const { Router } = require('express');
const auth = require('../../../middlewares/auth');
const LoanApplication = require('../../../models/LoanApplication');
const Lender = require('../../../models/Lender');

const router = Router();
router.use(auth);

// Very simple matching stub: rank active lenders by whether rules allow amount threshold
router.post('/applications/:id/match', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	const app = await LoanApplication.findById(req.params.id).lean();
	if (!app) return res.errorEnvelope('Not found', 404);
	const lenders = await Lender.find({ isActive: true, isDeleted: { $ne: true } }).lean();
	const ranked = lenders
		.map((l) => {
			const minAmt = l.eligibilityRules?.minAmount || 0;
			const maxAmt = l.eligibilityRules?.maxAmount || Infinity;
			const score = app.amount >= minAmt && app.amount <= maxAmt ? 1 : 0;
			return { lenderId: l._id, score };
		})
		.filter((x) => x.score > 0)
		.sort((a, b) => b.score - a.score);
	return res.success({ results: ranked }, ranked.length ? 'MATCH_FOUND' : 'MATCHING');
});

module.exports = router;


