const { Router } = require('express');
const rbac = require('../../../middlewares/rbac');
const CommsTemplate = require('../../../models/CommsTemplate');
const { createAuditLog } = require('../../../utils/audit');

const router = Router();

// GET /api/v1/admin/comms/templates
router.get('/templates', rbac(['admin:read']), async (req, res) => {
	const list = await CommsTemplate.find({ isDeleted: { $ne: true } }).sort({ updatedAt: -1 }).lean();
	return res.success(list, 'templates');
});

// POST /api/v1/admin/comms/templates
router.post('/templates', rbac(['admin:write']), async (req, res) => {
	try {
		const { channel, templateId, name, body, variables = [] } = req.body || {};
		if (!channel || !templateId || !name || !body) return res.errorEnvelope('Missing required fields', 400);
		const existing = await CommsTemplate.findOne({ templateId });
		if (existing) {
			existing.version = (existing.version || 1) + 1;
			existing.channel = channel;
			existing.name = name;
			existing.body = body;
			existing.variables = variables;
			await existing.save();
			try {
				await createAuditLog({
					actorId: req.user?._id,
					action: 'TEMPLATE_UPDATED',
					resource: '/admin/comms/templates',
					resourceId: existing._id?.toString(),
					ip: req.ip,
					headerUserAgent: req.get('user-agent') || '',
					before: {},
					after: existing.toObject(),
				});
			} catch (_) {}
			return res.success(existing.toObject(), 'template updated');
		}
		const created = await CommsTemplate.create({ channel, templateId, name, body, variables });
		try {
			await createAuditLog({
				actorId: req.user?._id,
				action: 'TEMPLATE_UPDATED',
				resource: '/admin/comms/templates',
				resourceId: created._id?.toString(),
				ip: req.ip,
				headerUserAgent: req.get('user-agent') || '',
				before: {},
				after: created.toObject(),
			});
		} catch (_) {}
		return res.success(created.toObject(), 'template created', 201);
	} catch (err) {
		return res.errorEnvelope(err.message || 'save failed', 400);
	}
});

module.exports = router;


