// AI Routes - AI explanation endpoints
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import aiService from '../services/aiService.js';

const router = express.Router();

// All routes are protected
router.use(protect);

/**
 * POST /api/ai/explain
 * Get AI explanation for content
 * 
 * Body: { content: string, intent: 'simple' | 'detailed' | 'example' }
 */
router.post('/explain', async (req, res) => {
    try {
        const { content, intent } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }

        console.log(`📖 [API] AI Explain request - intent: ${intent}`);

        const result = await aiService.generateExplanation(content, intent || 'simple');

        if (!result.success) {
            return res.status(500).json({
                message: 'AI explanation failed',
                error: result.error
            });
        }

        res.json({
            success: true,
            explanation: result.explanation
        });
    } catch (error) {
        console.error('AI Explain Error:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * POST /api/ai/explain-stream
 * Get AI explanation with real-time token streaming (SSE)
 * 
 * Body: { content: string, intent: 'simple' | 'detailed' | 'example' }
 */
router.post('/explain-stream', async (req, res) => {
    try {
        const { content, intent } = req.body;

        if (!content) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.write(`data: ${JSON.stringify({ type: 'ERROR', error: 'Content is required' })}\n\n`);
            res.end();
            return;
        }

        console.log(`📖 [API] AI Stream Explain request - intent: ${intent}`);

        // Call the streaming function
        await aiService.streamExplanation(res, content, intent || 'simple');

    } catch (error) {
        console.error('AI Stream Explain Error:', error);
        if (!res.headersSent) {
            res.setHeader('Content-Type', 'text/event-stream');
        }
        res.write(`data: ${JSON.stringify({ type: 'ERROR', error: error.message })}\n\n`);
        res.end();
    }
});

/**
 * POST /api/ai/generate-quiz
 * Generate quiz for an experiment
 */
router.post('/generate-quiz', async (req, res) => {
    try {
        const { experiment } = req.body;

        if (!experiment) {
            return res.status(400).json({ message: 'Experiment data is required' });
        }

        const result = await aiService.generateQuiz(experiment);

        if (!result.success) {
            return res.status(500).json({
                message: 'Quiz generation failed',
                error: result.error
            });
        }

        res.json({
            success: true,
            questions: result.questions
        });
    } catch (error) {
        console.error('Generate Quiz Error:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * POST /api/ai/evaluate
 * Evaluate quiz answers
 */
router.post('/evaluate', async (req, res) => {
    try {
        const { questions, answers } = req.body;

        if (!questions || !answers) {
            return res.status(400).json({ message: 'Questions and answers are required' });
        }

        const result = await aiService.evaluateQuiz(questions, answers);

        res.json({
            success: true,
            evaluation: result.evaluation
        });
    } catch (error) {
        console.error('Evaluate Quiz Error:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
