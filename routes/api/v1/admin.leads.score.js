const { Router } = require('express');
const Lead = require('../../../models/Lead');
const { computeLeadScore } = require('../../../services/scoring');
const rbac = require('../../../middlewares/rbac');

const router = Router();

// Recompute score for a single lead or all leads (admin)
router.post('/admin/leads/score', rbac(['admin:write']), async (req, res) => {
	const { leadId } = req.body || {};
	if (leadId) {
		const score = await computeLeadScore(leadId);
		await Lead.findByIdAndUpdate(leadId, { $set: { score } });
		return res.success({ leadId, score }, 'score updated');
	}
	const leads = await Lead.find({ isDeleted: { $ne: true } }, { _id: 1 });
	let updated = 0;
	for (const l of leads) {
		const score = await computeLeadScore(l._id);
		await Lead.updateOne({ _id: l._id }, { $set: { score } });
		updated += 1;
	}
	return res.success({ updated }, 'scores updated');
});

module.exports = router;


