const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
	{
		resourceType: { type: String, enum: ['LoanApplication', 'Lead', 'User'], required: true, index: true },
		resourceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
		templateId: { type: String, required: true },
		channel: { type: String, enum: ['sms', 'email', 'whatsapp'], required: true },
		scheduledAt: { type: Date, required: true, index: true },
		status: { type: String, enum: ['scheduled', 'sent', 'failed', 'cancelled'], default: 'scheduled', index: true },
		variables: { type: mongoose.Schema.Types.Mixed },
		attempts: { type: Number, default: 0 },
		lastError: { type: String },
		isDeleted: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

module.exports = mongoose.models.Reminder || mongoose.model('Reminder', reminderSchema);


