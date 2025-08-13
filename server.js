const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const config = require('./config');
const { connectToMongoWithRetry } = require('./services/mongo');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(require('./middlewares/responseEnvelope'));

// Standard response helper
function envelope(res, { message = 'ok', variant = 'success', myData = null, status = 200 }) {
	return res.status(status).json({ message, variant, myData });
}

// X-Timezone middleware (noop but validated)
app.use((req, res, next) => {
	const timezone = req.header('X-Timezone');
	if (timezone) {
		req.requestTimezone = timezone;
	}
	next();
});

// Health check
app.get('/health_check', (req, res) => {
	return res.success({ server: 'running', timestamp: new Date().toISOString() }, 'health check ok');
});

// Base API v1 router
const apiRouter = require('./routes/api/v1');
app.use('/api/v1', apiRouter);

const PORT = config.port;

// Ensure model registration so indexes are created on first connection
require('./models/Role');
require('./models/Permission');
require('./models/LoanType');
require('./models/User');
require('./models/Employee');

connectToMongoWithRetry()
	.then(() => {
		console.log('Mongo connected');
		app.listen(PORT, () => console.log(`Backend running on :${PORT}`));
	})
	.catch((err) => {
		console.error('Mongo connection error', err);
		app.listen(PORT, () => console.log(`Backend running (without DB) on :${PORT}`));
	});


