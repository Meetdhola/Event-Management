const mongoose = require('mongoose');

const aiReportSchema = new mongoose.Schema({
    event_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    profit_or_loss: {
        type: Number, // FLOAT
        default: null
    },
    audience_score: {
        type: Number, // FLOAT
        default: null
    },
    issues_detected: [
        {
            type: String
        }
    ],
    ai_suggestions: [
        {
            type: String
        }
    ],
    generated_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('AIReport', aiReportSchema);
