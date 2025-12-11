// Badge model for the Badge Management System
const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Badge name is required'],
        trim: true,
        unique: true
    },
    description: {
        type: String,
        required: [true, 'Badge description is required'],
        trim: true
    },
    icon: {
        type: String,
        enum: ['star', 'trophy', 'medal', 'award', 'crown', 'lightning', 'fire', 'rocket', 'diamond', 'heart', 'book', 'code', 'check', 'target', 'zap'],
        default: 'star'
    },
    color: {
        type: String,
        enum: ['gold', 'silver', 'bronze', 'purple', 'blue', 'green', 'red', 'orange', 'pink', 'cyan'],
        default: 'gold'
    },
    rarity: {
        type: String,
        enum: ['common', 'rare', 'epic', 'legendary'],
        default: 'common'
    },
    category: {
        type: String,
        enum: ['academic', 'participation', 'achievement', 'milestone', 'special'],
        default: 'achievement'
    },
    points: {
        type: Number,
        default: 10
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Badge', badgeSchema);
