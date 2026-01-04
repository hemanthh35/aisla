import mongoose from 'mongoose';

const LabActivitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    experimentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LabExperiment'
    },
    mode: {
        type: String,
        enum: ['guided', 'free'],
        required: true
    },
    actions: [{
        timestamp: { type: Date, default: Date.now },
        actionType: {
            type: String,
            enum: ['pick', 'place', 'pour', 'heat', 'mix', 'measure', 'stir', 'observe', 'reset']
        },
        sourceItem: { type: String },
        targetItem: { type: String },
        chemical: { type: String },
        result: { type: String },
        success: { type: Boolean, default: true }
    }],
    reactionsTriggered: [{
        reactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reaction' },
        chemicals: [{ type: String }],
        timestamp: { type: Date, default: Date.now },
        wasExpected: { type: Boolean }
    }],
    safetyWarningsShown: [{
        warning: { type: String },
        timestamp: { type: Date, default: Date.now }
    }],
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    duration: {
        type: Number // in seconds
    },
    completed: {
        type: Boolean,
        default: false
    },
    stepsCompleted: {
        type: Number,
        default: 0
    },
    totalSteps: {
        type: Number
    },
    score: {
        type: Number,
        min: 0,
        max: 100
    },
    feedback: {
        type: String
    }
}, { timestamps: true });

// Index for efficient user activity lookup
LabActivitySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('LabActivity', LabActivitySchema);
