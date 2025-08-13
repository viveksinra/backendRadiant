// Very simple in-memory token bucket per key (NOT for production use)
module.exports = function rateLimiter({ name = 'default', limit = 10, windowMs = 60_000 } = {}) {
	const buckets = new Map(); // key -> { count, resetAt }
	return function (req, res, next) {
		try {
			const key = `${name}:${req.ip}`;
			const now = Date.now();
			const entry = buckets.get(key) || { count: 0, resetAt: now + windowMs };
			if (now > entry.resetAt) {
				entry.count = 0;
				entry.resetAt = now + windowMs;
			}
			entry.count += 1;
			buckets.set(key, entry);
			if (entry.count > limit) {
				return res.errorEnvelope('Too Many Requests', 429, { retryInMs: entry.resetAt - now });
			}
			return next();
		} catch (_) {
			return next();
		}
	};
};

// Simple in-memory rate limiter (per IP + key)
const windowMs = 60 * 1000; // 1 minute
const store = new Map(); // key -> { count, expiresAt }
const AuditLog = require('../models/AuditLog');

function keyFor(req, name) {
	const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
	return `${name}:${ip}`;
}

module.exports = function rateLimiter(options = {}) {
    const { name = 'global', limit = 60, audit = true } = options;
    return async function (req, res, next) {
        const key = keyFor(req, name);
        const now = Date.now();
        let entry = store.get(key);
        if (!entry || entry.expiresAt <= now) {
            entry = { count: 0, expiresAt: now + windowMs };
        }
        entry.count += 1;
        store.set(key, entry);
        if (entry.count > limit) {
            if (audit) {
                try {
                    await AuditLog.create({
                        actorId: req.user?._id,
                        action: 'RATE_LIMIT_TRIGGERED',
                        resource: req.path,
                        ip: req.ip,
                        before: { name, limit },
                        after: { count: entry.count, windowMs },
                    });
                } catch (_) {}
            }
            return res.errorEnvelope('Rate limit exceeded', 429, { retryAfterMs: entry.expiresAt - now });
        }
        next();
    };
};


