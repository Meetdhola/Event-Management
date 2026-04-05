const express = require('express');
const router = express.Router();
const CrowdReport = require('../models/CrowdReport');
const { protect } = require('../middleware/authMiddleware');

// @desc    Create a crowd report
// @route   POST /api/crowd/report
// @access  Private
router.post('/report', protect, async (req, res) => {
    try {
        const { event_id, location, status, message } = req.body;

        if (!event_id || !location || !status) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const report = await CrowdReport.create({
            event_id,
            user_id: req.user._id,
            location,
            status,
            message
        });

        // Populate user info for real-time broadcast
        const populatedReport = await report.populate('user_id', 'name');

        // Broadcast via socket
        if (req.io) {
            req.io.to(`event_${event_id}`).emit('crowd_update', populatedReport);
        }

        res.status(201).json(populatedReport);
    } catch (error) {
        console.error('Error creating crowd report:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get reports for an event
// @route   GET /api/crowd/event/:eventId
// @access  Private
router.get('/event/:eventId', protect, async (req, res) => {
    try {
        const reports = await CrowdReport.find({ event_id: req.params.eventId })
            .sort({ created_at: -1 })
            .populate('user_id', 'name')
            .limit(20);
        res.json(reports);
    } catch (error) {
        console.error('Error fetching crowd reports:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
