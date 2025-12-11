// Quiz routes
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    generateQuiz,
    getQuiz,
    submitQuiz,
    getSubmission,
    getExperimentSubmissions,
    getMySubmissions
} from '../controllers/quizController.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Quiz operations
router.post('/generate', generateQuiz);
router.get('/:experimentId', getQuiz);
router.post('/submit', submitQuiz);
router.get('/submission/:experimentId', getSubmission);
router.get('/submissions/:experimentId', getExperimentSubmissions);
router.get('/my-submissions', getMySubmissions);

export default router;
