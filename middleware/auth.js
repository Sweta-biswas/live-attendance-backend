const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization;

        if (!token) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized, token missing or invalid"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { userId, role }
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: "Unauthorized, token missing or invalid"
        });
    }
};

const requireRole = (role) => {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({
                success: false,
                error: `Forbidden, ${role} access required`
            });
        }
        next();
    };
};

module.exports = { authMiddleware, requireRole };
