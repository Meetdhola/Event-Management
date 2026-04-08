import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    Calendar,
    MapPin,
    Users,
    Activity,
    ArrowRight,
    Search,
    Shield,
    XCircle,
    ChevronRight,
    TrendingUp,
    Zap,
    X,
    User,
    Clock,
    DollarSign,
    MessageSquare,
    Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, Card, Button } from '../components/ui/Components';

const ClientDashboard = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        fetchMyEvents();
    }, []);

    const fetchMyEvents = async () => {
        try {
            const res = await axios.get('/hiring/my-hires');
            setEvents(res.data);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEvents = events.filter(e => {
        const matchesSearch = e.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             e.venue.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'All' || e.hiring_status === activeTab.toLowerCase();
        return matchesSearch && matchesTab;
    });

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

                {/* Greeting Section */}
                <div className="flex items-center justify-between px-1">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none uppercase">
                            my <span className="text-gradient-gold-soft italic font-serif">UNIVERSE.</span>
                        </h1>
                        <p className="text-[11px] text-white/70 mt-3 uppercase tracking-[0.4em] font-black">Authorized client oversight • Level 3 Access</p>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="app-card p-6 flex flex-col gap-1 border-primary/10 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity"><TrendingUp size={24} /></div>
                        <span className="text-[11px] font-black text-primary uppercase tracking-[0.3em] mb-2">Active Mandates</span>
                        <div className="flex items-baseline justify-between">
                            <span className="text-3xl font-black text-white">{events.filter(e => e.hiring_status === 'accepted').length}</span>
                            <span className="text-[9px] text-white/80 font-bold uppercase tracking-widest">Ongoing Protocols</span>
                        </div>
                    </div>
                    <div className="app-card p-6 flex flex-col gap-1 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity"><Activity size={24} /></div>
                        <span className="text-[11px] font-black text-white/70 uppercase tracking-[0.3em] mb-2">Pending Nodes</span>
                        <div className="flex items-baseline justify-between">
                            <span className="text-3xl font-black text-white">{events.filter(e => e.hiring_status === 'pending').length}</span>
                            <span className="text-[9px] text-white/80 font-bold uppercase tracking-widest">Verification Node</span>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 mb-8">
                    {['All', 'Pending', 'Accepted', 'Rejected'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 flex items-center justify-center py-2.5 rounded-xl transition-all duration-300 ${activeTab === tab
                                ? 'bg-surface text-primary shadow-xl border border-white/5 font-black'
                                : 'text-white/60 hover:text-white font-black'}`}
                        >
                            <span className="text-[10px] uppercase font-black tracking-widest leading-none">{tab}</span>
                        </button>
                    ))}
                </div>

                {/* Search & IQ */}
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/80 group-focus-within:text-primary transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search active protocols..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-xs font-black uppercase tracking-widest text-white placeholder:text-white/80 focus:outline-none focus:border-primary/20 transition-all font-mono"
                    />
                </div>

                {/* Event Archive */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filteredEvents.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-24 flex flex-col items-center justify-center app-card bg-surface/40 border-dashed opacity-20"
                            >
                                <XCircle size={48} className="text-white mb-4" />
                                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-center px-12">No matching telemetry detected</p>
                            </motion.div>
                        ) : (
                            filteredEvents.map((event, index) => (
                                <motion.div
                                    key={event._id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="app-card p-6 group relative overflow-hidden bg-surface/40 hover:border-primary/30 transition-all duration-500 cursor-pointer"
                                    onClick={() => {
                                        setSelectedEvent(event);
                                        setShowDetails(true);
                                    }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    <div className="flex items-start justify-between gap-6 relative z-10">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Badge
                                                    variant={
                                                        event.hiring_status === 'accepted' ? 'success' :
                                                            event.hiring_status === 'rejected' ? 'danger' : 'warning'
                                                    }
                                                    className="uppercase text-[9px] font-black tracking-widest px-2 py-0.5 rounded-lg italic"
                                                >
                                                    {event.hiring_status}
                                                </Badge>
                                                <h3 className="text-sm font-black text-white uppercase tracking-tight mb-2 truncate leading-none group-hover:text-primary transition-colors">{event.event_name}</h3>
                                            </div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-5 h-5 rounded flex items-center justify-center bg-white/5 border border-white/5">
                                                    <User size={10} className="text-primary/70" />
                                                </div>
                                                <p className="text-[10px] text-white/50 font-black uppercase tracking-widest truncate">
                                                    Lead: <span className="text-white/90">{event.event_manager_id?.name || 'Unassigned'}</span>
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
                                                <div className="flex items-center gap-1.5 text-[11px] text-white/90 font-black uppercase tracking-widest">
                                                    <Calendar size={12} className="text-primary/70" />
                                                    {new Date(event.start_date).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] text-white/90 font-black uppercase tracking-widest truncate max-w-[150px]">
                                                    <MapPin size={12} className="text-primary/70" />
                                                    {event.venue}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] text-white/90 font-black uppercase tracking-widest">
                                                    <Users size={12} className="text-primary/70" />
                                                    {event.expected_audience} Capacity
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end justify-between self-stretch">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 text-white/80 group-hover:text-primary group-hover:border-primary/20 transition-all flex items-center justify-center">
                                                <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                                            </div>
                                            {event.hiring_status === 'accepted' && (
                                                <div className="flex -space-x-1.5">
                                                    {[1, 2].map(i => (
                                                        <div key={i} className="w-7 h-7 rounded-lg border-2 border-[#12141A] bg-zinc-900 flex items-center justify-center overflow-hidden">
                                                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                                                <span className="text-[8px] font-black text-primary/60">{i === 1 ? 'M' : 'V'}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="w-7 h-7 rounded-lg border-2 border-[#12141A] bg-zinc-800 flex items-center justify-center">
                                                        <span className="text-[8px] font-black text-white/40">+</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {event.hiring_status === 'accepted' && (
                                        <div className="absolute top-0 right-0 w-1.5 h-full bg-primary/10 group-hover:bg-primary transition-all duration-700 shadow-glow" />
                                    )}
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                {/* Event Details Modal */}
                <AnimatePresence>
                    {showDetails && selectedEvent && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-2xl"
                            onClick={() => setShowDetails(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="w-full max-w-xl bg-zinc-950 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                                
                                <div className="p-8 sm:p-12 space-y-8">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <Badge
                                                variant={
                                                    selectedEvent.hiring_status === 'accepted' ? 'success' :
                                                        selectedEvent.hiring_status === 'rejected' ? 'danger' : 'warning'
                                                }
                                                className="uppercase text-[9px] font-black tracking-widest px-3 py-1 rounded-full italic mb-4"
                                            >
                                                {selectedEvent.hiring_status}
                                            </Badge>
                                            <h2 className="text-3xl font-black text-white uppercase tracking-tight">{selectedEvent.event_name}</h2>
                                            <p className="text-[11px] text-white/50 font-black uppercase tracking-[0.4em] mt-2 italic shadow-glow-text">Mandate ID: #{selectedEvent._id.slice(-8).toUpperCase()}</p>
                                        </div>
                                        <button 
                                            onClick={() => setShowDetails(false)}
                                            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/50 hover:text-white transition-all hover:bg-white/10"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="app-card p-4 bg-white/[0.02] border-white/5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Calendar size={14} className="text-primary/70" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Engagement Date</span>
                                            </div>
                                            <p className="text-sm font-black text-white uppercase tracking-widest">{new Date(selectedEvent.start_date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="app-card p-4 bg-white/[0.02] border-white/5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <MapPin size={14} className="text-primary/70" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Venue Objective</span>
                                            </div>
                                            <p className="text-sm font-black text-white uppercase tracking-widest truncate">{selectedEvent.venue}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 px-1">
                                            <Info size={14} className="text-primary/70" />
                                            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Operational Briefing</h3>
                                        </div>
                                        <div className="app-card p-6 bg-white/[0.01] border-white/5">
                                            <p className="text-xs text-white/70 font-medium leading-relaxed font-serif italic">
                                                "{selectedEvent.description || 'No additional briefings provided for this mandate.'}"
                                            </p>
                                        </div>
                                    </div>

                                    <div className="app-card p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden group">
                                        <div className="flex items-center justify-between relative z-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-primary font-serif italic text-xl">
                                                    {selectedEvent.event_manager_id?.name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-1">Assigned Manager</p>
                                                    <h4 className="text-sm font-black text-white uppercase tracking-tight">{selectedEvent.event_manager_id?.name || 'Unassigned'}</h4>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost-luxury"
                                                className="w-12 h-12 rounded-2xl p-0 flex items-center justify-center"
                                                onClick={() => {
                                                    // Navigate to Chat with this manager
                                                    navigate('/chat', { state: { receiverId: selectedEvent.event_manager_id?._id } });
                                                }}
                                            >
                                                <MessageSquare size={18} />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <Button
                                            variant="luxury"
                                            className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] italic shadow-glow"
                                            onClick={() => setShowDetails(false)}
                                        >
                                            Dismiss Uplink
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ClientDashboard;
