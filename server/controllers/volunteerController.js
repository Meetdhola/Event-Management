const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const Task = require('../models/Task');

// @desc    Verify and check-in attendee via QR
// @route   POST /api/volunteer/check-in
// @access  Private/Volunteer
const checkInAttendee = async (req, res) => {
    try {
        const { qr_code, gate } = req.body;

        if (!qr_code) {
            return res.status(400).json({ message: 'QR Code is required' });
        }

        const ticket = await Ticket.findOne({ qr_code }).populate('user_id', 'name email').populate('event_id', 'event_name start_date');

        if (!ticket) {
            return res.status(404).json({ message: 'Invalid Ticket: QR Code not found' });
        }

        if (ticket.is_checked_in) {
            return res.status(400).json({
                message: 'Already Checked In',
                checkedInAt: ticket.checked_in_at,
                attendee: ticket.user_id.name
            });
        }

        // Update ticket
        ticket.is_checked_in = true;
        ticket.checked_in_at = new Date();
        ticket.gate = gate || 'Main Gate';
        await ticket.save();

        // Increment actual audience count in Event
        await Event.findByIdAndUpdate(ticket.event_id._id, {
            $inc: { actual_audience: 1 }
        });

        res.status(200).json({
            message: 'Check-in Successful',
            attendee: ticket.user_id.name,
            event: ticket.event_id.event_name,
            checkedInAt: ticket.checked_in_at
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get volunteer stats for an event
// @route   GET /api/volunteer/stats/:eventId
// @access  Private/Volunteer
const getVolunteerStats = async (req, res) => {
    try {
        const { eventId } = req.params;

        const totalTickets = await Ticket.countDocuments({ event_id: eventId });
        const checkedIn = await Ticket.countDocuments({ event_id: eventId, is_checked_in: true });

        res.status(200).json({
            totalTickets,
            checkedIn,
            remaining: totalTickets - checkedIn
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get check-in history for an event
// @route   GET /api/volunteer/history/:eventId
// @access  Private/Volunteer
const getCheckInHistory = async (req, res) => {
    try {
        const history = await Ticket.find({
            event_id: req.params.eventId,
            is_checked_in: true
        })
            .populate('user_id', 'name')
            .sort('-checked_in_at')
            .limit(20);

        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get assigned tasks for an event
// @route   GET /api/volunteer/tasks/:eventId
// @access  Private/Volunteer
const getVolunteerTasks = async (req, res) => {
    try {
        const tasks = await Task.find({
            event_id: req.params.eventId,
            assignedTo: req.user.id
        }).sort('-priority');

        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update task status
// @route   PATCH /api/volunteer/tasks/:taskId
// @access  Private/Volunteer
const updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const task = await Task.findById(req.params.taskId);

        if (!task || task.assignedTo.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized or task not found' });
        }

        task.status = status;
        await task.save();

        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    checkInAttendee,
    getVolunteerStats,
    getCheckInHistory,
    getVolunteerTasks,
    updateTaskStatus
};
