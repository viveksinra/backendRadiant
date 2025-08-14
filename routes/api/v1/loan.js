const { Router } = require('express');
const auth = require('../../../middlewares/auth');
const LoanApplication = require('../../../models/LoanApplication');

const router = Router();

router.use(auth);

// POST /api/v1/loan/applications
router.post('/applications', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	const { loanTypeId, amount = 0 } = req.body || {};
	const app = await LoanApplication.create({ userId: req.user._id, loanTypeId, amount, state: 'created' });
	return res.success(app.toObject(), 'application created');
});

// GET /api/v1/loan/applications/:id
router.get('/applications/:id', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	const app = await LoanApplication.findById(req.params.id).lean();
	if (!app) return res.errorEnvelope('Not found', 404);
	return res.success(app, 'application');
});

// PUT /api/v1/loan/applications/:id/questionnaire
router.put('/applications/:id/questionnaire', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	const { questionnaire = {} } = req.body || {};
	const app = await LoanApplication.findByIdAndUpdate(
		req.params.id,
		{ $set: { questionnaire, state: 'profiling' } },
		{ new: true }
	).lean();
	if (!app) return res.errorEnvelope('Not found', 404);
	return res.success(app, 'questionnaire updated');
});

// GET /api/v1/loan/applications/:id/status
router.get('/applications/:id/status', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	const app = await LoanApplication.findById(req.params.id).lean();
	if (!app) return res.errorEnvelope('Not found', 404);
	return res.success({ id: app._id, state: app.state }, 'status');
});

// POST /api/v1/loan/applications/:id/consent-share -> explicit consent to share with lenders
router.post('/applications/:id/consent-share', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	const { consent = false } = req.body || {};
	if (!consent) return res.errorEnvelope('Consent required', 400);
	const app = await LoanApplication.findById(req.params.id);
	if (!app) return res.errorEnvelope('Not found', 404);
	app.meta = { ...(app.meta || {}), consentShareWithLendersAt: new Date() };
	await app.save();
	return res.success({ id: app._id, consentedAt: app.meta.consentShareWithLendersAt }, 'CONSENT_RECORDED');
});

module.exports = router;


