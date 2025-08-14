const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		deviceId: { type: String, default: 'unknown', index: true },
		jti: { type: String, required: true, index: true },
		tokenHash: { type: String, required: true },
		expiresAt: { type: Date, required: true, index: true },
		isRevoked: { type: Boolean, default: false, index: true },
		revokedAt: { type: Date },
	},
	{ timestamps: true }
);

module.exports = mongoose.models.RefreshToken || mongoose.model('RefreshToken', refreshTokenSchema);


