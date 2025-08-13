const { Router } = require('express');
const Permission = require('../../../models/Permission');
const rbac = require('../../../middlewares/rbac');

const router = Router();

router.get('/', rbac(['admin:read']), async (req, res) => {
	const perms = await Permission.find({ isDeleted: { $ne: true } }).lean();
	return res.success(perms, 'permissions');
});

module.exports = router;


