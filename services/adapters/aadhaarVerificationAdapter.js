// Stub Aadhaar verification adapter
// Aadhaar is 12-digit numeric; here we only check basic format and a simple heuristic

async function verifyAadhaar(aadhaar) {
	const normalized = String(aadhaar || '').replace(/\s+/g, '');
	const isFormatValid = /^[0-9]{12}$/.test(normalized);
	const isBlacklisted = normalized.startsWith('0000') || normalized.startsWith('9999');
	const verified = isFormatValid && !isBlacklisted;
	return {
		status: verified ? 'verified' : 'failed',
		meta: {
			normalized,
			formatValid: isFormatValid,
			blacklisted: isBlacklisted,
			source: 'stub',
		},
	};
}

module.exports = { verifyAadhaar };


