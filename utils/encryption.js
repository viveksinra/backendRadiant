const crypto = require('crypto');
const config = require('../config');

const ALGO = 'aes-256-gcm';

function getKey() {
	const key = config.encryptionKey;
	return Buffer.from(key.padEnd(32, '0').slice(0, 32));
}

function encrypt(plaintext) {
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
	const enc = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
	const tag = cipher.getAuthTag();
	return Buffer.concat([iv, tag, enc]).toString('base64');
}

function decrypt(ciphertext) {
	try {
		const buf = Buffer.from(ciphertext, 'base64');
		const iv = buf.subarray(0, 12);
		const tag = buf.subarray(12, 28);
		const data = buf.subarray(28);
		const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
		decipher.setAuthTag(tag);
		const dec = Buffer.concat([decipher.update(data), decipher.final()]);
		return dec.toString('utf8');
	} catch (_) {
		return '';
	}
}

module.exports = { encrypt, decrypt };


