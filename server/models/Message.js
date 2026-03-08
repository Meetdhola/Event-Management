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
    client_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    manager_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    messages: [singleMessageSchema]
}, { timestamps: true });

// Ensure a unique chat thread between a specific client and manager
messageSchema.index({ client_id: 1, manager_id: 1 }, { unique: true });

module.exports = mongoose.model('Message', messageSchema);
