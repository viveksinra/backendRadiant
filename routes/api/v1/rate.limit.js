const { Router } = require('express');
const rateLimiter = require('../../../middlewares/rateLimiter');

const router = Router();

// Example usage: throttle OTP requests etc.
router.get('/test', rateLimiter({ name: 'test', limit: 5 }), (req, res) => {
    return res.success({ now: Date.now() }, 'ok');
});

module.exports = router;


