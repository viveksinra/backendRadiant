const { Router } = require('express');
const rbac = require('../../../middlewares/rbac');
const AuditLog = require('../../../models/AuditLog');
const Document = require('../../../models/Document');

const router = Router();

// POST /api/v1/me/export -> returns a simple aggregation of user's data (stub)
router.post('/export', rbac([]), async (req, res) => {
    const userId = req.user?._id || req.body.userId; // stub fallback
    if (!userId) return res.errorEnvelope('Unauthorized', 401);
    const audit = await AuditLog.find({ actorId: userId }).limit(50).lean();
    const docs = await Document.find({ ownerId: userId, isDeleted: { $ne: true } }).lean();
    return res.success({ audit, documents: docs }, 'DATA_EXPORT_REQUESTED');
});

// POST /api/v1/me/delete -> marks data for deletion (stub)
router.post('/delete', rbac([]), async (req, res) => {
    const userId = req.user?._id || req.body.userId; // stub fallback
    if (!userId) return res.errorEnvelope('Unauthorized', 401);
    // In a real system, enqueue deletion; here we just acknowledge
    return res.success({ userId, requestedAt: new Date().toISOString() }, 'DATA_DELETE_REQUESTED');
});

module.exports = router;


