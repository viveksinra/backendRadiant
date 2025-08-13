const mongoose = require('mongoose');

const loanApplicationSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
		loanTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'LoanType', index: true },
		amount: { type: Number, default: 0 },
		state: {
			type: String,
			enum: ['created', 'profiling', 'documents', 'matching', 'offered', 'in_review', 'approved', 'rejected', 'disbursed'],
			default: 'created',
			index: true,
		},
		questionnaire: { type: mongoose.Schema.Types.Mixed, default: {} },
		currentOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', index: true },
		meta: { type: mongoose.Schema.Types.Mixed },
		isDeleted: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

loanApplicationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.LoanApplication || mongoose.model('LoanApplication', loanApplicationSchema);
