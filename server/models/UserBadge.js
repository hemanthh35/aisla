// UserBadge model to track badge assignments to users
import mongoose from 'mongoose';

const userBadgeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    badgeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Badge',
        required: true
    },
    awardedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    awardedAt: {
        type: Date,
        default: Date.now
    },
    reason: {
        type: String,
        trim: true,
        default: ''
    },
    isVisible: {
        type: Boolean,
        default: true
    }
});

// Compound index to prevent duplicate badge assignments
userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

export default mongoose.model('UserBadge', userBadgeSchema);
