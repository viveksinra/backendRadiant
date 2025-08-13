const Assignment = require('../models/Assignment');
const LoanApplication = require('../models/LoanApplication');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');

async function assignLoanApplication({ applicationId, assigneeEmployeeId, assignedByEmployeeId, reason = '' }) {
	const [application, assignee] = await Promise.all([
		LoanApplication.findById(applicationId),
		Employee.findById(assigneeEmployeeId),
	]);
	if (!application) throw new Error('Application not found');
	if (!assignee) throw new Error('Assignee not found');

	await Assignment.updateMany(
		{ resourceType: 'LoanApplication', resourceId: application._id, isActive: true },
		{ $set: { isActive: false } }
	);

	const assignment = await Assignment.create({
		resourceType: 'LoanApplication',
		resourceId: application._id,
		assignee: assignee._id,
		assignedBy: assignedByEmployeeId || null,
		reason,
		isActive: true,
	});

	application.currentOwner = assignee._id;
	await application.save();

	// Notify assignee's user, if any
	if (assignee.user) {
		await Notification.create({
			user: assignee.user,
			title: 'New assignment',
			body: `You have been assigned application ${application._id.toString()}`,
			data: { applicationId: application._id.toString(), reason },
		});
	}

	return assignment;
}

async function unassignLoanApplication({ applicationId, reason = '' }) {
	const application = await LoanApplication.findById(applicationId);
	if (!application) throw new Error('Application not found');

	await Assignment.updateMany(
		{ resourceType: 'LoanApplication', resourceId: application._id, isActive: true },
		{ $set: { isActive: false, reason } }
	);

	application.currentOwner = null;
	await application.save();

	return { applicationId: application._id.toString(), unassigned: true };
}

module.exports = { assignLoanApplication, unassignLoanApplication };




