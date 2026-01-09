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
    extractText,
    extractPDFText
} from '../controllers/experimentController.js';
import Experiment from '../models/Experiment.js';
import User from '../models/User.js';
import aiService from '../services/aiService.js';
import emailService from '../services/emailService.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// AI features (Moved to top to avoid route conflicts)
router.post('/extract-text', (req, res, next) => {
    console.log('🔍 [API] OCR Extraction requested');
    next();
}, extractText);

router.post('/extract-pdf', (req, res, next) => {
    console.log('📄 [API] PDF Extraction requested');
    next();
}, extractPDFText);

/**
 * POST /api/experiment/generate-from-topic
 * Generate a complete experiment from just a topic name
 * The AI will create all content automatically
 */
router.post('/generate-from-topic', async (req, res) => {
    try {
        const { topicName, subject, difficulty } = req.body;

        if (!topicName || !topicName.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Topic name is required'
            });
        }

        if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Only faculty can create experiments'
            });
        }

        console.log(`🎯 [API] Generating experiment from topic: ${topicName}`);

        // Set SSE headers for streaming progress
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        // Send start event
        res.write(`data: ${JSON.stringify({
            type: 'START',
            message: `Generating complete experiment for "${topicName}"...`,
            estimate: '45-90 seconds'
        })}\n\n`);

        const startTime = Date.now();

        // Progress update interval
        const progressInterval = setInterval(() => {
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            res.write(`data: ${JSON.stringify({
                type: 'PROGRESS',
                message: elapsed < 30
                    ? 'AI is generating experiment content...'
                    : elapsed < 60
                        ? 'Creating detailed procedures and formulas...'
                        : 'Finalizing experiment structure...',
                elapsed
            })}\n\n`);
        }, 5000);

        // Generate complete experiment from topic
        const aiResult = await aiService.generateExperimentFromTopic(
            topicName.trim(),
            subject || '',
            difficulty || 'intermediate'
        );

        clearInterval(progressInterval);

        if (!aiResult.success) {
            res.write(`data: ${JSON.stringify({
                type: 'ERROR',
                error: aiResult.error || 'AI generation failed'
            })}\n\n`);
            res.end();
            return;
        }

        // Send progress update
        res.write(`data: ${JSON.stringify({
            type: 'PROGRESS',
            message: 'Saving experiment to database...',
            elapsed: Math.round((Date.now() - startTime) / 1000)
        })}\n\n`);

        // Create experiment in database
        const experiment = await Experiment.create({
            title: topicName.trim(),
            originalContent: {
                type: 'topic',
                text: `Auto-generated from topic: ${topicName}`
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
            message: `Experiment "${topicName}" created successfully in ${totalTime}s!`,
            elapsed: totalTime,
            experiment: {
                _id: experiment._id,
                title: experiment.title,
                subject: experiment.subject,
                difficulty: experiment.difficulty
            }
        })}\n\n`);

        res.end();
        console.log(`✅ [API] Topic-based experiment created in ${totalTime}s: ${experiment.title}`);

        // Send email notification to all students (async - don't wait)
        try {
            const students = await User.find({ role: 'student' }).select('email');
            const studentEmails = students.map(s => s.email).filter(e => e);

            if (studentEmails.length > 0) {
                console.log(`📧 Sending notification to ${studentEmails.length} students...`);
                emailService.sendNewExperimentNotification(studentEmails, experiment, req.user)
                    .then(result => {
                        if (result.success) {
                            console.log(`✅ Email sent to ${result.recipients} students`);
                        } else {
                            console.log(`⚠️ Email failed: ${result.error}`);
                        }
                    })
                    .catch(err => console.error('Email error:', err.message));
            }
        } catch (emailError) {
            console.error('Error fetching students for email:', emailError.message);
        }

    } catch (error) {
        console.error('Generate from topic error:', error);
        res.write(`data: ${JSON.stringify({
            type: 'ERROR',
            error: error.message || 'Failed to generate experiment'
        })}\n\n`);
        res.end();
    }
});

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

export default router;
