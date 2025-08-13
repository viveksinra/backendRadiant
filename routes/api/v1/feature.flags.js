const { Router } = require('express');
const rbac = require('../../../middlewares/rbac');
const { getFlags, setFlag } = require('../../../services/featureFlags');

const router = Router();

router.get('/', rbac([]), async (req, res) => {
	return res.success(getFlags(), 'feature flags');
});

router.post('/', rbac(['admin:write']), async (req, res) => {
	try {
		const { key, value } = req.body || {};
		const newValue = setFlag(key, value);
		return res.success({ key, value: newValue }, 'flag updated');
	} catch (err) {
		return res.errorEnvelope(err.message || 'update failed', 400);
	}
});

module.exports = router;




