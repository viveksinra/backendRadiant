const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
	{
		phone: { type: String, trim: true, index: { unique: true, sparse: true } },
		email: { type: String, trim: true, lowercase: true, index: { unique: true, sparse: true } },
		passwordHash: { type: String, default: '' },
		roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
		isActive: { type: Boolean, default: true },
		isDeleted: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);


