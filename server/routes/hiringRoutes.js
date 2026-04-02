const express = require('express');
const router = express.Router();
const { getManagers, hireManager, getMyHires, respondHiringRequest } = require('../controllers/hiringController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/managers', authorize('Client', 'Admin'), getManagers);
router.post('/hire', authorize('Client', 'Admin'), hireManager);
router.get('/my-hires', authorize('Client', 'Admin'), getMyHires);
router.put('/respond/:id', authorize('EventManager', 'Admin'), respondHiringRequest);

module.exports = router;
