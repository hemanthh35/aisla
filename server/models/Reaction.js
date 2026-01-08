import mongoose from 'mongoose';

const ReactionSchema = new mongoose.Schema({
    chemicals: [{
        type: String,
        required: true
    }],
    reactionType: {
        type: String,
        required: true,
        enum: ['neutralization', 'precipitation', 'oxidation', 'reduction', 'redox', 'displacement', 'combustion', 'decomposition', 'synthesis', 'color_change', 'gas_evolution']
    },
    visualEffect: {
        type: String,
        required: true,
        enum: ['bubbles', 'heat', 'bubbles_heat', 'smoke', 'precipitate', 'color_change', 'explosion', 'gas', 'flame', 'glow']
    },
    equation: {
        type: String,
        required: true
    },
    balancedEquation: {
        type: String
    },
    explanation: {
        type: String,
        required: true
    },
    safetyWarnings: [{
        type: String
    }],
    resultColor: {
        type: String,
        default: '#ffffff'
    },
    temperature: {
        type: String,
        enum: ['cold', 'room', 'warm', 'hot', 'very_hot'],
        default: 'room'
    },
    requiresHeat: {
        type: Boolean,
        default: false
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    category: {
        type: String,
        enum: ['acid_base', 'redox', 'precipitation', 'organic', 'inorganic', 'analytical'],
        default: 'inorganic'
    },
    duration: {
        type: Number, // in seconds
        default: 5
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Index for efficient chemical lookup
ReactionSchema.index({ chemicals: 1 });

export default mongoose.model('Reaction', ReactionSchema);
