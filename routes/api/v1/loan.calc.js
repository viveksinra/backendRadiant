const { Router } = require('express');
const auth = require('../../../middlewares/auth');

const router = Router();

router.use(auth);

// Simple EMI calculator: P*r*(1+r)^n / ((1+r)^n - 1)
router.post('/emi', (req, res) => {
	const { principal = 0, annualRatePercent = 0, tenureMonths = 0 } = req.body || {};
	if (principal <= 0 || annualRatePercent <= 0 || tenureMonths <= 0) {
		return res.errorEnvelope('Invalid inputs', 400);
	}
	const monthlyRate = annualRatePercent / 12 / 100;
	const pow = Math.pow(1 + monthlyRate, tenureMonths);
	const emi = (principal * monthlyRate * pow) / (pow - 1);
	return res.success({ emi: Math.round(emi * 100) / 100 }, 'emi');
});

// Trivial eligibility calc placeholder
router.post('/eligibility', (req, res) => {
	const { monthlyIncome = 0, obligations = 0 } = req.body || {};
	if (monthlyIncome <= 0) return res.errorEnvelope('Invalid inputs', 400);
	const disposable = Math.max(monthlyIncome - obligations, 0);
	const eligibleEmi = disposable * 0.4; // 40% FOIR
	return res.success({ eligibleEmi: Math.round(eligibleEmi) }, 'eligibility');
});

module.exports = router;


