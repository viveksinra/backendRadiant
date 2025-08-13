const crypto = require('crypto');

// Stub S3 signed URL generator
module.exports = {
	async getSignedUrl({ key, contentType, expiresInSeconds = 300 }) {
		if (!key || !contentType) throw new Error('key and contentType required');
		const signature = crypto.createHash('sha256').update(`${key}:${contentType}`).digest('hex');
		return {
			url: `https://s3.example.com/bucket/${encodeURIComponent(key)}?signature=${signature}&expires=${expiresInSeconds}`,
			method: 'PUT',
			headers: { 'Content-Type': contentType },
			expiresInSeconds,
		};
	},
};


