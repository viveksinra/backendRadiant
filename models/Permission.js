const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema(
	{
		key: { type: String, required: true, unique: true, index: true },
		description: { type: String, default: '' },
		isDeleted: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

module.exports = mongoose.models.Permission || mongoose.model('Permission', permissionSchema);


