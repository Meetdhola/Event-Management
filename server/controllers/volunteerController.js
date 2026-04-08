const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const Task = require('../models/Task');
const User = require('../models/User');
const webpush = require('web-push');

// Configure Web Push with VAPID keys
webpush.setVapidDetails(
    'mailto:meetdhola28@gmail.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// Helper function to send push to a user
const sendPush = async (userId, payload) => {
    try {
        const user = await User.findById(userId);
        if (user && user.push_subscription) {
            await webpush.sendNotification(user.push_subscription, JSON.stringify(payload));
        }
    } catch (error) {
        console.error('Push delivery failed:', error);
    }
};

// @desc    Verify and check-in attendee via QR
// @route   POST /api/volunteer/check-in
// @access  Private/Volunteer
const checkInAttendee = async (req, res) => {
    try {
        const { qr_code, gate } = req.body;

        if (!qr_code) {
            return res.status(400).json({ message: 'QR Code is required' });
        }

        const ticket = await Ticket.findOne({ qr_code }).populate('event_id', 'event_name start_date');
        if (!ticket) {
            return res.status(404).json({ message: 'Invalid Ticket: QR Code not found' });
        }

        // --- Task-Based Authorization Check ---
        // Verify if the current user (if Volunteer) has an assigned task for this event related to scanning
        if (req.user.role === 'Volunteer') {
            const volunteerTasks = await Task.find({
                assignedTo: req.user.id,
                eventId: ticket.event_id._id
            });

            const scanKeywords = ['scan', 'qr', 'check-in', 'entry', 'gate', 'security', 'verification'];
            const isAuthorizedToScan = volunteerTasks.some(task => 
                scanKeywords.some(keyword => task.title.toLowerCase().includes(keyword))
            );

            if (!isAuthorizedToScan) {
                return res.status(403).json({ 
                    message: `Strategic Lock: You are not authorized for entry verification at ${ticket.event_id.event_name}. No scanning task assigned to your unit.` 
                });
            }
        }
        // ----------------------------------------

        // Find the first guest who is not checked in
        const attendeeToCheckIn = ticket.attendees.find(a => !a.is_checked_in);

        if (!attendeeToCheckIn) {
            return res.status(400).json({
                message: 'All guests in this group are already checked in',
                event: ticket.event_id.event_name
            });
        }

        // Update specific attendee
        attendeeToCheckIn.is_checked_in = true;
        attendeeToCheckIn.checked_in_at = new Date();
        attendeeToCheckIn.checked_in_by = req.user.id;
        attendeeToCheckIn.gate = gate || 'Main Gate';

        await ticket.save();

        // Increment actual audience count in Event (optional, since it was incremented on booking, 
        // but typically check-in counts live occupancy)
        // If we want to track real-time entry, we increment here
        const event = await Event.findByIdAndUpdate(ticket.event_id._id, {
            $inc: { actual_audience: 1 }
        }, { new: true });

        // Emit real-time attendance update
        if (req.io) {
            req.io.to(`event_${ticket.event_id._id}`).emit('attendance_update', {
                eventId: ticket.event_id._id,
                attendeeName: attendeeToCheckIn.name,
                totalCheckedIn: event.actual_audience,
                timestamp: new Date()
            });
        }

        res.status(200).json({
            message: 'Check-in Successful',
            attendee: attendeeToCheckIn.name,
            event: ticket.event_id.event_name,
            checkedInAt: attendeeToCheckIn.checked_in_at,
            remaining: ticket.attendees.filter(a => !a.is_checked_in).length,
            ticketId: ticket._id
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

        const tickets = await Ticket.find({ event_id: eventId });
        let totalAttendees = 0;
        let checkedIn = 0;

        tickets.forEach(t => {
            totalAttendees += t.attendees.length;
            checkedIn += t.attendees.filter(a => a.is_checked_in).length;
        });

        res.status(200).json({
            totalTickets: totalAttendees,
            checkedIn,
            remaining: totalAttendees - checkedIn
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
        const tickets = await Ticket.find({
            event_id: req.params.eventId,
            "attendees.is_checked_in": true
        }).sort('-attendees.checked_in_at');

        // Extract and flatten checked-in attendees
        const history = [];
        tickets.forEach(ticket => {
            ticket.attendees.forEach(att => {
                if (att.is_checked_in) {
                    history.push({
                        name: att.name,
                        email: att.email,
                        checkedInAt: att.checked_in_at,
                        gate: att.gate,
                        ticketId: ticket._id
                    });
                }
            });
        });

        // Sort by check-in time descending and limit
        const sortedHistory = history.sort((a, b) => new Date(b.checkedInAt) - new Date(a.checkedInAt)).slice(0, 20);

        res.status(200).json(sortedHistory);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get assigned tasks for an event
// @route   GET /api/volunteer/tasks/:eventId
// @desc    Get all tasks for a volunteer across all events
// @route   GET /api/volunteer/all-tasks
// @access  Private/Volunteer
const getAllVolunteerTasks = async (req, res) => {
    try {
        const tasks = await Task.find({
            assignedTo: req.user.id
        }).sort({ createdAt: -1 });

        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all tasks for a specific event
// @route   GET /api/volunteer/tasks/:eventId
// @access  Private/Volunteer
const getVolunteerTasks = async (req, res) => {
    try {
        const tasks = await Task.find({
            eventId: req.params.eventId,
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

        // Emit real-time task update
        if (req.io) {
            req.io.to(`event_${task.eventId}`).emit('task_update', {
                taskId: task._id,
                status: task.status,
                title: task.title,
                updatedAt: new Date()
            });
        }

        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Assign a mission to a volunteer
// @route   POST /api/volunteer/tasks
// @access  Private/EventManager/Admin
const assignTask = async (req, res) => {
    try {
        const { eventId, assignedTo, title, description, priority } = req.body;

        if (!eventId || !assignedTo || !title) {
            return res.status(400).json({ message: 'Event, Volunteer, and Title are required' });
        }

        // Check if volunteer is already assigned to another active event
        const activeEvent = await Event.findOne({
            volunteers: assignedTo,
            _id: { $ne: eventId },
            status: { $in: ['upcoming', 'live'] }
        });

        if (activeEvent) {
            return res.status(400).json({ 
                message: `Deployment Conflict: This volunteer is already mobilized for event '${activeEvent.event_name}'. Tactical protocol prevents dual assignments.` 
            });
        }

        const task = await Task.create({
            eventId,
            assignedTo,
            title,
            description,
            priority: priority || 'Medium',
            status: 'Pending'
        });

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email')
            .populate('eventId', 'event_name');

        // Ensure this volunteer is officially added to this event's roster if they aren't already
        await Event.findByIdAndUpdate(eventId, {
            $addToSet: { volunteers: assignedTo }
        });

        // Emit real-time task assignment to the event room (for manager's view)
        if (req.io) {
            req.io.to(`event_${eventId}`).emit('task_assigned', populatedTask);
            // Emit directly to the specific volunteer
            req.io.to(`volunteer_${assignedTo}`).emit('new_mission_alert', populatedTask);
        }

        // Send Offline Push Notification
        await sendPush(assignedTo, {
            title: 'NEW MISSION TARGET',
            body: `Objective: ${title} | Sector: ${populatedTask.eventId?.event_name || 'Assigned Zone'}`,
            type: 'mission'
        });

        res.status(201).json(populatedTask);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a task assignment
// @route   DELETE /api/volunteer/tasks/:taskId
// @access  Private/EventManager/Admin
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId).populate('eventId', 'event_name');
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const deletionAlert = {
            taskId: task._id,
            title: task.title,
            eventName: task.eventId?.event_name || 'Assigned Event'
        };

        await task.deleteOne();

        // Emit real-time task deletion to event room and to specific volunteer
        if (req.io) {
            req.io.to(`event_${task.eventId._id || task.eventId}`).emit('task_deleted', req.params.taskId);
            req.io.to(`volunteer_${task.assignedTo}`).emit('task_deleted_alert', deletionAlert);
        }

        // Send Offline Push Notification for abort
        await sendPush(task.assignedTo, {
            title: 'MISSION RESCINDED',
            body: `Mission '${deletionAlert.title}' has been aborted by command.`,
            type: 'aborted'
        });

        res.status(200).json({ message: 'Task removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all volunteers for a specific event (Currently fetches ALL volunteers in the system)
// @route   GET /api/volunteer/event-volunteers/:eventId
// @access  Private/EventManager/Admin
const getEventVolunteers = async (req, res) => {
    try {
        // Fetch ALL volunteers in the system so the Event Manager can assign tasks to anyone
        const volunteers = await User.find({ role: 'Volunteer' }).select('name email role');
        res.status(200).json(volunteers);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all tasks for an event
// @route   GET /api/volunteer/event-tasks/:eventId
// @access  Private/EventManager/Admin
const getEventTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ eventId: req.params.eventId })
            .populate('assignedTo', 'name email')
            .sort('-priority');
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get events assigned to a volunteer
// @route   GET /api/volunteer/events
// @access  Private/Volunteer
const getVolunteerEvents = async (req, res) => {
    try {
        const events = await Event.find({ volunteers: req.user.id })
            .populate('event_manager_id', 'name email');
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json(error.message);
    }
};

// @desc    Update volunteer push subscription
// @route   POST /api/volunteer/subscribe
// @access  Private/Volunteer
const updatePushSubscription = async (req, res) => {
    try {
        const { subscription } = req.body;
        
        await User.findByIdAndUpdate(req.user.id, {
            push_subscription: subscription
        });

        res.status(200).json({ message: 'Push synchronization successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Trigger emergency SOS (REST-based trigger for higher reliability)
// @route   POST /api/volunteer/sos
// @access  Private/Volunteer/Admin
const triggerSOS = async (req, res) => {
    try {
        const { eventId, eventName, volunteerName, location, timestamp } = req.body;

        if (!eventName || !volunteerName) {
            return res.status(400).json({ message: 'Incomplete emergency signal data' });
        }

        const alertData = {
            eventId,
            eventName,
            volunteerName,
            location,
            timestamp: timestamp || new Date().toISOString()
        };

        // Server-Side Broadcast (Targeted delivery)
        if (req.io) {
            console.log('REST SOS RECEIVED - TARGETING MANAGEMENT:', alertData);
            
            const event = await Event.findById(eventId).select('event_manager_id');
            const managerId = event?.event_manager_id;

            // 1. Target specific event room
            if (eventId) {
                req.io.to(`event_${eventId}`).emit('emergency_alert', alertData);
            }

            // 2. Target the specific manager of this event
            if (managerId) {
                req.io.to(`user_${managerId}`).emit('volunteer_emergency', alertData);
            }

            // 3. Target admins for oversight
            req.io.to('admin_room').emit('volunteer_emergency', alertData);

            // 4. Global broadcast removed for optimization, only rooms notified
        }

        res.status(200).json({ message: 'Emergency signal processed and broadcasted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to dispatch SOS', error: error.message });
    }
};

module.exports = {
    checkInAttendee,
    getVolunteerStats,
    getCheckInHistory,
    getVolunteerTasks,
    updateTaskStatus,
    getVolunteerEvents,
    assignTask,
    getEventVolunteers,
    getEventTasks,
    deleteTask,
    getAllVolunteerTasks,
    updatePushSubscription,
    triggerSOS
};
