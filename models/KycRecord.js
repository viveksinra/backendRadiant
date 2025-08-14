const mongoose = require('mongoose');

const kycRecordSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		pan: { type: String, trim: true, index: true, default: '' },
		aadhaar: { type: String, trim: true, index: true, default: '' },
		status: { type: String, enum: ['draft', 'submitted', 'verified', 'rejected'], default: 'draft' },
		panStatus: { type: String, enum: ['unverified', 'verified', 'failed'], default: 'unverified' },
		aadhaarStatus: { type: String, enum: ['unverified', 'verified', 'failed'], default: 'unverified' },
		panMeta: { type: mongoose.Schema.Types.Mixed },
		aadhaarMeta: { type: mongoose.Schema.Types.Mixed },
		documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
		reviewNotes: {
			type: [
				new mongoose.Schema(
					{
						type: { type: String, enum: ['reject', 'reupload'] },
						reason: { type: String },
						note: { type: String },
						at: { type: Date, default: Date.now },
					},
					{ _id: false }
				),
			],
			default: [],
		},
		isDeleted: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

module.exports = mongoose.models.KycRecord || mongoose.model('KycRecord', kycRecordSchema);


