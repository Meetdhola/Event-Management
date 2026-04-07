const express = require('express');
const router = express.Router();
const { submitFeedback, getFeedbackByEvent, getMyFeedbackByEvent, getFeedbackForManager } = require('../controllers/feedbackController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', authorize('Attendee'), submitFeedback);
router.get('/my/:eventId', authorize('Attendee'), getMyFeedbackByEvent);
router.get('/manager', authorize('EventManager', 'Admin'), getFeedbackForManager);
router.get('/event/:eventId', authorize('Admin', 'EventManager'), getFeedbackByEvent);

module.exports = router;
