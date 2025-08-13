const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		code: { type: String, trim: true, unique: true, sparse: true },
		name: { type: String, trim: true },
		team: { type: String, trim: true },
		title: { type: String, trim: true },
		isDeleted: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

module.exports = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);


