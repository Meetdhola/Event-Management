const express = require('express');
const router = express.Router();
const { getManagers, hireManager, getMyHires, respondHiringRequest } = require('../controllers/hiringController');
const { protect } = require('../middleware/authMiddleware');

// Middleware to restrict to Client role
const authorizeClient = (req, res, next) => {
    if (req.user && req.user.role === 'Client') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as a Client' });
    }
};

// Middleware to restrict to EventManager role
const authorizeManager = (req, res, next) => {
    if (req.user && req.user.role === 'EventManager') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an Event Manager' });
    }
};

router.use(protect);

router.get('/managers', authorizeClient, getManagers);
router.post('/hire', authorizeClient, hireManager);
router.get('/my-hires', authorizeClient, getMyHires);
router.put('/respond/:id', authorizeManager, respondHiringRequest);

module.exports = router;
