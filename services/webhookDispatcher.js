const axios = require('axios');
const crypto = require('crypto');
const WebhookEvent = require('../models/WebhookEvent');

function computeBackoffMs(attemptIndex) {
	const base = 1000; // 1s
	const cap = 60 * 1000; // 60s
	const jitter = Math.floor(Math.random() * 500);
	const delay = Math.min(base * Math.pow(2, attemptIndex), cap) + jitter;
	return delay;
}

async function dispatchOne(event) {
	try {
		const headers = { ...(event.headers || {}) };
		if (event.signature) {
			headers['X-Webhook-Signature'] = event.signature;
		}
		const res = await axios.post(event.targetUrl, event.payload, { headers, timeout: 10000 });
		await WebhookEvent.findByIdAndUpdate(event._id, {
			status: 'delivered',
			deliveredAt: new Date(),
		});
		return { ok: true, status: res.status };
	} catch (err) {
		const attempt = (event.attemptCount || 0) + 1;
		const isPoison = attempt >= 6; // 6 attempts -> DLQ
		const update = {
			attemptCount: attempt,
			lastError: err?.message || 'dispatch error',
			nextAttemptAt: new Date(Date.now() + computeBackoffMs(attempt)),
			status: isPoison ? 'dlq' : 'pending',
		};
		await WebhookEvent.findByIdAndUpdate(event._id, update);
		return { ok: false, error: update.lastError, dlq: isPoison };
	}
}

async function runPendingBatch(limit = 25) {
	const now = new Date();
	const pending = await WebhookEvent.find({ status: 'pending', nextAttemptAt: { $lte: now } })
		.sort({ nextAttemptAt: 1 })
		.limit(limit)
		.lean();
	const results = [];
	for (const evt of pending) {
		results.push(await dispatchOne(evt));
	}
	return results;
}

async function enqueue({ source, targetUrl, payload, headers = {}, hmacSecret = null, idempotencyKey = null }) {
	let signature = null;
	if (hmacSecret) {
		signature = crypto.createHmac('sha256', hmacSecret).update(JSON.stringify(payload)).digest('hex');
	}
	if (idempotencyKey) {
		const existing = await WebhookEvent.findOne({ idempotencyKey });
		if (existing) return existing;
	}
	const evt = await WebhookEvent.create({ source, targetUrl, payload, headers, signature, idempotencyKey });
	return evt;
}

async function replay(id) {
	const evt = await WebhookEvent.findById(id);
	if (!evt) throw new Error('Not found');
	await WebhookEvent.findByIdAndUpdate(id, { status: 'pending', nextAttemptAt: new Date(), lastError: null });
	return true;
}

module.exports = {
	computeBackoffMs,
	dispatchOne,
	runPendingBatch,
	enqueue,
	replay,
};


