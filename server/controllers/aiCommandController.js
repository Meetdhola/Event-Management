const Event = require('../models/Event');
const Resource = require('../models/Resource');
const Ticket = require('../models/Ticket');
const PDFDocument = require('pdfkit');

const STOP_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'for', 'to', 'of', 'on', 'in', 'with', 'at',
    'is', 'are', 'be', 'this', 'that', 'it', 'we', 'i', 'you', 'my', 'our', 'can',
    'please', 'show', 'give', 'need', 'want', 'about', 'from', 'by', 'as'
]);

const CATEGORY_KEYWORDS = {
    Security: ['security', 'guard', 'bouncer', 'safety', 'police', 'emergency'],
    Food: ['food', 'catering', 'meal', 'snack', 'beverage', 'drink'],
    'Audio/Visual': ['audio', 'visual', 'sound', 'speaker', 'projector', 'mic', 'microphone', 'av'],
    Logistics: ['logistics', 'desk', 'queue', 'registration', 'entry', 'flow', 'gate'],
    Decor: ['decor', 'lighting', 'theme', 'ambience', 'design', 'setup'],
    Technical: ['technical', 'stage', 'rig', 'power', 'generator', 'truss']
};

const tokenize = (text = '') => {
    return (text.toLowerCase().match(/[a-z0-9]+/g) || []).filter((t) => t.length > 1 && !STOP_WORDS.has(t));
};

const detectIntent = (command = '') => {
    const cmd = command.toLowerCase();

    if (cmd.includes('budget') || cmd.includes('cost') || cmd.includes('expense') || cmd.includes('price')) {
        return { type: 'budget' };
    }

    if (cmd.includes('status') || cmd.includes('ready') || cmd.includes('progress') || cmd.includes('organize')) {
        return { type: 'readiness' };
    }

    for (const [category, words] of Object.entries(CATEGORY_KEYWORDS)) {
        if (words.some((w) => cmd.includes(w))) {
            return { type: 'resource', category };
        }
    }

    return { type: 'resource', category: null };
};

const getCurrentQty = (event, resourceId) => {
    const targetId = resourceId?.toString();
    const item = event.logistics_cart.find((r) => {
        if (!r.resource) return false;

        // Handle both populated document and raw ObjectId shapes safely.
        const currentId = (r.resource._id ? r.resource._id : r.resource).toString();
        return currentId === targetId;
    });
    return item ? item.quantity || 0 : 0;
};

const estimateTargetQty = (resource, event) => {
    const audience = event.expected_audience || 500;

    if (resource.capacity_per_unit && resource.capacity_per_unit > 0) {
        return Math.max(1, Math.ceil(audience / resource.capacity_per_unit));
    }

    switch (resource.category) {
        case 'Security':
            return Math.max(1, Math.ceil(audience / 120));
        case 'Food':
            return Math.max(1, Math.ceil(audience / 100));
        case 'Logistics':
            return Math.max(1, Math.ceil(audience / 250));
        case 'Decor':
            return Math.max(1, Math.ceil(audience / 300));
        case 'Audio/Visual':
        case 'Technical':
            return 1;
        default:
            return 1;
    }
};

const scoreResource = (resource, queryTokens, intentCategory) => {
    const nameTokens = tokenize(resource.name);
    const categoryTokens = tokenize(resource.category);
    const descTokens = tokenize(resource.description || '');
    const pool = new Set([...nameTokens, ...categoryTokens, ...descTokens]);

    let score = 0;
    for (const token of queryTokens) {
        if (nameTokens.includes(token)) score += 4;
        if (categoryTokens.includes(token)) score += 3;
        if (descTokens.includes(token)) score += 2;
        if (pool.has(token)) score += 1;
    }

    if (intentCategory && resource.category === intentCategory) {
        score += 8;
    }

    return score;
};

