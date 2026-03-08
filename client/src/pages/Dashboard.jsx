import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, MapPin, ArrowRight, Plus, Filter, Search, MoreVertical, Bell, CheckCircle2, XCircle, MessageSquare, Zap, Target, Activity, X, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Card, Button, Badge, Input } from '../components/ui/Components';

const Dashboard = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showLogistics, setShowLogistics] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState(null);
    const [allResources, setAllResources] = useState([]);
    const [isManagingLogistics, setIsManagingLogistics] = useState(false);

    useEffect(() => {
        fetchEvents();
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            const res = await axios.get('/resources');
            setAllResources(res.data);
        } catch (error) {
            console.error('Error fetching resources:', error);
        }
    };

    const fetchEvents = async () => {
        try {
            const res = await axios.get('/events');
            setEvents(res.data);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const getEventStatus = (event) => {
        const now = new Date();
        const start = new Date(event.start_date);
        const end = new Date(event.end_date);

        if (now < start) return 'upcoming';
        if (now >= start && now <= end) return 'ongoing';
        return 'past';
    };

    const handleRespondRequest = async (id, action) => {
        try {
            await axios.put(`/hiring/respond/${id}`, { action });
            toast.success(`Request ${action} successfully`);
            fetchEvents();
        } catch (error) {
            toast.error('Failed to update request');
        }
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;
        try {
            await axios.delete(`/events/${id}`);
            toast.success('Event deleted successfully');
            fetchEvents();
        } catch (error) {
            toast.error('Failed to delete event');
        }
    };

    const filteredEvents = events.filter(e => {
        if (e.hiring_status === 'pending') return false;

        const matchesSearch = e.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.venue.toLowerCase().includes(searchQuery.toLowerCase());

        const status = getEventStatus(e);
        const matchesTab = activeTab === 'All' || status.toLowerCase() === activeTab.toLowerCase();

        return matchesSearch && matchesTab && e.hiring_status !== 'rejected';
    });

    const pendingRequests = events.filter(e => e.hiring_status === 'pending');

    const handleShowLogistics = (event) => {
        setSelectedEvent(event);
        setShowLogistics(true);
        setIsManagingLogistics(false);
    };

    const handleAddResourceToEvent = async (resourceId, quantity) => {
        try {
            const res = await axios.post(`/resources/add-to-event/${selectedEvent._id}`, {
                resourceId,
                quantity
            });
            setSelectedEvent(res.data);
            setEvents(prev => prev.map(e => e._id === res.data._id ? res.data : e));
            toast.success('Logistics updated');
        } catch (error) {
            toast.error('Failed to update logistics');
        }
    };

    const handleEditClick = (event) => {
        setEventToEdit({
            ...event,
            start_date: new Date(event.start_date).toISOString().slice(0, 16),
            end_date: new Date(event.end_date).toISOString().slice(0, 16)
        });
        setIsEditModalOpen(true);
        setActiveMenu(null);
    };

    if (loading) {
        return (
            <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-background">
                <div className="relative">
                    <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-10 w-10 rounded-full bg-primary/20 blur-xl animate-pulse" />
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
                        <h1 className="text-2xl font-black text-white leading-tight uppercase tracking-widest italic font-serif">Event Dashboard <span className="text-primary not-italic">📋</span></h1>
                        <p className="text-[10px] text-white/40 mt-1 uppercase tracking-[0.4em] font-black">Manage your events and logistics • Secure Access</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/chat')} className="w-11 h-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-primary transition-all shadow-xl group">
                            <MessageSquare size={18} className="group-hover:scale-110 transition-transform" />
                        </button>
                        <button onClick={() => navigate('/create-event')} className="w-11 h-11 rounded-2xl btn-prismatic flex items-center justify-center text-primary shadow-glow hover:scale-105 active:scale-95 transition-all">
                            <Plus size={20} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* Hiring Requests Notification Strip */}
                {pendingRequests.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="app-card border-amber-500/20 bg-amber-500/5 p-4 flex items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                                <Bell size={18} className="animate-bounce" />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">New Requests</h3>
                                <p className="text-[9px] text-white/40 font-bold uppercase mt-1.5">{pendingRequests.length} Hiring requests waiting for you</p>
                            </div>
                        </div>
                        <button onClick={() => setActiveTab('Pending')} className="text-[9px] font-black text-white bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-all uppercase tracking-widest">Review</button>
                    </motion.div>
                )}

                {/* Search & Intelligence */}
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-[11px] font-black uppercase tracking-widest text-white placeholder:text-white/10 focus:outline-none focus:border-primary/20 transition-all font-mono"
                    />
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-2 px-1 overflow-x-auto no-scrollbar pb-2">
                    {['All', 'Upcoming', 'Ongoing', 'Past', 'Pending'].map((tab) => {
                        if (tab === 'Pending' && pendingRequests.length === 0) return null;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-none px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                    ? 'btn-prismatic text-primary shadow-glow'
                                    : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10 border border-white/5'}`}
                            >
                                {tab}
                            </button>
                        );
                    })}
                </div>

                {/* Data Grid */}
                <AnimatePresence mode="popLayout">
                    {activeTab === 'Pending' ? (
                        <div className="space-y-4">
                            {pendingRequests.map((request) => (
                                <motion.div key={request._id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="app-card border-amber-500/10 p-5 bg-zinc-900/40">
                                    <div className="flex items-start justify-between gap-6">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-glow" />
                                                <span className="text-[8px] text-amber-500 font-black uppercase tracking-widest">Awaiting Response</span>
                                            </div>
                                            <h3 className="text-base font-black text-white uppercase tracking-tight mb-2 truncate">{request.event_name}</h3>
                                            <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mb-4">Client: {request.client_id?.name || 'User'}</p>
                                            <div className="flex gap-4 text-[9px] text-white/40 font-black uppercase tracking-widest">
                                                <div className="flex items-center gap-1.5"><Calendar size={12} className="text-primary/40" /> {new Date(request.start_date).toLocaleDateString()}</div>
                                                <div className="flex items-center gap-1.5"><MapPin size={12} className="text-primary/40" /> {request.venue}</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleRespondRequest(request._id, 'accepted')} className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20 flex items-center justify-center"><CheckCircle2 size={18} /></button>
                                                <button onClick={() => handleRespondRequest(request._id, 'rejected')} className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20 flex items-center justify-center"><XCircle size={18} /></button>
                                            </div>
                                            <button onClick={() => navigate('/chat', { state: { receiverId: request.client_id?._id, eventId: request._id } })} className="w-full h-10 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all border border-blue-500/20 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest"><MessageSquare size={14} /> Message</button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredEvents.length === 0 ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 app-card bg-zinc-900/40 border-dashed opacity-20">
                                    <Target size={48} className="mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">No events found</p>
                                </motion.div>
                            ) : (
                                filteredEvents.map((event, index) => {
                                    const status = getEventStatus(event);
                                    return (
                                        <motion.div key={event._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="app-card group hover:border-primary/20 transition-all bg-zinc-900/30">
                                            <div className="p-5 flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${status === 'upcoming' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                            status === 'ongoing' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-glow' :
                                                                'bg-white/5 text-white/20 border border-white/10'
                                                            }`}>{status}</span>
                                                        <span className="text-[8px] text-white/10 font-black tracking-widest uppercase italic">ID: #{event._id.slice(-6).toUpperCase()}</span>
                                                    </div>
                                                    <h3 className="text-sm font-black text-white uppercase tracking-tight mb-3 truncate leading-none group-hover:text-primary transition-colors">{event.event_name}</h3>
                                                    <div className="flex flex-wrap items-center gap-4 text-[9px] text-white/30 font-black uppercase tracking-widest">
                                                        <span className="flex items-center gap-1.5"><Calendar size={12} className="text-primary/40" />{new Date(event.start_date).toLocaleDateString()}</span>
                                                        <span className="flex items-center gap-1.5"><MapPin size={12} className="text-primary/40" />{event.venue}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleShowLogistics(event)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20 hover:text-primary hover:border-primary/40 group/btn transition-all">
                                                        <ArrowRight size={18} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                                    </button>
                                                    <div className="relative">
                                                        <button onClick={() => setActiveMenu(activeMenu === event._id ? null : event._id)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all">
                                                            <MoreVertical size={16} />
                                                        </button>
                                                        <AnimatePresence>
                                                            {activeMenu === event._id && (
                                                                <>
                                                                    <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                                                                    <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-12 w-40 rounded-2xl z-50 overflow-hidden bg-zinc-900 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
                                                                        <button onClick={() => handleEditClick(event)} className="w-full px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/5 transition-colors border-b border-white/5">Edit Event</button>
                                                                        <button onClick={() => handleDeleteEvent(event._id)} className="w-full px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 transition-colors">Delete Event</button>
                                                                    </motion.div>
                                                                </>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            </div>
                                            {status === 'ongoing' && (
                                                <div className="absolute bottom-0 left-0 h-[2px] bg-emerald-500 animate-pulse w-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                            )}
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </AnimatePresence>

                {/* Tactical Logistics Modal */}
                <AnimatePresence>
                    {showLogistics && selectedEvent && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-3xl" onClick={() => setShowLogistics(false)}>
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-950/90 shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                                <div className="p-8 sm:p-10 flex-1 overflow-y-auto no-scrollbar scrollbar-hide">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-12">
                                        <div>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-glow" />
                                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Resources & Planning</span>
                                            </div>
                                            <h2 className="text-3xl font-serif text-white tracking-widest uppercase italic leading-none">{selectedEvent.event_name}</h2>
                                            <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.3em] mt-4 flex items-center gap-2">
                                                <Activity size={10} className="text-primary" />
                                                Logistics ready • Venue: {selectedEvent.venue}
                                            </p>
                                        </div>
                                        <div className="flex gap-4 w-full sm:w-auto">
                                            <button
                                                onClick={() => setIsManagingLogistics(!isManagingLogistics)}
                                                className={`px-8 py-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all ${isManagingLogistics
                                                    ? 'bg-primary text-background border-primary shadow-[0_0_30px_rgba(212,175,55,0.2)]'
                                                    : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20 hover:text-white'}`}
                                            >
                                                {isManagingLogistics ? 'Finish Setup' : 'Add Resources'}
                                            </button>
                                            <button onClick={() => setShowLogistics(false)} className="w-14 h-14 rounded-2xl bg-white/5 text-white/20 hover:text-white transition-all border border-white/5 flex items-center justify-center"><X size={24} /></button>
                                        </div>
                                    </div>

                                    {isManagingLogistics ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {['Security', 'Food', 'Audio/Visual', 'Logistics', 'Decor', 'Technical'].map((cat) => (
                                                <section key={cat}>
                                                    <h4 className="text-[9px] font-black text-primary/60 uppercase tracking-[0.4em] mb-4 flex items-center gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                                        {cat}
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {allResources.filter(r => r.category === cat).map(resource => (
                                                            <div key={resource._id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                                                                <div className="flex justify-between items-center">
                                                                    <div>
                                                                        <p className="text-[12px] font-black text-white uppercase tracking-widest group-hover:text-primary transition-colors">{resource.name}</p>
                                                                        <p className="text-[9px] text-white/30 font-bold uppercase mt-1.5 tracking-tight">₹{resource.base_price.toLocaleString()} • {resource.unit}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {(() => {
                                                                            const inCart = selectedEvent.logistics_cart?.find(item => (item.resource?._id || item.resource) === resource._id);
                                                                            return inCart ? (
                                                                                <div className="flex items-center gap-4 bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 shadow-xl">
                                                                                    <button onClick={() => handleAddResourceToEvent(resource._id, Math.max(0, inCart.quantity - 1))} className="text-rose-500/60 hover:text-rose-500 font-black text-xs">-</button>
                                                                                    <span className="text-[11px] font-black text-white w-4 text-center">{inCart.quantity}</span>
                                                                                    <button onClick={() => handleAddResourceToEvent(resource._id, inCart.quantity + 1)} className="text-emerald-500/60 hover:text-emerald-500 font-black text-xs">+</button>
                                                                                </div>
                                                                            ) : (
                                                                                <button onClick={() => handleAddResourceToEvent(resource._id, 1)} className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-background transition-all flex items-center justify-center"><Plus size={16} strokeWidth={3} /></button>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </section>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                            <div className="space-y-8">
                                                <section>
                                                    <h4 className="text-[9px] font-black text-primary/60 uppercase tracking-[0.4em] mb-6">Core Telemetry</h4>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 relative group overflow-hidden">
                                                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity"><Users size={24} /></div>
                                                            <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.3em] mb-2">Expected Guests</p>
                                                            <p className="text-3xl font-black text-white tracking-widest leading-none">{selectedEvent.expected_audience || 0}</p>
                                                        </div>
                                                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 relative group overflow-hidden">
                                                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity"><Zap size={24} /></div>
                                                            <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.3em] mb-2">Event Status</p>
                                                            <p className="text-lg font-black text-emerald-500 uppercase tracking-widest leading-none">{getEventStatus(selectedEvent)}</p>
                                                        </div>
                                                    </div>
                                                </section>

                                                <section>
                                                    <h4 className="text-[9px] font-black text-blue-400 uppercase tracking-[0.4em] mb-6">Capital Deployment</h4>
                                                    <div className="p-8 rounded-[2rem] bg-zinc-900 border border-blue-500/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                                                        <div className="absolute inset-0 bg-blue-500/2 blur-[80px] group-hover:bg-blue-500/5 transition-all" />
                                                        <p className="text-[8px] text-white/30 font-black uppercase tracking-[0.5em] mb-4">Total Estimated Cost</p>
                                                        <p className="text-4xl font-serif text-white italic tracking-widest">₹{selectedEvent.logistics_cart?.reduce((acc, curr) => acc + (curr.resource?.base_price || 0) * curr.quantity, 0).toLocaleString()}</p>
                                                        <div className="mt-6 flex gap-2">
                                                            {[1, 2, 3, 4].map(i => <div key={i} className="h-0.5 flex-1 bg-blue-500/20 rounded-full" />)}
                                                        </div>
                                                    </div>
                                                </section>
                                            </div>

                                            <div className="space-y-8">
                                                <section>
                                                    <h4 className="text-[9px] font-black text-emerald-500/60 uppercase tracking-[0.4em] mb-6">Active Resource Stream</h4>
                                                    <div className="space-y-3 max-h-[460px] overflow-y-auto pr-3 no-scrollbar">
                                                        {(selectedEvent.logistics_cart && selectedEvent.logistics_cart.length > 0) ? (
                                                            selectedEvent.logistics_cart.map((item, i) => (
                                                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 transition-all group">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-[10px] font-black text-primary/80 uppercase group-hover:text-primary transition-colors">
                                                                            {item.resource?.category?.[0] || 'A'}
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-[11px] font-black text-white uppercase tracking-widest block">{item.resource?.name || 'Authorized Asset...'}</span>
                                                                            <span className="text-[8px] text-white/20 font-black uppercase tracking-[0.3em] mt-1 block">{item.resource?.category || 'General'}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-[12px] font-black text-white">x{item.quantity}</p>
                                                                        <p className="text-[8px] text-white/30 font-black uppercase mt-1">₹{((item.resource?.base_price || 0) * item.quantity).toLocaleString()}</p>
                                                                    </div>
                                                                </motion.div>
                                                            ))
                                                        ) : (
                                                            <div className="py-24 rounded-[2rem] border border-dashed border-white/5 flex flex-col items-center justify-center text-center opacity-20">
                                                                <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-6">Manifest empty. Awaiting deployment.</p>
                                                                <Button onClick={() => setIsManagingLogistics(true)} variant="secondary" className="px-8 py-3 h-auto text-[9px] font-black tracking-widest">Init Deployment</Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </section>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-8 sm:p-10 bg-zinc-900/50 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-8">
                                    <div className="px-8 py-4 rounded-2xl bg-primary/5 border border-primary/10 w-full sm:w-auto">
                                        <p className="text-[8px] text-primary font-black uppercase tracking-[0.5em] mb-1.5 opacity-60">Total Budget</p>
                                        <p className="text-2xl font-serif text-white tracking-widest italic leading-none">
                                            ₹{selectedEvent.logistics_cart?.reduce((acc, curr) => acc + (curr.resource?.base_price || 0) * curr.quantity, 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <button onClick={() => setShowLogistics(false)} className="w-full sm:w-auto px-12 py-5 rounded-2xl bg-primary text-background font-black uppercase tracking-widest text-[11px] italic transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(212,175,55,0.2)]">
                                        Save & Close
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Dashboard;
