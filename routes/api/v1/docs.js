const { Router } = require('express');

const router = Router();

// Minimal OpenAPI stub served as JSON
router.get('/', (req, res) => {
    const openapi = {
        openapi: '3.0.0',
        info: { title: 'Radiant Finance API', version: '0.1.0' },
        paths: {
            '/api/v1/consents': { get: {}, post: {} },
            '/api/v1/consents/{id}/revoke': { post: {} },
            '/api/v1/kyc/verify/pan': { post: {} },
            '/api/v1/kyc/verify/aadhaar': { post: {} },
            '/api/v1/aa/consents': { post: {} },
            '/api/v1/aa/consents/{id}': { get: {} },
            '/api/v1/bureau/pull': { post: {} },
            '/api/v1/kfs/{applicationId}': { get: {} },
            '/api/v1/me/export': { post: {} },
            '/api/v1/me/delete': { post: {} },
        },
    };
    return res.success(openapi, 'SPEC_PUBLISHED');
});

module.exports = router;


