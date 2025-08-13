const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
	{
		applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'LoanApplication', index: true },
		lenderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lender' },
		ratePercent: { type: Number, default: 0 },
		processingFee: { type: Number, default: 0 },
		amount: { type: Number, default: 0 },
		isDeleted: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

module.exports = mongoose.models.Offer || mongoose.model('Offer', offerSchema);


