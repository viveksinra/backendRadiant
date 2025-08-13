const { Router } = require('express');
const auth = require('../../../middlewares/auth');
const storage = require('../../../services/objectStorageAdapter');

const router = Router();

router.post('/signed-url', auth, async (req, res) => {
	const { key, contentType } = req.body || {};
	if (!key || !contentType) return res.errorEnvelope('key and contentType required', 400);
	const signed = await storage.getSignedUrl({ key, contentType });
	return res.success(signed, 'signed url');
});

module.exports = router;

const { Router } = require('express');
const auth = require('../../../middlewares/auth');

const router = Router();

router.use(auth);

// Stub: returns fake signed URL pair for uploads
router.post('/signed-url', async (req, res) => {
	if (!req.user) return res.errorEnvelope('Unauthorized', 401);
	const { contentType = 'application/octet-stream' } = req.body || {};
	const key = `uploads/${req.user._id}/${Date.now()}`;
	const putUrl = `https://example-s3.local/${key}?signature=PUT_FAKE&contentType=${encodeURIComponent(contentType)}`;
	const getUrl = `https://example-s3.local/${key}?signature=GET_FAKE`;
	return res.success({ key, putUrl, getUrl }, 'signed url issued');
});

module.exports = router;


