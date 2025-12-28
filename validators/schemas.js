const { z } = require('zod');

const signupSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(['teacher', 'student'], {
        errorMap: () => ({ message: "Role must be either 'teacher' or 'student'" })
    })
});

const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required")
});

const createClassSchema = z.object({
    className: z.string().min(1, "Class name is required")
});

const addStudentSchema = z.object({
    studentId: z.string().min(1, "Student ID is required")
});

const startAttendanceSchema = z.object({
    classId: z.string().min(1, "Class ID is required")
});

module.exports = {
    signupSchema,
    loginSchema,
    createClassSchema,
    addStudentSchema,
    startAttendanceSchema
};
