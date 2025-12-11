// AI routes
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { aiExplain } = require('../controllers/experimentController');

// All routes are protected
router.use(protect);

// AI Explain endpoint
router.post('/explain', aiExplain);

module.exports = router;
