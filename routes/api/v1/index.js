const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
	res.json({ message: 'API base', variant: 'success', myData: { path: req.path } });
});

module.exports = router;



