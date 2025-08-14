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


