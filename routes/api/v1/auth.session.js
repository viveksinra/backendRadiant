const { Router } = require('express');
const jwt = require('jsonwebtoken');
const config = require('../../../config');

const router = Router();

router.post('/refresh', async (req, res) => {
	try {
		const { refreshToken } = req.body || {};
		if (!refreshToken) return res.errorEnvelope('refreshToken required', 400);
		const decoded = jwt.verify(refreshToken, config.jwtSecret);
		if (decoded.type !== 'refresh') return res.errorEnvelope('Invalid token type', 400);
		const token = jwt.sign({ uid: decoded.uid }, config.jwtSecret, { expiresIn: '15m' });
		return res.success({ token }, 'refreshed');
	} catch (err) {
		return res.errorEnvelope('Failed to refresh', 401);
	}
});

router.post('/logout', async (req, res) => {
	// Stateless JWT: client drops tokens; optionally maintain denylist if needed
	return res.success(null, 'logged out');
});

module.exports = router;


