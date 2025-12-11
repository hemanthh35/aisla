// Experiment model - AI-generated learning unit
import mongoose from 'mongoose';

const experimentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Experiment title is required'],
        trim: true
    },
    // Original uploaded content
    originalContent: {
        type: {
            type: String,
            enum: ['text', 'pdf', 'image'],
            default: 'text'
        },
        text: String,
        fileUrl: String
    },
    // AI-generated structured content - completely flexible
    content: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    // Quiz associated with this experiment
    quizGenerated: {
        type: Boolean,
        default: false
    },
    // Metadata
    subject: {
        type: String,
        trim: true
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'intermediate'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    // Disable strict mode to allow flexible content
    strict: false
});

// Update the updatedAt field before saving
experimentSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('Experiment', experimentSchema);
