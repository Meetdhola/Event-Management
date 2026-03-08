const express = require('express');
const router = express.Router();
const {
    getResources,
    addToEvent,
    getSuggestions
} = require('../controllers/resourceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getResources);
router.post('/add-to-event/:eventId', addToEvent);
router.get('/suggestions/:eventId', getSuggestions);

module.exports = router;
