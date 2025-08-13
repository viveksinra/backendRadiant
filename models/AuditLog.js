const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
	{
		actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		action: { type: String, required: true },
		resource: { type: String, required: true },
		resourceId: { type: String },
		ip: { type: String },
		headerUserAgent: { type: String },
		before: { type: mongoose.Schema.Types.Mixed },
		after: { type: mongoose.Schema.Types.Mixed },
		prevHash: { type: String },
		hash: { type: String, index: true },
	},
	{ timestamps: true }
);

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);


