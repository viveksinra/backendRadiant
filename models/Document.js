const mongoose = require('mongoose');

// Unified Document schema for uploads and KYC/loan attachments
const documentSchema = new mongoose.Schema(
	{
		ownerType: { type: String, enum: ['User', 'LoanApplication'], index: true },
		ownerId: { type: mongoose.Schema.Types.ObjectId, index: true },
		filename: { type: String, required: true },
		contentType: { type: String, default: 'application/octet-stream' },
		size: { type: Number, default: 0 },
		storageKey: { type: String, required: true, unique: true },
		scanStatus: { type: String, enum: ['pending', 'clean', 'infected', 'quarantined'], default: 'pending', index: true },
		flags: { type: [String], default: [] },
		meta: { type: mongoose.Schema.Types.Mixed },
		isDeleted: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

documentSchema.index({ ownerType: 1, ownerId: 1 });

module.exports = mongoose.models.Document || mongoose.model('Document', documentSchema);


