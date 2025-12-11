// Submission model - Student quiz submissions and scores
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    userAnswer: {
        type: String,
        required: true
    },
    isCorrect: {
        type: Boolean,
        default: false
    },
    feedback: {
        type: String
    }
});

const submissionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    experimentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Experiment',
        required: true
    },
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    answers: [answerSchema],
    score: {
        type: Number,
        default: 0
    },
    totalQuestions: {
        type: Number,
        default: 0
    },
    percentage: {
        type: Number,
        default: 0
    },
    // AI-generated feedback
    feedback: {
        overallFeedback: String,
        topicsToRevise: [String],
        strengths: [String],
        suggestions: [String]
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
submissionSchema.index({ userId: 1, experimentId: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
