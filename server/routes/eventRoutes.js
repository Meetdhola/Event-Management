const express = require('express');
const router = express.Router();
const {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/authMiddleware'); // Added authorize here

router.route('/')
    .get(protect, getEvents)
    .post(protect, authorize('EventManager', 'Admin'), createEvent);

router.route('/:id')
    .get(getEventById)
    .put(protect, authorize('EventManager', 'Admin'), updateEvent)
    .delete(protect, authorize('EventManager', 'Admin'), deleteEvent);

module.exports = router;
