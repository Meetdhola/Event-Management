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
    Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, Card, Button, Input } from '../components/ui/Components';
import toast from 'react-hot-toast';

const AttendeeDashboard = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [activeTab, setActiveTab] = useState('explore');

    useEffect(() => {
        fetchAttendeeData();
    }, []);

    const fetchAttendeeData = async () => {
        try {
            const [eventsRes, ticketsRes] = await Promise.all([
                axios.get('/events'),
                axios.get('/attendee/tickets')
            ]);
            setEvents(eventsRes.data.filter(e => e.hiring_status === 'accepted'));
            setTickets(ticketsRes.data);
        } catch (error) {
            console.error('Error fetching attendee data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBookTicket = async (eventId) => {
        try {
            await axios.post('/attendee/book', { eventId });
            toast.success('Ticket Secured! Check your vault.');
            fetchAttendeeData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Booking failed');
        }
    };

    const filteredEvents = events.filter(e =>
        e.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.venue.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-background">
            <div className="relative">
                <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin shadow-[0_0_20px_rgba(var(--glow-primary),0.5)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-10 w-10 rounded-full bg-primary/20 blur-xl animate-pulse" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="main-content px-3 pb-28 sm:pb-4">
            <div className="max-w-2xl mx-auto space-y-8">

                {/* Dashboard Header */}
                <div className="flex items-center justify-between px-1">
                    <div>
                        <h1 className="text-2xl font-black text-white leading-tight uppercase tracking-widest italic font-serif">Aura Lounge <span className="text-primary not-italic">✨</span></h1>
                        <p className="text-[10px] text-white/40 mt-1 uppercase tracking-[0.4em] font-black">Authorized elite entry • Guest Active</p>
                    </div>
                </div>

                {/* Interactive Navigation */}
                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
                    {[
                        { id: 'explore', label: 'Discover', icon: Compass },
                        { id: 'vault', label: 'My Vault', icon: Ticket }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl transition-all duration-300 ${activeTab === tab.id
                                ? 'bg-zinc-800 text-primary shadow-xl border border-white/5'
                                : 'text-white/30 hover:text-white/60'}`}
                        >
                            <tab.icon size={14} />
                            <span className="text-[9px] font-black uppercase tracking-widest leading-none">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'explore' ? (
                        <motion.div key="explore" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                            {/* Search IQ */}
                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Filter experience grid..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-[11px] font-black uppercase tracking-widest text-white placeholder:text-white/10 focus:outline-none focus:border-primary/20 transition-all font-mono"
                                />
                            </div>

                            <div className="space-y-4">
                                {filteredEvents.map((event, index) => (
                                    <motion.div
                                        key={event._id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                        className="app-card group hover:border-primary/30 transition-all duration-500 overflow-hidden bg-zinc-900/40"
                                    >
                                        <div className="p-6">
                                            <div className="flex justify-between items-start gap-4 mb-6">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Sparkles size={12} className="text-primary animate-pulse" />
                                                        <span className="text-[8px] text-white/20 font-black uppercase tracking-widest">Premium Offering • Verified</span>
                                                    </div>
                                                    <h3 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors leading-none">{event.event_name}</h3>
                                                </div>
                                                <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-primary text-[10px] font-black uppercase tracking-widest italic shadow-glow">
                                                    VIP Protocol
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6 mb-8">
                                                <div className="flex items-center gap-3 text-[10px] text-white/40 font-black uppercase tracking-widest">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-primary/40"><Calendar size={14} /></div>
                                                    {new Date(event.start_date).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-3 text-[10px] text-white/40 font-black uppercase tracking-widest">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-primary/40"><MapPin size={14} /></div>
                                                    <span className="truncate">{event.venue}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleBookTicket(event._id)}
                                                className="w-full h-14 rounded-2xl bg-white/5 group-hover:bg-primary group-hover:text-background transition-all duration-500 flex items-center justify-center gap-3 border border-white/5 group-hover:border-transparent group-hover:shadow-[0_0_30px_rgba(212,175,55,0.2)]"
                                            >
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Access Mandated Venue</span>
                                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="vault" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6">
                            <h2 className="text-[10px] font-black text-white/30 px-1 uppercase tracking-[0.4em]">My Secure Encrypts</h2>
                            {tickets.length === 0 ? (
                                <div className="py-24 flex flex-col items-center justify-center app-card border-dashed opacity-10">
                                    <Ticket size={48} className="mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">Vault empty. Secure an entry protocol.</p>
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
                                            className="app-card p-5 cursor-pointer hover:border-primary/40 transition-all flex items-center justify-between group bg-zinc-900/60 shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-background transition-all shadow-glow">
                                                    <QrCode size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors">{ticket.event_id?.event_name || 'Authorized Entry'}</p>
                                                    <div className="flex items-center gap-3 mt-1.5 opacity-40">
                                                        <span className="text-[8px] font-black text-white uppercase tracking-widest italic">Node #{ticket._id.slice(-6).toUpperCase()}</span>
                                                        <span className="w-1 h-1 rounded-full bg-white/20" />
                                                        <span className="text-[8px] font-black text-white uppercase tracking-widest leading-none">Status: ACTIVE</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight size={18} className="text-white/10 group-hover:text-primary transition-all group-hover:translate-x-1" />
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
                                    <button onClick={() => setSelectedTicket(null)} className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all"><X size={20} /></button>

                                    <div className="mt-4 mb-10 text-center">
                                        <div className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-4">Entry Verified • Level 1 Access</div>
                                        <h2 className="text-2xl font-serif text-white tracking-widest uppercase italic leading-tight">{selectedTicket.event_id?.event_name}</h2>
                                    </div>

                                    {/* QR Node */}
                                    <div className="relative p-8 rounded-[2.5rem] bg-white group hover:scale-[1.02] transition-transform duration-500 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                                        <div className="absolute inset-0 bg-primary/5 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <QrCode size={180} className="text-zinc-950" />
                                    </div>

                                    <div className="mt-12 w-full space-y-6">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] text-white/30 border-b border-white/5 pb-4">
                                            <span>Guest Identification</span>
                                            <span className="text-white">#{selectedTicket._id.slice(-6).toUpperCase()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] text-white/30 border-b border-white/5 pb-4">
                                            <span>Venue Node</span>
                                            <span className="text-white truncate max-w-[140px]">{selectedTicket.event_id?.venue}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                                            <span>Activation Status</span>
                                            <span className="text-emerald-500">AUTHORIZED</span>
                                        </div>
                                    </div>

                                    <p className="mt-12 text-[8px] text-white/10 font-black uppercase tracking-[0.6em] text-center">This protocol is end-to-end encrypted</p>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AttendeeDashboard;
