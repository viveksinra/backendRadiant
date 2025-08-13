// Local stub for antivirus scan
// For real integration, connect to ClamAV or a cloud AV service

async function scanFile({ filename }) {
	const isEicar = /eicar/i.test(filename || '');
	return isEicar ? 'infected' : 'clean';
}

module.exports = { scanFile };




