const mongoose = require('mongoose');

const loanTypeSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, unique: true, index: true },
		maxAmount: { type: Number, default: 0 },
		description: { type: String, default: '' },
		isDeleted: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

module.exports = mongoose.models.LoanType || mongoose.model('LoanType', loanTypeSchema);


