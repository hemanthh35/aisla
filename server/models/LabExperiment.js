import mongoose from 'mongoose';

const StepSchema = new mongoose.Schema({
    order: { type: Number, required: true },
    instruction: { type: String, required: true },
    action: {
        type: String,
        enum: ['pour', 'heat', 'mix', 'observe', 'measure', 'wait', 'add', 'stir', 'cool'],
        required: true
    },
    chemical: { type: String },
    targetContainer: { type: String },
    amount: { type: String },
    duration: { type: Number },
    expectedResult: { type: String },
    hint: { type: String }
});

const LabExperimentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    objective: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    category: {
        type: String,
        enum: ['acid_base', 'redox', 'precipitation', 'organic', 'inorganic', 'analytical', 'thermochemistry'],
        default: 'inorganic'
    },
    chemicals: [{
        name: { type: String, required: true },
        formula: { type: String },
        concentration: { type: String },
        color: { type: String, default: '#ffffff' },
        state: { type: String, enum: ['solid', 'liquid', 'gas', 'aqueous'], default: 'liquid' },
        hazardLevel: { type: String, enum: ['safe', 'caution', 'warning', 'danger'], default: 'safe' }
    }],
    apparatus: [{
        name: { type: String, required: true },
        quantity: { type: Number, default: 1 }
    }],
    steps: [StepSchema],
    expectedReactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reaction'
    }],
    safetyPrecautions: [{
        type: String
    }],
    estimatedTime: {
        type: Number, // in minutes
        default: 15
    },
    learningOutcomes: [{
        type: String
    }],
    preRequisites: [{
        type: String
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    thumbnailUrl: {
        type: String
    },
    videoUrl: {
        type: String
    }
}, { timestamps: true });

export default mongoose.model('LabExperiment', LabExperimentSchema);
