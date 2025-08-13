// Simple heuristic score v0
// Factors: has phone/email, recent visit count
const Visit = require('../models/Visit');

async function computeLeadScore(leadId) {
	let base = 0;
	// Base signals could be enhanced later
	// Last 30 days visits
	const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
	const visits = await Visit.countDocuments({ lead: leadId, createdAt: { $gte: since } });
	base += Math.min(50, visits * 10);
	return base;
}

module.exports = { computeLeadScore };


