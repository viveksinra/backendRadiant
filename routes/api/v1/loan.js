const { Router } = require('express');
const auth = require('../../../middlewares/auth');
const LoanApplication = require('../../../models/LoanApplication');

const router = Router();

router.use(auth);

router.post('/applications', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	const { loanTypeId, amount = 0 } = req.body || {};
	const app = await LoanApplication.create({ userId: req.user._id, loanTypeId, amount, state: 'created' });
	return res.success(app.toObject(), 'application created');
});

router.get('/applications/:id', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	const app = await LoanApplication.findById(req.params.id).lean();
	if (!app) return res.errorEnvelope('Not found', 404);
	return res.success(app, 'application');
});

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

router.get('/applications/:id/status', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	const app = await LoanApplication.findById(req.params.id).lean();
	if (!app) return res.errorEnvelope('Not found', 404);
	return res.success({ id: app._id, state: app.state }, 'status');
});

module.exports = router;


