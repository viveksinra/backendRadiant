const mongoose = require('mongoose');

// Inbound webhook events from lenders/providers
const webhookEventSchema = new mongoose.Schema(
	{
		source: { type: String, required: true },
		eventType: { type: String, required: true },
		idempotencyKey: { type: String, index: true },
		signature: { type: String },
		payload: { type: mongoose.Schema.Types.Mixed, required: true },
		status: { type: String, enum: ['received', 'processed', 'error'], default: 'received', index: true },
		processedAt: { type: Date },
		lastError: { type: String },
	},
	{ timestamps: true }
);

webhookEventSchema.index({ source: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.models.WebhookEvent || mongoose.model('WebhookEvent', webhookEventSchema);


