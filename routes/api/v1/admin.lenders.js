const { Router } = require('express');
const rbac = require('../../../middlewares/rbac');
const Lender = require('../../../models/Lender');

const router = Router();

router.get('/', rbac(['admin:read']), async (req, res) => {
	const lenders = await Lender.find({ isDeleted: { $ne: true } }).lean();
	return res.success(lenders, 'lenders');
});

router.post('/', rbac(['admin:read']), async (req, res) => {
	const { name, code, eligibilityRules = {} } = req.body || {};
	if (!name || !code) return res.errorEnvelope('name and code required', 400);
	const created = await Lender.create({ name, code, eligibilityRules });
	return res.success(created.toObject(), 'lender created');
});

router.put('/:id', rbac(['admin:read']), async (req, res) => {
	const { name, code, eligibilityRules, isActive } = req.body || {};
	const updated = await Lender.findByIdAndUpdate(
		req.params.id,
		{ $set: { name, code, eligibilityRules, isActive } },
		{ new: true }
	).lean();
	if (!updated) return res.errorEnvelope('Not found', 404);
	return res.success(updated, 'lender updated');
});

router.delete('/:id', rbac(['admin:read']), async (req, res) => {
	const updated = await Lender.findByIdAndUpdate(req.params.id, { $set: { isDeleted: true } }, { new: true }).lean();
	if (!updated) return res.errorEnvelope('Not found', 404);
	return res.success(updated, 'lender deleted');
});

module.exports = router;


