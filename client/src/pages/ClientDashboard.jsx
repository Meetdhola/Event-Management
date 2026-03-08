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
    Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, Card, Button } from '../components/ui/Components';

const ClientDashboard = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchMyEvents();
    }, []);

    const fetchMyEvents = async () => {
        try {
            const res = await axios.get('/events');
            setEvents(res.data.filter(e => e.client_id === user._id));
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEvents = events.filter(e =>
        e.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.venue.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-background">
            <div className="relative">
                <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin shadow-glow" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-10 w-10 rounded-full bg-primary/20 blur-xl animate-pulse" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="main-content px-3 pb-28 sm:pb-4">
            <div className="max-w-2xl mx-auto space-y-8">

                {/* Greeting Section */}
                <div className="flex items-center justify-between px-1">
                    <div>
                        <h1 className="text-2xl font-black text-white leading-tight uppercase tracking-widest italic font-serif">My Universe <span className="text-primary not-italic">✨</span></h1>
                        <p className="text-[10px] text-white/40 mt-1 uppercase tracking-[0.4em] font-black">Authorized client oversight • Level 3 Access</p>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="app-card p-6 flex flex-col gap-1 border-primary/10 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity"><TrendingUp size={24} /></div>
                        <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-2">Active Mandates</span>
                        <div className="flex items-baseline justify-between">
                            <span className="text-3xl font-black text-white">{events.filter(e => e.hiring_status === 'accepted').length}</span>
                            <span className="text-[8px] text-white/20 font-bold uppercase tracking-widest">Ongoing Protocols</span>
                        </div>
                    </div>
                    <div className="app-card p-6 flex flex-col gap-1 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity"><Activity size={24} /></div>
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">Pending Nodes</span>
                        <div className="flex items-baseline justify-between">
                            <span className="text-3xl font-black text-white">{events.filter(e => e.hiring_status === 'pending').length}</span>
                            <span className="text-[8px] text-white/20 font-bold uppercase tracking-widest">Verification Node</span>
                        </div>
                    </div>
                </div>

                {/* Search & IQ */}
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search active protocols..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-[11px] font-black uppercase tracking-widest text-white placeholder:text-white/10 focus:outline-none focus:border-primary/20 transition-all font-mono"
                    />
                </div>

                {/* Event Archive */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filteredEvents.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-24 flex flex-col items-center justify-center app-card bg-zinc-900/40 border-dashed opacity-20"
                            >
                                <XCircle size={48} className="text-white mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center px-12">No matching telemetry detected</p>
                            </motion.div>
                        ) : (
                            filteredEvents.map((event, index) => (
                                <motion.div
                                    key={event._id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="app-card p-5 group relative overflow-hidden bg-zinc-900/40 hover:border-primary/30 transition-all duration-500"
                                >
                                    <div className="flex items-start justify-between gap-6">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Badge
                                                    variant={
                                                        event.hiring_status === 'accepted' ? 'success' :
                                                            event.hiring_status === 'rejected' ? 'danger' : 'warning'
                                                    }
                                                    className="uppercase text-[8px] font-black tracking-widest px-2 py-0.5 rounded-lg italic"
                                                >
                                                    {event.hiring_status}
                                                </Badge>
                                                <span className="text-[8px] text-white/10 font-bold uppercase tracking-widest">Node #{event._id.slice(-6).toUpperCase()}</span>
                                            </div>
                                            <h3 className="text-base font-black text-white uppercase tracking-tight mb-2 truncate leading-none group-hover:text-primary transition-colors">{event.event_name}</h3>
                                            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
                                                <div className="flex items-center gap-1.5 text-[9px] text-white/30 font-black uppercase tracking-widest">
                                                    <Calendar size={12} className="text-primary/40" />
                                                    {new Date(event.start_date).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[9px] text-white/30 font-black uppercase tracking-widest truncate max-w-[150px]">
                                                    <MapPin size={12} className="text-primary/40" />
                                                    {event.venue}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[9px] text-white/30 font-black uppercase tracking-widest">
                                                    <Users size={12} className="text-primary/40" />
                                                    {event.expected_audience} Capacity
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end justify-between self-stretch">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 text-white/20 group-hover:text-primary group-hover:border-primary/20 transition-all flex items-center justify-center">
                                                <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                                            </div>
                                            {event.hiring_status === 'accepted' && (
                                                <div className="flex -space-x-2">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="w-6 h-6 rounded-lg border-2 border-[#12141A] bg-zinc-800 flex items-center justify-center">
                                                            <div className="w-full h-full rounded-md bg-primary/10 border border-primary/20" />
                                                        </div>
                                                    ))}
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
            </div>
        </div>
    );
};

export default ClientDashboard;
