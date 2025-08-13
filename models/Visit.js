const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema(
	{
		lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
		employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
		notes: { type: String, trim: true },
		photoUrls: [{ type: String, trim: true }],
		geo: {
			lat: { type: Number },
			lng: { type: Number },
		},
		flags: {
			outOfRadius: { type: Boolean, default: false },
			anomalyReasons: [{ type: String }],
		},
		isDeleted: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

visitSchema.index({ createdAt: -1 });
visitSchema.index({ 'geo.lat': 1, 'geo.lng': 1 });

module.exports = mongoose.models.Visit || mongoose.model('Visit', visitSchema);


