const { Router } = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../../../models/RefreshToken');
const config = require('../../../config');

const router = Router();

router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body || {};
        const deviceId = req.get('X-Device-Id') || req.get('X-Device-Fingerprint') || req.body?.deviceId || 'unknown';
        if (!refreshToken) return res.errorEnvelope('refreshToken required', 400);
        const decoded = jwt.verify(refreshToken, config.jwtSecret);
        if (decoded.type !== 'refresh') return res.errorEnvelope('Invalid token type', 400);
        if (decoded.deviceId !== deviceId) return res.errorEnvelope('Device mismatch', 401);

        // validate stored refresh token record
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const existing = await RefreshToken.findOne({ jti: decoded.jti, userId: decoded.uid, deviceId, tokenHash, isRevoked: false });
        if (!existing) return res.errorEnvelope('Refresh token invalidated', 401);
        if (existing.expiresAt <= new Date()) return res.errorEnvelope('Refresh token expired', 401);

        // rotate refresh token
        const newJti = crypto.randomBytes(16).toString('hex');
        const newRefreshPayload = { uid: decoded.uid, type: 'refresh', jti: newJti, deviceId };
        const newRefreshToken = jwt.sign(newRefreshPayload, config.jwtSecret, { expiresIn: '30d' });
        const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
        const { exp } = jwt.decode(newRefreshToken);

        // revoke old and store new
        await RefreshToken.findByIdAndUpdate(existing._id, { $set: { isRevoked: true, revokedAt: new Date() } });
        await RefreshToken.create({ userId: decoded.uid, deviceId, jti: newJti, tokenHash: newHash, expiresAt: new Date(exp * 1000) });

        const accessToken = jwt.sign({ uid: decoded.uid }, config.jwtSecret, { expiresIn: '15m' });
        return res.success({ token: accessToken, refreshToken: newRefreshToken }, 'refreshed');
    } catch (err) {
        return res.errorEnvelope('Failed to refresh', 401);
    }
});

router.post('/logout', async (req, res) => {
    try {
        const { refreshToken, allDevices = false } = req.body || {};
        const deviceId = req.get('X-Device-Id') || req.get('X-Device-Fingerprint') || req.body?.deviceId || null;
        if (!refreshToken && !deviceId) return res.errorEnvelope('refreshToken or deviceId required', 400);

        if (refreshToken) {
            try {
                const decoded = jwt.verify(refreshToken, config.jwtSecret);
                const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
                const query = { userId: decoded.uid, jti: decoded.jti, tokenHash: hash };
                await RefreshToken.updateMany(query, { $set: { isRevoked: true, revokedAt: new Date() } });
                if (allDevices) {
                    await RefreshToken.updateMany({ userId: decoded.uid }, { $set: { isRevoked: true, revokedAt: new Date() } });
                }
            } catch (_) {
                // ignore parse error and proceed with device-based revoke if provided
            }
        }

        if (deviceId) {
            // revoke all tokens for device (optionally for current user only if refreshToken parsed)
            if (refreshToken) {
                const decoded = jwt.decode(refreshToken);
                if (decoded?.uid) {
                    await RefreshToken.updateMany({ userId: decoded.uid, deviceId }, { $set: { isRevoked: true, revokedAt: new Date() } });
                } else {
                    await RefreshToken.updateMany({ deviceId }, { $set: { isRevoked: true, revokedAt: new Date() } });
                }
            } else {
                await RefreshToken.updateMany({ deviceId }, { $set: { isRevoked: true, revokedAt: new Date() } });
            }
        }

        return res.success(null, 'logged out');
    } catch (err) {
        return res.errorEnvelope('Logout failed', 400);
    }
});

module.exports = router;


