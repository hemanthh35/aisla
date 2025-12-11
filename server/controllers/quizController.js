// Quiz controller - Quiz generation and submission handling
import Quiz from '../models/Quiz.js';
import Experiment from '../models/Experiment.js';
import Submission from '../models/Submission.js';
import aiService from '../services/aiService.js';

// @desc    Generate quiz for an experiment
// @route   POST /api/quiz/generate
// @access  Private (Faculty only)
const generateQuiz = async (req, res) => {
    try {
        const { experimentId } = req.body;

        if (!experimentId) {
            return res.status(400).json({ message: 'Experiment ID is required' });
        }

        // Get experiment
        const experiment = await Experiment.findById(experimentId);
        if (!experiment) {
            return res.status(404).json({ message: 'Experiment not found' });
        }

        // Check if quiz already exists
        const existingQuiz = await Quiz.findOne({ experimentId });
        if (existingQuiz) {
            return res.json({
                success: true,
                message: 'Quiz already exists',
                quiz: existingQuiz
            });
        }

        // Generate quiz using AI
        const aiResult = await aiService.generateQuiz(experiment);

        if (!aiResult.success) {
            return res.status(500).json({
                message: 'Quiz generation failed',
                error: aiResult.error
            });
        }

        // Create quiz in database
        const quiz = await Quiz.create({
            experimentId,
            questions: aiResult.questions,
            totalQuestions: aiResult.questions.length
        });

        // Update experiment
        experiment.quizGenerated = true;
        await experiment.save();

        res.status(201).json({
            success: true,
            message: 'Quiz generated successfully',
            quiz
        });
    } catch (error) {
        console.error('Generate Quiz Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get quiz for an experiment
// @route   GET /api/quiz/:experimentId
// @access  Private
const getQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findOne({ experimentId: req.params.experimentId });

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found for this experiment' });
        }

        // For students, hide the answers
        const isStudent = req.user.role === 'student';
        const quizData = quiz.toObject();

        if (isStudent) {
            quizData.questions = quizData.questions.map(q => ({
                _id: q._id,
                type: q.type,
                question: q.question,
                options: q.options
                // answer and explanation hidden
            }));
        }

        res.json({
            success: true,
            quiz: quizData
        });
    } catch (error) {
        console.error('Get Quiz Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submit quiz answers
// @route   POST /api/quiz/submit
// @access  Private (Students only)
const submitQuiz = async (req, res) => {
    try {
        const { experimentId, quizId, answers } = req.body;

        if (!experimentId || !quizId || !answers || !Array.isArray(answers)) {
            return res.status(400).json({ message: 'Invalid submission data' });
        }

        // Get quiz
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // Check if already submitted
        const existingSubmission = await Submission.findOne({
            userId: req.user._id,
            experimentId,
            quizId
        });

        if (existingSubmission) {
            return res.status(400).json({
                message: 'You have already submitted this quiz',
                submission: existingSubmission
            });
        }

        // Evaluate answers using AI
        const aiResult = await aiService.evaluateQuiz(quiz.questions, answers);

        if (!aiResult.success) {
            return res.status(500).json({
                message: 'Quiz evaluation failed',
                error: aiResult.error
            });
        }

        // Calculate score
        const evaluation = aiResult.evaluation;
        let correctCount = 0;
        const processedAnswers = quiz.questions.map((q, index) => {
            const result = evaluation.results.find(r => r.questionIndex === index) || {};
            if (result.isCorrect) correctCount++;

            return {
                questionId: q._id,
                userAnswer: answers[index] || '',
                isCorrect: result.isCorrect || false,
                feedback: result.feedback || ''
            };
        });

        const percentage = Math.round((correctCount / quiz.questions.length) * 100);

        // Create submission
        const submission = await Submission.create({
            userId: req.user._id,
            experimentId,
            quizId,
            answers: processedAnswers,
            score: correctCount,
            totalQuestions: quiz.questions.length,
            percentage,
            feedback: {
                overallFeedback: evaluation.overallFeedback,
                topicsToRevise: evaluation.topicsToRevise || [],
                strengths: evaluation.strengths || [],
                suggestions: evaluation.suggestions || []
            }
        });

        res.status(201).json({
            success: true,
            message: 'Quiz submitted successfully',
            submission,
            correctAnswers: quiz.questions.map(q => ({
                questionId: q._id,
                answer: q.answer,
                explanation: q.explanation
            }))
        });
    } catch (error) {
        console.error('Submit Quiz Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's submission for an experiment
// @route   GET /api/quiz/submission/:experimentId
// @access  Private
const getSubmission = async (req, res) => {
    try {
        const submission = await Submission.findOne({
            userId: req.user._id,
            experimentId: req.params.experimentId
        }).populate('quizId');

        if (!submission) {
            return res.status(404).json({ message: 'No submission found' });
        }

        res.json({
            success: true,
            submission
        });
    } catch (error) {
        console.error('Get Submission Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all submissions for an experiment (Faculty)
// @route   GET /api/quiz/submissions/:experimentId
// @access  Private (Faculty only)
const getExperimentSubmissions = async (req, res) => {
    try {
        // Verify ownership
        const experiment = await Experiment.findById(req.params.experimentId);
        if (!experiment) {
            return res.status(404).json({ message: 'Experiment not found' });
        }

        if (experiment.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const submissions = await Submission.find({ experimentId: req.params.experimentId })
            .populate('userId', 'name email')
            .sort({ submittedAt: -1 });

        const stats = {
            totalSubmissions: submissions.length,
            averageScore: submissions.length > 0
                ? Math.round(submissions.reduce((acc, s) => acc + s.percentage, 0) / submissions.length)
                : 0,
            highestScore: submissions.length > 0
                ? Math.max(...submissions.map(s => s.percentage))
                : 0,
            lowestScore: submissions.length > 0
                ? Math.min(...submissions.map(s => s.percentage))
                : 0
        };

        res.json({
            success: true,
            submissions,
            stats
        });
    } catch (error) {
        console.error('Get Experiment Submissions Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's all submissions (Student dashboard)
// @route   GET /api/quiz/my-submissions
// @access  Private
const getMySubmissions = async (req, res) => {
    try {
        const submissions = await Submission.find({ userId: req.user._id })
            .populate('experimentId', 'title subject')
            .sort({ submittedAt: -1 });

        res.json({
            success: true,
            submissions
        });
    } catch (error) {
        console.error('Get My Submissions Error:', error);
        res.status(500).json({ message: error.message });
    }
};

export {
    generateQuiz,
    getQuiz,
    submitQuiz,
    getSubmission,
    getExperimentSubmissions,
    getMySubmissions
};
