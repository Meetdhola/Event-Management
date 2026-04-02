const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
    try {
        const { receiver_id, content } = req.body;

        if (!receiver_id || !content) {
            return res.status(400).json({ message: 'Please provide receiver_id and content' });
        }

        const sender_id = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(receiver_id)) {
            return res.status(400).json({ message: 'Invalid receiver ID format' });
        }

        console.log(`SendMessage - Sender: ${sender_id}, Receiver: ${receiver_id}`);

        // Sort IDs to ensure consistent user1_id and user2_id
        const [user1_id, user2_id] = [sender_id.toString(), receiver_id.toString()].sort();
        console.log(`Chat ID: ${user1_id} / ${user2_id}`);

        const newMessage = {
            sender: sender_id,
            content,
            created_at: new Date()
        };

        const conversation = await Message.findOneAndUpdate(
            {
                user1_id,
                user2_id
            },
            { $push: { messages: newMessage } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Return the last message added
        const lastMessage = conversation.messages[conversation.messages.length - 1];
        res.status(201).json(lastMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server Error', error: error.message, stack: error.stack });
    }
};

// @desc    Get messages for a specific 1:1 conversation
// @route   GET /api/messages/:receiver_id
// @access  Private
const getMessages = async (req, res) => {
    try {
        const { receiver_id } = req.params;
        const sender_id = req.user.id.toString();
        const receiver_id_str = receiver_id.toString();

        if (!mongoose.Types.ObjectId.isValid(receiver_id_str)) {
            return res.status(400).json({ message: 'Invalid receiver ID format' });
        }

        console.log(`GetMessages - Sender: ${sender_id}, Receiver: ${receiver_id_str}`);

        // Sort IDs to ensure consistent user1_id and user2_id
        const [user1_id, user2_id] = [sender_id, receiver_id_str].sort();
        console.log(`Chat Query ID: ${user1_id} / ${user2_id}`);

        const conversation = await Message.findOne({
            user1_id,
            user2_id
        }).populate('messages.sender', 'name role');

        if (!conversation || !conversation.messages) {
            console.log('No conversation found, returning empty array');
            return res.status(200).json([]);
        }

        res.status(200).json(conversation.messages);
    } catch (error) {
        console.error('CRITICAL Error getting messages:', error);
        res.status(500).json({ message: 'Server Error', error: error.message, stack: error.stack });
    }
};

module.exports = {
    sendMessage,
    getMessages
};
