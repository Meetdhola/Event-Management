const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const crypto = require('crypto');

// @desc    Book a ticket for an event
// @route   POST /api/tickets/book
// @access  Private/Attendee
const bookTicket = async (req, res) => {
    try {
        const { eventId, attendees } = req.body;

        if (!eventId || !attendees || !Array.isArray(attendees) || attendees.length === 0) {
            return res.status(400).json({ message: 'Event ID and attendees list are required' });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check capacity
        if (event.actual_audience + attendees.length > event.expected_audience) {
            return res.status(400).json({ message: `Insufficient capacity. Only ${event.expected_audience - event.actual_audience} slots remaining.` });
        }

        // Create a single consolidated ticket record
        const qr_code = crypto.randomBytes(16).toString('hex');
        const ticket = await Ticket.create({
            event_id: eventId,
            user_id: req.user.id,
            qr_code,
            attendees: attendees.map(person => ({
                name: person.name,
                email: person.email,
                phone: person.phone,
                is_checked_in: false,
                checked_in_at: null,
                checked_in_by: null,
                gate: null
            }))
        });

        // Update event audience count
        event.actual_audience += attendees.length;
        await event.save();

        res.status(201).json({
            message: `Successfully secured entry for ${attendees.length} attendee(s)`,
            ticket
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get user's tickets
// @route   GET /api/tickets/my-tickets
// @access  Private/Attendee
const getMyTickets = async (req, res) => {
    try {
        const userEmail = req.user.email;
        const tickets = await Ticket.find({
            $or: [
                { user_id: req.user.id },
                { "attendees.email": userEmail }
            ]
        })
            .populate('event_id', 'event_name venue start_date end_date image');
        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    bookTicket,
    getMyTickets
};
