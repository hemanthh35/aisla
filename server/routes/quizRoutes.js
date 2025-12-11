// Quiz routes
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    generateQuiz,
    getQuiz,
    submitQuiz,
    getSubmission,
    getExperimentSubmissions,
    getMySubmissions
} = require('../controllers/quizController');

// All routes are protected
router.use(protect);

// Quiz operations
router.post('/generate', generateQuiz);
router.get('/:experimentId', getQuiz);
router.post('/submit', submitQuiz);
router.get('/submission/:experimentId', getSubmission);
router.get('/submissions/:experimentId', getExperimentSubmissions);
router.get('/my-submissions', getMySubmissions);

module.exports = router;
