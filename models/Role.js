const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, unique: true, index: true },
		description: { type: String, default: '' },
		permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
		isDeleted: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

module.exports = mongoose.models.Role || mongoose.model('Role', roleSchema);


