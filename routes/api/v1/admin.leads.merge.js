const { Router } = require('express');
const Lead = require('../../../models/Lead');
const rbac = require('../../../middlewares/rbac');

const router = Router();

// Simple admin merge: keep base lead, merge fields and mark duplicate as deleted
router.post('/admin/leads/:id/merge', rbac(['admin:write']), async (req, res) => {
	const baseId = req.params.id;
	const { duplicateId, prefer = {} } = req.body || {};
	if (!duplicateId) return res.errorEnvelope('duplicateId required', 400);
	const base = await Lead.findById(baseId);
	const dup = await Lead.findById(duplicateId);
	if (!base || !dup) return res.errorEnvelope('Lead(s) not found', 404);

	base.fullName = prefer.fullName ?? base.fullName ?? dup.fullName;
	base.phone = prefer.phone ?? base.phone ?? dup.phone;
	base.email = prefer.email ?? base.email ?? dup.email;
	base.addressLine = prefer.addressLine ?? base.addressLine ?? dup.addressLine;
	base.city = prefer.city ?? base.city ?? dup.city;
	base.state = prefer.state ?? base.state ?? dup.state;
	base.pincode = prefer.pincode ?? base.pincode ?? dup.pincode;
	base.geo = prefer.geo ?? base.geo ?? dup.geo;
	base.score = Math.max(base.score || 0, dup.score || 0);
	await base.save();

	dup.isDeleted = true;
	await dup.save();

	return res.success({ kept: base._id, removed: dup._id }, 'leads merged');
});

module.exports = router;


