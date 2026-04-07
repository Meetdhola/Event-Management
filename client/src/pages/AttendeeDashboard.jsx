import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    Calendar,
    MapPin,
    Users,
    Activity,
    Search,
    ChevronRight,
    Star,
    Ticket,
    Info,
    ArrowRight,
    QrCode,
    X,
    Filter,
    Compass,
    Sparkles,
    CheckCircle2,
    Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, Card, Button, Input } from '../components/ui/Components';
import { toast } from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { socket } from '../lib/socket';
import { AlertTriangle, Clock, MessageSquare, Send } from 'lucide-react';

const LiveCountdown = ({ targetDate, eventName }) => {
    const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const difference = target - now;

            if (difference > 0) {
                setTimeLeft({
                    d: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    h: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    m: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                    s: Math.floor((difference % (1000 * 60)) / 1000)
                });
            } else {
                clearInterval(interval);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="app-card relative overflow-hidden bg-zinc-950 p-8 md:p-10 border border-primary/20 shadow-[0_20px_50px_rgba(212,175,55,0.15)] group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.15),transparent_50%)] pointer-events-none" />
            <div className="absolute top-0 right-10 w-[1px] h-full bg-gradient-to-b from-transparent via-primary/20 to-transparent max-md:hidden" />
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
                <div className="text-center md:text-left flex-1">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-glow" />
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">Your Next Event</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-serif text-white uppercase italic tracking-widest">{eventName}</h2>
                </div>

                <div className="flex gap-4 sm:gap-6">
                    {Object.entries(timeLeft).map(([unit, value]) => (
                        <div key={unit} className="flex flex-col items-center">
                            <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 tracking-widest tabular-nums w-14 sm:w-20 text-center drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                                {value.toString().padStart(2, '0')}
                            </span>
                            <span className="text-[9px] uppercase tracking-[0.5em] text-primary/70 font-black mt-2">{unit === 'd' ? 'Days' : unit === 'h' ? 'Hours' : unit === 'm' ? 'Mins' : 'Secs'}</span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

const AttendeeDashboard = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [activeTab, setActiveTab] = useState('explore');
    const [bookingEvent, setBookingEvent] = useState(null);
    const [ticketQuantity, setTicketQuantity] = useState(1);
    const [attendees, setAttendees] = useState([]);
    const [isBooking, setIsBooking] = useState(false);
    const [crowdReports, setCrowdReports] = useState([]);
    const [showReportModal, setShowReportModal] = useState(false);
    const [isReporting, setIsReporting] = useState(false);
    const [reportForm, setReportForm] = useState({ location: '', status: 'Normal', message: '' });
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: '' });
    const [hasExistingFeedback, setHasExistingFeedback] = useState(false);
    const [aiQuestion, setAiQuestion] = useState('');
    const [aiAnswer, setAiAnswer] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [showAiWidget, setShowAiWidget] = useState(false);

    const upcomingTickets = tickets.filter(t => new Date(t.event_id?.start_date) > new Date()).sort((a,b) => new Date(a.event_id?.start_date) - new Date(b.event_id?.start_date));
    const nextTicket = upcomingTickets.length > 0 ? upcomingTickets[0] : null;

    useEffect(() => {
        fetchAttendeeData();
    }, []);

    useEffect(() => {
        if (nextTicket?.event_id?._id) {
            const eventId = nextTicket.event_id._id;
            fetchCrowdReports(eventId);
            fetchMyFeedback(eventId);
            
            socket.emit('join_room', `event_${eventId}`);
            
            const handleUpdate = (newReport) => {
                setCrowdReports(prev => [newReport, ...prev].slice(0, 20));
                toast(`New Crowd Alert: ${newReport.location} is ${newReport.status}`, {
                    icon: '!',
                    style: {
                        borderRadius: '1rem',
                        background: '#09090b',
                        color: '#d4af37',
                        border: '1px solid rgba(212, 175, 55, 0.2)',
                        fontSize: '11px',
                        fontWeight: '900',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                    }
                });
            };

            socket.on('crowd_update', handleUpdate);
            return () => socket.off('crowd_update', handleUpdate);
        }
    }, [nextTicket?.event_id?._id]);

    const fetchCrowdReports = async (eventId) => {
        try {
            const res = await axios.get(`/crowd/event/${eventId}`);
            setCrowdReports(res.data);
        } catch (error) {
            console.error('Error fetching crowd reports:', error);
        }
    };

    const submitReport = async () => {
        if (!reportForm.location) return toast.error('Specify location');
        setIsReporting(true);
        try {
            await axios.post('/crowd/report', {
                event_id: nextTicket.event_id._id,
                ...reportForm
            });
            setShowReportModal(false);
            setReportForm({ location: '', status: 'Normal', message: '' });
            toast.success('Status Transmitted to Elite Stream');
        } catch (error) {
            toast.error('Email Failed');
        } finally {
            setIsReporting(false);
        }
    };

    const submitFeedback = async () => {
        if (!nextTicket?.event_id?._id) {
            toast.error('No active event found for feedback');
            return;
        }

        setIsSubmittingFeedback(true);
        try {
            const res = await axios.post('/feedback', {
                event_id: nextTicket.event_id._id,
                rating: Number(feedbackForm.rating),
                comment: feedbackForm.comment.trim()
            });
            setHasExistingFeedback(true);
            toast.success(res?.data?.isUpdate ? 'Feedback updated successfully' : 'Feedback submitted successfully');
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to submit feedback');
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    const fetchMyFeedback = async (eventId) => {
        try {
            const res = await axios.get(`/feedback/my/${eventId}`);
            if (res.data) {
                setFeedbackForm({
                    rating: Number(res.data.rating) || 5,
                    comment: res.data.comment || ''
                });
                setHasExistingFeedback(true);
            } else {
                setFeedbackForm({ rating: 5, comment: '' });
                setHasExistingFeedback(false);
            }
        } catch (error) {
            console.error('Error fetching attendee feedback:', error);
            setHasExistingFeedback(false);
        }
    };

    const fetchAttendeeData = async () => {
        try {
            const eventsRes = await axios.get('/events');
            const ticketsRes = await axios.get('/tickets/my-tickets');
            setEvents(eventsRes.data.filter(e => e.status !== 'draft'));
            setTickets(ticketsRes.data);
        } catch (error) {
            console.error('Error fetching attendee data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBookTicket = (event) => {
        setBookingEvent(event);
        setTicketQuantity(1);
        setAttendees([{ name: user.name || '', email: user.email || '', phone: '' }]);
    };

    const confirmBooking = async () => {
        if (!bookingEvent) return;

        // Validate all attendees
        const isValid = attendees.every(a => a.name.trim() && a.email.trim() && a.phone.trim());
        if (!isValid) {
            toast.error('Please fill all attendee details');
            return;
        }

        setIsBooking(true);
        try {
            await axios.post('/tickets/book', {
                eventId: bookingEvent._id,
                attendees
            });
            toast.success('Tickets Secured! Check your vault.');
            setBookingEvent(null);
            fetchAttendeeData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Booking failed');
        } finally {
            setIsBooking(false);
        }
    };

    const handleQuantityChange = (q) => {
        const newQty = Math.max(1, Math.min(10, q));
        setTicketQuantity(newQty);

        const newAttendees = [...attendees];
        if (newQty > attendees.length) {
            for (let i = attendees.length; i < newQty; i++) {
                newAttendees.push({ name: '', email: '', phone: '' });
            }
        } else {
            newAttendees.splice(newQty);
        }
        setAttendees(newAttendees);
    };

    const updateAttendee = (index, field, value) => {
        const newAttendees = [...attendees];
        newAttendees[index][field] = value;
        setAttendees(newAttendees);
    };

    const filteredEvents = events.filter(e => {
        const isUpcoming = new Date(e.start_date) > new Date();
        const matchesSearch = e.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             e.venue.toLowerCase().includes(searchQuery.toLowerCase());
        return isUpcoming && matchesSearch;
    });

    const handleAskAnything = async (e) => {
        e.preventDefault();
        const question = aiQuestion.trim();
        if (!question) return;

        setAiLoading(true);
        try {
            const chatbotBaseUrl = import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:5000';
            const res = await axios.post(`${chatbotBaseUrl}/api/chat`, { question });
            setAiAnswer(res.data?.answer || "I don't have that information");
            setAiQuestion('');
        } catch (error) {
            setAiAnswer('Unable to reach AI assistant right now.');
        } finally {
            setAiLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-80px)] bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {/* Background Orbs */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />

                <div className="relative z-10 flex flex-col items-center gap-8">
                    <div className="relative">
                        <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin shadow-[0_0_40px_rgba(212,175,55,0.2)]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-10 w-10 rounded-full bg-primary/20 blur-xl animate-pulse" />
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-[11px] font-black text-white/70 uppercase tracking-[0.5em] animate-pulse">Initializing System</span>
                        <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="main-content px-3 pb-32 sm:pb-4">
            <div className="max-w-2xl mx-auto space-y-8">

                {/* Dashboard Header */}
                <div className="flex items-center justify-between px-1">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none uppercase">
                            aura <span className="text-gradient-gold-soft italic font-serif">LOUNGE.</span>
                        </h1>
                        <p className="text-[11px] text-white/70 mt-3 uppercase tracking-[0.4em] font-black">Authorized elite entry | Guest Active</p>
                    </div>
                </div>

                {/* Live Countdown for Next Assigned Ticket */}
                {nextTicket && nextTicket.event_id && (
                    <LiveCountdown targetDate={nextTicket.event_id.start_date} eventName={nextTicket.event_id.event_name} />
                )}

                {/* Interactive Navigation */}
                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
                    {[
                        { id: 'explore', label: 'Discover', icon: Compass },
                        { id: 'vault', label: 'My Vault', icon: Ticket },
                        { id: 'live', label: 'Live Status', icon: Activity }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl transition-all duration-300 ${activeTab === tab.id
                                ? 'bg-surface text-primary shadow-xl border border-white/5 font-black'
                                : 'text-white/90 hover:text-white/90 font-black'}`}
                        >
                            <tab.icon size={14} />
                            <span className="text-[11px] font-black uppercase tracking-widest leading-none">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'explore' ? (
                        <motion.div key="explore" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                            {/* Search IQ */}
                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/80 group-focus-within:text-primary transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Filter experience grid..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-xs font-black uppercase tracking-widest text-white placeholder:text-white/80 focus:outline-none focus:border-primary/20 transition-all font-mono"
                                />
                            </div>

                            <div className="space-y-4">
                                {filteredEvents.map((event, index) => (
                                    <motion.div
                                        key={event._id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                        className="relative app-card flex flex-col bg-zinc-950/80 border border-white/5 rounded-[2rem] overflow-hidden group hover:border-primary/20 transition-all shadow-2xl"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-tl from-primary/5 via-transparent to-zinc-900/50 opacity-0 group-hover:opacity-100 transition-opacity z-0" />
                                        
                                        <div className="p-8 relative z-10 flex flex-col items-center text-center">
                                            <div className="mb-6 flex gap-3 items-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                <span className="text-[10px] text-primary font-black uppercase tracking-[0.3em]">Aura Exclusive</span>
                                            </div>
                                            <h3 className="text-2xl sm:text-3xl font-serif text-white uppercase italic tracking-widest mb-8 text-glow-gold transition-all duration-500">{event.event_name || 'Premium Activation'}</h3>
                                            
                                            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-10 text-[11px] text-white/80 font-black uppercase tracking-widest bg-white/[0.02] px-8 py-4 rounded-xl border border-white/5">
                                                <span className="flex items-center gap-3"><Calendar size={14} className="text-primary/70" /> {new Date(event.start_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                                <span className="hidden sm:block text-white/20">|</span>
                                                <span className="flex items-center gap-3"><MapPin size={14} className="text-primary/70" /> {event.venue}</span>
                                            </div>
                                        </div>

                                        {/* Structured Divider */}
                                        <div className="relative flex items-center h-8 bg-zinc-950/80">
                                            <div className="absolute -left-4 w-8 h-8 rounded-full bg-background border-r border-white/5 group-hover:border-primary/20 shadow-inner z-20" />
                                            <div className="w-full border-t border-dashed border-white/20 mx-6 opacity-40 group-hover:border-primary/40 transition-colors" />
                                            <div className="absolute -right-4 w-8 h-8 rounded-full bg-background border-l border-white/5 group-hover:border-primary/20 shadow-inner z-20" />
                                        </div>

                                        <div className="p-6 bg-zinc-950/80 relative z-10">
                                            <Button
                                                onClick={() => handleBookTicket(event)}
                                                variant="luxury"
                                                className="w-full h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-glow group"
                                            >
                                                <span>Secure Entry Pass</span>
                                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ) : activeTab === 'vault' ? (
                        <motion.div key="vault" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6">
                            <h2 className="text-[11px] font-black text-white/90 px-1 uppercase tracking-[0.4em]">My Secure Encrypts</h2>
                            {tickets.length === 0 ? (
                                <div className="py-24 flex flex-col items-center justify-center app-card border-dashed opacity-10">
                                    <Ticket size={48} className="mb-4" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.5em]">Vault empty. Secure an entry protocol.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {tickets.map((ticket, index) => (
                                        <motion.div
                                            key={ticket._id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => setSelectedTicket(ticket)}
                                            className="app-card relative flex flex-col md:flex-row bg-zinc-950/80 border border-white/5 rounded-2xl overflow-hidden group hover:border-primary/30 transition-all cursor-pointer shadow-xl"
                                        >
                                            <div className="p-6 md:p-8 flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-6 md:border-r border-dashed border-white/10 group-hover:border-primary/30 transition-colors">
                                                <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-background transition-all shadow-glow flex-shrink-0">
                                                    <QrCode size={28} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xl font-serif uppercase tracking-widest text-white italic truncate">{ticket.event_id?.event_name || 'Authorized Entry'}</p>
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 opacity-70">
                                                        <span className="text-[11px] font-black text-primary uppercase tracking-widest">
                                                            {ticket.attendees?.[0]?.name}
                                                            {ticket.attendees?.length > 1 && ` + ${ticket.attendees.length - 1} OTHERS`}
                                                        </span>
                                                        <span className="hidden sm:block text-white/30">|</span>
                                                        <span className="text-[10px] text-white/70 font-bold tracking-widest">
                                                            ENTRY CONFIRMED
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Notches for Desktop View */}
                                            <div className="hidden md:block absolute top-[50%] right-[160px] -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-background border-l border-white/5 z-20" />
                                            
                                            <div className="p-6 md:p-8 md:w-40 flex items-center justify-between md:justify-center bg-zinc-900/50">
                                                <div className="flex flex-col items-start md:items-center text-left md:text-center">
                                                    <span className="text-[9px] text-white/50 font-black uppercase tracking-[0.3em] mb-2">Ticket ID</span>
                                                    <span className="text-[13px] font-mono font-black text-white tracking-widest">{ticket._id.slice(-6).toUpperCase()}</span>
                                                </div>
                                                <ChevronRight size={20} className="text-white/30 group-hover:text-primary transition-transform group-hover:translate-x-1 md:hidden" />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div key="live" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-[11px] font-black text-white/90 uppercase tracking-[0.4em]">Live Updates</h2>
                                {nextTicket && (
                                    <button
                                        onClick={() => setShowReportModal(true)}
                                        className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-full border border-primary/20 hover:bg-primary hover:text-background transition-all shadow-glow"
                                    >
                                        <AlertTriangle size={12} />
                                        Report Status
                                    </button>
                                )}
                            </div>

                            {nextTicket && (
                                <div className="app-card border border-white/10 rounded-2xl bg-zinc-950/60 p-5 md:p-6 space-y-4">
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.35em]">Attendee Feedback</h3>
                                        <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">
                                            {hasExistingFeedback ? 'Edit your feedback' : `For ${nextTicket.event_id?.event_name}`}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-white/80 uppercase tracking-[0.3em] px-1">Rating</label>
                                        <div className="flex items-center gap-2">
                                            {[1, 2, 3, 4, 5].map((r) => (
                                                <button
                                                    key={r}
                                                    type="button"
                                                    onClick={() => setFeedbackForm((prev) => ({ ...prev, rating: r }))}
                                                    className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${
                                                        feedbackForm.rating >= r
                                                            ? 'bg-primary/15 border-primary/30 text-primary'
                                                            : 'bg-white/[0.02] border-white/10 text-white/40 hover:text-white/70'
                                                    }`}
                                                >
                                                    <Star size={14} fill={feedbackForm.rating >= r ? 'currentColor' : 'none'} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-white/80 uppercase tracking-[0.3em] px-1">Comment (Optional)</label>
                                        <textarea
                                            value={feedbackForm.comment}
                                            onChange={(e) => setFeedbackForm((prev) => ({ ...prev, comment: e.target.value }))}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-4 px-5 text-[11px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-primary/20 transition-all font-mono min-h-[90px] resize-none"
                                            placeholder="SHARE YOUR EXPERIENCE..."
                                        />
                                    </div>

                                    <Button
                                        onClick={submitFeedback}
                                        disabled={isSubmittingFeedback}
                                        variant="luxury"
                                        className="w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] disabled:opacity-50"
                                    >
                                        {isSubmittingFeedback ? (
                                            <div className="h-4 w-4 rounded-full border-2 border-background/20 border-t-background animate-spin" />
                                        ) : (
                                            <>
                                                <span>{hasExistingFeedback ? 'Update Feedback' : 'Submit Feedback'}</span>
                                                <Send size={14} />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}

                            {!nextTicket ? (
                                <div className="py-24 flex flex-col items-center justify-center app-card border-dashed opacity-10">
                                    <Activity size={48} className="mb-4" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.5em]">Waiting for event. Scan your ticket to see updates.</p>
                                </div>
                            ) : crowdReports.length === 0 ? (
                                <div className="py-24 flex flex-col items-center justify-center app-card border border-white/5 rounded-[2rem] bg-zinc-950/50">
                                    <Sparkles size={32} className="text-primary/50 mb-4 animate-pulse" />
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">Everything is clear right now.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {crowdReports.map((report, index) => (
                                        <motion.div
                                            key={report._id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="app-card p-6 bg-zinc-950 border border-white/5 rounded-2xl relative overflow-hidden group"
                                        >
                                            <div className={`absolute top-0 left-0 w-1 h-full ${
                                                report.status === 'Very Crowded' ? 'bg-red-500' : 
                                                report.status === 'Crowded' ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`} />
                                            
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em] block mb-1">Area / Gate</span>
                                                    <h4 className="text-lg font-serif italic text-white tracking-widest uppercase">{report.location}</h4>
                                                </div>
                                                <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest ${
                                                    report.status === 'Very Crowded' ? 'text-red-400 border-red-400/20 bg-red-400/5' : 
                                                    report.status === 'Crowded' ? 'text-amber-400 border-amber-400/20 bg-amber-400/5' : 
                                                    'text-emerald-400 border-emerald-400/20 bg-emerald-400/5'
                                                }`}>
                                                    {report.status}
                                                </Badge>
                                            </div>

                                            {report.message && (
                                                <div className="flex gap-3 items-start bg-white/[0.02] p-4 rounded-xl border border-white/5 mb-4">
                                                    <MessageSquare size={14} className="text-primary flex-shrink-0 mt-0.5" />
                                                    <p className="text-[11px] text-white/80 font-medium leading-relaxed italic tracking-wide">{report.message}</p>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-black text-primary">
                                                        {report.user_id?.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">{report.user_id?.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-white/30">
                                                    <Clock size={10} />
                                                    <span className="text-[8px] font-black uppercase tracking-widest">{new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Ticket Display Portal */}
                <AnimatePresence>
                    {selectedTicket && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-3xl"
                            onClick={() => setSelectedTicket(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 40 }}
                                className="w-full max-w-sm rounded-[3rem] overflow-hidden border border-white/10 bg-zinc-950 shadow-[0_50px_100px_rgba(0,0,0,1)] relative"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 shadow-glow" />
                                <div className="p-10 flex flex-col items-center">
                                    <button onClick={() => setSelectedTicket(null)} className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/80 hover:text-white transition-all"><X size={20} /></button>

                                    <div className="mt-4 mb-4 text-center">
                                        <div className="text-[11px] font-black text-primary uppercase tracking-[0.5em] mb-4">Entry Verified | Level 1 Access</div>
                                        <h2 className="text-2xl font-serif text-white tracking-widest uppercase italic leading-tight">{selectedTicket.event_id?.event_name}</h2>
                                        
                                        <div className="flex items-center justify-center gap-3 mt-6 text-[10px] font-black text-white/60 uppercase tracking-widest bg-white/5 py-3 px-6 rounded-2xl border border-white/5">
                                            <Calendar size={12} className="text-primary" />
                                            <span>{new Date(selectedTicket.event_id?.start_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                            <span className="text-white/20">|</span>
                                            <Clock size={12} className="text-primary" />
                                            <span>{new Date(selectedTicket.event_id?.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>

                                    {/* QR Node */}
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="relative p-7 rounded-[2.5rem] bg-white group hover:scale-[1.02] transition-transform duration-500 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                                            <div className="absolute inset-0 bg-primary/5 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <QRCodeSVG
                                                value={selectedTicket.qr_code}
                                                size={160}
                                                level="H"
                                                includeMargin={false}
                                                className="text-zinc-950"
                                            />
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Ticket ID</span>
                                            <div className="px-4 py-2 rounded-lg bg-zinc-900 border border-white/5 font-mono text-[11px] text-primary font-black uppercase tracking-widest select-all">
                                                {selectedTicket.qr_code}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-10 w-full space-y-4 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                                        <div className="flex items-center justify-between px-1 mb-2">
                                            <div className="text-[9px] font-black text-white/80 uppercase tracking-[0.4em]">Guest List</div>
                                            <Badge variant="outline" className="text-[9px] font-black">{selectedTicket.attendees?.length} NODE{selectedTicket.attendees?.length > 1 ? 'S' : ''}</Badge>
                                        </div>
                                        {selectedTicket.attendees?.map((att, i) => (
                                            <div key={i} className={`p-4 rounded-2xl border transition-all ${att.is_checked_in ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/[0.03] border-white/5'} space-y-1`}>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[11px] font-black uppercase tracking-widest ${att.is_checked_in ? 'text-emerald-400' : 'text-white'}`}>{att.name}</span>
                                                        {att.is_checked_in && <CheckCircle2 size={10} className="text-emerald-400" />}
                                                    </div>
                                                    <span className={`text-[9px] font-black uppercase italic ${att.is_checked_in ? 'text-emerald-500/60' : 'text-primary'}`}>
                                                        {att.is_checked_in ? 'VERIFIED' : `Node #${i + 1}`}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <div className="text-[9px] font-medium text-white/90 uppercase tracking-widest truncate">{att.email}</div>
                                                    {att.is_checked_in && att.checked_in_at && (
                                                        <div className="text-[6px] font-black text-white/70 uppercase tracking-widest">
                                                            Entry: {new Date(att.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        <div className="pt-4 space-y-4">
                                            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-[0.3em] text-white/90 border-b border-white/5 pb-4">
                                                <span>Booking ID</span>
                                                <span className="text-white">#{selectedTicket._id.slice(-6).toUpperCase()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-[0.3em] text-white/90 border-b border-white/5 pb-4">
                                                <span>Venue Node</span>
                                                <span className="text-white truncate max-w-[140px]">{selectedTicket.event_id?.venue}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-[0.3em] text-white/90">
                                                <span>Status</span>
                                                <span className="text-emerald-500">AUTHORIZED</span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="mt-12 text-[9px] text-white/70 font-black uppercase tracking-[0.6em] text-center">This protocol is end-to-end encrypted</p>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Booking Invitation Modal */}
                <AnimatePresence>
                    {bookingEvent && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/95 backdrop-blur-3xl overflow-y-auto"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 40 }}
                                className="w-full max-w-lg rounded-[2.5rem] overflow-hidden border border-white/10 bg-zinc-950 shadow-[0_50px_100px_rgba(0,0,0,1)] my-auto p-1"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-8 md:p-10 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-[11px] font-black text-primary uppercase tracking-[0.5em] mb-2">Booking Details</div>
                                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">{bookingEvent.event_name}</h2>
                                        </div>
                                        <button onClick={() => setBookingEvent(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/80 hover:text-white transition-all backdrop-blur-3xl"><X size={20} /></button>
                                    </div>

                                    {/* Quantity Selector */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[11px] font-black text-white/70 uppercase tracking-widest">Select Tickets</span>
                                            <div className="flex items-center gap-6">
                                                <button onClick={() => handleQuantityChange(ticketQuantity - 1)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/70 hover:text-primary transition-all border border-white/5 md:w-10 md:h-10">-</button>
                                                <span className="text-xl font-serif italic text-primary">{ticketQuantity}</span>
                                                <button onClick={() => handleQuantityChange(ticketQuantity + 1)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/70 hover:text-primary transition-all border border-white/5 md:w-10 md:h-10">+</button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Attendee Data Stream */}
                                    <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                        {attendees.map((attendee, index) => (
                                            <div key={index} className="space-y-4 p-6 rounded-3xl bg-white/[0.02] border border-white/5 relative group hover:border-primary/20 transition-colors">
                                                <div className="absolute -top-2 -left-2 w-8 h-8 rounded-lg bg-zinc-950 border border-white/10 flex items-center justify-center text-[11px] font-black text-primary shadow-glow group-hover:bg-primary group-hover:text-background transition-all">
                                                    #{index + 1}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-white/80 uppercase tracking-[0.3em] px-1">Full Name</label>
                                                        <input
                                                            value={attendee.name}
                                                            onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                                                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-3 px-4 text-[11px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-primary/20 transition-all font-mono"
                                                            placeholder="IDENTIFYING NAME"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-white/80 uppercase tracking-[0.3em] px-1">Phone Number</label>
                                                        <input
                                                            value={attendee.phone}
                                                            onChange={(e) => updateAttendee(index, 'phone', e.target.value)}
                                                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-3 px-4 text-[11px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-primary/20 transition-all font-mono"
                                                            placeholder="+X (XXX) XXX-XXXX"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-white/80 uppercase tracking-[0.3em] px-1">Email Address</label>
                                                    <input
                                                        value={attendee.email}
                                                        onChange={(e) => updateAttendee(index, 'email', e.target.value)}
                                                        className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-3 px-4 text-[11px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-primary/20 transition-all font-mono"
                                                        placeholder="guest@example.com"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        onClick={confirmBooking}
                                        disabled={isBooking}
                                        variant="luxury"
                                        className="w-full h-16 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] italic shadow-glow disabled:opacity-50"
                                    >
                                        {isBooking ? (
                                            <div className="h-4 w-4 rounded-full border-2 border-background/20 border-t-background animate-spin" />
                                        ) : (
                                            <>
                                                <span>Confirm Booking</span>
                                                <Sparkles size={16} />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Crowd Status Report Modal */}
                <AnimatePresence>
                    {showReportModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-background/95 backdrop-blur-3xl"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 40 }}
                                className="w-full max-w-md rounded-[2.5rem] overflow-hidden border border-white/10 bg-zinc-950 shadow-[0_50px_100px_rgba(0,0,0,1)] p-8"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <div className="text-[11px] font-black text-primary uppercase tracking-[0.5em] mb-2">Live Updates</div>
                                        <h2 className="text-2xl font-black text-white uppercase tracking-tight italic font-serif">Report Status.</h2>
                                    </div>
                                    <button onClick={() => setShowReportModal(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/80 hover:text-white transition-all"><X size={20} /></button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-white/80 uppercase tracking-[0.3em] px-1">Area Name (e.g. Gate 1)</label>
                                        <input
                                            value={reportForm.location}
                                            onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-4 px-5 text-[11px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-primary/20 transition-all font-mono"
                                            placeholder="E.G. GATE 1, FOOD COURT..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-white/80 uppercase tracking-[0.3em] px-1">Density Level</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['Clear', 'Normal', 'Crowded', 'Very Crowded'].map(lvl => (
                                                <button
                                                    key={lvl}
                                                    onClick={() => setReportForm({ ...reportForm, status: lvl })}
                                                    className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                                                        reportForm.status === lvl 
                                                        ? 'bg-primary text-background border-primary shadow-glow' 
                                                        : 'bg-white/[0.02] text-white/60 border-white/5 hover:border-white/10'
                                                    }`}
                                                >
                                                    {lvl}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-white/80 uppercase tracking-[0.3em] px-1">Optional Details</label>
                                        <textarea
                                            value={reportForm.message}
                                            onChange={(e) => setReportForm({ ...reportForm, message: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-4 px-5 text-[11px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-primary/20 transition-all font-mono min-h-[100px] resize-none"
                                            placeholder="E.G. GATE 1 CROWDED, MOVE TO GATE 2..."
                                        />
                                    </div>

                                    <Button
                                        onClick={submitReport}
                                        disabled={isReporting || !reportForm.location}
                                        variant="luxury"
                                        className="w-full h-16 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] italic shadow-glow disabled:opacity-50"
                                    >
                                        {isReporting ? (
                                            <div className="h-4 w-4 rounded-full border-2 border-background/20 border-t-background animate-spin" />
                                        ) : (
                                            <>
                                                <span>Send Report</span>
                                                <Send size={14} />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="fixed bottom-6 right-4 sm:right-8 z-[80]">
                    <AnimatePresence>
                        {showAiWidget && (
                            <motion.div
                                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                                className="w-[92vw] max-w-md mb-3 app-card p-5 border border-white/10 rounded-2xl bg-zinc-950/95 backdrop-blur-xl space-y-4 shadow-2xl"
                            >
                                <div className="flex items-center justify-between">
                                    <h2 className="text-[11px] font-black text-white/90 uppercase tracking-[0.4em]">Attendee AI</h2>
                                    <button
                                        type="button"
                                        onClick={() => setShowAiWidget(false)}
                                        className="text-white/60 hover:text-white transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                                <form onSubmit={handleAskAnything} className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        value={aiQuestion}
                                        onChange={(e) => setAiQuestion(e.target.value)}
                                        placeholder="ASK ANYTHING HERE"
                                        className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-[11px] font-black uppercase tracking-widest text-white placeholder:text-white/70 focus:outline-none focus:border-primary/40 transition-all"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={aiLoading || !aiQuestion.trim()}
                                        variant="luxury"
                                        className="h-11 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                                    >
                                        {aiLoading ? 'Asking...' : 'Ask'}
                                    </Button>
                                </form>
                                {aiAnswer && (
                                    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 text-[11px] text-white/90 leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
                                        {aiAnswer}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="button"
                        onClick={() => setShowAiWidget((prev) => !prev)}
                        className="h-14 px-4 rounded-2xl bg-primary text-background shadow-[0_10px_30px_rgba(212,175,55,0.35)] flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                        aria-label="Toggle attendee AI chatbot"
                    >
                        <Bot size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">AI Chatbot</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AttendeeDashboard;
