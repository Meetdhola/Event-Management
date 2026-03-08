const express = require('express');
const router = express.Router();
const {
    checkInAttendee,
    getVolunteerStats,
    getCheckInHistory,
    getVolunteerTasks,
    updateTaskStatus
} = require('../controllers/volunteerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('Volunteer', 'Admin'));

router.post('/check-in', checkInAttendee);
router.get('/stats/:eventId', getVolunteerStats);
router.get('/history/:eventId', getCheckInHistory);
router.get('/tasks/:eventId', getVolunteerTasks);
router.patch('/tasks/:taskId', updateTaskStatus);

module.exports = router;
