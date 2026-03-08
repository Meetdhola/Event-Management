const User = require('../models/User');
const Event = require('../models/Event');

// @desc    Get all available Event Managers
// @route   GET /api/hiring/managers
// @access  Private (Client only)
const getManagers = async (req, res) => {
    try {
        const managers = await User.find({ role: 'EventManager', is_approved: true })
            .select('name email phone');
        res.status(200).json(managers);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Hire an Event Manager (Create an event request)
// @route   POST /api/hiring/hire
// @access  Private (Client only)
const hireManager = async (req, res) => {
    try {
        const { manager_id, event_name, event_type, description, venue, start_date, end_date, expected_audience } = req.body;

        if (!manager_id || !event_name || !event_type || !description || !venue || !start_date || !end_date || !expected_audience) {
            return res.status(400).json({ message: 'Please add all required fields' });
        }

        // Verify manager exists and is an EventManager
        const manager = await User.findOne({ _id: manager_id, role: 'EventManager' });
        if (!manager) {
            return res.status(404).json({ message: 'Event Manager not found' });
        }

        const event = await Event.create({
            event_name,
            event_type,
            description,
            venue,
            start_date,
            end_date,
            expected_audience,
            event_manager_id: manager_id,
            client_id: req.user.id,
            status: 'draft',
            hiring_status: 'pending' // Hired events start as pending request
        });

        res.status(201).json({
            message: 'Manager hired successfully and event created as draft',
            event
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get client's hired events
// @route   GET /api/hiring/my-hires
// @access  Private (Client only)
const getMyHires = async (req, res) => {
    try {
        const events = await Event.find({ client_id: req.user.id })
            .populate('event_manager_id', 'name email phone');
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Respond to a hiring request (Accept/Decline)
// @route   PUT /api/hiring/respond/:id
// @access  Private (EventManager only)
const respondHiringRequest = async (req, res) => {
    try {
        const { action } = req.body; // 'accepted' or 'rejected'

        if (!['accepted', 'rejected'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action' });
        }

        const event = await Event.findOne({
            _id: req.params.id,
            event_manager_id: req.user.id
        });

        if (!event) {
            return res.status(404).json({ message: 'Hiring request not found' });
        }

        event.hiring_status = action;

        if (action === 'accepted') {
            event.status = 'upcoming';
        } else {
            event.status = 'draft';
        }

        await event.save();

        res.status(200).json({
            message: `Request ${action} successfully`,
            event
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getManagers,
    hireManager,
    getMyHires,
    respondHiringRequest
};
