const { encrypt, decrypt } = require('../utils/encryption');

module.exports = function encryptFieldsPlugin(schema, options) {
	const fields = options?.fields || [];

	function encryptDoc(doc) {
		for (const f of fields) {
			if (doc[f]) {
				try {
					if (!String(doc[f]).startsWith('enc:')) {
						doc[f] = 'enc:' + encrypt(doc[f]);
					}
				} catch (_) {}
			}
		}
	}

	schema.pre('save', function (next) {
		encryptDoc(this);
		next();
	});

	schema.pre('findOneAndUpdate', function (next) {
		const update = this.getUpdate() || {};
		for (const f of fields) {
			if (update[f]) {
				try {
					if (!String(update[f]).startsWith('enc:')) {
						update[f] = 'enc:' + encrypt(update[f]);
					}
				} catch (_) {}
			}
		}
		this.setUpdate(update);
		next();
	});

	function decryptValue(v) {
		if (typeof v !== 'string') return v;
		if (!v.startsWith('enc:')) return v;
		return decrypt(v.slice(4));
	}

	const transformer = (doc, ret) => {
		for (const f of fields) {
			if (ret[f]) ret[f] = decryptValue(ret[f]);
		}
		return ret;
	};

	schema.set('toJSON', { transform: transformer });
	schema.set('toObject', { transform: transformer });
};


