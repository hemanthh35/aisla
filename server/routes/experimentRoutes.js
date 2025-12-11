// Experiment routes with streaming support
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
import Experiment from '../models/Experiment.js';
import aiService from '../services/aiService.js';

const router = express.Router();

// All routes are protected
router.use(protect);

/**
 * POST /api/experiment/create-stream
 * Create experiment with SSE streaming for progress updates
 */
router.post('/create-stream', async (req, res) => {
    try {
        const { title, content, contentType, subject, difficulty } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content required' });
        }

        if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only faculty can create experiments' });
        }

        console.log(`📝 [API] Creating experiment: ${title}`);

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        // Send start event with time estimate
        res.write(`data: ${JSON.stringify({
            type: 'START',
            message: 'Starting AI generation...',
            estimate: '30-60 seconds'
        })}\n\n`);

        const startTime = Date.now();

        // Generate with streaming progress
        const aiResult = await aiService.generateExperiment(title, content);

        if (!aiResult.success) {
            res.write(`data: ${JSON.stringify({
                type: 'ERROR',
                error: aiResult.error
            })}\n\n`);
            res.end();
            return;
        }

        // Send progress update
        res.write(`data: ${JSON.stringify({
            type: 'PROGRESS',
            message: 'Saving to database...',
            elapsed: Math.round((Date.now() - startTime) / 1000)
        })}\n\n`);

        // Create experiment in database
        const experiment = await Experiment.create({
            title,
            originalContent: {
                type: contentType || 'text',
                text: content
            },
            content: aiResult.content,
            subject: subject || '',
            difficulty: difficulty || 'intermediate',
            createdBy: req.user._id
        });

        const totalTime = Math.round((Date.now() - startTime) / 1000);

        // Send completion
        res.write(`data: ${JSON.stringify({
            type: 'DONE',
            message: `Experiment created in ${totalTime}s!`,
            elapsed: totalTime,
            experiment: {
                _id: experiment._id,
                title: experiment.title,
                subject: experiment.subject
            }
        })}\n\n`);

        res.end();
        console.log(`✅ [API] Experiment created in ${totalTime}s`);

    } catch (error) {
        console.error('Create stream error:', error);
        res.write(`data: ${JSON.stringify({
            type: 'ERROR',
            error: error.message
        })}\n\n`);
        res.end();
    }
});

// Experiment CRUD
router.post('/create', createExperiment);
router.get('/', getExperiments);
router.get('/:id', getExperiment);
router.put('/:id', updateExperiment);
router.delete('/:id', deleteExperiment);

// AI features
router.post('/extract-text', extractText);

export default router;
