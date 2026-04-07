const Feedback = require('../models/Feedback');
const Event = require('../models/Event');
const User = require('../models/User');
const { analyzeFeedbackSentiment } = require('../services/sentimentService');

const sendFeedbackNotifications = async (req, event, feedbackDoc) => {
    try {
        if (!req.io) return;

        const admins = await User.find({ role: 'Admin' }).select('_id name');

        const payload = {
            type: 'feedback_sentiment_alert',
            eventId: event._id,
            eventName: event.event_name,
            feedbackId: feedbackDoc._id,
            sentimentLabel: feedbackDoc.emotion_ai,
            sentimentScore: feedbackDoc.sentiment_score_ai,
            rating: feedbackDoc.rating,
            comment: feedbackDoc.comment,
            submittedBy: req.user.name,
            submittedById: req.user.id,
            submittedAt: feedbackDoc.created_at
        };

        req.io.to('manager_room').emit('feedback_notification', payload);
        req.io.to('admin_room').emit('feedback_notification', payload);
        req.io.to(`manager_${event.event_manager_id}`).emit('feedback_notification', payload);
        req.io.to(`event_${event._id}`).emit('feedback_notification', payload);

        for (const admin of admins) {
            req.io.to(`admin_${admin._id}`).emit('feedback_notification', payload);
        }
    } catch (error) {
        console.error('Feedback notification emit failed:', error.message);
    }
};

// @desc    Submit or update attendee feedback and run NLP sentiment analysis
// @route   POST /api/feedback
// @access  Private/Attendee
const submitFeedback = async (req, res) => {
    try {
        const { event_id, rating, comment } = req.body;

        if (!event_id || rating === undefined || rating === null) {
            return res.status(400).json({ message: 'event_id and rating are required' });
        }

        const numericRating = Number(rating);
        if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ message: 'rating must be between 1 and 5' });
        }

        const event = await Event.findById(event_id).select('event_name event_manager_id');
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const safeComment = typeof comment === 'string' ? comment.trim() : '';
        const textForAnalysis = safeComment || `Rating given: ${numericRating}/5`;
        const sentiment = await analyzeFeedbackSentiment(textForAnalysis);

        const existingFeedback = await Feedback.findOne({
            event_id,
            user_id: req.user.id
        });

        let feedback;
        if (existingFeedback) {
            existingFeedback.rating = numericRating;
            existingFeedback.comment = safeComment || null;
            existingFeedback.sentiment_score_ai = sentiment.ensemble_score;
            existingFeedback.emotion_ai = sentiment.label;
            feedback = await existingFeedback.save();
        } else {
            feedback = await Feedback.create({
                event_id,
                user_id: req.user.id,
                rating: numericRating,
                comment: safeComment || null,
                sentiment_score_ai: sentiment.ensemble_score,
                emotion_ai: sentiment.label
            });
        }

        await sendFeedbackNotifications(req, event, feedback);

        return res.status(existingFeedback ? 200 : 201).json({
            message: existingFeedback
                ? 'Feedback updated and analyzed successfully'
                : 'Feedback submitted and analyzed successfully',
            feedback,
            sentiment,
            isUpdate: Boolean(existingFeedback)
        });
    } catch (error) {
        return res.status(500).json({ message: 'Feedback processing error', error: error.message });
    }
};

// @desc    Get feedback list for an event
// @route   GET /api/feedback/event/:eventId
// @access  Private/Admin/EventManager
const getFeedbackByEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findById(eventId).select('event_manager_id');
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const isAdmin = req.user.role === 'Admin';
        const managerId = String(event.event_manager_id);
        const currentUserId = String(req.user._id || req.user.id);
        const isManagerForEvent = req.user.role === 'EventManager' && managerId === currentUserId;

        if (!isAdmin && !isManagerForEvent) {
            return res.status(403).json({ message: 'Not authorized to view feedback for this event' });
        }

        const feedback = await Feedback.find({ event_id: eventId })
            .populate('user_id', 'name email role')
            .sort({ created_at: -1 });

        return res.status(200).json(feedback);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching feedback', error: error.message });
    }
};

// @desc    Get feedback across all events managed by current manager
// @route   GET /api/feedback/manager
// @access  Private/EventManager/Admin
const getFeedbackForManager = async (req, res) => {
    try {
        const isAdmin = req.user.role === 'Admin';
        const currentUserId = String(req.user._id || req.user.id);

        let eventFilter = {};
        if (!isAdmin) {
            eventFilter.event_manager_id = currentUserId;
        }

        const events = await Event.find(eventFilter).select('_id event_name start_date end_date').lean();
        const eventIds = events.map((e) => e._id);

        if (eventIds.length === 0) {
            return res.status(200).json([]);
        }

        const eventMap = new Map(events.map((e) => [String(e._id), e]));

        const feedback = await Feedback.find({ event_id: { $in: eventIds } })
            .populate('user_id', 'name email role')
            .sort({ created_at: -1 })
            .lean();

        const enriched = feedback.map((item) => ({
            ...item,
            event_meta: eventMap.get(String(item.event_id)) || null
        }));

        return res.status(200).json(enriched);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching manager feedback', error: error.message });
    }
};

// @desc    Get current attendee's feedback for an event
// @route   GET /api/feedback/my/:eventId
// @access  Private/Attendee
const getMyFeedbackByEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        const feedback = await Feedback.findOne({
            event_id: eventId,
            user_id: req.user.id
        }).sort({ created_at: -1 });

        return res.status(200).json(feedback || null);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching your feedback', error: error.message });
    }
};

module.exports = {
    submitFeedback,
    getFeedbackByEvent,
    getMyFeedbackByEvent,
    getFeedbackForManager
};
