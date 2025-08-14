const axios = require('axios');

// Adapter supports stub mode or real provider based on env
async function sendOtp(phone, code) {
    const provider = (process.env.OTP_PROVIDER || 'stub').toLowerCase();
    if (provider === 'stub') {
        console.log(`[OTP] sending to ${phone}: ${code}`);
        return { ok: true, provider: 'stub', providerMessageId: `stub-${Date.now()}` };
    }
    // Example generic provider call (MSG91/Twilio-like)
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
        'Content-Type': 'application/json',
    };
    try {
        const res = await axios.post(url, payload, { headers, timeout: 10000 });
        return { ok: res.status < 300, provider: 'http', providerStatus: res.status, data: res.data };
    } catch (err) {
        return { ok: false, provider: 'http', providerStatus: err?.response?.status || 500, error: err?.message };
    }
}

module.exports = { sendOtp };


