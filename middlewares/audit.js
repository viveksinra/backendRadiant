const crypto = require('crypto');
const AuditLog = require('../models/AuditLog');

async function getLastHash() {
	const last = await AuditLog.findOne({}, { hash: 1 }).sort({ createdAt: -1 }).lean();
	return last?.hash || '';
}

function computeHash(payload) {
	return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

module.exports = function auditMiddleware(req, res, next) {
	const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
	if (!isMutating) return next();

	const startSnapshot = { body: req.body, params: req.params, query: req.query };
	const originalSuccess = res.success;
	const originalError = res.errorEnvelope;

	res.success = async function wrappedSuccess(myData = null, message = 'ok', status = 200) {
		try {
			const prevHash = await getLastHash();
			const payload = {
				actorId: req.user?._id,
				action: `${req.method} ${req.path}`,
				resource: req.path,
				resourceId: req.params?.id,
				ip: req.ip,
				headerUserAgent: req.get('user-agent') || '',
				before: startSnapshot,
				after: myData,
				prevHash,
			};
			const hash = computeHash(payload);
			await AuditLog.create({ ...payload, hash });
		} catch (_) {
			// do not block response on audit failure
		}
		return originalSuccess.call(res, myData, message, status);
	};

	res.errorEnvelope = async function wrappedError(message = 'error', status = 400, myData = null) {
		try {
			const prevHash = await getLastHash();
			const payload = {
				actorId: req.user?._id,
				action: `${req.method} ${req.path}`,
				resource: req.path,
				resourceId: req.params?.id,
				ip: req.ip,
				headerUserAgent: req.get('user-agent') || '',
				before: startSnapshot,
				after: { error: message, data: myData },
				prevHash,
			};
			const hash = computeHash(payload);
			await AuditLog.create({ ...payload, hash });
		} catch (_) {}
		return originalError.call(res, message, status, myData);
	};

	return next();
};


