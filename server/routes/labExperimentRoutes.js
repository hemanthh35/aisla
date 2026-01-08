import express from 'express';
import LabExperiment from '../models/LabExperiment.js';
import LabActivity from '../models/LabActivity.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all lab experiments
router.get('/', async (req, res) => {
    try {
        const { category, difficulty, published } = req.query;
        const filter = {};

        if (category) filter.category = category;
        if (difficulty) filter.difficulty = difficulty;
        if (published !== undefined) filter.isPublished = published === 'true';

        const experiments = await LabExperiment.find(filter)
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.json({ success: true, experiments });
    } catch (error) {
        console.error('Error fetching lab experiments:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch experiments' });
    }
});

// Get single experiment
router.get('/:id', async (req, res) => {
    try {
        const experiment = await LabExperiment.findById(req.params.id)
            .populate('createdBy', 'name')
            .populate('expectedReactions');

        if (!experiment) {
            return res.status(404).json({ success: false, message: 'Experiment not found' });
        }

        res.json({ success: true, experiment });
    } catch (error) {
        console.error('Error fetching experiment:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch experiment' });
    }
});

// Create lab experiment
router.post('/', protect, async (req, res) => {
    try {
        const experiment = new LabExperiment({
            ...req.body,
            createdBy: req.user.id
        });
        await experiment.save();
        res.status(201).json({ success: true, experiment });
    } catch (error) {
        console.error('Error creating experiment:', error);
        res.status(500).json({ success: false, message: 'Failed to create experiment' });
    }
});

// Start lab session
router.post('/:id/start', protect, async (req, res) => {
    try {
        const { mode } = req.body;
        const experiment = await LabExperiment.findById(req.params.id);

        if (!experiment && mode === 'guided') {
            return res.status(404).json({ success: false, message: 'Experiment not found' });
        }

        const activity = new LabActivity({
            userId: req.user.id,
            experimentId: mode === 'guided' ? req.params.id : null,
            mode,
            totalSteps: experiment ? experiment.steps.length : 0,
            startTime: new Date()
        });

        await activity.save();

        res.json({
            success: true,
            sessionId: activity._id,
            experiment: experiment || null
        });
    } catch (error) {
        console.error('Error starting lab session:', error);
        res.status(500).json({ success: false, message: 'Failed to start session' });
    }
});

// Log action in lab session
router.post('/session/:sessionId/action', protect, async (req, res) => {
    try {
        const { actionType, sourceItem, targetItem, chemical, result, success } = req.body;

        const activity = await LabActivity.findById(req.params.sessionId);
        if (!activity) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        activity.actions.push({
            actionType,
            sourceItem,
            targetItem,
            chemical,
            result,
            success
        });

        await activity.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error logging action:', error);
        res.status(500).json({ success: false, message: 'Failed to log action' });
    }
});

// Log reaction triggered
router.post('/session/:sessionId/reaction', protect, async (req, res) => {
    try {
        const { reactionId, chemicals, wasExpected } = req.body;

        const activity = await LabActivity.findById(req.params.sessionId);
        if (!activity) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        activity.reactionsTriggered.push({
            reactionId,
            chemicals,
            wasExpected
        });

        await activity.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error logging reaction:', error);
        res.status(500).json({ success: false, message: 'Failed to log reaction' });
    }
});

// Complete step in guided mode
router.post('/session/:sessionId/step-complete', protect, async (req, res) => {
    try {
        const activity = await LabActivity.findById(req.params.sessionId);
        if (!activity) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        activity.stepsCompleted += 1;
        await activity.save();

        res.json({
            success: true,
            stepsCompleted: activity.stepsCompleted,
            totalSteps: activity.totalSteps
        });
    } catch (error) {
        console.error('Error completing step:', error);
        res.status(500).json({ success: false, message: 'Failed to complete step' });
    }
});

// End lab session
router.post('/session/:sessionId/end', protect, async (req, res) => {
    try {
        const { feedback } = req.body;

        const activity = await LabActivity.findById(req.params.sessionId);
        if (!activity) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        activity.endTime = new Date();
        activity.duration = Math.floor((activity.endTime - activity.startTime) / 1000);
        activity.completed = true;
        activity.feedback = feedback;

        // Calculate score for guided mode
        if (activity.mode === 'guided' && activity.totalSteps > 0) {
            activity.score = Math.round((activity.stepsCompleted / activity.totalSteps) * 100);
        }

        await activity.save();

        res.json({
            success: true,
            activity: {
                duration: activity.duration,
                score: activity.score,
                stepsCompleted: activity.stepsCompleted,
                reactionsTriggered: activity.reactionsTriggered.length
            }
        });
    } catch (error) {
        console.error('Error ending session:', error);
        res.status(500).json({ success: false, message: 'Failed to end session' });
    }
});

// Get user's lab history
router.get('/user/history', protect, async (req, res) => {
    try {
        const activities = await LabActivity.find({ userId: req.user.id, completed: true })
            .populate('experimentId', 'title')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ success: true, activities });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch history' });
    }
});

