const mongoose = require('mongoose');

const interactionLogSchema = new mongoose.Schema(
	{
		lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', index: true },
		employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', index: true },
		type: { type: String, enum: ['note', 'call', 'visit', 'status_change', 'assign'], default: 'note' },
		message: { type: String, trim: true },
		meta: { type: mongoose.Schema.Types.Mixed },
		isDeleted: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

interactionLogSchema.index({ createdAt: -1 });

module.exports = mongoose.models.InteractionLog || mongoose.model('InteractionLog', interactionLogSchema);


