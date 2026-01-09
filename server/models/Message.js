// Message model for chat messages between faculty and students
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    // Reference to the chat room
    chatRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatRoom',
        required: true
    },
    // Message sender
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Sender role for quick filtering
    senderRole: {
        type: String,
        enum: ['student', 'faculty', 'admin', 'system'],
        required: true
    },
    // Message type
    messageType: {
        type: String,
        enum: ['text', 'doubt', 'task', 'file', 'image', 'system', 'feedback'],
        default: 'text'
    },
    // Message content
    content: {
        type: String,
        required: function () {
            return this.messageType !== 'file' && this.messageType !== 'image';
        },
        trim: true
    },
    // File attachment details
    file: {
        url: String,
        name: String,
        type: String,  // mime type
        size: Number   // in bytes
    },
    // For doubt/task messages
    metadata: {
        // Doubt specific
        isResolved: { type: Boolean, default: false },
        resolvedAt: Date,
        resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        // Task specific
        taskStatus: {
            type: String,
            enum: ['pending', 'accepted', 'rejected', 'in-progress', 'completed', 'under-review'],
            default: 'pending'
        },
        dueDate: Date,
        // Priority for doubts
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium'
        },
        // Related experiment/subject
        relatedExperiment: { type: mongoose.Schema.Types.ObjectId, ref: 'Experiment' },
        subject: String
    },
    // Message status
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'sent'
    },
    // Read by recipient
    readAt: Date,
    // Edit history
    isEdited: { type: Boolean, default: false },
    editedAt: Date,
    // Soft delete
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    // Reactions (optional feature)
    reactions: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emoji: String,
        createdAt: { type: Date, default: Date.now }
    }],
    // Reply to another message
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    // Timestamp
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for efficient queries
messageSchema.index({ chatRoom: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ messageType: 1 });
messageSchema.index({ 'metadata.isResolved': 1 });
messageSchema.index({ status: 1 });

// Static method to get unread count for a user in a chat
messageSchema.statics.getUnreadCount = async function (chatRoomId, userId) {
    return this.countDocuments({
        chatRoom: chatRoomId,
        sender: { $ne: userId },
        status: { $ne: 'read' }
    });
};

// Static method to mark messages as read
messageSchema.statics.markAsRead = async function (chatRoomId, userId) {
    return this.updateMany(
        {
            chatRoom: chatRoomId,
            sender: { $ne: userId },
            status: { $ne: 'read' }
        },
        {
            $set: {
                status: 'read',
                readAt: new Date()
            }
        }
    );
};

export default mongoose.model('Message', messageSchema);
