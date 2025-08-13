/* eslint-disable no-console */
const { connectToMongoWithRetry } = require('../services/mongo');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const LoanType = require('../models/LoanType');

async function upsertOne(model, where, doc) {
	await model.updateOne(where, { $set: doc }, { upsert: true });
}

async function run() {
	await connectToMongoWithRetry(3, 300);
	console.log('Seeding base data...');

	const basePermissions = [
		{ key: 'admin:read', description: 'Read admin resources' },
		{ key: 'admin:write', description: 'Write admin resources' },
		{ key: 'lead:view', description: 'View leads' },
		{ key: 'lead:edit', description: 'Edit leads' },
	];
	for (const p of basePermissions) {
		await upsertOne(Permission, { key: p.key }, p);
	}

	const baseRoles = [
		{ name: 'Admin', description: 'System administrator' },
		{ name: 'Agent', description: 'Field agent' },
		{ name: 'Customer', description: 'Customer user' },
	];
	for (const r of baseRoles) {
		await upsertOne(Role, { name: r.name }, r);
	}

	const loanTypes = [
		{ name: 'Personal Loan', maxAmount: 1000000 },
		{ name: 'Home Loan', maxAmount: 10000000 },
		{ name: 'Business Loan', maxAmount: 2000000 },
	];
	for (const lt of loanTypes) {
		await upsertOne(LoanType, { name: lt.name }, lt);
	}

	console.log('Seed completed.');
	process.exit(0);
}

run().catch((err) => {
	console.error('Seed failed', err);
	process.exit(1);
});


