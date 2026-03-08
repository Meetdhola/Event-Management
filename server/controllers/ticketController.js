const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const crypto = require('crypto');

// @desc    Book a ticket for an event
// @route   POST /api/tickets/book
// @access  Private/Attendee
const bookTicket = async (req, res) => {
    try {
        const { eventId } = req.body;

        if (!eventId) {
            return res.status(400).json({ message: 'Event ID is required' });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if user already has a ticket
        const existingTicket = await Ticket.findOne({ event_id: eventId, user_id: req.user.id });
        if (existingTicket) {
            return res.status(400).json({ message: 'You already have a ticket for this event' });
        }

        // Check capacity
        if (event.actual_audience >= event.expected_audience) {
            return res.status(400).json({ message: 'Event is at full capacity' });
        }

        // Generate a unique QR code hash
        const qr_code = crypto.randomBytes(16).toString('hex');

        const ticket = await Ticket.create({
            event_id: eventId,
            user_id: req.user.id,
            qr_code
        });

        res.status(201).json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get user's tickets
// @route   GET /api/tickets/my-tickets
// @access  Private/Attendee
const getMyTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ user_id: req.user.id })
            .populate('event_id', 'event_name venue start_date image');
        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    bookTicket,
    getMyTickets
};
