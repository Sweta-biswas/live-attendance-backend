require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/database');
const { setupWebSocket, getActiveSession, setActiveSession } = require('./websocket/handler');

// Import routes
const authRoutes = require('./routes/auth');
const classRoutes = require('./routes/class');
const studentsRoutes = require('./routes/students');
const { router: attendanceRoutes, setSessionHandlers } = require('./routes/attendance');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Setup WebSocket
setupWebSocket(server);

// Share session handlers with attendance route
setSessionHandlers(getActiveSession, setActiveSession);

// Routes
app.use('/auth', authRoutes);
app.use('/class', classRoutes);
app.use('/students', studentsRoutes);
app.use('/attendance', attendanceRoutes);

// Health check route
app.get('/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'Server is running',
            timestamp: new Date().toISOString()
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 WebSocket available at ws://localhost:${PORT}/ws`);
});
