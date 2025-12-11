// Experiment routes
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    createExperiment,
    getExperiments,
    getExperiment,
    updateExperiment,
    deleteExperiment,
    aiExplain,
    extractText
} from '../controllers/experimentController.js';

const router = express.Router();

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

export default router;
