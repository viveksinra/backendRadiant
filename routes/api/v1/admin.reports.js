const { Router } = require('express');
const rbac = require('../../../middlewares/rbac');
const AuditLog = require('../../../models/AuditLog');
const Assignment = require('../../../models/Assignment');
const LoanApplication = require('../../../models/LoanApplication');

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

// GET /api/v1/admin/reports/productivity -> simple counts per employee
router.get('/productivity', rbac(['admin:read']), async (req, res) => {
    const pipeline = [
        { $match: { isActive: true } },
        { $group: { _id: '$assignee', activeAssignments: { $sum: 1 } } },
        { $sort: { activeAssignments: -1 } }
    ];
    const data = await Assignment.aggregate(pipeline);
    return res.success({ items: data }, 'productivity');
});

// GET /api/v1/admin/reports/sla-breaches -> app-level simple breach by age
router.get('/sla-breaches', rbac(['admin:read']), async (req, res) => {
    const thresholdHours = Number(req.query.thresholdHours || 48);
    const cutoff = new Date(Date.now() - thresholdHours * 3600 * 1000);
    const items = await LoanApplication.find({ state: 'in_review', updatedAt: { $lt: cutoff } })
        .select('_id userId updatedAt state')
        .lean();
    return res.success({ count: items.length, items }, 'sla_breaches');
});

module.exports = router;


