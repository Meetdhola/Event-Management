const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password_hash: {
        type: String,
        required: [true, 'Please add a password']
    },
    role: {
        type: String,
        enum: ['Admin', 'EventManager', 'Vendor', 'Volunteer', 'Attendee', 'Client'],
        required: [true, 'Please select a role']
    },
    phone: {
        type: String,
        default: null
    },
    is_approved: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        default: 'active'
    },
    otp: {
        type: String,
        default: null
    },
    otp_expires_at: {
        type: Date,
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password_hash);
};

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
    if (!this.isModified('password_hash')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
});

module.exports = mongoose.model('User', userSchema);
