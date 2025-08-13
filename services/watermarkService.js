// Simple placeholder for watermarking and preview
// In production, integrate with image/pdf processing libs and signed URLs

const Document = require('../models/Document');

async function getDownloadInfo(documentId, requester) {
	const doc = await Document.findById(documentId).lean();
	if (!doc) throw new Error('Document not found');
	return {
		url: `/assets/storage/${encodeURIComponent(doc.storageKey)}`,
		filename: doc.filename,
		watermarked: true,
		watermarkText: `Downloaded by ${requester?.user?.email || 'unknown'} at ${new Date().toISOString()}`,
	};
}

async function getPreviewInfo(documentId) {
	const doc = await Document.findById(documentId).lean();
	if (!doc) throw new Error('Document not found');
	return {
		url: `/assets/storage/preview/${encodeURIComponent(doc.storageKey)}`,
		filename: doc.filename,
	};
}

module.exports = { getDownloadInfo, getPreviewInfo };




