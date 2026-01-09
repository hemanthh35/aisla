// ChatRoom model for faculty-student messaging
import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema({
    // Student who initiated the chat
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Faculty member assigned to the chat
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Chat room status
    status: {
        type: String,
        enum: ['active', 'resolved', 'closed', 'pending'],
        default: 'active'
    },
    // Subject/Topic of the chat
    subject: {
        type: String,
        trim: true,
        default: 'General Doubt'
    },
    // Category for filtering
    category: {
        type: String,
        enum: ['doubt', 'task', 'assignment', 'general'],
        default: 'general'
    },
    // Priority level
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    // Last message preview for listing
    lastMessage: {
        content: String,
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: Date
    },
    // Unread count for each participant
    unreadCount: {
        student: { type: Number, default: 0 },
        faculty: { type: Number, default: 0 }
    },
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    // When the chat was resolved/closed
    resolvedAt: Date,
    closedAt: Date,
    // Faculty notes (internal)
    facultyNotes: {
        type: String,
        trim: true
    }
});

// Index for efficient queries
chatRoomSchema.index({ student: 1, faculty: 1 });
chatRoomSchema.index({ status: 1 });
chatRoomSchema.index({ updatedAt: -1 });

// Update the updatedAt field before saving
chatRoomSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Virtual for message count (populated separately)
chatRoomSchema.virtual('messageCount', {
    ref: 'Message',
    localField: '_id',
    foreignField: 'chatRoom',
    count: true
});

// Ensure virtuals are included in JSON output
chatRoomSchema.set('toJSON', { virtuals: true });
chatRoomSchema.set('toObject', { virtuals: true });

export default mongoose.model('ChatRoom', chatRoomSchema);
