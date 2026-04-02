import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, MapPin, ArrowRight, Search, Trash2, XCircle, Shield, Archive, Activity, Zap, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Card, Badge, Button } from '../components/ui/Components';

const RejectedEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchRejectedEvents();
    }, []);

    const fetchRejectedEvents = async () => {
        try {
            const res = await axios.get('/events');
            setEvents(res.data.filter(e => e.hiring_status === 'rejected'));
        } catch (error) {
            console.error('Error fetching rejected events:', error);
            toast.error('Failed to load history');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm('Permanently delete this event from the history?')) return;
        try {
            await axios.delete(`/events/${id}`);
            toast.success('Event deleted successfully');
            fetchRejectedEvents();
        } catch (error) {
            toast.error('Failed to delete event');
        }
    };

    const filteredEvents = events.filter(e =>
        e.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.venue.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
        <div className="main-content px-3 pb-28 sm:pb-4">
            <div className="max-w-2xl mx-auto space-y-8">

                {/* Command Header */}
                <div className="flex items-center justify-between px-1">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none uppercase">
                            rejected <span className="text-rose-500 italic font-serif">EVENTS.</span>
                        </h1>
                        <p className="text-[11px] text-white/70 mt-3 uppercase tracking-[0.4em] font-black">History of rejected or cancelled event requests • Secure Access</p>
                    </div>
                </div>

                {/* Intelligence Metrics */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="app-card p-6 flex flex-col gap-1 border-rose-500/10 bg-gradient-to-br from-rose-500/5 to-transparent relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity"><Archive size={24} /></div>
                        <span className="text-[11px] font-black text-rose-500 uppercase tracking-[0.3em] mb-2">Total Rejected</span>
                        <div className="flex items-baseline justify-between">
                            <span className="text-3xl font-black text-white">{events.length}</span>
                            <span className="text-[9px] text-white/80 font-bold uppercase tracking-widest">Events Filtered</span>
                        </div>
                    </div>
                    <div className="app-card p-6 flex flex-col gap-1 relative overflow-hidden group border-white/5 bg-surface/40">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity"><Activity size={24} /></div>
                        <span className="text-[11px] font-black text-white/70 uppercase tracking-[0.3em] mb-2">System Status</span>
                        <div className="flex items-baseline justify-between">
                            <span className="text-3xl font-black text-emerald-500">Active</span>
                            <span className="text-[9px] text-white/80 font-bold uppercase tracking-widest">Secure Storage</span>
                        </div>
                    </div>
                </div>

                {/* Intelligence Filter */}
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/80 group-focus-within:text-rose-500 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search rejected events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-xs font-black uppercase tracking-widest text-white placeholder:text-white/80 focus:outline-none focus:border-rose-500/20 transition-all font-mono"
                    />
                </div>

                <AnimatePresence mode="wait">
                    {filteredEvents.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-24 flex flex-col items-center justify-center app-card bg-surface/40 border-dashed opacity-10"
                        >
                            <Shield size={48} className="text-white mb-4" />
                            <p className="text-[11px] font-black uppercase tracking-[0.4em]">No rejected events</p>
                        </motion.div>
                    ) : (
                        <div className="space-y-4">
                            {filteredEvents.map((event, index) => (
                                <motion.div
                                    key={event._id}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.04 }}
                                    className="app-card p-5 group relative overflow-hidden bg-surface/40 border-rose-500/10 hover:border-rose-500/30 transition-all duration-500"
                                >
                                    <div className="flex items-start justify-between gap-6">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Badge
                                                    variant="danger"
                                                    className="uppercase text-[9px] font-black tracking-widest px-2 py-0.5 rounded-lg italic bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                                >
                                                    Rejected
                                                </Badge>
                                                <span className="text-[9px] text-white/70 font-bold uppercase tracking-widest">Event ID #{event._id.slice(-6).toUpperCase()}</span>
                                            </div>
                                            <h3 className="text-xs font-black text-white/70 group-hover:text-white uppercase tracking-tight mb-2 truncate transition-colors leading-none">{event.event_name}</h3>
                                            <p className="text-[11px] text-white/80 italic line-clamp-1 mb-4 leading-relaxed group-hover:text-white/70 transition-colors">{event.description || 'No additional details available.'}</p>
                                            <div className="flex flex-wrap items-center gap-6 text-[11px] text-white/80 font-black uppercase tracking-widest">
                                                <span className="flex items-center gap-1.5"><Calendar size={12} className="text-rose-500/40" /> {new Date(event.start_date).toLocaleDateString()}</span>
                                                <span className="flex items-center gap-1.5"><MapPin size={12} className="text-rose-500/40" /> {event.venue}</span>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => handleDeleteEvent(event._id)}
                                            variant="danger"
                                            className="w-12 h-12 rounded-2xl p-0 flex items-center justify-center shrink-0"
                                        >
                                            <Trash2 size={20} />
                                        </Button>
                                    </div>
                                    <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-500/10 group-hover:bg-rose-500 transition-all duration-700 shadow-[0_0_20px_rgba(244,63,94,0.3)]" />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>

                {/* Secure Notice */}
                <div className="px-6 py-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4 group hover:bg-white/[0.04] transition-all">
                    <Info size={16} className="text-primary/70 group-hover:text-primary transition-colors" />
                    <p className="text-[11px] text-white/80 font-black uppercase tracking-widest group-hover:text-white/70 transition-colors">These events were rejected by the manager or cancelled by the client.</p>
                </div>
            </div>
        </div>
    );
};

export default RejectedEvents;
