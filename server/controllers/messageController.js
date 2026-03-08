const Message = require('../models/Message');
const User = require('../models/User');

// Helper to reliably get client and manager IDs from two user IDs
const getClientAndManagerIds = async (userId1, userId2) => {
    const users = await User.find({ _id: { $in: [userId1, userId2] } });
    if (users.length !== 2) return null;

    let clientId = null;
    let managerId = null;

    for (const user of users) {
        if (user.role === 'Client') clientId = user._id;
        if (user.role === 'EventManager') managerId = user._id;
    }

    return { clientId, managerId };
};

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

        // Determine who is the client and who is the manager
        const roles = await getClientAndManagerIds(sender_id, receiver_id);

        if (!roles || !roles.clientId || !roles.managerId) {
            return res.status(400).json({ message: 'Chat must be between a Client and an Event Manager' });
        }

        const newMessage = {
            sender: sender_id,
            content,
            created_at: new Date()
        };

        const conversation = await Message.findOneAndUpdate(
            {
                client_id: roles.clientId,
                manager_id: roles.managerId
            },
            { $push: { messages: newMessage } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Return the last message added
        const lastMessage = conversation.messages[conversation.messages.length - 1];
        res.status(201).json(lastMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get messages for a specific 1:1 conversation
// @route   GET /api/messages/:receiver_id
// @access  Private
const getMessages = async (req, res) => {
    try {
        const { receiver_id } = req.params;
        const sender_id = req.user.id;

        // Determine who is the client and who is the manager
        const roles = await getClientAndManagerIds(sender_id, receiver_id);

        if (!roles || !roles.clientId || !roles.managerId) {
            return res.status(400).json({ message: 'Invalid chat configuration (must be Client and Manager)' });
        }

        const conversation = await Message.findOne({
            client_id: roles.clientId,
            manager_id: roles.managerId
        }).populate('messages.sender', 'name role');

        if (!conversation || !conversation.messages) {
            return res.status(200).json([]);
        }

        res.status(200).json(conversation.messages);
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    sendMessage,
    getMessages
};
