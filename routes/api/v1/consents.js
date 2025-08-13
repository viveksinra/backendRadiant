const { Router } = require('express');
const Consent = require('../../../models/Consent');
const rbac = require('../../../middlewares/rbac');

const router = Router();

// GET /api/v1/consents?subjectId=...&scope=...
router.get('/', rbac([]), async (req, res) => {
    const { subjectId, scope } = req.query;
    const q = {};
    if (subjectId) q.subjectId = subjectId;
    if (scope) q.scope = scope;
    const consents = await Consent.find(q).sort({ createdAt: -1 }).lean();
    return res.success(consents, 'consents');
});

// POST /api/v1/consents
router.post('/', rbac([]), async (req, res) => {
    const { subjectId, scope, ttlDays = 90, description = '' } = req.body;
    if (!subjectId || !scope) return res.errorEnvelope('subjectId and scope required', 400);
    const expiresAt = new Date(Date.now() + Number(ttlDays) * 24 * 60 * 60 * 1000);
    const consent = await Consent.create({ subjectId, scope, description, expiresAt, status: 'active' });
    return res.success(consent.toObject(), 'CONSENT_GIVEN', 201);
});

// POST /api/v1/consents/:id/revoke
router.post('/:id/revoke', rbac([]), async (req, res) => {
    const { id } = req.params;
    const by = req.user?._id || null;
    const consent = await Consent.findById(id);
    if (!consent) return res.errorEnvelope('not found', 404);
    consent.status = 'revoked';
    consent.revokedAt = new Date();
    consent.revokedBy = by;
    await consent.save();
    return res.success(consent.toObject(), 'CONSENT_REVOKED');
});

module.exports = router;


