const mongoose = require('mongoose');
const config = require('../config');

let isConnected = false;

async function connectToMongoWithRetry(maxRetries = 5, baseDelayMs = 500) {
	if (isConnected) return mongoose.connection;

	let attempt = 0;
	while (attempt <= maxRetries) {
		try {
			await mongoose.connect(config.mongoUri, { autoIndex: true });
			isConnected = true;
			return mongoose.connection;
		} catch (err) {
			attempt += 1;
			if (attempt > maxRetries) {
				throw err;
			}
			const delay = baseDelayMs * Math.pow(2, attempt - 1);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}
}

module.exports = {
	connectToMongoWithRetry,
};


