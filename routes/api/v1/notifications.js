const { Router } = require('express');
const auth = require('../../../middlewares/auth');
const Notification = require('../../../models/Notification');

const router = Router();
router.use(auth);

router.get('/', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	const list = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(100).lean();
	return res.success(list, 'notifications');
});

router.post('/', async (req, res) => {
	const { userId, title, body } = req.body || {};
	if (!userId || !title) return res.errorEnvelope('userId and title required', 400);
	const created = await Notification.create({ userId, title, body });
	// Push adapter stub; later integrate FCM and queue
	return res.success(created.toObject(), 'notification created');
});

router.post('/register-device', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	const { deviceToken } = req.body || {};
	if (!deviceToken) return res.errorEnvelope('deviceToken required', 400);
	await Notification.updateMany({ userId: req.user._id }, { $addToSet: { deviceTokens: deviceToken } });
	return res.success(null, 'device registered');
});

module.exports = router;


