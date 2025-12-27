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

/**
 * POST /api/ai/generate-diagram
 * Generate diagram code from text description (Admin only)
 * 
 * Body: { description: string, format: 'mermaid' | 'graphviz' | 'plantuml' | 'd2' }
 */
router.post('/generate-diagram', async (req, res) => {
    try {
        const { description, format } = req.body;

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        if (!description) {
            return res.status(400).json({ message: 'Description is required' });
        }

        console.log(`📊 [API] Generate diagram request - format: ${format || 'mermaid'}`);

        const result = await aiService.generateDiagram(description, format || 'mermaid');

        if (!result.success) {
            return res.status(500).json({
                message: 'Diagram generation failed',
                error: result.error
            });
        }

        res.json({
            success: true,
            code: result.code,
            format: result.format
        });
    } catch (error) {
        console.error('Generate Diagram Error:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * POST /api/ai/code-suggestion-stream
 * Stream code suggestions with real-time token streaming (SSE)
 * Provides hints and guidance without giving direct code answers
 * 
 * Body: { problemStatement: string, code: string, language: string }
 */
router.post('/code-suggestion-stream', async (req, res) => {
    try {
        const { problemStatement, code, language } = req.body;

        if (!problemStatement || !code) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.write(`data: ${JSON.stringify({ type: 'ERROR', error: 'Problem statement and code are required' })}\n\n`);
            res.end();
            return;
        }

        console.log(`💡 [API] Code suggestion stream request - language: ${language}`);

        // Call the streaming function
        await aiService.streamCodeSuggestion(res, problemStatement, code, language || 'python');

    } catch (error) {
        console.error('Code Suggestion Stream Error:', error);
        if (!res.headersSent) {
            res.setHeader('Content-Type', 'text/event-stream');
        }
        res.write(`data: ${JSON.stringify({ type: 'ERROR', error: error.message })}\n\n`);
        res.end();
    }
});

/**
 * POST /api/ai/analyze-complexity
 * Analyze code complexity (Big-O notation)
 * 
 * Body: { code: string, language: string }
 */
router.post('/analyze-complexity', async (req, res) => {
    try {
        const { code, language } = req.body;

        if (!code) {
            return res.status(400).json({ message: 'Code is required' });
        }

        console.log(`📊 [API] Complexity analysis request - language: ${language}`);

        const result = await aiService.analyzeCodeComplexity(code, language || 'python');

        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('Complexity Analysis Error:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * POST /api/ai/generate-test-cases
 * Generate test cases based on problem statement
 * 
 * Body: { problemStatement: string, language: string }
 */
router.post('/generate-test-cases', async (req, res) => {
    try {
        const { problemStatement, language } = req.body;

        if (!problemStatement) {
            return res.status(400).json({ message: 'Problem statement is required' });
        }

        console.log(`🧪 [API] Test case generation request`);

        const result = await aiService.generateTestCases(problemStatement, language || 'python');

        res.json(result);

    } catch (error) {
        console.error('Test Case Generation Error:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
