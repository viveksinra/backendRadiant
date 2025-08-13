const { Router } = require('express');
const Visit = require('../../../models/Visit');
const Lead = require('../../../models/Lead');
const rbac = require('../../../middlewares/rbac');
const { isOutOfRadius } = require('../../../services/geo');

const router = Router();

// Create a visit for a lead
router.post('/leads/:id/visits', rbac(['visit:create']), async (req, res) => {
	const leadId = req.params.id;
	const { notes, photoUrls = [], geo } = req.body || {};
	const lead = await Lead.findById(leadId).lean();
	if (!lead) return res.errorEnvelope('Lead not found', 404);

	let flags = { outOfRadius: false, anomalyReasons: [] };
	if (geo && geo.lat && geo.lng && lead.geo && lead.geo.lat && lead.geo.lng) {
		const out = isOutOfRadius(lead.geo, geo, 2_000); // 2km default
		if (out) {
			flags.outOfRadius = true;
			flags.anomalyReasons.push('out_of_radius');
		}
	}

	const visit = await Visit.create({
		lead: leadId,
		employee: req.user?.employeeId,
		notes,
		photoUrls,
		geo,
		flags,
	});
	return res.success(visit, 'visit logged', 201);
});

// List visits for a lead
router.get('/leads/:id/visits', rbac(['visit:read']), async (req, res) => {
	const leadId = req.params.id;
	const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
	const visits = await Visit.find({ lead: leadId, isDeleted: { $ne: true } })
		.sort({ createdAt: -1 })
		.limit(limit)
		.lean();
	return res.success(visits, 'visits');
});

// Today's visits
router.get('/visits/today', rbac(['visit:read']), async (req, res) => {
	const start = new Date();
	start.setHours(0, 0, 0, 0);
	const end = new Date();
	end.setHours(23, 59, 59, 999);
	const visits = await Visit.find({ createdAt: { $gte: start, $lte: end }, isDeleted: { $ne: true } })
		.sort({ createdAt: -1 })
		.lean();
	return res.success(visits, 'today visits');
});

module.exports = router;


