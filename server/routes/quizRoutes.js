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

// Static routes MUST come before dynamic routes
router.get('/my-submissions', getMySubmissions);

// Quiz operations
router.post('/generate', generateQuiz);
router.post('/submit', submitQuiz);
router.get('/submission/:experimentId', getSubmission);
router.get('/submissions/:experimentId', getExperimentSubmissions);

// Dynamic route - must be last
router.get('/:experimentId', getQuiz);

export default router;
