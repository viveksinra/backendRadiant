const { Router } = require('express');
const auth = require('../../../middlewares/auth');
const Notification = require('../../../models/Notification');

const router = Router();
router.use(auth);

router.get('/', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	const list = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100).lean();
	return res.success(list, 'notifications');
});

router.post('/', async (req, res) => {
    const { userId, user, title, body, data } = req.body || {};
    const targetUser = user || userId;
    if (!targetUser || !title) return res.errorEnvelope('user (or userId) and title required', 400);
    const created = await Notification.create({ user: targetUser, title, body, data });
    // Push adapter stub; later integrate FCM and queue
    return res.success(created.toObject(), 'notification created');
});

router.post('/register-device', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	const { deviceToken } = req.body || {};
	if (!deviceToken) return res.errorEnvelope('deviceToken required', 400);
	await Notification.updateMany({ user: req.user._id }, { $addToSet: { deviceTokens: deviceToken } });
	return res.success(null, 'device registered');
});

module.exports = router;


