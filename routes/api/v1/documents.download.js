const { Router } = require('express');
const sharp = require('sharp');
const mongoose = require('mongoose');
const Document = require('../../../models/Document');
const { createAuditLog } = require('../../../utils/audit');

const router = Router();

async function fetchBufferByStorageKey(storageKey) {
	// Placeholder: in a real system, fetch from S3/MinIO with signed URL or SDK
	// For now, return an empty PNG buffer with watermark applied below
	const blank = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#ffffff' } })
		.png()
		.toBuffer();
	return blank;
}

async function applyWatermark(inputBuffer, watermarkText) {
	const svg = Buffer.from(
		`<svg width="800" height="600">
		  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="rgba(0,0,0,0.35)" font-size="32" font-family="Arial" transform="rotate(-20,400,300)">${watermarkText}</text>
		</svg>`
	);
	return await sharp(inputBuffer).composite([{ input: svg, gravity: 'center' }]).png().toBuffer();
}

router.get('/:id/download', async (req, res) => {
	try {
		const id = req.params.id;
		if (!mongoose.isValidObjectId(id)) return res.errorEnvelope('Invalid id', 400);
		const doc = await Document.findById(id).lean();
		if (!doc) return res.errorEnvelope('Not found', 404);

		const baseBuffer = await fetchBufferByStorageKey(doc.storageKey);
		const userLabel = (req.user?.email || req.user?.id || 'admin');
		const watermark = `${userLabel} • ${new Date().toISOString()}`;
		const watermarked = await applyWatermark(baseBuffer, watermark);

        res.setHeader('Content-Type', doc.mimeType || 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="${doc.originalName || 'document'}.png"`);
        try {
            await createAuditLog({
                actorId: req.user?._id,
                action: 'DOC_DOWNLOADED',
                resource: `/documents/${id}/download`,
                resourceId: id,
                ip: req.ip,
                headerUserAgent: req.get('user-agent') || '',
                before: { params: req.params, query: req.query },
                after: { bytes: watermarked.length },
            });
        } catch (_) {}
        return res.status(200).send(watermarked);
	} catch (err) {
		return res.errorEnvelope('Download failed', 500, { error: err.message });
	}
});

module.exports = router;


