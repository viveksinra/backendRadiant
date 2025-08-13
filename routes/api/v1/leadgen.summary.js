const { Router } = require('express');
const Visit = require('../../../models/Visit');
const Lead = require('../../../models/Lead');
const rbac = require('../../../middlewares/rbac');

const router = Router();

router.get('/leadgen/me/summary', rbac(['leadgen:summary']), async (req, res) => {
	const employeeId = req.user?.employeeId;
	const now = new Date();
	const start = new Date(now);
	start.setHours(0, 0, 0, 0);
	const end = new Date(now);
	end.setHours(23, 59, 59, 999);

	const todayVisits = await Visit.countDocuments({ employee: employeeId, createdAt: { $gte: start, $lte: end } });
	const assignedLeads = await Lead.countDocuments({ assignedTo: employeeId, isDeleted: { $ne: true } });

	return res.success({ todayVisits, assignedLeads }, 'leadgen summary');
});

router.get('/leadgen/me/schedule', rbac(['leadgen:summary']), async (req, res) => {
	// Placeholder schedule; real impl would join assignments and planned visits
	return res.success({ items: [] }, 'schedule');
});

module.exports = router;


