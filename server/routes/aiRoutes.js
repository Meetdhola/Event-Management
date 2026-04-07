const express = require('express');
const router = express.Router();
const {
	processCommand,
	executeAction,
	analyzeSentiment,
	generateAnalyticsReport,
	downloadAnalyticsReportPdf
} = require('../controllers/aiCommandController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/command', authorize('EventManager', 'Admin'), processCommand);
router.post('/execute', authorize('EventManager', 'Admin'), executeAction);
router.post('/report', authorize('EventManager', 'Admin'), generateAnalyticsReport);
router.post('/report/pdf', authorize('EventManager', 'Admin'), downloadAnalyticsReportPdf);
router.post('/sentiment', analyzeSentiment);

module.exports = router;
