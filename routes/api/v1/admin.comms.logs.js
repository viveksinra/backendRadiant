const { Router } = require('express');
const rbac = require('../../../middlewares/rbac');
const CommsLog = require('../../../models/CommsLog');

const router = Router();

router.get('/', rbac(['admin:read']), async (req, res) => {
    const { channel } = req.query;
    const q = {};
    if (channel) q.channel = channel;
    const logs = await CommsLog.find(q).sort({ createdAt: -1 }).limit(200).lean();
    return res.success(logs, 'COMMS_LOGGED');
});

module.exports = router;


