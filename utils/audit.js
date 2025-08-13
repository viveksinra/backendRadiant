const crypto = require('crypto');
const AuditLog = require('../models/AuditLog');

async function getLastHash() {
	const last = await AuditLog.findOne({}, { hash: 1 }).sort({ createdAt: -1 }).lean();
	return last?.hash || '';
}

function computeHash(payload) {
	return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

async function createAuditLog({ actorId, action, resource, resourceId, ip, headerUserAgent, before, after }) {
	try {
		const prevHash = await getLastHash();
		const payload = { actorId, action, resource, resourceId, ip, headerUserAgent, before, after, prevHash };
		const hash = computeHash(payload);
		await AuditLog.create({ ...payload, hash });
		return true;
	} catch (err) {
		return false;
	}
}

module.exports = { getLastHash, computeHash, createAuditLog };




