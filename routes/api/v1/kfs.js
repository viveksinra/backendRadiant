const { Router } = require('express');
const Document = require('../../../models/Document');
const rbac = require('../../../middlewares/rbac');

const router = Router();

// GET /api/v1/kfs/:applicationId -> return simple JSON as placeholder for KFS
router.get('/:applicationId', rbac([]), async (req, res) => {
    const { applicationId } = req.params;
    const kfs = {
        applicationId,
        version: 1,
        disclaimer: 'This is a stub KFS. For demo only.',
        terms: {
            principal: 100000,
            rate: 12.5,
            tenureMonths: 24,
        },
    };
    return res.success(kfs, 'KFS_GENERATED');
});

module.exports = router;


