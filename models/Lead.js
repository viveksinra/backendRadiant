const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
	{
		fullName: { type: String, trim: true },
		phone: { type: String, trim: true, index: { unique: false, sparse: true } },
		email: { type: String, trim: true, lowercase: true, index: { unique: false, sparse: true } },
		status: {
			type: String,
			enum: ['new', 'contacted', 'qualified', 'converted', 'lost'],
			default: 'new',
		},
		addressLine: { type: String, trim: true },
		city: { type: String, trim: true },
		state: { type: String, trim: true },
		pincode: { type: String, trim: true },
		geo: {
			lat: { type: Number },
			lng: { type: Number },
		},
		assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', index: true },
		score: { type: Number, default: 0, index: true },
		convertedApplication: { type: mongoose.Schema.Types.ObjectId, ref: 'LoanApplication' },
		isDeleted: { type: Boolean, default: false, index: true },
	},
	{ timestamps: true }
);

leadSchema.index({ phone: 1 }, { sparse: true });
leadSchema.index({ email: 1 }, { sparse: true });

module.exports = mongoose.models.Lead || mongoose.model('Lead', leadSchema);


