const { Router } = require('express');
const mongoose = require('mongoose');
const Lead = require('../../../models/Lead');
const Assignment = require('../../../models/Assignment');
const InteractionLog = require('../../../models/InteractionLog');
const rbac = require('../../../middlewares/rbac');

const router = Router();

// Create lead
router.post('/', rbac(['lead:create']), async (req, res) => {
	try {
		const payload = req.body || {};
		const lead = await Lead.create(payload);
		await InteractionLog.create({
			lead: lead._id,
			employee: null,
			type: 'note',
			message: 'Lead created',
			meta: { by: req.user?._id },
		});
		return res.success(lead, 'lead created', 201);
	} catch (err) {
		return res.errorEnvelope(err.message || 'failed to create lead', 400);
	}
});

// List leads
router.get('/', rbac(['lead:read']), async (req, res) => {
	const { assignedTo, sort, limit = 20, page = 1 } = req.query;
	const q = { isDeleted: { $ne: true } };
	if (assignedTo === 'me' && req.user?.employeeId) {
		q.assignedTo = new mongoose.Types.ObjectId(req.user.employeeId);
	}
	const sortSpec = sort === 'score' ? { score: -1, updatedAt: -1 } : { updatedAt: -1 };
	const results = await Lead.find(q)
		.sort(sortSpec)
		.skip((Number(page) - 1) * Number(limit))
		.limit(Math.min(Number(limit), 100))
		.lean();
	return res.success(results, 'leads');
});

// Get lead by id
router.get('/:id', rbac(['lead:read']), async (req, res) => {
	const lead = await Lead.findById(req.params.id).lean();
	if (!lead) return res.errorEnvelope('Lead not found', 404);
	return res.success(lead, 'lead');
});

// Update lead
router.put('/:id', rbac(['lead:update']), async (req, res) => {
	try {
		const updated = await Lead.findByIdAndUpdate(
			req.params.id,
			{ $set: req.body },
			{ new: true }
		).lean();
		if (!updated) return res.errorEnvelope('Lead not found', 404);
		await InteractionLog.create({
			lead: updated._id,
			employee: null,
			type: 'status_change',
			message: 'Lead updated',
			meta: { by: req.user?._id },
		});
		return res.success(updated, 'lead updated');
	} catch (err) {
		return res.errorEnvelope(err.message || 'failed to update lead', 400);
	}
});

// Assign lead to employee
router.post('/:id/assign', rbac(['lead:assign']), async (req, res) => {
	const { employeeId, notes } = req.body || {};
	if (!employeeId) return res.errorEnvelope('employeeId required', 400);
	const lead = await Lead.findById(req.params.id);
	if (!lead) return res.errorEnvelope('Lead not found', 404);
	lead.assignedTo = employeeId;
	await lead.save();
	await Assignment.updateMany({ lead: lead._id, isActive: true }, { $set: { isActive: false } });
	const assignment = await Assignment.create({
		lead: lead._id,
		employee: employeeId,
		assignedBy: req.user?._id,
		notes: notes || '',
		isActive: true,
	});
	await InteractionLog.create({
		lead: lead._id,
		employee: employeeId,
		type: 'assign',
		message: 'Lead assigned',
		meta: { assignmentId: assignment._id, by: req.user?._id },
	});
	return res.success({ lead, assignment }, 'lead assigned');
});

module.exports = router;


