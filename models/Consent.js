const mongoose = require('mongoose');

const consentSchema = new mongoose.Schema(
	{
		subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		scope: { type: String, required: true, index: true },
		description: { type: String, default: '' },
		status: { type: String, enum: ['active', 'revoked', 'expired'], default: 'active', index: true },
		expiresAt: { type: Date, default: null, index: true },
		revokedAt: { type: Date, default: null },
		revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	},
	{ timestamps: true }
);

consentSchema.index({ subjectId: 1, scope: 1, status: 1 });

module.exports = mongoose.models.Consent || mongoose.model('Consent', consentSchema);


