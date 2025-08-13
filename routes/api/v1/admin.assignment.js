const { Router } = require('express');
const Employee = require('../../models/Employee');

const router = Router();

// Round-robin tracker in-memory; replace with persistent counter in production
let roundRobinIndex = 0;

router.post('/loan/applications/:id/assign/auto', async (req, res) => {
	try {
		const employees = await Employee.find({ isDeleted: false }).sort({ createdAt: 1 }).select('_id name').lean();
		if (!employees.length) return res.errorEnvelope('No employees available', 400);
		roundRobinIndex = (roundRobinIndex + 1) % employees.length;
		const assignee = employees[roundRobinIndex];
		// In a full system, update Assignment/LoanApplication here
		return res.success({ applicationId: req.params.id, assignedTo: assignee }, 'ASSIGNED');
	} catch (err) {
		return res.errorEnvelope('Assignment failed', 500, { error: err.message });
	}
});

module.exports = router;


