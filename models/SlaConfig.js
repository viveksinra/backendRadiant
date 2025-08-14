const mongoose = require('mongoose');

const slaConfigSchema = new mongoose.Schema(
    {
        scope: { type: String, enum: ['global', 'loanType', 'stage'], default: 'global' },
        loanTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'LoanType' },
        // thresholds in hours by stage/state name
        thresholds: { type: Map, of: Number, default: {} },
        quietHours: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.models.SlaConfig || mongoose.model('SlaConfig', slaConfigSchema);