const buildReadinessSummary = (event) => {
    const keyCategories = ['Security', 'Logistics', 'Audio/Visual', 'Technical', 'Food'];
    const inPlan = new Set(event.logistics_cart.map((item) => item.resource?.category).filter(Boolean));
    const covered = keyCategories.filter((c) => inPlan.has(c));
    const missing = keyCategories.filter((c) => !inPlan.has(c));

    const logisticsFactor = Math.min(50, covered.length * 10);
    const staffingFactor = Math.min(20, (event.volunteers?.length || 0) > 0 ? 20 : 0);
    const statusFactor = event.status === 'upcoming' || event.status === 'live' ? 30 : 15;
    const score = Math.min(100, logisticsFactor + staffingFactor + statusFactor);

    return { score, covered, missing };
};

const toNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
};

const formatPercent = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return 'Insufficient data for analysis';
    return `${(value * 100).toFixed(1)}%`;
};

const scoreToTen = (value) => {
    const clamped = Math.max(0, Math.min(100, value));
    return (clamped / 10).toFixed(1);
};

const line = (label, value) => `- ${label}: ${value}`;

const createPdfFromReport = (reportText) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const chunks = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const lines = reportText.split('\n');
        lines.forEach((l) => {
            if (l.startsWith('## ')) {
                doc.moveDown(0.5).fontSize(13).font('Helvetica-Bold').text(l.replace('## ', ''));
            } else if (l.startsWith('- ')) {
                doc.fontSize(10).font('Helvetica').text(`* ${l.substring(2)}`);
            } else {
                doc.fontSize(10).font('Helvetica').text(l || ' ');
            }
        });

        doc.end();
    });
};

