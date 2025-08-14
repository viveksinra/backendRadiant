const { Router } = require('express');
const rateLimiter = require('../../../middlewares/rateLimiter');

const router = Router();

router.get('/', (req, res) => {
	res.json({ message: 'API base', variant: 'success', myData: { path: req.path } });
});

// Global soft rate limit
router.use(rateLimiter({ name: 'global', limit: 120 }));

router.use('/admin/permissions', require('./admin.permissions'));
router.use('/audit/logs', require('./audit.logs'));
router.use('/auth/otp', require('../../../middlewares/rateLimiter')({ name: 'otp', limit: 5 }));
router.use('/auth/otp', require('./auth.otp'));
router.use('/auth', require('./auth.session'));
router.use('/profile', require('./profile'));
router.use('/storage', require('./storage'));
router.use('/kyc', require('./kyc'));
router.use('/loan', require('./loan'));
router.use('/admin', require('./admin.assignment'));
router.use('/loan/calc', require('./loan.calc'));
router.use('/loan', require('./loan.match'));
router.use('/admin/lenders', require('./admin.lenders'));
router.use('/admin/reports', require('./admin.reports'));
router.use('/admin/kyc', require('./admin.kyc'));
router.use('/admin/comms', require('./admin.comms.templates'));
router.use('/admin/reminders', require('./admin.reminders'));
router.use('/admin/sla', require('./admin.sla'));
router.use('/admin/comms/logs', require('./admin.comms.logs'));
router.use('/admin/sessions', require('./admin.sessions'));
router.use('/admin/retention', require('./admin.retention'));
router.use('/notifications', require('./notifications'));
router.use('/webhooks', require('./webhooks.lender'));
router.use('/consents', require('./consents'));
router.use('/aa', require('./aa'));
router.use('/bureau', require('./bureau'));
router.use('/kfs', require('./kfs'));
router.use('/docs', require('./docs'));
router.use('/feature/flags', require('./feature.flags'));
router.use('/me', require('./me.data'));

// Optional mounts (now enabled as implementations exist)
router.use('/admin/webhooks', require('./admin.webhooks'));
router.use('/documents', require('./documents.download'));
router.use('/storage', require('./storage.multipart'));
router.use('/admin/loan/applications', require('./admin.loan.applications'));
router.use('/documents', require('./documents'));
// router.use('/feature/flags', require('./feature.flags'));
// Leads/Visits and related will be enabled as needed

module.exports = router;



