const express = require('express');
const router = express.Router();
const { processCommand, executeAction, analyzeSentiment } = require('../controllers/aiCommandController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/command', authorize('EventManager', 'Admin'), processCommand);
router.post('/execute', authorize('EventManager', 'Admin'), executeAction);
router.post('/sentiment', analyzeSentiment);

module.exports = router;
