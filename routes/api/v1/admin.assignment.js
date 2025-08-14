const { Router } = require('express');
const Employee = require('../../../models/Employee');
const Assignment = require('../../../models/Assignment');
const LoanApplication = require('../../../models/LoanApplication');
const Notification = require('../../../models/Notification');
const rbac = require('../../../middlewares/rbac');

const router = Router();

// Round-robin tracker in-memory; replace with persistent counter in production
let roundRobinIndex = 0;

router.post('/loan/applications/:id/assign/auto', rbac(['admin:write']), async (req, res) => {
	try {
		const { assigneeId } = req.body || {};
		let assignee = null;
		if (assigneeId) {
			assignee = await Employee.findById(assigneeId).select('_id name').lean();
			if (!assignee) return res.errorEnvelope('Invalid assigneeId', 400);
		} else {
			const employees = await Employee.find({ isDeleted: false }).sort({ createdAt: 1 }).select('_id name').lean();
			if (!employees.length) return res.errorEnvelope('No employees available', 400);
			roundRobinIndex = (roundRobinIndex + 1) % employees.length;
			assignee = employees[roundRobinIndex];
		}
		const applicationId = req.params.id;
		await Assignment.create({ resourceType: 'LoanApplication', resourceId: applicationId, assignee: assignee._id, reason: 'auto' });
		await LoanApplication.findByIdAndUpdate(applicationId, { $set: { currentOwner: assignee._id } });
		// notify assigned employee (best-effort)
		try {
			const emp = await Employee.findById(assignee._id).select('user name').lean();
			if (emp?.user) {
				await Notification.create({ user: emp.user, title: 'New assignment', body: `Assigned application ${applicationId}` });
			}
		} catch (_) {}
		return res.success({ applicationId, assignedTo: assignee }, 'ASSIGNED');
	} catch (err) {
		return res.errorEnvelope('Assignment failed', 500, { error: err.message });
	}
});

// POST /api/v1/admin/loan/applications/:id/assign -> manual assignment
router.post('/loan/applications/:id/assign', rbac(['admin:write']), async (req, res) => {
	try {
		const { assigneeId, reason = 'manual' } = req.body || {};
		if (!assigneeId) return res.errorEnvelope('assigneeId required', 400);
		const assignee = await Employee.findById(assigneeId).select('_id name').lean();
		if (!assignee) return res.errorEnvelope('Invalid assigneeId', 400);
		const applicationId = req.params.id;
		await Assignment.create({ resourceType: 'LoanApplication', resourceId: applicationId, assignee: assignee._id, reason });
		await LoanApplication.findByIdAndUpdate(applicationId, { $set: { currentOwner: assignee._id } });
		try {
			const emp = await Employee.findById(assignee._id).select('user name').lean();
			if (emp?.user) {
				await Notification.create({ user: emp.user, title: 'New assignment', body: `Assigned application ${applicationId}` });
			}
		} catch (_) {}
		return res.success({ applicationId, assignedTo: assignee }, 'ASSIGNED');
	} catch (err) {
		return res.errorEnvelope('Assignment failed', 500, { error: err.message });
	}
});

module.exports = router;


