const { Router } = require('express');
const Consent = require('../../../models/Consent');
const rbac = require('../../../middlewares/rbac');
const config = require('../../../config');

const router = Router();

// POST /api/v1/bureau/pull
router.post('/pull', rbac([]), async (req, res) => {
    const { subjectId } = req.body;
    if (!subjectId) return res.errorEnvelope('subjectId required', 400);
    const hasConsent = await Consent.findOne({ subjectId, scope: 'bureau:pull', status: 'active', expiresAt: { $gt: new Date() } });
    if (!hasConsent) return res.errorEnvelope('Consent required', 403);
    if (!config.featureFlags.bureauStubEnabled) {
        return res.errorEnvelope('Bureau provider not configured', 503);
    }
    // Deterministic stubbed score
    const score = 700 + (parseInt(String(subjectId).slice(-2), 16) % 100);
    return res.success({ score, reportId: `stub-${subjectId}` }, 'BUREAU_PULL_REQUESTED');
});

module.exports = router;


