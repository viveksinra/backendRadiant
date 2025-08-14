const { Router } = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const OtpCode = require('../../../models/OtpCode');
const User = require('../../../models/User');
const CommsLog = require('../../../models/CommsLog');
const RefreshToken = require('../../../models/RefreshToken');
const otpProvider = require('../../../services/otpProviderAdapter');
const config = require('../../../config');

const router = Router();

function hashCode(code) {
	return crypto.createHash('sha256').update(`${code}:${config.jwtSecret}`).digest('hex');
}

function randomCode() {
	return `${Math.floor(100000 + Math.random() * 900000)}`;
}

// POST /api/v1/auth/otp/request
router.post('/request', async (req, res) => {
	const { phone } = req.body || {};
	if (!phone) return res.errorEnvelope('Phone is required', 400);
	const now = new Date();
	const code = randomCode();
	const codeHash = hashCode(code);
	const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
	const existing = await OtpCode.findOne({ phone });
	if (existing?.lockedUntil && existing.lockedUntil > now) {
		return res.errorEnvelope('Too many attempts. Try later.', 429);
	}
	await OtpCode.updateOne(
		{ phone },
		{ $set: { codeHash, expiresAt, lastSentAt: now }, $setOnInsert: { attemptCount: 0 } },
		{ upsert: true }
	);
	await otpProvider.sendOtp(phone, code);
    await CommsLog.create({ channel: 'otp', templateId: 'otp_login', recipient: phone, variables: { code }, status: 'sent' });
    return res.success({ ttlSeconds: 300 }, 'OTP_PROVIDER_CALLED');
});

// POST /api/v1/auth/otp/verify
router.post('/verify', async (req, res) => {
	const { phone, code } = req.body || {};
	if (!phone || !code) return res.errorEnvelope('Phone and code required', 400);
	const now = new Date();
	const found = await OtpCode.findOne({ phone });
	if (!found) return res.errorEnvelope('Request OTP first', 400);
	if (found.lockedUntil && found.lockedUntil > now) return res.errorEnvelope('Locked. Try later.', 429);
	if (found.expiresAt <= now) return res.errorEnvelope('OTP expired', 400);
	const valid = found.codeHash === hashCode(code);
	const nextAttempts = (found.attemptCount || 0) + 1;
	if (!valid) {
		const update = { attemptCount: nextAttempts };
		if (nextAttempts >= 5) update.lockedUntil = new Date(now.getTime() + 15 * 60 * 1000);
		await OtpCode.updateOne({ phone }, { $set: update });
		return res.errorEnvelope('Invalid OTP', 400);
	}

	let user = await User.findOne({ phone });
	if (!user) user = await User.create({ phone });

	const deviceId = req.get('X-Device-Id') || req.get('X-Device-Fingerprint') || req.body?.deviceId || 'unknown';
	const jti = crypto.randomBytes(16).toString('hex');
	const token = jwt.sign({ uid: user._id }, config.jwtSecret, { expiresIn: '15m' });
	const refreshPayload = { uid: user._id, type: 'refresh', jti, deviceId };
	const refreshToken = jwt.sign(refreshPayload, config.jwtSecret, { expiresIn: '30d' });

	// persist hashed refresh token (device-bound)
	const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
	const { exp } = jwt.decode(refreshToken);
	await RefreshToken.create({
		userId: user._id,
		deviceId,
		jti,
		tokenHash: hash,
		expiresAt: new Date(exp * 1000),
		isRevoked: false,
	});

	return res.success({ token, refreshToken, user: { id: user._id, phone: user.phone } }, 'OTP verified');
});

module.exports = router;


