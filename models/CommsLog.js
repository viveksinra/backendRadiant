const mongoose = require('mongoose');

const commsLogSchema = new mongoose.Schema(
	{
		channel: { type: String, enum: ['otp', 'sms', 'email', 'whatsapp'], required: true },
		templateId: { type: String, required: true },
		recipient: { type: String, required: true, index: true },
		variables: { type: mongoose.Schema.Types.Mixed },
		status: { type: String, enum: ['queued', 'sent', 'failed'], default: 'queued' },
		providerMessageId: { type: String },
		meta: { type: mongoose.Schema.Types.Mixed },
	},
	{ timestamps: true }
);

module.exports = mongoose.models.CommsLog || mongoose.model('CommsLog', commsLogSchema);


