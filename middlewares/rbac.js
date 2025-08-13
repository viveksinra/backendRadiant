// Simple RBAC middleware: expects req.user with roles -> permissions populated upstream
module.exports = function requirePermissions(requiredPermissions = []) {
	return async function (req, res, next) {
		try {
			// In a fuller system, decode JWT and load user roles+permissions
			// Here, allow if no perms required
			if (!requiredPermissions.length) return next();

			const user = req.user || null;
			if (!user) return res.errorEnvelope('Unauthorized', 401);

			const userPerms = new Set(user.permissions || []);
			const ok = requiredPermissions.every((p) => userPerms.has(p));
			if (!ok) return res.errorEnvelope('Forbidden', 403);

			return next();
		} catch (err) {
			return res.errorEnvelope('RBAC check failed', 500);
		}
	};
};


