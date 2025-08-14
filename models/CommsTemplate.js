const mongoose = require('mongoose');

const commsTemplateSchema = new mongoose.Schema(
	{
		channel: { type: String, enum: ['sms', 'email', 'whatsapp'], required: true },
		templateId: { type: String, required: true, unique: true, index: true },
		name: { type: String, required: true },
		version: { type: Number, default: 1 },
		body: { type: String, required: true },
		variables: { type: [String], default: [] },
		isDeleted: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

module.exports = mongoose.models.CommsTemplate || mongoose.model('CommsTemplate', commsTemplateSchema);


