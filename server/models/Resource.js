const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Security', 'Food', 'Audio/Visual', 'Logistics', 'Decor', 'Technical'],
        required: true
    },
    base_price: {
        type: Number,
        required: true
    },
    unit: {
        type: String, // e.g., 'per guard', 'per meal', 'per set'
        required: true
    },
    capacity_per_unit: {
        type: Number, // e.g., 50 (50 people per unit)
        default: 0
    },
    description: {
        type: String
    },
    is_available: {
        type: Boolean,
        default: true
    },
    vendor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // Admin resources or system defaults
    }
});

module.exports = mongoose.model('Resource', resourceSchema);
