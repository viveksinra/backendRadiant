const { Router } = require('express');
const rbac = require('../../../middlewares/rbac');
const RefreshToken = require('../../../models/RefreshToken');
const User = require('../../../models/User');

const router = Router();

// GET /api/v1/admin/sessions -> list active sessions (non-revoked, not expired)
router.get('/', rbac(['admin:read']), async (req, res) => {
	const now = new Date();
	const limit = Math.min(parseInt(req.query.limit || '200', 10), 1000);
	const sessions = await RefreshToken.find({ isRevoked: { $ne: true }, expiresAt: { $gt: now } })
		.sort({ createdAt: -1 })
		.limit(limit)
		.lean();
	// hydrate minimal user info
	const userIds = Array.from(new Set(sessions.map((s) => String(s.userId))));
	const users = await User.find({ _id: { $in: userIds } }, { _id: 1, phone: 1, email: 1 }).lean();
	const userMap = new Map(users.map((u) => [String(u._id), u]));
	const data = sessions.map((s) => ({
		id: String(s._id),
		userId: String(s.userId),
		user: userMap.get(String(s.userId)) || null,
		deviceId: s.deviceId,
		createdAt: s.createdAt,
		expiresAt: s.expiresAt,
		isRevoked: s.isRevoked,
	}));
	return res.success({ items: data }, 'sessions');
});

// POST /api/v1/admin/sessions/:id/revoke -> revoke a specific refresh token session
router.post('/:id/revoke', rbac(['admin:write']), async (req, res) => {
	const { id } = req.params;
	const { allForUser = false } = req.body || {};
	const session = await RefreshToken.findById(id);
	if (!session) return res.errorEnvelope('Session not found', 404);
	await RefreshToken.updateMany(
		allForUser ? { userId: session.userId } : { _id: session._id },
		{ $set: { isRevoked: true, revokedAt: new Date() } }
	);
	return res.success({ id, allForUser: Boolean(allForUser) }, 'SESSION_REVOKED_BY_ADMIN');
});

module.exports = router;


