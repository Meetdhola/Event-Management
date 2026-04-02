const express = require('express');
const router = express.Router();
const {
    checkInAttendee,
    getVolunteerStats,
    getCheckInHistory,
    getVolunteerTasks,
    updateTaskStatus,
    getVolunteerEvents,
    assignTask,
    getEventVolunteers,
    getEventTasks,
    deleteTask,
    getAllVolunteerTasks,
    updatePushSubscription
} = require('../controllers/volunteerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Volunteer routes
router.post('/check-in', authorize('Volunteer', 'Admin'), checkInAttendee);
router.post('/subscribe', authorize('Volunteer', 'Admin'), updatePushSubscription);
router.get('/stats/:eventId', authorize('Volunteer', 'Admin'), getVolunteerStats);
router.get('/history/:eventId', authorize('Volunteer', 'Admin'), getCheckInHistory);
router.get('/tasks/:eventId', authorize('Volunteer', 'Admin'), getVolunteerTasks);
router.get('/all-tasks', authorize('Volunteer', 'Admin'), getAllVolunteerTasks);
router.patch('/tasks/:taskId', authorize('Volunteer', 'Admin'), updateTaskStatus);
router.get('/events', authorize('Volunteer', 'Admin'), getVolunteerEvents);

// Manager/Admin routes
router.post('/tasks', authorize('EventManager', 'Admin'), assignTask);
router.delete('/tasks/:taskId', authorize('EventManager', 'Admin'), deleteTask);
router.get('/event-volunteers/:eventId', authorize('EventManager', 'Admin'), getEventVolunteers);
router.get('/event-tasks/:eventId', authorize('EventManager', 'Admin'), getEventTasks);

module.exports = router;
