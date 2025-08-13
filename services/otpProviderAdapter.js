/* Stub provider; replace with MSG91/Twilio later */
module.exports = {
	async sendOtp(phone, code) {
		console.log(`[OTP] sending to ${phone}: ${code}`);
		return { providerMessageId: `stub-${Date.now()}` };
	},
};

const axios = require('axios');

async function sendOtp(phone, code) {
    const providerKey = process.env.OTP_PROVIDER_KEY || '';
    const senderId = process.env.OTP_SENDER_ID || '';
    const dltEntityId = process.env.DLT_ENTITY_ID || '';
    const url = process.env.OTP_PROVIDER_URL || 'https://example.com/otp/send';
    const message = `Your Radiant Finance OTP is ${code}`;
    const payload = { phone, message, code };
    const headers = {
        'X-API-KEY': providerKey,
        'X-SENDER-ID': senderId,
        'X-DLT-ENTITY': dltEntityId,
        'Content-Type': 'application/json'
    };
    try {
        const res = await axios.post(url, payload, { headers, timeout: 10000 });
        return { ok: res.status < 300, providerStatus: res.status, data: res.data };
    } catch (err) {
        return { ok: false, providerStatus: err?.response?.status || 500, error: err?.message };
    }
}

module.exports = { sendOtp };


