const mongoose = require('mongoose');

const crowdReportSchema = new mongoose.Schema({
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
    location: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['Clear', 'Normal', 'Crowded', 'Very Crowded'],
        required: true
    },
    message: {
        type: String,
        trim: true
    },
    created_at: {
        type: Date,
        default: Date.now,
        index: { expires: '2h' } // Reports expire after 2 hours
    }
});

module.exports = mongoose.model('CrowdReport', crowdReportSchema);
