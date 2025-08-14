const { Router } = require('express');
const crypto = require('crypto');
const Document = require('../../../models/Document');

const router = Router();

// Simple in-memory chunk store for dev; replace with S3 multipart in prod
const chunkStore = new Map(); // uploadId -> { parts: Map(partNumber->Buffer), meta }

router.post('/multipart/init', async (req, res) => {
	const { filename = 'upload.bin', mimeType = 'application/octet-stream' } = req.body || {};
	const uploadId = crypto.randomBytes(12).toString('hex');
	chunkStore.set(uploadId, { parts: new Map(), meta: { filename, mimeType } });
	return res.success({ uploadId });
});

router.post('/multipart/:uploadId/part/:partNumber', async (req, res) => {
	try {
		const { uploadId, partNumber } = req.params;
		const store = chunkStore.get(uploadId);
		if (!store) return res.errorEnvelope('Invalid uploadId', 400);
		const { dataBase64 } = req.body || {};
		if (!dataBase64) return res.errorEnvelope('dataBase64 required', 400);
		const buf = Buffer.from(dataBase64, 'base64');
		store.parts.set(Number(partNumber), buf);
		return res.success({ received: Number(partNumber) });
	} catch (err) {
		return res.errorEnvelope('Part upload failed', 500, { error: err.message });
	}
});

router.post('/multipart/complete', async (req, res) => {
	try {
		const { uploadId, expectedSha256 } = req.body || {};
		const store = chunkStore.get(uploadId);
		if (!store) return res.errorEnvelope('Invalid uploadId', 400);
		const ordered = [...store.parts.entries()].sort((a, b) => a[0] - b[0]).map(([, b]) => b);
		const combined = Buffer.concat(ordered);
		const checksum = crypto.createHash('sha256').update(combined).digest('hex');
		if (expectedSha256 && checksum !== expectedSha256) {
			return res.errorEnvelope('Checksum mismatch', 400, { checksum });
		}
		const storageKey = `local/${uploadId}`;
		await Document.create({ storageKey, originalName: store.meta.filename, mimeType: store.meta.mimeType, size: combined.length });
		chunkStore.delete(uploadId);
		return res.success({ storageKey, checksum }, 'UPLOAD_COMPLETED');
	} catch (err) {
		return res.errorEnvelope('Complete failed', 500, { error: err.message });
	}
});

module.exports = router;


