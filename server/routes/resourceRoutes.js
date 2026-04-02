const express = require('express');
const router = express.Router();
const {
    getResources,
    addToEvent,
    getSuggestions
} = require('../controllers/resourceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getResources);
router.post('/add-to-event/:eventId', authorize('EventManager', 'Admin'), addToEvent);
router.get('/suggestions/:eventId', authorize('EventManager', 'Admin'), getSuggestions);

module.exports = router;
