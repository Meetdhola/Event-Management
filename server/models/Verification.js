const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        index: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        index: { expires: '10m' } // TTL index to automatically delete expired docs
    }
});

module.exports = mongoose.model('Verification', verificationSchema);
