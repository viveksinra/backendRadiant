const { Router } = require('express');
const auth = require('../../../middlewares/auth');
const KycRecord = require('../../../models/KycRecord');
const Document = require('../../../models/Document');
const config = require('../../../config');
const { verifyPan } = require('../../../services/adapters/panVerificationAdapter');
const { verifyAadhaar } = require('../../../services/adapters/aadhaarVerificationAdapter');

const router = Router();

router.use(auth);

// GET /api/v1/kyc/me
router.get('/me', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	const rec = await KycRecord.findOne({ userId: req.user._id, isDeleted: { $ne: true } })
		.populate('documents')
		.lean();
	return res.success(rec || { status: 'draft', documents: [] }, 'kyc');
});

// PUT /api/v1/kyc/aadhaar
router.put('/aadhaar', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	const { aadhaar = '' } = req.body || {};
	const updated = await KycRecord.findOneAndUpdate(
		{ userId: req.user._id },
		{ $set: { aadhaar, status: 'draft', aadhaarStatus: 'unverified' } },
		{ new: true, upsert: true }
	).lean();
	return res.success(updated, 'aadhaar saved');
});

// PUT /api/v1/kyc/pan
router.put('/pan', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	const { pan = '' } = req.body || {};
	const updated = await KycRecord.findOneAndUpdate(
		{ userId: req.user._id },
		{ $set: { pan, status: 'draft', panStatus: 'unverified' } },
		{ new: true, upsert: true }
	).lean();
	return res.success(updated, 'pan saved');
});

// POST /api/v1/kyc/itr
router.post('/itr', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	const { fiscalYear = '', storageKey = '', contentType = 'application/octet-stream', filename = 'document', size = 0 } = req.body || {};
	if (!storageKey) return res.errorEnvelope('storageKey required', 400);
	const doc = await Document.create({ ownerType: 'User', ownerId: req.user._id, filename, contentType, storageKey, size, meta: { fiscalYear } });
	await KycRecord.findOneAndUpdate(
		{ userId: req.user._id },
		{ $addToSet: { documents: doc._id }, $setOnInsert: { status: 'draft' } },
		{ upsert: true }
	);
	return res.success(doc.toObject(), 'itr uploaded');
});

// POST /api/v1/kyc/submit
router.post('/submit', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	const updated = await KycRecord.findOneAndUpdate(
		{ userId: req.user._id },
		{ $set: { status: 'submitted' } },
		{ new: true }
	).lean();
	return res.success(updated, 'kyc submitted');
});

module.exports = router;

// POST /api/v1/kyc/verify/pan
router.post('/verify/pan', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	if (!config.featureFlags.kycStubsEnabled) return res.errorEnvelope('PAN provider not configured', 503);
	const { pan = '' } = req.body || {};
	const result = await verifyPan(pan);
	const updated = await KycRecord.findOneAndUpdate(
		{ userId: req.user._id },
		{ $set: { pan, panStatus: result.status, panMeta: result.meta } },
		{ new: true, upsert: true }
	).lean();
	return res.success(updated, 'PAN_VERIFIED');
});

// POST /api/v1/kyc/verify/aadhaar
router.post('/verify/aadhaar', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	if (!config.featureFlags.kycStubsEnabled) return res.errorEnvelope('Aadhaar provider not configured', 503);
	const { aadhaar = '' } = req.body || {};
	const result = await verifyAadhaar(aadhaar);
	const updated = await KycRecord.findOneAndUpdate(
		{ userId: req.user._id },
		{ $set: { aadhaar, aadhaarStatus: result.status, aadhaarMeta: result.meta } },
		{ new: true, upsert: true }
	).lean();
	return res.success(updated, 'AADHAAR_VERIFIED');
});


