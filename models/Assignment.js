const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
	{
		resourceType: { type: String, enum: ['LoanApplication', 'Lead'], required: true, index: true },
		resourceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
		assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
		assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
		reason: { type: String, default: '' },
		isActive: { type: Boolean, default: true, index: true },
		isDeleted: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

assignmentSchema.index({ resourceType: 1, resourceId: 1, isActive: 1 });

module.exports = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);



