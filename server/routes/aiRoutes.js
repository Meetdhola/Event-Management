const express = require('express');
const router = express.Router();
const { processCommand, executeAction } = require('../controllers/aiCommandController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('EventManager', 'Admin'));

router.post('/command', processCommand);
router.post('/execute', executeAction);

module.exports = router;
