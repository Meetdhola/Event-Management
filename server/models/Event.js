const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    event_name: {
        type: String,
        required: [true, 'Please add an event name']
    },
    event_type: {
        type: String,
        required: [true, 'Please add an event type'], // Concert, Fest, Conference
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    event_manager_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    client_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    hiring_status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'none'],
        default: 'none'
    },
    venue: {
        type: String,
        required: [true, 'Please add a venue']
    },
    start_date: {
        type: Date,
        required: [true, 'Please add a start date']
    },
    end_date: {
        type: Date,
        required: [true, 'Please add an end date']
    },
    expected_audience: {
        type: Number,
        required: [true, 'Please add expected audience']
    },
    actual_audience: {
        type: Number,
        default: null
    },
    status: {
        type: String,
        enum: ['draft', 'upcoming', 'live', 'completed'],
        default: 'upcoming'
    },
    readiness_score_ai: {
        type: Number,
        default: null
    },
    logistics_cart: [
        {
            resource: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Resource'
            },
            quantity: {
                type: Number,
                default: 1
            }
        }
    ],
    budget: {
        planned: { type: Number, default: 0 },
        actual: { type: Number, default: 0 }
    },
    vendors: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    volunteers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    crowd_data: [
        {
            timestamp: { type: Date, default: Date.now },
            count: Number,
            sentiment: Number
        }
    ],
    alerts: [
        {
            type: String,
            message: String,
            severity: String,
            timestamp: { type: Date, default: Date.now }
        }
    ],
    image: {
        type: String,
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Event', eventSchema);
