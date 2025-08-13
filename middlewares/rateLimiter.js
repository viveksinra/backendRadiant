// Simple in-memory rate limiter (per IP + key)
const windowMs = 60 * 1000; // 1 minute
const store = new Map(); // key -> { count, expiresAt }

function keyFor(req, name) {
	const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
	return `${name}:${ip}`;
}

module.exports = function rateLimiter(options = {}) {
	const { name = 'global', limit = 60 } = options;
	return function (req, res, next) {
		const key = keyFor(req, name);
		const now = Date.now();
		let entry = store.get(key);
		if (!entry || entry.expiresAt <= now) {
			entry = { count: 0, expiresAt: now + windowMs };
		}
		entry.count += 1;
		store.set(key, entry);
		if (entry.count > limit) {
			return res.errorEnvelope('Rate limit exceeded', 429, { retryAfterMs: entry.expiresAt - now });
		}
		next();
	};
};


