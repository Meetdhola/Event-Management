const Resource = require('../models/Resource');
const Event = require('../models/Event');

// @desc    Get all available resources
// @route   GET /api/resources
// @access  Private
const getResources = async (req, res) => {
    try {
        const resources = await Resource.find({ is_available: true });
        res.status(200).json(resources);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Add resource to event (Logistics Cart)
// @route   POST /api/resources/add-to-event/:eventId
// @access  Private/Organizer
const addToEvent = async (req, res) => {
    try {
        const { resourceId, quantity } = req.body;
        const event = await Event.findById(req.params.eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if organizer owns the event
        if (event.event_manager_id.toString() !== req.user.id && req.user.role !== 'Admin') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Check if resource already in event
        const resourceIndex = event.logistics_cart.findIndex(r => r.resource.toString() === resourceId);

        if (resourceIndex > -1) {
            event.logistics_cart[resourceIndex].quantity = quantity;
        } else {
            event.logistics_cart.push({ resource: resourceId, quantity });
        }

        await event.save();
        const updatedEvent = await Event.findById(req.params.eventId)
            .populate('logistics_cart.resource')
            .populate('event_manager_id', 'name email')
            .populate('client_id', 'name email');

        res.status(200).json(updatedEvent);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get AI suggestions for event logistics
// @route   GET /api/resources/suggestions/:eventId
// @access  Private/Organizer
const getSuggestions = async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId).populate('logistics_cart.resource');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Simple mock AI logic
        // "You need 1 security guard for every 250 people"
        const capacity = event.expected_audience || 500;
        const suggestions = [];

        const security = event.logistics_cart.find(r => r.resource?.category === 'Security');
        const guardsNeeded = Math.ceil(capacity / 250);
        const guardsCurrent = security ? security.quantity : 0;

        if (guardsCurrent < guardsNeeded) {
            suggestions.push({
                type: 'warning',
                message: `You need ${guardsNeeded - guardsCurrent} more security guards for ${capacity} people.`
            });
        } else {
            suggestions.push({
                type: 'success',
                message: 'Security coverage is adequate for the planned capacity.'
            });
        }

        res.status(200).json(suggestions);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getResources,
    addToEvent,
    getSuggestions
};
