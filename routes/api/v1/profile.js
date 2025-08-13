const { Router } = require('express');
const auth = require('../../../middlewares/auth');
const CustomerProfile = require('../../../models/CustomerProfile');

const router = Router();

router.use(auth);

router.get('/me', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	let profile = await CustomerProfile.findOne({ userId: req.user._id, isDeleted: { $ne: true } }).lean();
	if (!profile) {
		profile = { userId: req.user._id, name: '', email: '', imageUrl: '' };
	}
	return res.success(profile, 'profile');
});

router.put('/me', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	const { name, email, imageUrl } = req.body || {};
	const updated = await CustomerProfile.findOneAndUpdate(
		{ userId: req.user._id },
		{ $set: { name: name || '', email: email || '', imageUrl: imageUrl || '' } },
		{ new: true, upsert: true }
	).lean();
	return res.success(updated, 'profile updated');
});

module.exports = router;


