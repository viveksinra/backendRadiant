const Joi = require('joi');

const schema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
    PORT: Joi.number().port().default(4000),
    MONGO_URI: Joi.string().uri({ scheme: [/^mongodb(\+srv)?$/] }).default('mongodb://127.0.0.1:27017/radiant_finance'),
    JWT_SECRET: Joi.string().min(6).allow('').default('dev_secret'),
    ENCRYPTION_KEY: Joi.string().min(32).allow('').default('12345678901234567890123456789012'),
    FEATURE_FLAGS: Joi.string().allow('').default(''),
    RETENTION_DAYS: Joi.number().integer().min(1).default(365),
}).unknown(true);

const { value: env, error } = schema.validate(process.env, { abortEarly: false });

if (error) {
    const isProd = env.NODE_ENV === 'production';
    if (isProd) {
        throw new Error(`Invalid env configuration: ${error.message}`);
    } else {
        console.warn('[config] Env validation warnings:', error.message);
    }
}

function parseFeatureFlags(raw) {
    if (!raw) return { kycStubsEnabled: true, aaStubEnabled: true, bureauStubEnabled: true };
    try {
        const obj = JSON.parse(raw);
        return {
            kycStubsEnabled: Boolean(obj.kycStubsEnabled ?? obj.useStubs ?? true),
            aaStubEnabled: Boolean(obj.aaStubEnabled ?? obj.useStubs ?? true),
            bureauStubEnabled: Boolean(obj.bureauStubEnabled ?? obj.useStubs ?? true),
        };
    } catch (_) {
        // comma-separated flags like "kyc,aa"
        const set = new Set(String(raw).split(',').map((s) => s.trim()));
        return {
            kycStubsEnabled: set.has('kyc') || set.has('all') || raw === '1',
            aaStubEnabled: set.has('aa') || set.has('all') || raw === '1',
            bureauStubEnabled: set.has('bureau') || set.has('all') || raw === '1',
        };
    }
}

module.exports = {
    env: env.NODE_ENV,
    port: env.PORT,
    mongoUri: env.MONGO_URI,
    jwtSecret: env.JWT_SECRET,
    encryptionKey: env.ENCRYPTION_KEY,
    retentionDays: env.RETENTION_DAYS,
    featureFlags: parseFeatureFlags(env.FEATURE_FLAGS),
};



