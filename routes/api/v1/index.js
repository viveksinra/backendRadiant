const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
	res.json({ message: 'API base', variant: 'success', myData: { path: req.path } });
});

router.use('/admin/permissions', require('./admin.permissions'));
router.use('/audit/logs', require('./audit.logs'));
// Rate limit OTP endpoints
router.use('/auth/otp', require('../../../middlewares/rateLimiter')({ name: 'otp', limit: 5 }));
router.use('/auth/otp', require('./auth.otp'));
router.use('/auth', require('./auth.session'));
router.use('/profile', require('./profile'));
router.use('/storage', require('./storage'));
router.use('/kyc', require('./kyc'));
router.use('/loan', require('./loan'));
router.use('/loan/calc', require('./loan.calc'));
router.use('/admin/webhooks', require('./admin.webhooks'));
router.use('/webhooks', require('./webhooks.lender'));
router.use('/documents', require('./documents.download'));
router.use('/storage', require('./storage.multipart'));
router.use('/admin', require('./admin.assignment'));
router.use('/auth', require('./auth.otp'));
router.use('/admin/loan/applications', require('./admin.loan.applications'));
router.use('/documents', require('./documents'));
router.use('/feature/flags', require('./feature.flags'));
router.use('/', require('./leads'));
router.use('/', require('./visits'));
router.use('/', require('./lead.convert'));
router.use('/', require('./admin.leads.merge'));
router.use('/', require('./admin.leads.score'));
router.use('/', require('./leadgen.summary'));

// Newly added routes (backend task subset 1)
router.use('/consents', require('./consents'));
router.use('/aa', require('./aa'));
router.use('/bureau', require('./bureau'));
router.use('/kfs', require('./kfs'));
router.use('/me', require('./me.data'));
router.use('/admin/reports', require('./admin.reports'));
router.use('/docs', require('./docs'));
router.use('/admin/comms/logs', require('./admin.comms.logs'));
router.use('/rate', require('./rate.limit'));
router.use('/admin/retention', require('./admin.retention'));

module.exports = router;



