const { Router } = require('express');
const crypto = require('crypto');
const OtpCode = require('../../../models/OtpCode');
const User = require('../../../models/User');
const otpProvider = require('../../../services/otpProviderAdapter');
const config = require('../../../config');

const router = Router();

function hashCode(code) {
	return crypto.createHash('sha256').update(`${code}:${config.jwtSecret}`).digest('hex');
}

function randomCode() {
	return `${Math.floor(100000 + Math.random() * 900000)}`;
}

router.post('/otp/request', async (req, res) => {
	const { phone } = req.body || {};
	if (!phone) return res.errorEnvelope('phone required', 400);
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
	return res.success({ ttlSeconds: 300 }, 'OTP sent');
});

router.post('/otp/verify', async (req, res) => {
	const { phone, code } = req.body || {};
	if (!phone || !code) return res.errorEnvelope('phone and code required', 400);
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

	// success: create/find user and issue token (stub, simple JWT-less token)
	let user = await User.findOne({ phone });
	if (!user) user = await User.create({ phone });

	// lightweight token for now
	const token = Buffer.from(`${user._id}:${Date.now()}`).toString('base64');
	return res.success({ token, user: { id: user._id, phone: user.phone } }, 'OTP verified');
});

module.exports = router;

const { Router } = require('express');
const jwt = require('jsonwebtoken');
const config = require('../../../config');
const User = require('../../../models/User');

const router = Router();

// naive in-memory store for demo; replace with Redis in production
const otpStore = new Map(); // key: phone, value: { code, expiresAt, attempts }

function generateOtp() {
	return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /api/v1/auth/otp/request
router.post('/request', async (req, res) => {
	try {
		const { phone } = req.body || {};
		if (!phone) return res.errorEnvelope('Phone is required', 400);
		const now = Date.now();
		const existing = otpStore.get(phone);
		if (existing && existing.expiresAt - 2 * 60 * 1000 > now) {
			return res.success(null, 'OTP already sent recently');
		}
		const code = generateOtp();
		otpStore.set(phone, { code, expiresAt: now + 5 * 60 * 1000, attempts: 0 });
		console.log(`[otp] send to ${phone}: ${code}`);
		return res.success(null, 'OTP sent');
	} catch (err) {
		return res.errorEnvelope('Failed to send OTP', 500);
	}
});

// POST /api/v1/auth/otp/verify
router.post('/verify', async (req, res) => {
	try {
		const { phone, code } = req.body || {};
		if (!phone || !code) return res.errorEnvelope('Phone and code are required', 400);
		const entry = otpStore.get(phone);
		if (!entry) return res.errorEnvelope('OTP not requested', 400);
		if (Date.now() > entry.expiresAt) return res.errorEnvelope('OTP expired', 400);
		if (entry.attempts >= 5) return res.errorEnvelope('Too many attempts', 429);
		entry.attempts += 1;
		if (entry.code !== code) return res.errorEnvelope('Invalid OTP', 400);
		otpStore.delete(phone);
		let user = await User.findOne({ phone });
		if (!user) {
			user = await User.create({ phone });
		}
		const token = jwt.sign({ uid: user._id }, config.jwtSecret, { expiresIn: '15m' });
		const refreshToken = jwt.sign({ uid: user._id, type: 'refresh' }, config.jwtSecret, { expiresIn: '30d' });
		return res.success({ token, refreshToken, user: { id: user._id, phone: user.phone } }, 'OTP verified');
	} catch (err) {
		return res.errorEnvelope('Failed to verify OTP', 500);
	}
});

module.exports = router;


