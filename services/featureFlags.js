const config = require('../config');

function toBool(value, defaultValue = false) {
	if (value === true || value === false) return value;
	if (typeof value === 'string') {
		const v = value.trim().toLowerCase();
		if (['1', 'true', 'yes', 'on', 'y'].includes(v)) return true;
		if (['0', 'false', 'no', 'off', 'n'].includes(v)) return false;
	}
	if (typeof value === 'number') return value !== 0;
	return defaultValue;
}

const flags = {
	aa: toBool(process.env.FEATURE_AA, false),
	bureau: toBool(process.env.FEATURE_BUREAU, false),
	esign: toBool(process.env.FEATURE_ESIGN, false),
};

function getFlags() {
	return { ...flags, env: config.env };
}

function setFlag(key, value) {
	if (!Object.prototype.hasOwnProperty.call(flags, key)) throw new Error('Unknown flag');
	flags[key] = toBool(value, flags[key]);
	return flags[key];
}

module.exports = { getFlags, setFlag };




