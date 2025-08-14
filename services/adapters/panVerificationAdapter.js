// Stub PAN verification adapter
// Valid PAN format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/i;

async function verifyPan(pan) {
	const normalized = String(pan || '').trim().toUpperCase();
	const isFormatValid = PAN_REGEX.test(normalized);
	const isBlacklisted = normalized.startsWith('AAAAA');
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

module.exports = { verifyPan };


