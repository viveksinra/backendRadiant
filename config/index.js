const Joi = require('joi');

const schema = Joi.object({
	NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
	PORT: Joi.number().port().default(4000),
	MONGO_URI: Joi.string().uri({ scheme: [/^mongodb(\+srv)?$/] }).default('mongodb://127.0.0.1:27017/radiant_finance'),
	JWT_SECRET: Joi.string().min(6).allow('').default('dev_secret'),
}).unknown(true);

const { value: env, error } = schema.validate(process.env, { abortEarly: false });

if (error) {
	// In production, fail fast; in dev, log but continue
	const isProd = env.NODE_ENV === 'production';
	if (isProd) {
		throw new Error(`Invalid env configuration: ${error.message}`);
	} else {
		console.warn('[config] Env validation warnings:', error.message);
	}
}

module.exports = {
	env: env.NODE_ENV,
	port: env.PORT,
	mongoUri: env.MONGO_URI,
	jwtSecret: env.JWT_SECRET,
};