const buildEventAnalyticsReport = async (eventId, chartPaths = []) => {
    const event = await Event.findById(eventId)
        .populate('logistics_cart.resource')
        .populate('vendors', 'name role')
        .populate('volunteers', 'name role')
        .lean();

    if (!event) {
        return { error: 'Event not found' };
    }

    const tickets = await Ticket.find({ event_id: event._id }).lean();
    const checkInCount = tickets.reduce(
        (acc, t) => acc + ((t.attendees || []).filter((a) => a.is_checked_in).length),
        0
    );

    const expectedAudience = toNumber(event.expected_audience);
    const actualAudience = toNumber(event.actual_audience) || (checkInCount > 0 ? checkInCount : null);
    const budget = toNumber(event.budget?.planned) || null;
    const volunteerCount = Array.isArray(event.volunteers) ? event.volunteers.length : null;
    const vendorCount = Array.isArray(event.vendors) ? event.vendors.length : null;
    const estimatedSpend = (event.logistics_cart || []).reduce(
        (sum, item) => sum + ((item.resource?.base_price || 0) * (item.quantity || 0)),
        0
    );

    const requiredFields = {
        expected_audience: expectedAudience,
        actual_audience_or_checkin: actualAudience,
        budget,
        volunteers_count: volunteerCount,
        vendors_count: vendorCount
    };

    const missingFields = Object.entries(requiredFields)
        .filter(([, v]) => v === null || v === undefined)
        .map(([k]) => k);

    if (missingFields.length / 5 > 0.4) {
        return {
            insufficient: true,
            message: 'Insufficient data for meaningful analytics. Please ensure event tracking is completed.',
            missingFields
        };
    }

    const attendanceRate = expectedAudience && actualAudience ? actualAudience / expectedAudience : null;
    const budgetUtilization = budget && estimatedSpend ? estimatedSpend / budget : null;
    const attendanceGap = expectedAudience && actualAudience ? ((expectedAudience - actualAudience) / expectedAudience) : null;

    const attendanceBand = attendanceRate === null
        ? 'Insufficient data for analysis'
        : attendanceRate > 0.8 ? 'Strong' : attendanceRate >= 0.6 ? 'Moderate' : 'Weak';

    const budgetBand = budgetUtilization === null
        ? 'Insufficient data for analysis'
        : (budgetUtilization >= 0.9 && budgetUtilization <= 1.1) ? 'Optimal'
            : budgetUtilization < 0.9 ? 'Under-utilized'
                : 'Overspending';

    const logisticsCount = (event.logistics_cart || []).length;
    const operationsSignals = [];
    if ((volunteerCount || 0) === 0) operationsSignals.push('No volunteers assigned -> operational risk (High)');
    if ((vendorCount || 0) === 0) operationsSignals.push('No vendors linked -> execution gap');
    if (logisticsCount === 0) operationsSignals.push('Empty logistics_cart -> planning failure');

    const budgetDeviation = budgetUtilization === null ? 0 : Math.abs(1 - budgetUtilization);
    const costEfficiencyScore100 = budgetUtilization === null ? 0 : Math.max(0, 100 - (budgetDeviation * 200));
    const operationalReadiness100 = Math.max(
        0,
        100
        - ((volunteerCount || 0) === 0 ? 35 : 0)
        - ((vendorCount || 0) === 0 ? 25 : 0)
        - (logisticsCount === 0 ? 40 : 0)
    );

    const attendanceScore100 = attendanceRate === null ? 0 : Math.min(100, Math.max(0, attendanceRate * 100));
    const overall100 = (attendanceScore100 * 0.35) + (costEfficiencyScore100 * 0.35) + (operationalReadiness100 * 0.30);

    const eventJson = {
        id: event._id,
        event_name: event.event_name,
        event_type: event.event_type,
        venue: event.venue,
        start_date: event.start_date,
        end_date: event.end_date,
        status: event.status
    };

    const metricsJson = {
        expected_audience: expectedAudience,
        actual_audience: actualAudience,
        check_in_count: checkInCount,
        attendance_rate: attendanceRate,
        budget,
        estimated_spend: estimatedSpend,
        budget_utilization: budgetUtilization,
        volunteers_count: volunteerCount,
        vendors_count: vendorCount,
        logistics_items_count: logisticsCount
    };

    const visualInsightsLines = (chartPaths || []).length > 0
        ? chartPaths.map((p) => `- ${p}: Represents tracked trend for this event. Key insight depends on plotted metric; ensure chart metadata labels are provided for precise impact mapping.`)
        : ['- Insufficient data for analysis'];

    const recommendations = [
        expectedAudience && actualAudience ? `Increase confirmed attendance by ${(Math.max(0, expectedAudience - actualAudience)).toLocaleString()} to close the ${(attendanceGap * 100).toFixed(1)}% gap.` : 'Improve attendance tracking completeness to compute attendance-rate targets.',
        budget ? `Set spend guardrails to keep utilization between 90%-110% of â‚¹${budget.toLocaleString()}.` : 'Capture planned budget in event setup to enable spend control analytics.',
        volunteerCount === 0 ? 'Assign at least 1 volunteer lead and 1 operations backup before event day.' : `Increase volunteer depth from ${volunteerCount} to reduce single-point operational dependency.`,
        vendorCount === 0 ? 'Onboard minimum 1 confirmed vendor per critical category (Food, AV, Technical).' : `Validate vendor SLAs for all ${vendorCount} onboarded vendors with fallback contacts.`,
        logisticsCount === 0 ? 'Finalize logistics cart with category coverage before publishing run-of-show.' : `Audit logistics cart (${logisticsCount} items) against expected audience capacity assumptions.`,
        'Track task completion rate per hour during live event to improve engagement fallback analytics.',
        'Add chart labels/definitions to automate chart-to-business-impact interpretation in reports.'
    ];

    const report = [
        '## 1. Executive Summary',
        `Event performance is ${scoreToTen(overall100)}/10 based on attendance (${formatPercent(attendanceRate)}), budget discipline (${formatPercent(budgetUtilization)}), and operational readiness (${scoreToTen(operationalReadiness100)}/10). Attendance classification is ${attendanceBand}; budget classification is ${budgetBand}.`,
        '',
        '## 2. Key Performance Indicators',
        line('Attendance Rate', formatPercent(attendanceRate)),
        line('Budget Utilization', formatPercent(budgetUtilization)),
        line('Cost Efficiency Score', `${scoreToTen(costEfficiencyScore100)}/10`),
        line('Operational Readiness Score', `${scoreToTen(operationalReadiness100)}/10`),
        line('Overall Performance Score', `${scoreToTen(overall100)}/10`),
        '',
        '## 3. Attendance & Engagement Analysis',
        line('Expected Audience', expectedAudience ?? 'Insufficient data for analysis'),
        line('Actual Audience (fallback includes check-ins)', actualAudience ?? 'Insufficient data for analysis'),
        line('Gap', attendanceGap !== null ? `${(attendanceGap * 100).toFixed(1)}% below expectation` : 'Insufficient data for analysis'),
        `Behavioral interpretation: ${attendanceRate === null ? 'Insufficient data for analysis' : attendanceRate >= 0.8 ? 'Strong conversion from planning to attendance.' : attendanceRate >= 0.6 ? 'Moderate conversion; funnel leakage likely in pre-event engagement.' : 'Weak conversion; attendance acquisition and reminder cadence underperforming.'}`,
        'Trends/anomalies: Insufficient data for time-series trend decomposition.',
        '',
        '## 4. Financial Analysis',
        line('Budget', budget !== null ? `â‚¹${budget.toLocaleString()}` : 'Insufficient data for analysis'),
        line('Estimated Spend', `â‚¹${estimatedSpend.toLocaleString()}`),
        line('Utilization Classification', budgetBand),
        `Efficiency interpretation: ${budgetBand === 'Optimal' ? 'Spending is within efficient operating range.' : budgetBand === 'Under-utilized' ? 'Potential underinvestment against planned demand.' : budgetBand === 'Overspending' ? 'Cost control risk; spending exceeds healthy envelope.' : 'Insufficient data for analysis'}`,
        'ROI: Insufficient data for analysis',
        '',
        '## 5. Operations Analysis',
        line('Vendor Utilization', vendorCount !== null ? `${vendorCount} vendor(s) linked` : 'Insufficient data for analysis'),
        line('Volunteer Coverage', volunteerCount !== null ? `${volunteerCount} volunteer(s)` : 'Insufficient data for analysis'),
        line('Logistics Items', logisticsCount),
        `Bottlenecks: ${operationsSignals.length ? operationsSignals.join(' | ') : 'No critical operational bottleneck detected from current structured fields.'}`,
        '',
        '## 6. Risk Assessment',
        '- Issue | Impact | Cause',
        ...(
            operationsSignals.length
                ? operationsSignals.map((s) => `- ${s.split(' -> ')[0]} | Elevated execution risk | ${s.split(' -> ')[1] || 'Operational data indicates gap'}`)
                : ['- None critical in tracked dimensions | Stable baseline | Core staffing/vendor/logistics fields present']
        ),
        '',
        '## 7. Data-Driven Insights',
        `- Observation: Attendance rate is ${formatPercent(attendanceRate)}. Reason: actual (${actualAudience ?? 'N/A'}) vs expected (${expectedAudience ?? 'N/A'}). Impact: ${attendanceBand} demand realization impacts revenue/utilization outcomes.`,
        `- Observation: Budget utilization is ${formatPercent(budgetUtilization)}. Reason: estimated spend â‚¹${estimatedSpend.toLocaleString()} against budget ${budget !== null ? `â‚¹${budget.toLocaleString()}` : 'N/A'}. Impact: ${budgetBand} financial performance profile.`,
        `- Observation: Logistics cart has ${logisticsCount} item(s). Reason: current configured plan depth. Impact: ${logisticsCount === 0 ? 'High planning risk before execution.' : 'Execution plan has baseline resource structure.'}`,
        '',
        '## 8. Recommendations',
        ...recommendations.slice(0, 8).map((r) => `- ${r}`),
        '',
        '## 9. Visual Insights (IMPORTANT)',
        ...visualInsightsLines,
        '',
        '## 10. Final Verdict',
        `Performance rating: ${scoreToTen(overall100)}/10`,
        `Conclusion: ${scoreToTen(overall100) >= 8 ? 'Execution is strong with controllable optimization opportunities.' : scoreToTen(overall100) >= 6 ? 'Performance is moderate; focused operational and attendance levers are required.' : 'Performance is weak; immediate planning and tracking interventions are required.'}`,
        '',
        '## 11. Confidence Level',
        `Confidence: ${missingFields.length === 0 ? 'High' : missingFields.length <= 2 ? 'Medium' : 'Low'}`,
        `Justification: ${5 - missingFields.length}/5 required validation fields available. Missing fields: ${missingFields.length ? missingFields.join(', ') : 'None'}.`,
        '',
        'Data Quality Notes:',
        ...missingFields.map((f) => `- Missing field: ${f}. Update event tracking inputs to improve report precision.`)
    ].join('\n');

    return {
        insufficient: false,
        report,
        event_json: eventJson,
        metrics_json: metricsJson,
        chart_paths: chartPaths,
        missingFields
    };
};

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
        const intent = detectIntent(cmd);
        const queryTokens = tokenize(command);

        const availableResources = await Resource.find({ is_available: true }).lean();
        let response = {
            message: "I can help with logistics planning, budget, readiness, and resource recommendations based on your current plan.",
            action: null,
            data: null
        };

        if (intent.type === 'budget') {
            const total = event.logistics_cart.reduce((sum, item) => sum + ((item.resource?.base_price || 0) * (item.quantity || 0)), 0);
            const plannedBudget = event.budget?.planned || 0;
            const baseline = plannedBudget > 0 ? plannedBudget : Math.max(total, 1);
            const variance = ((total / baseline) * 100).toFixed(1);

            response = {
                message: `Budget view: logistics total is â‚¹${total.toLocaleString()}. This is ${variance}% of your ${plannedBudget > 0 ? 'planned budget' : 'current baseline'}. ${plannedBudget > 0 && total > plannedBudget ? 'You are over budget.' : 'You are on track.'}`,
                action: 'BUDGET_SUMMARY',
                data: { total, variance, status: plannedBudget > 0 && total > plannedBudget ? 'OVERRUN' : 'ON_TRACK' }
            };
        } else if (intent.type === 'readiness') {
            const readiness = buildReadinessSummary(event);

            response = {
                message: `Readiness is ${readiness.score}%. Covered: ${readiness.covered.join(', ') || 'None'}. Missing: ${readiness.missing.join(', ') || 'None'}.`,
                action: 'READINESS_UPDATE',
                data: { score: readiness.score, missing: readiness.missing }
            };
        } else if (cmd.includes('report') || cmd.includes('analytics') || cmd.includes('analysis') || cmd.includes('pdf')) {
            const analytics = await buildEventAnalyticsReport(eventId, []);
            if (analytics.error) {
                return res.status(404).json({ message: analytics.error });
            }
            if (analytics.insufficient) {
                response = {
                    message: analytics.message,
                    action: null,
                    data: { missingFields: analytics.missingFields || [] }
                };
            } else {
                response = {
                    message: 'Event analytics report generated. Click below to download the PDF report.',
                    action: 'GENERATE_REPORT',
                    data: {
                        eventId,
                        missingFields: analytics.missingFields || []
                    }
                };
            }
        } else {
            const ranked = availableResources
                .map((resource) => ({
                    resource,
                    score: scoreResource(resource, queryTokens, intent.category)
                }))
                .sort((a, b) => b.score - a.score);

            let top = ranked.find((r) => r.score > 0);
            if (!top && intent.category) {
                top = ranked.find((r) => r.resource.category === intent.category) || null;
            }

            if (!top && ranked.length > 0) {
                top = ranked[0];
            }

            if (top) {
                const selected = top.resource;
                const currentQty = getCurrentQty(event, selected._id);
                const targetQty = estimateTargetQty(selected, event);
                const toAdd = Math.max(0, targetQty - currentQty);

                if (toAdd > 0) {
                    response = {
                        message: `Based on your query and current logistics plan, best fit is ${selected.name} (${selected.category}). You currently have ${currentQty}; recommended is ${targetQty}. I can add ${toAdd} unit(s).`,
                        action: 'SUGGEST_RESOURCE',
                        data: {
                            resourceId: selected._id,
                            category: selected.category,
                            needed: toAdd,
                            target: targetQty,
                            reason: `Matched from logistics catalog for "${command}"`
                        }
                    };
                } else {
                    response = {
                        message: `${selected.name} already meets the estimated requirement for your current audience and plan.`,
                        action: 'STATUS_CHECK',
                        data: { status: 'OPTIMAL', resourceId: selected._id, target: targetQty, current: currentQty }
                    };
                }
            }
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
            const resource = data.resourceId
                ? await Resource.findById(data.resourceId)
                : await Resource.findOne({ category: data.category });

            if (!resource) return res.status(404).json({ message: 'Compatible resource not found' });

            const qtyToAdd = Math.max(1, Number(data.needed) || 1);

            // Check if resource already in cart
            const cartIndex = event.logistics_cart.findIndex(item => item.resource.toString() === resource._id.toString());

            if (cartIndex > -1) {
                event.logistics_cart[cartIndex].quantity += qtyToAdd;
                event.logistics_cart[cartIndex].resource_price_at_booking = resource.base_price;
            } else {
                event.logistics_cart.push({
                    resource: resource._id,
                    quantity: qtyToAdd,
                    resource_price_at_booking: resource.base_price
                });
            }

            await event.save();
            return res.status(200).json({ message: `Successfully added ${qtyToAdd} ${resource.name} to logistics plan.`, event });
        }

        res.status(400).json({ message: 'Action type not supported yet' });
    } catch (error) {
        res.status(500).json({ message: 'Execution Error', error: error.message });
    }
};

