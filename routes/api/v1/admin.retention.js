const { Router } = require('express');
const rbac = require('../../../middlewares/rbac');
const config = require('../../../config');
const Document = require('../../../models/Document');
const AuditLog = require('../../../models/AuditLog');
const Consent = require('../../../models/Consent');

const router = Router();

// POST /api/v1/admin/retention/run  -> soft delete old documents and expired consents
router.post('/run', rbac(['admin:write']), async (req, res) => {
    const days = Number(req.body.days || config.retentionDays);
    const cutoff = new Date(Date.now() - days * 86400000);
    const docResult = await Document.updateMany({ updatedAt: { $lt: cutoff } }, { $set: { isDeleted: true } });
    const consentResult = await Consent.updateMany({ expiresAt: { $lt: new Date() }, status: { $ne: 'revoked' } }, { $set: { status: 'expired' } });
    await AuditLog.create({ action: 'RETENTION_RUN', resource: '/admin/retention/run', before: { days }, after: { docResult, consentResult } });
    return res.success({ docResult, consentResult }, 'PURGE_EXECUTED');
});

module.exports = router;


