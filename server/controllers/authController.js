const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Verification = require('../models/Verification');
const sendEmail = require('../config/email');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Send OTP to email
// @route   POST /api/auth/send-otp
// @access  Public
const sendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Please provide an email' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save to DB (upsert if exists)
        await Verification.findOneAndUpdate(
            { email },
            { otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
            { upsert: true, new: true }
        );

        // Send Email
        await sendEmail({
            email,
            subject: 'Your Registration OTP - Intelligent Event Hub',
            message: 'Your verification code for registration is:',
            otp
        });

        res.status(200).json({ message: 'OTP sent to your email' });
    } catch (error) {
        console.error("FULL OTP ERROR:", error);
        res.status(500).json({
            message: 'Server failed to deliver OTP. Check the console for detailed SMTP logs.',
            error: error.message,
            code: error.code || 'UNKNOWN_ERROR'
        });
    }
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password, role, phone, otp } = req.body;

        if (!name || !email || !password || !role || !otp) {
            return res.status(400).json({ message: 'Please add all fields including OTP' });
        }

        // Verify OTP
        const verification = await Verification.findOne({ email, otp });
        if (!verification) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            if (userExists.status === 'blocked') {
                return res.status(403).json({ message: 'Access Denied: This email protocol has been blacklisted by system administration.' });
            }
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password_hash: password,
            role,
            phone,
            is_approved: ['Attendee', 'Client'].includes(role), // Attendees and Clients approved by default
        });

        if (user) {
            // Delete verification record after successful registration
            await Verification.deleteOne({ _id: verification._id });

            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            // Check if user is blocked
            if (user.status === 'blocked') {
                return res.status(403).json({ message: 'Access Denied: This account has been restricted by system administration.' });
            }

            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    res.status(200).json(req.user);
};

// @desc    Get all admins
// @route   GET /api/auth/admins
// @access  Private
const getAdmins = async (req, res) => {
    try {
        const admins = await User.find({ role: 'Admin' }).select('-password_hash');
        res.status(200).json(admins);
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};
// @desc    Request forgot password OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found with this email' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await Verification.findOneAndUpdate(
            { email },
            { otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
            { upsert: true, new: true }
        );

        await sendEmail({
            email,
            subject: 'Reset Password OTP - EventFlow',
            message: 'Your verification code for password reset is:',
            otp
        });

        res.status(200).json({ message: 'OTP sent to your email' });
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// @desc    Reset password using OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { email, otp, password } = req.body;

        const verification = await Verification.findOne({ email, otp });
        if (!verification) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.password_hash = password;
        await user.save();

        await Verification.deleteOne({ _id: verification._id });

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

module.exports = {
    sendOTP,
    registerUser,
    loginUser,
    getMe,
    getAdmins,
    forgotPassword,
    resetPassword,
};
