const mongoose = require('mongoose');

const customerProfileSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
		name: { type: String, trim: true },
		email: { type: String, trim: true, lowercase: true },
		imageUrl: { type: String, default: '' },
		isDeleted: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

module.exports = mongoose.models.CustomerProfile || mongoose.model('CustomerProfile', customerProfileSchema);

const mongoose = require('mongoose');

const customerProfileSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		name: { type: String, trim: true, default: '' },
		email: { type: String, trim: true, lowercase: true, default: '' },
		imageUrl: { type: String, default: '' },
		isDeleted: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

customerProfileSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.models.CustomerProfile || mongoose.model('CustomerProfile', customerProfileSchema);


