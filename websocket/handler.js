const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');

// Active session state
let activeSession = {
    classId: null,
    startedAt: null,
    attendance: {}
};

const getActiveSession = () => activeSession;
const setActiveSession = (session) => {
    activeSession = session;
};

// Helper function to send message to a client
const sendMessage = (ws, event, data) => {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event, data }));
    }
};

// Helper function to broadcast to all clients
const broadcast = (wss, event, data) => {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            sendMessage(client, event, data);
        }
    });
};

// Helper function to send error
const sendError = (ws, message) => {
    sendMessage(ws, 'ERROR', { message });
};

const setupWebSocket = (server) => {
    const wss = new WebSocket.Server({ noServer: true });

    // Handle upgrade
    server.on('upgrade', (request, socket, head) => {
        const pathname = url.parse(request.url).pathname;

        if (pathname === '/ws') {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    });

    wss.on('connection', (ws, request) => {
        // Extract token from query parameter
        const params = url.parse(request.url, true).query;
        const token = params.token;

        if (!token) {
            sendError(ws, 'Unauthorized or invalid token');
            ws.close();
            return;
        }

        // Verify JWT
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            ws.user = {
                userId: decoded.userId,
                role: decoded.role
            };
        } catch (error) {
            sendError(ws, 'Unauthorized or invalid token');
            ws.close();
            return;
        }

        // Handle messages
        ws.on('message', async (message) => {
            try {
                const { event, data } = JSON.parse(message);

                switch (event) {
                    case 'ATTENDANCE_MARKED':
                        await handleAttendanceMarked(ws, wss, data);
                        break;

                    case 'TODAY_SUMMARY':
                        await handleTodaySummary(ws, wss);
                        break;

                    case 'MY_ATTENDANCE':
                        await handleMyAttendance(ws);
                        break;

                    case 'DONE':
                        await handleDone(ws, wss);
                        break;

                    default:
                        sendError(ws, 'Unknown event');
                }
            } catch (error) {
                sendError(ws, 'Invalid message format');
            }
        });

        ws.on('close', () => {
            // Connection closed
        });
    });

    return wss;
};

// Event Handlers

async function handleAttendanceMarked(ws, wss, data) {
    // Verify teacher role
    if (ws.user.role !== 'teacher') {
        sendError(ws, 'Forbidden, teacher event only');
        return;
    }

    // Check active session
    if (!activeSession.classId) {
        sendError(ws, 'No active attendance session');
        return;
    }

    const { studentId, status } = data;

    // Update in-memory attendance
    activeSession.attendance[studentId] = status;

    // Broadcast to all clients
    broadcast(wss, 'ATTENDANCE_MARKED', {
        studentId,
        status
    });
}

async function handleTodaySummary(ws, wss) {
    // Verify teacher role
    if (ws.user.role !== 'teacher') {
        sendError(ws, 'Forbidden, teacher event only');
        return;
    }

    // Check active session
    if (!activeSession.classId) {
        sendError(ws, 'No active attendance session');
        return;
    }

    // Calculate summary
    const attendanceValues = Object.values(activeSession.attendance);
    const present = attendanceValues.filter(status => status === 'present').length;
    const absent = attendanceValues.filter(status => status === 'absent').length;
    const total = present + absent;

    // Broadcast to all clients
    broadcast(wss, 'TODAY_SUMMARY', {
        present,
        absent,
        total
    });
}

async function handleMyAttendance(ws) {
    // Verify student role
    if (ws.user.role !== 'student') {
        sendError(ws, 'Forbidden, student event only');
        return;
    }

    // Check active session
    if (!activeSession.classId) {
        sendError(ws, 'No active attendance session');
        return;
    }

    // Get student's attendance status
    const status = activeSession.attendance[ws.user.userId] || 'not yet updated';

    // Send response only to this student (unicast)
    sendMessage(ws, 'MY_ATTENDANCE', {
        status
    });
}

async function handleDone(ws, wss) {
    // Verify teacher role
    if (ws.user.role !== 'teacher') {
        sendError(ws, 'Forbidden, teacher event only');
        return;
    }

    // Check active session
    if (!activeSession.classId) {
        sendError(ws, 'No active attendance session');
        return;
    }

    try {
        // Get all students in the active class
        const classDoc = await Class.findById(activeSession.classId);
        if (!classDoc) {
            sendError(ws, 'Class not found');
            return;
        }

        // Mark absent students in memory
        classDoc.studentIds.forEach(studentId => {
            const studentIdStr = studentId.toString();
            if (!activeSession.attendance[studentIdStr]) {
                activeSession.attendance[studentIdStr] = 'absent';
            }
        });

        // Persist to MongoDB (upsert to handle duplicates)
        const attendanceRecords = Object.entries(activeSession.attendance).map(([studentId, status]) => ({
            classId: activeSession.classId,
            studentId,
            status
        }));

        // Use bulkWrite for efficient upsert
        const bulkOps = attendanceRecords.map(record => ({
            updateOne: {
                filter: { classId: record.classId, studentId: record.studentId },
                update: { $set: { status: record.status } },
                upsert: true
            }
        }));

        await Attendance.bulkWrite(bulkOps);

        // Calculate final summary
        const attendanceValues = Object.values(activeSession.attendance);
        const present = attendanceValues.filter(status => status === 'present').length;
        const absent = attendanceValues.filter(status => status === 'absent').length;
        const total = present + absent;

        // Broadcast to all clients
        broadcast(wss, 'DONE', {
            message: 'Attendance persisted',
            present,
            absent,
            total
        });

        // Clear active session
        activeSession = {
            classId: null,
            startedAt: null,
            attendance: {}
        };
    } catch (error) {
        sendError(ws, 'Failed to persist attendance');
    }
}

module.exports = { setupWebSocket, getActiveSession, setActiveSession };
