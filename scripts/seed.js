const mongoose = require('mongoose');
require('dotenv').config();
const config = require('../config');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const LoanType = require('../models/LoanType');

async function main() {
	await mongoose.connect(config.mongoUri);
	const perms = [
		{ key: 'admin:read', description: 'Read admin data' },
		{ key: 'kyc:verify', description: 'Verify KYC' },
	];
	for (const p of perms) {
		await Permission.updateOne({ key: p.key }, { $setOnInsert: p }, { upsert: true });
	}
	const adminRole = await Role.findOneAndUpdate(
		{ name: 'admin' },
		{ $setOnInsert: { name: 'admin', description: 'Administrator' } },
		{ upsert: true, new: true }
	);
	const baseLoanTypes = [
		{ name: 'Personal Loan', code: 'PL' },
		{ name: 'Home Loan', code: 'HL' },
		{ name: 'Business Loan', code: 'BL' },
	];
	for (const lt of baseLoanTypes) {
		await LoanType.updateOne({ code: lt.code }, { $setOnInsert: lt }, { upsert: true });
	}
	console.log('Seed completed');
	await mongoose.disconnect();
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});

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


