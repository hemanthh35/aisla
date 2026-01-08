// Quiz model - AI-generated quizzes for experiments
import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['mcq', 'short_answer'],
        required: true
    },
    question: {
        type: String,
        required: true
    },
    options: [{
        type: String
    }],
    answer: {
        type: String,
        required: true
    },
    explanation: {
        type: String
    }
});

const quizSchema = new mongoose.Schema({
    experimentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Experiment',
        required: true
    },
    questions: [questionSchema],
    totalQuestions: {
        type: Number,
        default: 7 // 5 MCQs + 2 short answer
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Quiz', quizSchema);
