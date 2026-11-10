const router = require('express').Router();
const ChildProfile = require('../models/ChildProfile');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => res.json(await ChildProfile.find({ guardian: req.guardianId })));
router.post('/', requireAuth, async (req, res) => res.status(201).json(await ChildProfile.create({ ...req.body, guardian: req.guardianId })));
module.exports = router;
