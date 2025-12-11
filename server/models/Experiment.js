// Experiment model - AI-generated learning unit
const mongoose = require('mongoose');

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
    // AI-generated structured content
    content: {
        aim: {
            type: String,
            required: true
        },
        theory: {
            type: String,
            required: true
        },
        procedure: {
            type: String,
            required: true
        },
        keyFormulas: [{
            type: String
        }],
        example: {
            type: String
        },
        commonMistakes: [{
            type: String
        }],
        realWorldApplication: {
            type: String
        },
        summary: {
            type: String
        }
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
});

// Update the updatedAt field before saving
experimentSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Experiment', experimentSchema);
