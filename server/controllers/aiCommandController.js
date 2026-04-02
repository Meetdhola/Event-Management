const Event = require('../models/Event');
const Resource = require('../models/Resource');

const analyzeSentiment = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ message: 'Text is required' });

        // Heuristic-based sentiment analysis for demo purposes
        // In production, this would call an LLM or specialized NLP service
        const positiveWords = ['great', 'awesome', 'excellent', 'good', 'happy', 'love', 'perfect', 'amazing', 'smooth', 'helpful', 'efficient'];
        const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'sad', 'hate', 'delay', 'expensive', 'rude', 'unhelpful', 'slow', 'broken'];

        const words = text.toLowerCase().split(/\W+/);
        let score = 0;

        words.forEach(word => {
            if (positiveWords.includes(word)) score++;
            if (negativeWords.includes(word)) score--;
        });

        let sentiment = 'neutral';
        if (score > 0) sentiment = 'positive';
        if (score < 0) sentiment = 'negative';

        res.status(200).json({
            sentiment,
            score,
            confidence: 0.85,
            analysis: `Detected ${sentiment} sentiment based on keyword matching.`
        });
    } catch (error) {
        res.status(500).json({ message: 'Sentiment Analysis Error', error: error.message });
    }
};

// @desc    Process natural language command for event management
// @route   POST /api/ai/command
// @access  Private/Manager
const processCommand = async (req, res) => {
    try {
        const { command, eventId } = req.body;

        if (!command) {
            return res.status(400).json({ message: 'Command is required' });
        }

        const event = await Event.findById(eventId).populate('logistics_cart.resource');
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const cmd = command.toLowerCase();
        let response = {
            message: "I'm not sure how to help with that. Try asking for 'security status', 'budget overview', 'ready for event', or 'add more equipment'.",
            action: null,
            data: null
        };

        // Enhanced AI Logic for Command Recognition
        if (cmd.includes('security') || cmd.includes('guard') || cmd.includes('police')) {
            const capacity = event.expected_audience || 500;
            const security = event.logistics_cart.find(r => r.resource?.category === 'Security' || r.resource?.name?.toLowerCase().includes('security'));
            const current = security ? security.quantity : 0;
            const needed = Math.ceil(capacity / 100); // 1 guard per 100 people for better safety

            if (current < needed) {
                response = {
                    message: `Security check: You have ${current} guards for ${capacity} guests. Safety standards suggest at least ${needed}. Would you like me to add ${needed - current} more personnel?`,
                    action: 'SUGGEST_RESOURCE',
                    data: { category: 'Security', needed: needed - current }
                };
            } else {
                response = {
                    message: "Security status: Optimal. Your current coverage exceeds safety requirements for the expected audience.",
                    action: 'STATUS_CHECK',
                    data: { status: 'OPTIMAL' }
                };
            }
        } else if (cmd.includes('budget') || cmd.includes('cost') || cmd.includes('expense') || cmd.includes('price')) {
            const total = event.logistics_cart.reduce((sum, item) => sum + ((item.resource?.base_price || 0) * (item.quantity || 0)), 0);
            const budgetLimit = event.budget || total * 1.2; // Estimation if no budget set
            const variance = ((total / budgetLimit) * 100).toFixed(1);

            response = {
                message: `Financial Intel: Total logistics cost is $${total.toLocaleString()}. This is ${variance}% of your ${event.budget ? 'allocated' : 'estimated'} budget ($${budgetLimit.toLocaleString()}). ${total > budgetLimit ? 'WARNING: Budget overrun detected!' : 'Status: Within financial parameters.'}`,
                action: 'BUDGET_SUMMARY',
                data: { total, variance, status: total > budgetLimit ? 'OVERRUN' : 'ON_TRACK' }
            };
        } else if (cmd.includes('status') || cmd.includes('ready') || cmd.includes('progress') || cmd.includes('organized')) {
            const hasLogistics = event.logistics_cart.length > 0;
            const hasVolunteers = event.volunteers?.length > 0;
            const progress = (hasLogistics ? 40 : 0) + (hasVolunteers ? 30 : 0) + (event.status === 'Published' ? 30 : 10);

            response = {
                message: `Readiness Audit: Event is approximately ${progress}% ready. ${!hasLogistics ? 'Logistics are not yet configured.' : 'Logistics are being finalized.'} ${!hasVolunteers ? 'Volunteer recruitment is pending.' : 'Volunteers are assigned.'}`,
                action: 'READINESS_UPDATE',
                data: { score: progress }
            };
        } else if (cmd.includes('equipment') || cmd.includes('tech') || cmd.includes('av')) {
            response = {
                message: "A/V & Equipment: I can help you add projectors, sound systems, or staging. What specific equipment do you need?",
                action: 'BROWSE_RESOURCES',
                data: { category: 'Electronics' }
            };
        }

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: 'AI Command Center Error', error: error.message });
    }
};

// @desc    Execute AI recommended action
// @route   POST /api/ai/execute
// @access  Private/Manager
const executeAction = async (req, res) => {
    try {
        const { action, data, eventId } = req.body;
        const event = await Event.findById(eventId);

        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (action === 'SUGGEST_RESOURCE') {
            const resource = await Resource.findOne({ category: data.category });
            if (!resource) return res.status(404).json({ message: 'Compatible resource not found' });

            // Check if resource already in cart
            const cartIndex = event.logistics_cart.findIndex(item => item.resource.toString() === resource._id.toString());

            if (cartIndex > -1) {
                event.logistics_cart[cartIndex].quantity += data.needed;
                event.logistics_cart[cartIndex].resource_price_at_booking = resource.base_price;
            } else {
                event.logistics_cart.push({
                    resource: resource._id,
                    quantity: data.needed,
                    resource_price_at_booking: resource.base_price
                });
            }

            await event.save();
            return res.status(200).json({ message: `Successfully added ${data.needed} ${resource.name} to logistics plan.`, event });
        }

        res.status(400).json({ message: 'Action type not supported yet' });
    } catch (error) {
        res.status(500).json({ message: 'Execution Error', error: error.message });
    }
};

module.exports = {
    processCommand,
    executeAction,
    analyzeSentiment
};
