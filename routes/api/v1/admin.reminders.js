const { Router } = require('express');
const rbac = require('../../../middlewares/rbac');
const Reminder = require('../../../models/Reminder');
const { createAuditLog } = require('../../../utils/audit');

const router = Router();

// POST /api/v1/admin/reminders
router.post('/', rbac(['admin:write']), async (req, res) => {
	try {
		const { resourceType, resourceId, templateId, channel, scheduledAt, variables = {} } = req.body || {};
		if (!resourceType || !resourceId || !templateId || !channel || !scheduledAt) {
			return res.errorEnvelope('Missing required fields', 400);
		}
		const when = new Date(scheduledAt);
		if (isNaN(when.getTime())) return res.errorEnvelope('Invalid scheduledAt', 400);
		const created = await Reminder.create({ resourceType, resourceId, templateId, channel, scheduledAt: when, variables });
		try {
			await createAuditLog({
				actorId: req.user?._id,
				action: 'REMINDER_CREATED',
				resource: '/admin/reminders',
				resourceId: created._id?.toString(),
				ip: req.ip,
				headerUserAgent: req.get('user-agent') || '',
				before: {},
				after: created.toObject(),
			});
		} catch (_) {}
		return res.success(created.toObject(), 'REMINDER_CREATED', 201);
	} catch (err) {
		return res.errorEnvelope(err.message || 'create failed', 400);
	}
});

// GET /api/v1/admin/reminders
router.get('/', rbac(['admin:read']), async (req, res) => {
	const { status, from, to } = req.query || {};
	const q = { isDeleted: { $ne: true } };
	if (status) q.status = status;
	if (from || to) {
		q.scheduledAt = {};
		if (from) q.scheduledAt.$gte = new Date(from);
		if (to) q.scheduledAt.$lte = new Date(to);
	}
	const list = await Reminder.find(q).sort({ scheduledAt: -1 }).limit(200).lean();
	return res.success(list, 'reminders');
});

module.exports = router;


