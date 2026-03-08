const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    event_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    qr_code: {
        type: String,
        required: true,
        unique: true
    },
    is_checked_in: {
        type: Boolean,
        default: false
    },
    checked_in_at: {
        type: Date,
        default: null
    },
    gate: {
        type: String,
        default: null
    }
});

module.exports = mongoose.model('Ticket', ticketSchema);
