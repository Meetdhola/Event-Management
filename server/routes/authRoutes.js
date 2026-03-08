const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getMe,
    sendOTP,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/send-otp', sendOTP);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

module.exports = router;
