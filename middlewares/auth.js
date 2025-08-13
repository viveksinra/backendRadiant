const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

module.exports = async function authMiddleware(req, res, next) {
	try {
		const auth = req.headers.authorization || '';
		const token = auth.replace(/^Bearer\s+/i, '').trim();
		if (!token) return res.errorEnvelope('Unauthorized', 401);
		const payload = jwt.verify(token, config.jwtSecret);
		const user = await User.findById(payload.uid).lean();
		if (!user) return res.errorEnvelope('Unauthorized', 401);
		req.user = { _id: user._id, phone: user.phone };
		return next();
	} catch (err) {
		return res.errorEnvelope('Unauthorized', 401);
	}
};

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
		if (user) req.user = { _id: user._id, roles: user.roles || [], permissions: [] };
	} catch (_) {
		// ignore invalid token; downstream routes can enforce auth
	}
	return next();
};