// @desc    Generate analytics report JSON
// @route   POST /api/ai/report
// @access  Private/Manager
const generateAnalyticsReport = async (req, res) => {
    try {
        const { eventId, chartPaths = [] } = req.body;
        if (!eventId) {
            return res.status(400).json({ message: 'eventId is required' });
        }

        const analytics = await buildEventAnalyticsReport(eventId, chartPaths);
        if (analytics.error) {
            return res.status(404).json({ message: analytics.error });
        }
        if (analytics.insufficient) {
            return res.status(200).json({
                report: analytics.message,
                insufficient: true,
                missingFields: analytics.missingFields || []
            });
        }

        return res.status(200).json({
            report: analytics.report,
            insufficient: false,
            event_json: analytics.event_json,
            metrics_json: analytics.metrics_json,
            chart_paths: analytics.chart_paths,
            missingFields: analytics.missingFields
        });
    } catch (error) {
        return res.status(500).json({ message: 'Report generation error', error: error.message });
    }
};

// @desc    Generate analytics report PDF
// @route   POST /api/ai/report/pdf
// @access  Private/Manager
const downloadAnalyticsReportPdf = async (req, res) => {
    try {
        const { eventId, chartPaths = [] } = req.body;
        if (!eventId) {
            return res.status(400).json({ message: 'eventId is required' });
        }

        const analytics = await buildEventAnalyticsReport(eventId, chartPaths);
        const reportText = analytics.insufficient ? analytics.message : analytics.report;
        const pdfBuffer = await createPdfFromReport(reportText);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="event-analytics-${eventId}.pdf"`);
        return res.status(200).send(pdfBuffer);
    } catch (error) {
        return res.status(500).json({ message: 'PDF generation error', error: error.message });
    }
};

module.exports = {
    processCommand,
    executeAction,
    analyzeSentiment,
    generateAnalyticsReport,
    downloadAnalyticsReportPdf
};
