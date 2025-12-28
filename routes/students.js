const express = require('express');
const User = require('../models/User');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /students - Get all students (Teacher only)
router.get('/', authMiddleware, requireRole('teacher'), async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('_id name email');

        return res.status(200).json({
            success: true,
            data: students
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
