// Experiment controller - CRUD operations
import Experiment from '../models/Experiment.js';
import User from '../models/User.js';
import aiService from '../services/aiService.js';
import emailService from '../services/emailService.js';

// @desc    Create new experiment with AI generation
// @route   POST /api/experiment/create
// @access  Private (Faculty only)
const createExperiment = async (req, res) => {
    try {
        const { title, content, contentType, subject, difficulty } = req.body;

        // Validate input
        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }

        // Check if user is faculty
        if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only faculty can create experiments' });
        }

        // Generate experiment using AI
        const aiResult = await aiService.generateExperiment(title, content);

        if (!aiResult.success) {
            return res.status(500).json({
                message: 'AI generation failed',
                error: aiResult.error
            });
        }

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

        // Send email notifications to all students (async, don't wait)
        try {
            // Get all student emails
            const students = await User.find({ role: 'student' }).select('email');
            const studentEmails = students.map(student => student.email);

            if (studentEmails.length > 0) {
                console.log(`📧 Sending notification emails to ${studentEmails.length} students...`);
                
                // Send emails asynchronously
                emailService.sendNewExperimentNotification(
                    studentEmails,
                    experiment,
                    {
                        name: req.user.name,
                        email: req.user.email
                    }
                ).then(result => {
                    if (result.success) {
                        console.log(`✅ Successfully sent ${result.recipients} notification emails`);
                    } else {
                        console.error('❌ Email notification failed:', result.error);
                    }
                }).catch(err => {
                    console.error('❌ Email notification error:', err);
                });
            }
        } catch (emailError) {
            // Log error but don't fail the request
            console.error('Email notification error (non-blocking):', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'Experiment created successfully',
            experiment
        });
    } catch (error) {
        console.error('Create Experiment Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all experiments
// @route   GET /api/experiments
// @access  Private
const getExperiments = async (req, res) => {
    try {
        const { page = 1, limit = 10, subject, difficulty } = req.query;

        const query = {};
        if (subject) query.subject = subject;
        if (difficulty) query.difficulty = difficulty;

        // If student, get all experiments
        // If faculty, get only their created experiments
        if (req.user.role === 'faculty') {
            query.createdBy = req.user._id;
        }

        const experiments = await Experiment.find(query)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Experiment.countDocuments(query);

        res.json({
            success: true,
            experiments,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error('Get Experiments Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single experiment by ID
// @route   GET /api/experiment/:id
// @access  Private
const getExperiment = async (req, res) => {
    try {
        const experiment = await Experiment.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!experiment) {
            return res.status(404).json({ message: 'Experiment not found' });
        }

        res.json({
            success: true,
            experiment
        });
    } catch (error) {
        console.error('Get Experiment Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update experiment
// @route   PUT /api/experiment/:id
// @access  Private (Faculty only - owner)
const updateExperiment = async (req, res) => {
    try {
        const experiment = await Experiment.findById(req.params.id);

        if (!experiment) {
            return res.status(404).json({ message: 'Experiment not found' });
        }

        // Check ownership
        if (experiment.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this experiment' });
        }

        const { title, subject, difficulty, content } = req.body;

        if (title) experiment.title = title;
        if (subject) experiment.subject = subject;
        if (difficulty) experiment.difficulty = difficulty;
        if (content) experiment.content = content;

        await experiment.save();

        res.json({
            success: true,
            message: 'Experiment updated successfully',
            experiment
        });
    } catch (error) {
        console.error('Update Experiment Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete experiment
// @route   DELETE /api/experiment/:id
// @access  Private (Faculty/Admin only - owner or admin)
const deleteExperiment = async (req, res) => {
    try {
        const experiment = await Experiment.findById(req.params.id);

        if (!experiment) {
            return res.status(404).json({ message: 'Experiment not found' });
        }

        // Check if user is owner or admin
        const isOwner = experiment.createdBy.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to delete this experiment' });
        }

        await experiment.deleteOne();

        res.json({
            success: true,
            message: 'Experiment deleted successfully'
        });
    } catch (error) {
        console.error('Delete Experiment Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    AI Explain - Get AI explanation for content
// @route   POST /api/ai/explain
// @access  Private
const aiExplain = async (req, res) => {
    try {
        const { content, intent } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }

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
};

// @desc    Extract text from image using OCR
// @route   POST /api/experiment/extract-text
// @access  Private (Faculty only)
const extractText = async (req, res) => {
    try {
        const { imageBase64 } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ message: 'Image data is required' });
        }

        const result = await aiService.extractTextFromImage(imageBase64);

        if (!result.success) {
            return res.status(500).json({
                message: 'Text extraction failed',
                error: result.error
            });
        }

        res.json({
            success: true,
            text: result.text
        });
    } catch (error) {
        console.error('Extract Text Error:', error);
        res.status(500).json({ message: error.message });
    }
};

export {
    createExperiment,
    getExperiments,
    getExperiment,
    updateExperiment,
    deleteExperiment,
    aiExplain,
    extractText
};
