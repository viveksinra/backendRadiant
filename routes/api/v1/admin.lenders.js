const { Router } = require('express');
const rbac = require('../../../middlewares/rbac');
const Lender = require('../../../models/Lender');

const router = Router();

router.get('/', rbac(['admin:read']), async (req, res) => {
	const lenders = await Lender.find({ isDeleted: { $ne: true } }).lean();
	return res.success(lenders, 'lenders');
});

router.post('/', rbac(['admin:read']), async (req, res) => {
	const { name, code, eligibilityRules = {} } = req.body || {};
	if (!name || !code) return res.errorEnvelope('name and code required', 400);
	const created = await Lender.create({ name, code, eligibilityRules });
	return res.success(created.toObject(), 'lender created');
});

// Field-level permission guardrails: only admin:write can change eligibilityRules
router.put('/:id', rbac(['admin:read']), async (req, res) => {
	const { name, code, eligibilityRules, isActive } = req.body || {};
    if (eligibilityRules && !(req.user?.permissions || []).includes('admin:write')) {
        return res.errorEnvelope('EDIT_DENIED', 403);
    }
	const updated = await Lender.findByIdAndUpdate(
		req.params.id,
		{ $set: { name, code, eligibilityRules, isActive } },
		{ new: true }
	).lean();
	if (!updated) return res.errorEnvelope('Not found', 404);
	return res.success(updated, 'lender updated');
});

router.delete('/:id', rbac(['admin:read']), async (req, res) => {
	const updated = await Lender.findByIdAndUpdate(req.params.id, { $set: { isDeleted: true } }, { new: true }).lean();
	if (!updated) return res.errorEnvelope('Not found', 404);
	return res.success(updated, 'lender deleted');
});

module.exports = router;

// POST /api/v1/admin/lenders/import -> CSV import with optional dry-run
router.post('/import', rbac(['admin:write']), async (req, res) => {
    try {
        const { csv = '', dryRun = true } = req.body || {};
        if (!csv || typeof csv !== 'string') return res.errorEnvelope('csv string required', 400);
        // Very simple CSV parser: first line headers, commas, no quotes handling
        const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (!lines.length) return res.errorEnvelope('empty csv', 400);
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
        const idxName = headers.indexOf('name');
        const idxCode = headers.indexOf('code');
        const idxActive = headers.indexOf('isactive');
        const idxRules = headers.indexOf('eligibilityrules');
        if (idxName === -1 || idxCode === -1) return res.errorEnvelope('headers must include name,code', 400);
        const results = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            const name = (cols[idxName] || '').trim();
            const code = (cols[idxCode] || '').trim();
            if (!name || !code) {
                results.push({ row: i + 1, status: 'error', error: 'name/code required' });
                continue;
            }
            const isActive = idxActive !== -1 ? String(cols[idxActive] || '').trim().toLowerCase() !== 'false' : true;
            let eligibilityRules = {};
            if (idxRules !== -1 && cols[idxRules]) {
                try { eligibilityRules = JSON.parse(cols[idxRules]); } catch (_) {}
            }
            const existing = await Lender.findOne({ code }).lean();
            if (dryRun) {
                results.push({ row: i + 1, code, action: existing ? 'update' : 'create', ok: true });
            } else if (existing) {
                const updated = await Lender.findByIdAndUpdate(existing._id, { $set: { name, isActive, eligibilityRules } }, { new: true }).lean();
                results.push({ row: i + 1, code, action: 'update', ok: true, id: updated?._id });
            } else {
                const created = await Lender.create({ name, code, isActive, eligibilityRules });
                results.push({ row: i + 1, code, action: 'create', ok: true, id: created._id });
            }
        }
        return res.success({ dryRun: Boolean(dryRun), results }, 'LENDER_IMPORTED');
    } catch (err) {
        return res.errorEnvelope(err.message || 'import failed', 400);
    }
});


