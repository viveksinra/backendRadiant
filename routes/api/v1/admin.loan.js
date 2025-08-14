const { Router } = require('express');
const rbac = require('../../../middlewares/rbac');
const LoanApplication = require('../../../models/LoanApplication');
const { createAuditLog } = require('../../../utils/audit');

const router = Router();

// GET /api/v1/admin/loan/export -> CSV export of loan applications (respects basic filters)
router.get('/export', rbac(['admin:read']), async (req, res) => {
    const { state, from, to, limit = 1000 } = req.query || {};
    const q = { isDeleted: { $ne: true } };
    if (state) q.state = state;
    if (from || to) {
        q.updatedAt = {};
        if (from) q.updatedAt.$gte = new Date(from);
        if (to) q.updatedAt.$lte = new Date(to);
    }
    const items = await LoanApplication.find(q)
        .sort({ updatedAt: -1 })
        .limit(Number(limit))
        .lean();

    const header = ['id', 'userId', 'loanTypeId', 'amount', 'state', 'updatedAt'];
    const rows = items.map((a) => [a._id, a.userId || '', a.loanTypeId || '', a.amount || 0, a.state, new Date(a.updatedAt).toISOString()]);
    const csv = [header.join(',')].concat(rows.map((r) => r.join(','))).join('\n');

    try {
        await createAuditLog({
            actorId: req.user?._id,
            action: 'REPORT_EXPORTED',
            resource: '/admin/loan/export',
            resourceId: null,
            ip: req.ip,
            headerUserAgent: req.get('user-agent') || '',
            before: { query: req.query },
            after: { count: items.length },
        });
    } catch (_) {}

    res.setHeader('Content-Type', 'text/csv');
    return res.status(200).send(csv);
});

module.exports = router;

