const { Router } = require('express');
const crypto = require('crypto');
const { enqueue } = require('../../../services/webhookDispatcher');

const router = Router();

function validateHmac(req, secret) {
    const provided = req.get('X-Hub-Signature') || req.get('X-Signature') || '';
    const computed = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');
    return provided === computed;
}

router.post('/lender', async (req, res) => {
    const secret = process.env.WEBHOOK_HMAC_SECRET || 'change-me';
    if (!validateHmac(req, secret)) {
        return res.errorEnvelope('Invalid signature', 400);
    }
    const idempotencyKey = req.get('Idempotency-Key') || null;
    await enqueue({
        source: 'lender',
        targetUrl: process.env.WEBHOOK_INTERNAL_TARGET || 'http://localhost:2040/internal/lender-webhook',
        payload: req.body,
        headers: { 'Content-Type': 'application/json' },
        hmacSecret: process.env.WEBHOOK_FORWARD_HMAC_SECRET || null,
        idempotencyKey,
    });
    return res.success({ accepted: true }, 'WEBHOOK_RECEIVED');
});

module.exports = router;


