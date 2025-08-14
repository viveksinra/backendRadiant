const mongoose = require('mongoose');

// Unified WebhookEvent schema supporting inbound and outbound events with retry/DLQ
const webhookEventSchema = new mongoose.Schema(
    {
        // common
        source: { type: String, required: true },
        eventType: { type: String },
        idempotencyKey: { type: String, index: true },
        payload: { type: mongoose.Schema.Types.Mixed, required: true },
        signature: { type: String },
        headers: { type: mongoose.Schema.Types.Mixed, default: {} },

        // outbound delivery
        targetUrl: { type: String },
        status: {
            type: String,
            enum: ['pending', 'delivered', 'dlq', 'received', 'processed', 'error'],
            default: 'pending',
            index: true,
        },
        attemptCount: { type: Number, default: 0 },
        nextAttemptAt: { type: Date, default: () => new Date() },
        deliveredAt: { type: Date },

        // inbound processing
        processedAt: { type: Date },
        lastError: { type: String },
    },
    { timestamps: true }
);

webhookEventSchema.index({ source: 1, idempotencyKey: 1 }, { unique: true, sparse: true });
webhookEventSchema.index({ status: 1, nextAttemptAt: 1 });

module.exports = mongoose.models.WebhookEvent || mongoose.model('WebhookEvent', webhookEventSchema);


