const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

module.exports = async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.get('authorization') || '';
        if (!authHeader) return next();
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        const decoded = jwt.verify(token, config.jwtSecret);
        const user = await User.findById(decoded.uid).lean();
        if (user) req.user = { _id: user._id, phone: user.phone, roles: user.roles || [], permissions: [] };
    } catch (_) {
        // ignore invalid token; downstream routes can enforce auth
    }
    return next();
};


