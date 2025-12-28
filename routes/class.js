const express = require('express');
const Class = require('../models/Class');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createClassSchema, addStudentSchema } = require('../validators/schemas');

const router = express.Router();

// POST /class - Create a new class (Teacher only)
router.post('/', authMiddleware, requireRole('teacher'), validate(createClassSchema), async (req, res) => {
    try {
        const { className } = req.body;

        const newClass = await Class.create({
            className,
            teacherId: req.user.userId,
            studentIds: []
        });

        return res.status(201).json({
            success: true,
            data: {
                _id: newClass._id,
                className: newClass.className,
                teacherId: newClass.teacherId,
                studentIds: newClass.studentIds
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /class/:id/add-student - Add student to class (Teacher only, must own class)
router.post('/:id/add-student', authMiddleware, requireRole('teacher'), validate(addStudentSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const { studentId } = req.body;

        // Find class
        const classDoc = await Class.findById(id);
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

        // Verify student exists and has student role
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                error: "Student not found"
            });
        }

        if (student.role !== 'student') {
            return res.status(400).json({
                success: false,
                error: "User is not a student"
            });
        }

        // Check if student already in class
        if (classDoc.studentIds.includes(studentId)) {
            return res.status(400).json({
                success: false,
                error: "Student already in class"
            });
        }

        // Add student to class
        classDoc.studentIds.push(studentId);
        await classDoc.save();

        return res.status(200).json({
            success: true,
            data: {
                _id: classDoc._id,
                className: classDoc.className,
                teacherId: classDoc.teacherId,
                studentIds: classDoc.studentIds
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /class/:id - Get class details with populated students
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const classDoc = await Class.findById(id).populate('studentIds', '_id name email');

        if (!classDoc) {
            return res.status(404).json({
                success: false,
                error: "Class not found"
            });
        }

        // Check authorization: teacher who owns class OR student enrolled in class
        const isTeacher = req.user.role === 'teacher' && classDoc.teacherId.toString() === req.user.userId;
        const isEnrolledStudent = req.user.role === 'student' &&
            classDoc.studentIds.some(student => student._id.toString() === req.user.userId);

        if (!isTeacher && !isEnrolledStudent) {
            return res.status(403).json({
                success: false,
                error: "Forbidden, not authorized to view this class"
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                _id: classDoc._id,
                className: classDoc.className,
                teacherId: classDoc.teacherId,
                students: classDoc.studentIds
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /class/:id/my-attendance - Get student's attendance for a class (Student only)
router.get('/:id/my-attendance', authMiddleware, requireRole('student'), async (req, res) => {
    try {
        const { id } = req.params;

        // Verify class exists
        const classDoc = await Class.findById(id);
        if (!classDoc) {
            return res.status(404).json({
                success: false,
                error: "Class not found"
            });
        }

        // Check if student is enrolled in class
        if (!classDoc.studentIds.includes(req.user.userId)) {
            return res.status(403).json({
                success: false,
                error: "Forbidden, not enrolled in this class"
            });
        }

        // Check for persisted attendance
        const attendance = await Attendance.findOne({
            classId: id,
            studentId: req.user.userId
        });

        return res.status(200).json({
            success: true,
            data: {
                classId: id,
                status: attendance ? attendance.status : null
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
