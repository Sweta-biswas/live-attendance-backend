const express = require('express');
const Class = require('../models/Class');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { startAttendanceSchema } = require('../validators/schemas');

const router = express.Router();

// Import active session from websocket handler
let getActiveSession;
let setActiveSession;

const setSessionHandlers = (getter, setter) => {
    getActiveSession = getter;
    setActiveSession = setter;
};

// POST /attendance/start - Start attendance session (Teacher only)
router.post('/start', authMiddleware, requireRole('teacher'), validate(startAttendanceSchema), async (req, res) => {
    try {
        const { classId } = req.body;

        // Verify class exists
        const classDoc = await Class.findById(classId);
        if (!classDoc) {
            return res.status(404).json({
                success: false,
                error: "Class not found"
            });
        }

        // Check if teacher owns the class
        if (classDoc.teacherId.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                error: "Forbidden, not class teacher"
            });
        }

        // Set active session
        const startedAt = new Date().toISOString();
        setActiveSession({
            classId,
            startedAt,
            attendance: {}
        });

        return res.status(200).json({
            success: true,
            data: {
                classId,
                startedAt
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = { router, setSessionHandlers };
