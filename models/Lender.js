const mongoose = require('mongoose');

const lenderSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, unique: true },
		code: { type: String, required: true, unique: true },
		isActive: { type: Boolean, default: true },
		eligibilityRules: { type: Object, default: {} },
		isDeleted: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

module.exports = mongoose.models.Lender || mongoose.model('Lender', lenderSchema);


