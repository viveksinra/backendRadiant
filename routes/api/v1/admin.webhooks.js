const { Router } = require('express');
const WebhookEvent = require('../../models/WebhookEvent');
const { replay, runPendingBatch } = require('../../services/webhookDispatcher');

const router = Router();

router.get('/', async (req, res) => {
	const { status = 'dlq', limit = 50, page = 1 } = req.query;
	const q = { status };
	const docs = await WebhookEvent.find(q)
		.sort({ updatedAt: -1 })
		.skip((Number(page) - 1) * Number(limit))
		.limit(Number(limit))
		.lean();
	return res.success({ items: docs });
});

router.post('/:id/replay', async (req, res) => {
	try {
		await replay(req.params.id);
		await runPendingBatch(1);
		return res.success({ id: req.params.id }, 'WEBHOOK_REPLAYED');
	} catch (err) {
		return res.errorEnvelope(err.message || 'Replay failed', 400);
	}
});

module.exports = router;


