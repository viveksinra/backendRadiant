const { Router } = require('express');
const rbac = require('../../../middlewares/rbac');
const SlaConfig = require('../../../models/SlaConfig');
const { createAuditLog } = require('../../../utils/audit');

const router = Router();

// GET /api/v1/admin/sla -> list configs
router.get('/', rbac(['admin:read']), async (req, res) => {
    const items = await SlaConfig.find({ isActive: true }).lean();
    return res.success({ items }, 'sla');
});

// POST /api/v1/admin/sla -> create/update config
router.post('/', rbac(['admin:write']), async (req, res) => {
    const { id, scope = 'global', loanTypeId = null, thresholds = {}, quietHours = '' } = req.body || {};
    const payload = { scope, loanTypeId, thresholds, quietHours, isActive: true };
    let doc;
    if (id) {
        const before = await SlaConfig.findById(id).lean();
        doc = await SlaConfig.findByIdAndUpdate(id, { $set: payload }, { new: true, upsert: false }).lean();
        try { await createAuditLog({ actorId: req.user?._id, action: 'SLA_CONFIG_UPDATED', resource: '/admin/sla', resourceId: id, ip: req.ip, headerUserAgent: req.get('user-agent'), before, after: doc }); } catch (_) {}
    } else {
        doc = await SlaConfig.create(payload);
        try { await createAuditLog({ actorId: req.user?._id, action: 'SLA_CONFIG_CREATED', resource: '/admin/sla', resourceId: doc._id, ip: req.ip, headerUserAgent: req.get('user-agent'), before: null, after: doc }); } catch (_) {}
    }
    return res.success(doc, 'SLA_CONFIG_UPDATED');
});

module.exports = router;

