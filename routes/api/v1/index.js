const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
	res.json({ message: 'API base', variant: 'success', myData: { path: req.path } });
});

router.use('/admin/permissions', require('./admin.permissions'));
router.use('/audit/logs', require('./audit.logs'));
router.use('/auth/otp', require('../../../middlewares/rateLimiter')({ name: 'otp', limit: 5 }));
router.use('/auth/otp', require('./auth.otp'));
router.use('/auth', require('./auth.session'));
router.use('/profile', require('./profile'));
router.use('/storage', require('./storage'));
router.use('/kyc', require('./kyc'));
router.use('/loan', require('./loan'));
router.use('/loan/calc', require('./loan.calc'));
router.use('/loan', require('./loan.match'));
router.use('/admin/lenders', require('./admin.lenders'));
router.use('/notifications', require('./notifications'));
router.use('/webhooks', require('./webhooks.lender'));

// Enable implemented backend features
router.use('/admin/webhooks', require('./admin.webhooks'));
router.use('/documents', require('./documents.download'));
router.use('/storage', require('./storage.multipart'));
router.use('/admin', require('./admin.assignment'));

module.exports = router;



