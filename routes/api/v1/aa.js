const { Router } = require('express');
const Consent = require('../../../models/Consent');
const WebhookEvent = require('../../../models/WebhookEvent');
const rbac = require('../../../middlewares/rbac');
const config = require('../../../config');

const router = Router();

// POST /api/v1/aa/consents  -> initiate AA consent
router.post('/consents', rbac([]), async (req, res) => {
    const { subjectId, purpose = 'bank_statements' } = req.body;
    if (!subjectId) return res.errorEnvelope('subjectId required', 400);
    const consent = await Consent.create({ subjectId, scope: `aa:${purpose}`, description: 'AA consent', expiresAt: new Date(Date.now() + 7 * 86400000) });
    let status = 'pending';
    let stub = false;
    if (config.featureFlags.aaStubEnabled) {
        status = 'granted';
        stub = true;
    }
    await WebhookEvent.create({ source: 'aa', eventType: 'consent_initiated', payload: { consentId: consent._id, status, stub } });
    return res.success({ id: consent._id, status, stub }, 'AA_CONSENT_INITIATED', 201);
});

// GET /api/v1/aa/consents/:id -> poll status (stubbed)
router.get('/consents/:id', rbac([]), async (req, res) => {
    const { id } = req.params;
    const consent = await Consent.findById(id).lean();
    if (!consent) return res.errorEnvelope('not found', 404);
    const status = config.featureFlags.aaStubEnabled ? 'granted' : 'pending';
    return res.success({ id, status }, 'AA_CONSENT_STATUS_UPDATED');
});

module.exports = router;


