const { Router } = require('express');
const AuditLog = require('../../../models/AuditLog');
const rbac = require('../../../middlewares/rbac');
const crypto = require('crypto');

const router = Router();

function computeHash(payload) {
	return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

router.get('/', rbac(['admin:read']), async (req, res) => {
	const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
	const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(limit).lean();
	return res.success(logs, 'audit logs');
});

router.get('/validate', rbac(['admin:read']), async (req, res) => {
	const limit = Math.min(parseInt(req.query.limit || '100', 10), 1000);
	const logs = await AuditLog.find({}).sort({ createdAt: 1 }).limit(limit).lean();
	let valid = true;
	let prevHash = '';
	for (const log of logs) {
		const payload = { ...log };
		delete payload._id;
		delete payload.__v;
		delete payload.hash;
		delete payload.createdAt;
		delete payload.updatedAt;
		const recomputed = computeHash(payload);
		if (recomputed !== log.hash) {
			valid = false;
			break;
		}
		if (log.prevHash !== prevHash) {
			valid = false;
			break;
		}
		prevHash = log.hash;
	}
	return res.success({ valid, checked: logs.length }, 'audit chain validation');
});

module.exports = router;


