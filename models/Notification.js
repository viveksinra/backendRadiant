const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
		title: { type: String, required: true },
		body: { type: String, default: '' },
		read: { type: Boolean, default: false, index: true },
		deviceTokens: { type: [String], default: [] },
	},
	{ timestamps: true }
);

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
		title: { type: String, required: true },
		body: { type: String, default: '' },
		data: { type: mongoose.Schema.Types.Mixed },
		readAt: { type: Date },
		isDeleted: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);




