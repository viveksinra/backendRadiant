function maskValue(value) {
	if (value == null) return value;
	const s = String(value);
	if (s.length <= 4) return '*'.repeat(Math.max(0, s.length - 1)) + s.slice(-1);
	return s.slice(0, 2) + '*'.repeat(s.length - 6) + s.slice(-4);
}


module.exports = function piiMask(options = {}) {
	const { fields = ['pan', 'aadhaar'], maskForRoles = ['agent'] } = options;
	return function (req, res, next) {
		const originalSuccess = res.success;
		res.success = function (myData = null, message = 'ok', status = 200) {
			try {
				const user = req.user || { roles: [], permissions: [] };
				const userRoles = new Set(user.roles || []);
				const userPerms = new Set(user.permissions || []);
				// Mask if user does NOT have explicit PII read permission
				let shouldMask = !userPerms.has('pii:read');
				// Or if role-based mask list matches
				if (!shouldMask) {
					// already allowed
				} else if (maskForRoles.length) {
					shouldMask = maskForRoles.some((r) => userRoles.has(r));
				}
				if (shouldMask && myData) {
					const applyMask = (obj) => {
						if (!obj || typeof obj !== 'object') return obj;
						for (const f of fields) {
							if (obj[f]) obj[f] = maskValue(obj[f]);
						}
						return obj;
					};
					if (Array.isArray(myData)) {
						myData = myData.map((x) => applyMask({ ...x }));
					} else if (typeof myData === 'object') {
						myData = applyMask({ ...myData });
					}
				}
			} catch (_) {}
			return originalSuccess.call(res, myData, message, status);
		};
		return next();
	};
};


