const { Router } = require('express');
const KycRecord = require('../../../models/KycRecord');
const Consent = require('../../../models/Consent');
const rbac = require('../../../middlewares/rbac');
const config = require('../../../config');

const router = Router();

async function ensureConsent(subjectId, scope) {
    const c = await Consent.findOne({ subjectId, scope, status: 'active', expiresAt: { $gt: new Date() } });
    return Boolean(c);
}

// POST /api/v1/kyc/verify/pan
router.post('/verify/pan', rbac([]), async (req, res) => {
    const { userId, pan } = req.body;
    if (!userId || !pan) return res.errorEnvelope('userId and pan required', 400);
    const hasConsent = await ensureConsent(userId, 'kyc:pan');
    if (!hasConsent) return res.errorEnvelope('Consent required', 403);
    const useStub = config.featureFlags.kycStubsEnabled;
    let result = { status: 'failed', meta: {} };
    if (useStub) {
        // deterministic stub: simple checksum rule
        const ok = /^([A-Z]{5}[0-9]{4}[A-Z])$/.test(pan);
        result = { status: ok ? 'verified' : 'failed', meta: { stub: true } };
    } else {
        // In real adapter, call provider
        result = { status: 'failed', meta: { provider: 'unconfigured' } };
    }
    const rec = await KycRecord.findOneAndUpdate(
        { userId },
        { pan, panStatus: result.status, panMeta: result.meta },
        { upsert: true, new: true }
    );
    return res.success(rec.toObject(), result.status === 'verified' ? 'PAN_VERIFIED' : 'PAN_FAILED');
});

// POST /api/v1/kyc/verify/aadhaar
router.post('/verify/aadhaar', rbac([]), async (req, res) => {
    const { userId, aadhaar } = req.body;
    if (!userId || !aadhaar) return res.errorEnvelope('userId and aadhaar required', 400);
    const hasConsent = await ensureConsent(userId, 'kyc:aadhaar');
    if (!hasConsent) return res.errorEnvelope('Consent required', 403);
    const useStub = config.featureFlags.kycStubsEnabled;
    let result = { status: 'failed', meta: {} };
    if (useStub) {
        const ok = /^[2-9][0-9]{11}$/.test(aadhaar);
        result = { status: ok ? 'verified' : 'failed', meta: { stub: true } };
    } else {
        result = { status: 'failed', meta: { provider: 'unconfigured' } };
    }
    const rec = await KycRecord.findOneAndUpdate(
        { userId },
        { aadhaar, aadhaarStatus: result.status, aadhaarMeta: result.meta },
        { upsert: true, new: true }
    );
    return res.success(rec.toObject(), result.status === 'verified' ? 'AADHAAR_VERIFIED' : 'AADHAAR_FAILED');
});

module.exports = router;

const { Router } = require('express');
const auth = require('../../../middlewares/auth');
const KycRecord = require('../../../models/KycRecord');
const Document = require('../../../models/Document');

const router = Router();

router.use(auth);

router.get('/me', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	const rec = await KycRecord.findOne({ userId: req.user._id, isDeleted: { $ne: true } })
		.populate('documents')
		.lean();
	return res.success(rec || { status: 'draft', documents: [] }, 'kyc');
});

router.put('/aadhaar', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	const { aadhaarNumber = '' } = req.body || {};
	const updated = await KycRecord.findOneAndUpdate(
		{ userId: req.user._id },
		{ $set: { aadhaarNumber, status: 'draft' } },
		{ new: true, upsert: true }
	).lean();
	return res.success(updated, 'aadhaar saved');
});

router.put('/pan', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	const { panNumber = '' } = req.body || {};
	const updated = await KycRecord.findOneAndUpdate(
		{ userId: req.user._id },
		{ $set: { panNumber, status: 'draft' } },
		{ new: true, upsert: true }
	).lean();
	return res.success(updated, 'pan saved');
});

router.post('/itr', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	const { fiscalYear = '', storageKey = '', contentType = '' } = req.body || {};
	if (!storageKey) return res.errorEnvelope('storageKey required', 400);
	const doc = await Document.create({ ownerUserId: req.user._id, type: 'itr', fiscalYear, contentType, storageKey, status: 'submitted' });
	await KycRecord.findOneAndUpdate(
		{ userId: req.user._id },
		{ $addToSet: { documents: doc._id }, $setOnInsert: { status: 'draft' } },
		{ upsert: true }
	);
	return res.success(doc.toObject(), 'itr uploaded');
});

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


