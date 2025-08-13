const { Router } = require('express');
const rbac = require('../../../middlewares/rbac');
const AuditLog = require('../../../models/AuditLog');

const router = Router();

// GET /api/v1/admin/reports/export -> returns CSV text (stub)
router.get('/export', rbac(['admin:read']), async (req, res) => {
    const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(100).lean();
    const csv = ['timestamp,action,resource'].concat(
        logs.map((l) => `${new Date(l.createdAt).toISOString()},${JSON.stringify(l.action)},${JSON.stringify(l.resource)}`)
    );
    res.setHeader('Content-Type', 'text/csv');
    return res.status(200).send(csv.join('\n'));
});

module.exports = router;


