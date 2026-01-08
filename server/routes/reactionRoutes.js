import express from 'express';
import Reaction from '../models/Reaction.js';
import reactionEngine from '../services/reactionEngine.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all reactions
router.get('/', async (req, res) => {
    try {
        const { category, difficulty, type } = req.query;
        const filter = { isActive: true };

        if (category) filter.category = category;
        if (difficulty) filter.difficulty = difficulty;
        if (type) filter.reactionType = type;

        const reactions = await Reaction.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, reactions });
    } catch (error) {
        console.error('Error fetching reactions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reactions' });
    }
});

// Get reaction by ID
router.get('/:id', async (req, res) => {
    try {
        const reaction = await Reaction.findById(req.params.id);
        if (!reaction) {
            return res.status(404).json({ success: false, message: 'Reaction not found' });
        }
        res.json({ success: true, reaction });
    } catch (error) {
        console.error('Error fetching reaction:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reaction' });
    }
});

// Calculate reaction for given chemicals
router.post('/calculate', async (req, res) => {
    try {
        const { chemicals, isHeated, temperature } = req.body;

        if (!chemicals || !Array.isArray(chemicals) || chemicals.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'At least 2 chemicals are required'
            });
        }

        const result = await reactionEngine.calculateReaction(chemicals, {
            isHeated,
            temperature
        });

        res.json(result);
    } catch (error) {
        console.error('Error calculating reaction:', error);
        res.status(500).json({ success: false, message: 'Failed to calculate reaction' });
    }
});

// Get visual effect parameters
router.get('/effects/:effectType', (req, res) => {
    const { effectType } = req.params;
    const params = reactionEngine.getVisualEffectParams(effectType);
    res.json({ success: true, effect: effectType, params });
});

// Check dangerous combinations
router.post('/safety-check', (req, res) => {
    const { chemicals } = req.body;

    if (!chemicals || !Array.isArray(chemicals)) {
        return res.status(400).json({ success: false, message: 'Chemicals array required' });
    }

    const result = reactionEngine.isDangerousCombination(chemicals);
    res.json({ success: true, ...result });
});

// Admin: Create reaction
router.post('/', protect, async (req, res) => {
    try {
        const reaction = new Reaction(req.body);
        await reaction.save();
        reactionEngine.clearCache();
        res.status(201).json({ success: true, reaction });
    } catch (error) {
        console.error('Error creating reaction:', error);
        res.status(500).json({ success: false, message: 'Failed to create reaction' });
    }
});

// Admin: Update reaction
router.put('/:id', protect, async (req, res) => {
    try {
        const reaction = await Reaction.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!reaction) {
            return res.status(404).json({ success: false, message: 'Reaction not found' });
        }
        reactionEngine.clearCache();
        res.json({ success: true, reaction });
    } catch (error) {
        console.error('Error updating reaction:', error);
        res.status(500).json({ success: false, message: 'Failed to update reaction' });
    }
});

