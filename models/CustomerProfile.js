const mongoose = require('mongoose');

const customerProfileSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true, unique: true },
		name: { type: String, trim: true, default: '' },
		email: { type: String, trim: true, lowercase: true, default: '' },
		imageUrl: { type: String, default: '' },
		isDeleted: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

module.exports = mongoose.models.CustomerProfile || mongoose.model('CustomerProfile', customerProfileSchema);


