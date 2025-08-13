const Document = require('../models/Document');
const LoanApplication = require('../models/LoanApplication');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');
const { scanFile } = require('./adapters/antivirusScanAdapter');

async function notifyQuarantine(doc) {
	try {
		if (doc.ownerType === 'User') {
			await Notification.create({
				user: doc.ownerId,
				title: 'Upload quarantined',
				body: `${doc.filename} flagged by virus scan`,
				data: { documentId: doc._id.toString() },
			});
		} else if (doc.ownerType === 'LoanApplication') {
			const app = await LoanApplication.findById(doc.ownerId);
			if (app?.currentOwner) {
				const ownerEmp = await Employee.findById(app.currentOwner);
				if (ownerEmp?.user) {
					await Notification.create({
						user: ownerEmp.user,
						title: 'Upload quarantined',
						body: `${doc.filename} flagged by virus scan`,
						data: { documentId: doc._id.toString(), applicationId: app._id.toString() },
					});
				}
			}
		}
	} catch (_) {}
}

// Stub AV scan service: simulate enqueue and immediate scan
async function enqueueScan(documentId) {
	const doc = await Document.findById(documentId);
	if (!doc) throw new Error('Document not found');

	const result = await scanFile({ filename: doc.filename, storageKey: doc.storageKey });
	if (result === 'infected') {
		doc.scanStatus = 'quarantined';
		doc.flags = Array.from(new Set([...(doc.flags || []), 'infected']));
		await notifyQuarantine(doc);
	} else {
		doc.scanStatus = 'clean';
	}
	await doc.save();
	return doc;
}

module.exports = { enqueueScan };




