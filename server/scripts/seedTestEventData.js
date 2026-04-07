require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const User = require('../models/User');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const Feedback = require('../models/Feedback');

const EVENT_NAME = 'TEST_EVENT';
const EXPECTED_AUDIENCE = 150;
const BUDGET_INR = 15000;
const ATTENDEE_COUNT = 100;

const ensureEventManager = async () => {
    const email = 'test.manager@event.com';
    let manager = await User.findOne({ email });

    if (!manager) {
        manager = await User.create({
            name: 'Test Event Manager',
            email,
            password_hash: 'Password@123',
            role: 'EventManager',
            is_approved: true,
            status: 'active'
        });
    }

    return manager;
};

const ensureEvent = async (managerId) => {
    const now = new Date();
    const startDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000);

    let event = await Event.findOne({
        event_name: EVENT_NAME,
        event_manager_id: managerId
    });

    if (!event) {
        event = await Event.create({
            event_name: EVENT_NAME,
            event_type: 'Conference',
            description: 'Seeded test event for load/feedback validation',
            event_manager_id: managerId,
            venue: 'Test Arena',
            start_date: startDate,
            end_date: endDate,
            expected_audience: EXPECTED_AUDIENCE,
            actual_audience: ATTENDEE_COUNT,
            status: 'upcoming',
            budget: {
                planned: BUDGET_INR,
                actual: 0
            }
        });
    } else {
        event.expected_audience = EXPECTED_AUDIENCE;
        event.actual_audience = ATTENDEE_COUNT;
        event.budget = {
            ...(event.budget || {}),
            planned: BUDGET_INR,
            actual: (event.budget && event.budget.actual) || 0
        };
        await event.save();
    }

    return event;
};

const ensureAttendees = async () => {
    const attendees = [];

    for (let i = 1; i <= ATTENDEE_COUNT; i += 1) {
        const num = String(i).padStart(3, '0');
        const email = `test.attendee${num}@event.com`;

        let attendee = await User.findOne({ email });
        if (!attendee) {
            attendee = await User.create({
                name: `Test Attendee ${num}`,
                email,
                password_hash: 'Password@123',
                role: 'Attendee',
                is_approved: true,
                status: 'active',
                phone: `900000${String(i).padStart(4, '0')}`
            });
        }

        attendees.push(attendee);
    }

    return attendees;
};

const ensureTicketAndFeedback = async (event, attendee, index) => {
    let ticket = await Ticket.findOne({ event_id: event._id, user_id: attendee._id });
    if (!ticket) {
        ticket = await Ticket.create({
            event_id: event._id,
            user_id: attendee._id,
            qr_code: crypto.randomBytes(16).toString('hex'),
            attendees: [
                {
                    name: attendee.name,
                    email: attendee.email,
                    phone: attendee.phone || '9000000000',
                    is_checked_in: false,
                    checked_in_at: null,
                    checked_in_by: null,
                    gate: null
                }
            ]
        });
    }

    const rating = (index % 5) + 1;
    const sentimentScore = (rating - 3) / 2;
    const emotion = rating >= 4 ? 'positive' : rating <= 2 ? 'negative' : 'neutral';

    const existing = await Feedback.findOne({ event_id: event._id, user_id: attendee._id });
    if (existing) {
        existing.rating = rating;
        existing.comment = `Seed feedback from ${attendee.name}`;
        existing.sentiment_score_ai = sentimentScore;
        existing.emotion_ai = emotion;
        await existing.save();
    } else {
        await Feedback.create({
            event_id: event._id,
            user_id: attendee._id,
            rating,
            comment: `Seed feedback from ${attendee.name}`,
            sentiment_score_ai: sentimentScore,
            emotion_ai: emotion
        });
    }
};

const run = async () => {
    try {
        await connectDB();

        const manager = await ensureEventManager();
        const event = await ensureEvent(manager._id);
        const attendees = await ensureAttendees();

        for (let i = 0; i < attendees.length; i += 1) {
            await ensureTicketAndFeedback(event, attendees[i], i);
        }

        const ticketCount = await Ticket.countDocuments({ event_id: event._id });
        const feedbackCount = await Feedback.countDocuments({ event_id: event._id });

        console.log('Seed completed successfully');
        console.log(`Event Name: ${event.event_name}`);
        console.log(`Event ID: ${event._id}`);
        console.log(`Expected Audience: ${event.expected_audience}`);
        console.log(`Budget (INR): ${event.budget?.planned || 0}`);
        console.log(`Tickets on Event: ${ticketCount}`);
        console.log(`Feedback on Event: ${feedbackCount}`);
        console.log(`Manager Login: test.manager@event.com / Password@123`);
        console.log(`Sample Attendee Login: test.attendee001@event.com / Password@123`);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
};

run();
