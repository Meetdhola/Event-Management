const Event = require('../models/Event');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
    try {
        let query = {};

        // If user is an Event Manager, only show their events
        if (req.user.role === 'EventManager') {
            query.event_manager_id = req.user.id;
        }

        // If user is a Client, only show events they hired for
        if (req.user.role === 'Client') {
            query.client_id = req.user.id;
        }

        const events = await Event.find(query)
            .populate('event_manager_id', 'name email')
            .populate('client_id', 'name email')
            .populate('logistics_cart.resource');
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('event_manager_id', 'name email')
            .populate('client_id', 'name email')
            .populate('logistics_cart.resource');
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private
const createEvent = async (req, res) => {
    try {
        const {
            event_name,
            event_type,
            description,
            venue,
            start_date,
            end_date,
            expected_audience,
            budget_planned,
            image
        } = req.body;

        if (!event_name || !event_type || !description || !venue || !start_date || !end_date || !expected_audience) {
            return res.status(400).json({ message: 'Please add all required fields' });
        }

        const now = new Date();
        const start = new Date(start_date);
        const end = new Date(end_date);

        if (start < now) {
            return res.status(400).json({ message: 'Commencement cannot be before current date/time' });
        }

        if (end <= start) {
            return res.status(400).json({ message: 'Conclusion must be after commencement' });
        }

        const event = await Event.create({
            event_name,
            event_type,
            description,
            venue,
            start_date,
            end_date,
            expected_audience,
            budget: {
                planned: Number(budget_planned) || 0
            },
            image,
            event_manager_id: req.user.id
        });

        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Owner only)
const updateEvent = async (req, res) => {
    try {
        let event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if user is event manager
        if (event.event_manager_id.toString() !== req.user.id && req.user.role !== 'Admin') {
            return res.status(401).json({ message: 'User not authorized' });
        }

        const {
            event_name,
            event_type,
            description,
            venue,
            start_date,
            end_date,
            expected_audience,
            budget_planned,
            image,
            status
        } = req.body;

        if (start_date && end_date) {
            const start = new Date(start_date);
            const end = new Date(end_date);
            if (end <= start) {
                return res.status(400).json({ message: 'Conclusion must be after commencement' });
            }
        }

        event = await Event.findByIdAndUpdate(
            req.params.id,
            {
                event_name,
                event_type,
                description,
                venue,
                start_date,
                end_date,
                expected_audience,
                budget: {
                    ...(event.budget || {}),
                    planned: Number(budget_planned) || 0
                },
                image,
                status
            },
            {
                new: true,
                runValidators: true
            }
        ).populate('event_manager_id', 'name email').populate('client_id', 'name email');

        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Owner only)
const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if user is event manager
        if (event.event_manager_id.toString() !== req.user.id && req.user.role !== 'Admin') {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await event.deleteOne();

        res.status(200).json({ message: 'Event removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
};