// Seed initial experiments
router.post('/seed', async (req, res) => {
    try {
        const existingCount = await LabExperiment.countDocuments();
        if (existingCount > 0) {
            return res.json({ success: true, message: 'Experiments already seeded', count: existingCount });
        }

        const initialExperiments = [
            {
                title: 'Acid-Base Neutralization',
                description: 'Learn about neutralization reactions by combining an acid with a base to form salt and water.',
                objective: 'To understand the concept of neutralization and observe the heat produced during the reaction.',
                difficulty: 'beginner',
                category: 'acid_base',
                chemicals: [
                    { name: 'Hydrochloric Acid', formula: 'HCl', concentration: '1M', color: '#e8e8e8', state: 'liquid', hazardLevel: 'warning' },
                    { name: 'Sodium Hydroxide', formula: 'NaOH', concentration: '1M', color: '#f0f0f0', state: 'liquid', hazardLevel: 'warning' }
                ],
                apparatus: [
                    { name: 'Beaker', quantity: 2 },
                    { name: 'Measuring Cylinder', quantity: 1 },
                    { name: 'Stirring Rod', quantity: 1 }
                ],
                steps: [
                    { order: 1, instruction: 'Take 50ml of NaOH solution in a beaker', action: 'pour', chemical: 'NaOH', targetContainer: 'beaker1', amount: '50ml' },
                    { order: 2, instruction: 'Slowly add 50ml of HCl to the NaOH solution', action: 'pour', chemical: 'HCl', targetContainer: 'beaker1', amount: '50ml', hint: 'Pour slowly to observe the reaction' },
                    { order: 3, instruction: 'Observe the heat generated', action: 'observe', expectedResult: 'Solution becomes warm' },
                    { order: 4, instruction: 'Stir the mixture gently', action: 'stir', targetContainer: 'beaker1' }
                ],
                safetyPrecautions: [
                    'Wear safety goggles at all times',
                    'Handle acids and bases with care',
                    'In case of skin contact, wash immediately with water'
                ],
                estimatedTime: 10,
                learningOutcomes: [
                    'Understand acid-base neutralization',
                    'Observe exothermic reactions',
                    'Identify products of neutralization'
                ]
            },
            {
                title: 'Copper Hydroxide Precipitation',
                description: 'Create a beautiful blue precipitate by reacting copper sulfate with sodium hydroxide.',
                objective: 'To observe precipitation reactions and understand the formation of insoluble compounds.',
                difficulty: 'beginner',
                category: 'precipitation',
                chemicals: [
                    { name: 'Copper Sulfate', formula: 'CuSO4', concentration: '0.5M', color: '#4A90D9', state: 'aqueous', hazardLevel: 'caution' },
                    { name: 'Sodium Hydroxide', formula: 'NaOH', concentration: '1M', color: '#f0f0f0', state: 'liquid', hazardLevel: 'warning' }
                ],
                apparatus: [
                    { name: 'Test Tube', quantity: 2 },
                    { name: 'Dropper', quantity: 1 }
                ],
                steps: [
                    { order: 1, instruction: 'Add 10ml of copper sulfate solution to a test tube', action: 'pour', chemical: 'CuSO4', targetContainer: 'testTube1', amount: '10ml' },
                    { order: 2, instruction: 'Add sodium hydroxide solution dropwise', action: 'add', chemical: 'NaOH', targetContainer: 'testTube1', hint: 'Add slowly and observe the precipitate forming' },
                    { order: 3, instruction: 'Observe the blue precipitate forming', action: 'observe', expectedResult: 'Blue copper hydroxide precipitate' }
                ],
                safetyPrecautions: [
                    'Copper compounds can be toxic - avoid ingestion',
                    'Handle sodium hydroxide carefully',
                    'Dispose of precipitate properly'
                ],
                estimatedTime: 8,
                learningOutcomes: [
                    'Understand precipitation reactions',
                    'Identify colored precipitates',
                    'Write ionic equations'
                ]
            },
            {
                title: 'Hydrogen Gas Evolution',
                description: 'Generate hydrogen gas by reacting zinc metal with hydrochloric acid.',
                objective: 'To understand single displacement reactions and gas evolution.',
                difficulty: 'intermediate',
                category: 'redox',
                chemicals: [
                    { name: 'Zinc Metal', formula: 'Zn', color: '#C0C0C0', state: 'solid', hazardLevel: 'safe' },
                    { name: 'Hydrochloric Acid', formula: 'HCl', concentration: '2M', color: '#e8e8e8', state: 'liquid', hazardLevel: 'danger' }
                ],
                apparatus: [
                    { name: 'Flask', quantity: 1 },
                    { name: 'Delivery Tube', quantity: 1 },
                    { name: 'Test Tube', quantity: 1 }
                ],
                steps: [
                    { order: 1, instruction: 'Place zinc pieces in a flask', action: 'add', chemical: 'Zn', targetContainer: 'flask1' },
                    { order: 2, instruction: 'Add dilute HCl to the zinc', action: 'pour', chemical: 'HCl', targetContainer: 'flask1', amount: '30ml', hint: 'Add slowly to control the reaction rate' },
                    { order: 3, instruction: 'Observe the vigorous bubbling', action: 'observe', expectedResult: 'Hydrogen gas bubbles' },
                    { order: 4, instruction: 'Collect the gas in an inverted test tube', action: 'wait', duration: 30 }
                ],
                safetyPrecautions: [
                    'Hydrogen is highly flammable!',
                    'Keep away from flames',
                    'Ensure good ventilation',
                    'Wear safety goggles'
                ],
                estimatedTime: 15,
                learningOutcomes: [
                    'Understand single displacement reactions',
                    'Observe gas evolution',
                    'Learn about redox reactions'
                ]
            }
        ];

        await LabExperiment.insertMany(initialExperiments);

        res.json({
            success: true,
            message: 'Initial experiments seeded successfully',
            count: initialExperiments.length
        });
    } catch (error) {
        console.error('Error seeding experiments:', error);
        res.status(500).json({ success: false, message: 'Failed to seed experiments' });
    }
});

export default router;
