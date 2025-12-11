// Experiment routes
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createExperiment,
    getExperiments,
    getExperiment,
    updateExperiment,
    deleteExperiment,
    aiExplain,
    extractText
} = require('../controllers/experimentController');

// All routes are protected
router.use(protect);

// Experiment CRUD
router.post('/create', createExperiment);
router.get('/', getExperiments);
router.get('/:id', getExperiment);
router.put('/:id', updateExperiment);
router.delete('/:id', deleteExperiment);

// AI features
router.post('/extract-text', extractText);

module.exports = router;