// Seed initial reactions
router.post('/seed', async (req, res) => {
    try {
        const existingCount = await Reaction.countDocuments();
        if (existingCount > 0) {
            return res.json({ success: true, message: 'Reactions already seeded', count: existingCount });
        }

        const initialReactions = [
            {
                chemicals: ['HCl', 'NaOH'],
                reactionType: 'neutralization',
                visualEffect: 'bubbles_heat',
                equation: 'HCl + NaOH → NaCl + H₂O',
                balancedEquation: 'HCl + NaOH → NaCl + H₂O',
                explanation: 'Hydrochloric acid reacts with sodium hydroxide in a classic neutralization reaction. The H⁺ ions from the acid combine with OH⁻ ions from the base to form water, while the remaining ions form sodium chloride (table salt). This exothermic reaction releases heat.',
                resultColor: '#f0f0f0',
                temperature: 'warm',
                requiresHeat: false,
                difficulty: 'beginner',
                category: 'acid_base',
                duration: 3,
                safetyWarnings: ['Handle acids and bases with care', 'Wear safety goggles', 'Work in a well-ventilated area']
            },
            {
                chemicals: ['CuSO4', 'NaOH'],
                reactionType: 'precipitation',
                visualEffect: 'precipitate',
                equation: 'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄',
                balancedEquation: 'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄',
                explanation: 'Copper sulfate solution reacts with sodium hydroxide to form copper hydroxide, a blue precipitate that settles at the bottom. This is a double displacement reaction where the copper ions combine with hydroxide ions to form an insoluble compound.',
                resultColor: '#4A90D9',
                temperature: 'room',
                requiresHeat: false,
                difficulty: 'beginner',
                category: 'precipitation',
                duration: 4,
                safetyWarnings: ['Copper compounds can be toxic', 'Avoid skin contact', 'Dispose of properly']
            },
            {
                chemicals: ['KMnO4', 'H2SO4', 'FeSO4'],
                reactionType: 'redox',
                visualEffect: 'color_change',
                equation: '2KMnO₄ + 10FeSO₄ + 8H₂SO₄ → K₂SO₄ + 2MnSO₄ + 5Fe₂(SO₄)₃ + 8H₂O',
                explanation: 'Potassium permanganate (purple) is reduced by ferrous sulfate in acidic medium. The Mn⁷⁺ is reduced to Mn²⁺, causing the characteristic purple color to fade to a pale pink or colorless solution, indicating the endpoint of the reaction.',
                resultColor: '#FFE4E1',
                temperature: 'room',
                requiresHeat: false,
                difficulty: 'intermediate',
                category: 'redox',
                duration: 5,
                safetyWarnings: ['KMnO4 is a strong oxidizer', 'Can stain skin and clothes', 'Handle with care']
            },
            {
                chemicals: ['Na2CO3', 'HCl'],
                reactionType: 'gas_evolution',
                visualEffect: 'bubbles',
                equation: 'Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑',
                balancedEquation: 'Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑',
                explanation: 'Sodium carbonate reacts vigorously with hydrochloric acid, producing carbon dioxide gas (the bubbles you see), water, and sodium chloride. The effervescence is caused by CO₂ escaping from the solution.',
                resultColor: '#f5f5f5',
                temperature: 'room',
                requiresHeat: false,
                difficulty: 'beginner',
                category: 'acid_base',
                duration: 3,
                safetyWarnings: ['Produces gas - ensure ventilation', 'Handle acid carefully']
            },
            {
                chemicals: ['AgNO3', 'NaCl'],
                reactionType: 'precipitation',
                visualEffect: 'precipitate',
                equation: 'AgNO₃ + NaCl → AgCl↓ + NaNO₃',
                balancedEquation: 'AgNO₃ + NaCl → AgCl↓ + NaNO₃',
                explanation: 'Silver nitrate reacts with sodium chloride to form silver chloride, a white precipitate. This reaction is commonly used to test for the presence of chloride ions and is an example of a precipitation reaction.',
                resultColor: '#FFFFFF',
                temperature: 'room',
                requiresHeat: false,
                difficulty: 'beginner',
                category: 'precipitation',
                duration: 2,
                safetyWarnings: ['AgNO3 stains skin black', 'Handle carefully', 'Dispose of silver waste properly']
            },
            {
                chemicals: ['Zn', 'HCl'],
                reactionType: 'gas_evolution',
                visualEffect: 'bubbles',
                equation: 'Zn + 2HCl → ZnCl₂ + H₂↑',
                balancedEquation: 'Zn + 2HCl → ZnCl₂ + H₂↑',
                explanation: 'Zinc metal reacts with hydrochloric acid to produce hydrogen gas and zinc chloride. The hydrogen gas bubbles vigorously through the solution. This is a single displacement reaction where zinc displaces hydrogen from the acid.',
                resultColor: '#e8e8e8',
                temperature: 'warm',
                requiresHeat: false,
                difficulty: 'beginner',
                category: 'redox',
                duration: 5,
                safetyWarnings: ['Hydrogen gas is flammable', 'Keep away from flames', 'Work in ventilated area']
            },
            {
                chemicals: ['Pb(NO3)2', 'KI'],
                reactionType: 'precipitation',
                visualEffect: 'precipitate',
                equation: 'Pb(NO₃)₂ + 2KI → PbI₂↓ + 2KNO₃',
                balancedEquation: 'Pb(NO₃)₂ + 2KI → PbI₂↓ + 2KNO₃',
                explanation: 'Lead nitrate reacts with potassium iodide to form brilliant yellow lead iodide precipitate, often called "golden rain" when the precipitate forms. This beautiful reaction demonstrates precipitation of an insoluble salt.',
                resultColor: '#FFD700',
                temperature: 'room',
                requiresHeat: false,
                difficulty: 'beginner',
                category: 'precipitation',
                duration: 3,
                safetyWarnings: ['Lead compounds are toxic', 'Avoid ingestion', 'Wash hands thoroughly', 'Dispose as hazardous waste']
            },
            {
                chemicals: ['CaCO3', 'HCl'],
                reactionType: 'gas_evolution',
                visualEffect: 'bubbles',
                equation: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑',
                balancedEquation: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑',
                explanation: 'Calcium carbonate (limestone, marble, chalk) reacts with hydrochloric acid to produce carbon dioxide gas, water, and calcium chloride. This reaction demonstrates why acid rain damages limestone buildings and statues.',
                resultColor: '#f0f0f0',
                temperature: 'room',
                requiresHeat: false,
                difficulty: 'beginner',
                category: 'acid_base',
                duration: 4,
                safetyWarnings: ['Handle acid carefully', 'Produces gas - ensure ventilation']
            }
        ];

        await Reaction.insertMany(initialReactions);
        reactionEngine.clearCache();

        res.json({
            success: true,
            message: 'Initial reactions seeded successfully',
            count: initialReactions.length
        });
    } catch (error) {
        console.error('Error seeding reactions:', error);
        res.status(500).json({ success: false, message: 'Failed to seed reactions' });
    }
});

export default router;
