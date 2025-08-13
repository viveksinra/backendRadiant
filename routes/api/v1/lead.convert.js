const { Router } = require('express');
const Lead = require('../../../models/Lead');
const LoanApplication = require('../../../models/LoanApplication');
const rbac = require('../../../middlewares/rbac');

const router = Router();

router.post('/leads/:id/convert', rbac(['lead:convert']), async (req, res) => {
	const leadId = req.params.id;
	const { loanType, amountRequested = 0 } = req.body || {};
	const lead = await Lead.findById(leadId);
	if (!lead) return res.errorEnvelope('Lead not found', 404);
	if (lead.convertedApplication) return res.errorEnvelope('Lead already converted', 400);

	const app = await LoanApplication.create({
		lead: lead._id,
		loanType: loanType || null,
		amountRequested,
		status: 'submitted',
	});
	lead.status = 'converted';
	lead.convertedApplication = app._id;
	await lead.save();
	return res.success({ lead, application: app }, 'lead converted');
});

module.exports = router;


