const { Router } = require('express');
const rbac = require('../../../middlewares/rbac');
const Document = require('../../../models/Document');
const { enqueueScan } = require('../../../services/avScanService');
const { getDownloadInfo, getPreviewInfo } = require('../../../services/watermarkService');
const { createAuditLog } = require('../../../utils/audit');

const router = Router();

// Create document record (after client uploads to storage via signed URL in future)
router.post('/', rbac(['user:write']), async (req, res) => {
	try {
		const { ownerType, ownerId, filename, contentType, size, storageKey } = req.body || {};
		const doc = await Document.create({ ownerType, ownerId, filename, contentType, size, storageKey });
		// Enqueue AV scan (stub)
		await enqueueScan(doc._id);
		return res.success(doc, 'document created', 201);
	} catch (err) {
		return res.errorEnvelope(err.message || 'create failed', 400);
	}
});

router.get('/:id', rbac(['user:read']), async (req, res) => {
	const doc = await Document.findById(req.params.id).lean();
	if (!doc) return res.errorEnvelope('not found', 404);
	return res.success(doc, 'document');
});

router.get('/:id/download', rbac(['user:read']), async (req, res) => {
	try {
        const info = await getDownloadInfo(req.params.id, req);
        // explicit audit event for downloads (GET is not captured by default audit middleware)
        try {
            await createAuditLog({
                actorId: req.user?._id,
                action: 'DOC_DOWNLOADED',
                resource: `/documents/${req.params.id}/download`,
                resourceId: req.params.id,
                ip: req.ip,
                headerUserAgent: req.get('user-agent') || '',
                before: { params: req.params, query: req.query },
                after: info,
            });
        } catch (_) {}
        return res.success(info, 'download');
	} catch (err) {
		return res.errorEnvelope(err.message || 'download failed', 400);
	}
});

router.get('/:id/preview', rbac(['user:read']), async (req, res) => {
	try {
		const info = await getPreviewInfo(req.params.id);
		return res.success(info, 'preview');
	} catch (err) {
		return res.errorEnvelope(err.message || 'preview failed', 400);
	}
});

module.exports = router;




