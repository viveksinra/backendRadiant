const mongoose = require('mongoose');

const otpCodeSchema = new mongoose.Schema(
	{
		phone: { type: String, required: true, unique: true, index: true },
		codeHash: { type: String, required: true },
		expiresAt: { type: Date, required: true },
		attemptCount: { type: Number, default: 0 },
		lockedUntil: { type: Date },
		lastSentAt: { type: Date },
	},
	{ timestamps: true }
);

module.exports = mongoose.models.OtpCode || mongoose.model('OtpCode', otpCodeSchema);


