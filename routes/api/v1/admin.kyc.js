const { Router } = require('express');
const auth = require('../../../middlewares/auth');
const rbac = require('../../../middlewares/rbac');
const KycRecord = require('../../../models/KycRecord');
const User = require('../../../models/User');
const Notification = require('../../../models/Notification');
const { createAuditLog } = require('../../../utils/audit');

const router = Router();
router.use(auth);

// GET /api/v1/admin/kyc/queue -> list submitted KYC records pending review
router.get('/queue', rbac([]), async (req, res) => {
	const list = await KycRecord.aggregate([
		{ $match: { status: 'submitted', isDeleted: { $ne: true } } },
		{ $sort: { updatedAt: 1 } },
		{
			$lookup: {
				from: 'users',
				localField: 'userId',
				foreignField: '_id',
				as: 'user'
			}
		},
		{ $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
		{
			$project: {
				_id: 1,
				status: 1,
				userId: 1,
				userName: { $ifNull: ['$user.phone', 'User'] },
				documentType: { $literal: 'KYC' },
				updatedAt: 1
			}
		}
	]);
	return res.success(list, 'kyc_queue');
});

// GET /api/v1/admin/kyc/export -> CSV export (PII redacted unless user has pii:read)
router.get('/export', rbac(['admin:read']), async (req, res) => {
	const { limit = 1000 } = req.query || {};
	const hasPii = (req.user?.permissions || []).includes('pii:read');
	const mask = (v) => {
		if (v == null) return '';
		const s = String(v);
		if (hasPii) return s;
		if (s.length <= 4) return '*'.repeat(Math.max(0, s.length - 1)) + s.slice(-1);
		return s.slice(0, 2) + '*'.repeat(s.length - 6) + s.slice(-4);
	};
	const items = await KycRecord.find({ isDeleted: { $ne: true } })
		.sort({ updatedAt: -1 })
		.limit(Number(limit))
		.lean();
	const header = ['id', 'userId', 'pan', 'aadhaar', 'status', 'updatedAt'];
	const rows = items.map((k) => [
		k._id,
		k.userId || '',
		mask(k.pan || ''),
		mask(k.aadhaar || ''),
		k.status || '',
		new Date(k.updatedAt).toISOString(),
	]);
	const csv = [header.join(',')].concat(rows.map((r) => r.join(','))).join('\n');
	try {
		await createAuditLog({
			actorId: req.user?._id,
			action: hasPii ? 'REPORT_EXPORTED' : 'EXPORT_REDACTED',
			resource: '/admin/kyc/export',
			resourceId: null,
			ip: req.ip,
			headerUserAgent: req.get('user-agent') || '',
			before: { query: req.query },
			after: { count: items.length },
		});
	} catch (_) {}
	res.setHeader('Content-Type', 'text/csv');
	return res.status(200).send(csv);
});

// POST /api/v1/admin/kyc/verify -> mark a KYC record verified
router.post('/verify', rbac([]), async (req, res) => {
	const { id } = req.body || {};
	if (!id) return res.errorEnvelope('id required', 400);
	const before = await KycRecord.findById(id).lean();
	if (!before) return res.errorEnvelope('Not found', 404);
	const updated = await KycRecord.findByIdAndUpdate(
		id,
		{ $set: { status: 'verified', panStatus: before.pan ? 'verified' : before.panStatus, aadhaarStatus: before.aadhaar ? 'verified' : before.aadhaarStatus } },
		{ new: true }
	).lean();
	await createAuditLog({
		actorId: req.user?._id,
		action: 'KYC_VERIFIED',
		resource: '/admin/kyc/verify',
		resourceId: id,
		ip: req.ip,
		headerUserAgent: req.get('user-agent'),
		before,
		after: updated
	});
	// notify user (best-effort)
	try {
		await Notification.create({ user: updated.userId, title: 'KYC verified', body: 'Your KYC has been verified.' });
	} catch (_) {}
	return res.success(updated, 'kyc verified');
});

// POST /api/v1/admin/kyc/reject -> mark a KYC record rejected (optional reason)
router.post('/reject', rbac([]), async (req, res) => {
	const { id, reason = '' } = req.body || {};
	if (!id) return res.errorEnvelope('id required', 400);
	const before = await KycRecord.findById(id).lean();
	if (!before) return res.errorEnvelope('Not found', 404);
	const updated = await KycRecord.findByIdAndUpdate(
		id,
		{ $set: { status: 'rejected' }, $push: { reviewNotes: { type: 'reject', reason, at: new Date() } } },
		{ new: true }
	).lean();
	await createAuditLog({
		actorId: req.user?._id,
		action: 'KYC_REJECTED',
		resource: '/admin/kyc/reject',
		resourceId: id,
		ip: req.ip,
		headerUserAgent: req.get('user-agent'),
		before,
		after: updated
	});
	try {
		await Notification.create({ user: updated.userId, title: 'KYC rejected', body: reason || 'Your KYC has been rejected. Please review and re-upload required documents.' });
	} catch (_) {}
	return res.success(updated, 'kyc rejected');
});

// POST /api/v1/admin/kyc/request-reupload -> move back to draft and inform user
router.post('/request-reupload', rbac([]), async (req, res) => {
	const { id, note = '' } = req.body || {};
	if (!id) return res.errorEnvelope('id required', 400);
	const before = await KycRecord.findById(id).lean();
	if (!before) return res.errorEnvelope('Not found', 404);
	const updated = await KycRecord.findByIdAndUpdate(
		id,
		{ $set: { status: 'draft' }, $push: { reviewNotes: { type: 'reupload', note, at: new Date() } } },
		{ new: true }
	).lean();
	await createAuditLog({
		actorId: req.user?._id,
		action: 'REUPLOAD_REQUESTED',
		resource: '/admin/kyc/request-reupload',
		resourceId: id,
		ip: req.ip,
		headerUserAgent: req.get('user-agent'),
		before,
		after: updated
	});
	try {
		await Notification.create({ user: updated.userId, title: 'Re-upload requested', body: note || 'Please re-upload your KYC documents.' });
	} catch (_) {}
	return res.success(updated, 'reupload requested');
});

module.exports = router;

// POST /api/v1/admin/kyc/bulk -> perform bulk verify/reject/reupload
router.post('/bulk', rbac([]), async (req, res) => {
	const { ids = [], action, reason = '', note = '' } = req.body || {};
	if (!Array.isArray(ids) || ids.length === 0) return res.errorEnvelope('ids required', 400);
	if (!['verify', 'reject', 'requestReupload'].includes(action)) return res.errorEnvelope('invalid action', 400);
	const results = [];
	for (const id of ids) {
		const before = await KycRecord.findById(id).lean();
		if (!before) continue;
		let updated;
		if (action === 'verify') {
			updated = await KycRecord.findByIdAndUpdate(
				id,
				{ $set: { status: 'verified', panStatus: before.pan ? 'verified' : before.panStatus, aadhaarStatus: before.aadhaar ? 'verified' : before.aadhaarStatus } },
				{ new: true }
			).lean();
			try { await Notification.create({ user: updated.userId, title: 'KYC verified', body: 'Your KYC has been verified.' }); } catch (_) {}
		} else if (action === 'reject') {
			updated = await KycRecord.findByIdAndUpdate(
				id,
				{ $set: { status: 'rejected' }, $push: { reviewNotes: { type: 'reject', reason, at: new Date() } } },
				{ new: true }
			).lean();
			try { await Notification.create({ user: updated.userId, title: 'KYC rejected', body: reason || 'Your KYC has been rejected. Please review and re-upload required documents.' }); } catch (_) {}
		} else if (action === 'requestReupload') {
			updated = await KycRecord.findByIdAndUpdate(
				id,
				{ $set: { status: 'draft' }, $push: { reviewNotes: { type: 'reupload', note, at: new Date() } } },
				{ new: true }
			).lean();
			try { await Notification.create({ user: updated.userId, title: 'Re-upload requested', body: note || 'Please re-upload your KYC documents.' }); } catch (_) {}
		}
		results.push(updated);
		await createAuditLog({
			actorId: req.user?._id,
			action: `KYC_BULK_${action.toUpperCase()}`,
			resource: '/admin/kyc/bulk',
			resourceId: id,
			ip: req.ip,
			headerUserAgent: req.get('user-agent'),
			before,
			after: updated
		});
	}
	return res.success({ count: results.length }, 'bulk processed');
});


