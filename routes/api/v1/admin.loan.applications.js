const { Router } = require('express');
const rbac = require('../../../middlewares/rbac');
const LoanApplication = require('../../../models/LoanApplication');
const { assignLoanApplication, unassignLoanApplication } = require('../../../services/assignmentService');

const router = Router();

// Create a basic loan application (admin manual creation)
router.post('/', rbac(['admin:write']), async (req, res) => {
	const { customerId, loanType, meta } = req.body || {};
	const appDoc = await LoanApplication.create({ customerId, loanType, meta, status: 'draft' });
	return res.success(appDoc, 'application created', 201);
});

// Assign application
router.post('/:id/assign', rbac(['admin:write']), async (req, res) => {
	try {
		const { id } = req.params;
		const { assigneeEmployeeId, reason } = req.body || {};
		const assignedByEmployeeId = req.user?.employeeId || null;
		const assignment = await assignLoanApplication({ applicationId: id, assigneeEmployeeId, assignedByEmployeeId, reason });
		return res.success(assignment, 'assigned');
	} catch (err) {
		return res.errorEnvelope(err.message || 'assign failed', 400);
	}
});

module.exports = router;

// Unassign application
router.post('/:id/unassign', rbac(['admin:write']), async (req, res) => {
	try {
		const { id } = req.params;
		const { reason } = req.body || {};
		const result = await unassignLoanApplication({ applicationId: id, reason });
		return res.success(result, 'unassigned');
	} catch (err) {
		return res.errorEnvelope(err.message || 'unassign failed', 400);
	}
});




