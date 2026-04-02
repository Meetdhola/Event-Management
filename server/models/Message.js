const mongoose = require('mongoose');

const singleMessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: [true, 'Please add message content']
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

const messageSchema = new mongoose.Schema({
    user1_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    user2_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    messages: [singleMessageSchema]
}, { timestamps: true });

// Ensure a unique chat thread between two specific users
messageSchema.index({ user1_id: 1, user2_id: 1 }, { unique: true });

module.exports = mongoose.model('Message', messageSchema);
