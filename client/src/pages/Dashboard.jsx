import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, MapPin, ArrowRight, Plus, Filter, Search, MoreHorizontal, Bell, CheckCircle2, XCircle, MessageSquare, Zap, Target, Activity, X, Users, Scan, Trash2, AlertCircle, ShieldAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Card, Button, Badge, Input, Tooltip } from '../components/ui/Components';
import AICommandCenter from '../components/AICommandCenter';
import { socket, joinRoom } from '../lib/socket';

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
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">Next Deployment</span>
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

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
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
    const [showAiAssistant, setShowAiAssistant] = useState(false);
    const [aiEventId, setAiEventId] = useState(null);
    const [eventVolunteers, setEventVolunteers] = useState([]);
    const [eventTasks, setEventTasks] = useState([]);
    const [missionTab, setMissionTab] = useState('feed'); // 'feed' or 'assign'
    const [missionForm, setMissionForm] = useState({ title: '', description: '', priority: 'Medium', assignedTo: '' });
    const [logisticsTab, setLogisticsTab] = useState('resources'); // 'resources' or 'missions'
    const [liveAlerts, setLiveAlerts] = useState([]);

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

            // Join all active event rooms for real-time updates
            res.data.forEach(event => {
                joinRoom(`event_${event._id}`);
            });
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Essential: Join the general manager room immediately so we don't miss global signals
        joinRoom('manager_room');
        if (user?.role === 'Admin') joinRoom('admin_room');

        // Global listener for attendance updates
        socket.on('attendance_update', (data) => {
            setEvents(prev => prev.map(ev =>
                ev._id === data.eventId
                    ? { ...ev, actual_audience: data.totalCheckedIn }
                    : ev
            ));

            setSelectedEvent(prev => (prev && prev._id === data.eventId)
                ? { ...prev, actual_audience: data.totalCheckedIn }
                : prev
            );
        });

        socket.on('task_assigned', (newTask) => {
            if (selectedEvent && newTask.eventId === selectedEvent._id) {
                setEventTasks(prev => [newTask, ...prev]);
            }
        });

        socket.on('task_update', (data) => {
            setEventTasks(prev => prev.map(t => t._id === data.taskId ? { ...t, status: data.status, updatedAt: data.updatedAt } : t));
        });

        // Use a unified handler for all emergency entry points
        const triggerEmergencyUI = (data) => {
            // Sound Alarm
            try {
                const alarm = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                alarm.volume = 0.5;
                alarm.play().catch(e => console.log('Audio playback prevented:', e));
            } catch (e) {
                console.error('Sound system error:', e);
            }

            setLiveAlerts(prev => {
                // Deduplication check
                if (prev.some(a => a.timestamp === data.timestamp && a.volunteerName === data.volunteerName)) {
                    return prev;
                }
                return [{ id: Date.now(), ...data, type: 'EMERGENCY' }, ...prev];
            });

            toast.error(`EMERGENCY: ${data.volunteerName} at ${data.eventName}`, {
                duration: 15000,
                position: 'top-right',
                icon: '🚨',
                style: {
                    background: '#7f1d1d',
                    color: '#fff',
                    fontWeight: 'black',
                    border: '2px solid #ef4444',
                    padding: '16px'
                }
            });
        };

        socket.on('volunteer_emergency', (data) => {
            console.log('SIGNAL: Emergency via Manager Room');
            triggerEmergencyUI(data);
        });

        socket.on('emergency_alert', (data) => {
            console.log('SIGNAL: Emergency via Event Room');
            triggerEmergencyUI(data);
        });

        socket.on('broadcast_emergency', (data) => {
            console.log('SIGNAL: Emergency via Global Broadcast');
            // Only show to managers/admins if it's a broadcast
            if (user?.role === 'Admin' || user?.role === 'EventManager') {
                triggerEmergencyUI(data);
            }
        });

        return () => {
            socket.off('attendance_update');
            socket.off('task_assigned');
            socket.off('task_update');
            socket.off('volunteer_emergency');
            socket.off('emergency_alert');
            socket.off('broadcast_emergency');
        };
    }, [user, selectedEvent]);


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

    const fetchEventVolunteers = async (eventId) => {
        try {
            const res = await axios.get(`/volunteer/event-volunteers/${eventId}`);
            setEventVolunteers(res.data);
        } catch (error) {
            console.error('Error fetching event volunteers:', error);
        }
    };

    const fetchEventTasks = async (eventId) => {
        try {
            const res = await axios.get(`/volunteer/event-tasks/${eventId}`);
            setEventTasks(res.data);
        } catch (error) {
            console.error('Error fetching event tasks:', error);
        }
    };

    const handleAssignTask = async (e) => {
        e.preventDefault();

        if (!missionForm.title) {
            toast.error('Mission Objective (Title) is required');
            return;
        }
        if (!missionForm.assignedTo) {
            toast.error('An Operations Agent (Volunteer) must be selected');
            return;
        }

        try {
            await axios.post('/volunteer/tasks', {
                ...missionForm,
                eventId: selectedEvent._id
            });
            toast.success('Mission Assigned Successfully');
            setMissionForm({ title: '', description: '', priority: 'Medium', assignedTo: '' });
            setMissionTab('feed');
            fetchEventTasks(selectedEvent._id);
        } catch (error) {
            toast.error('Failed to assign mission');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to rescind this mission mandate?')) return;
        try {
            await axios.delete(`/volunteer/tasks/${taskId}`);
            toast.success('Mission successfully rescinded.', {
                icon: '🗑️',
                style: { background: '#ef4444', color: '#fff', fontWeight: 'bold' }
            });
            fetchEventTasks(selectedEvent._id);
        } catch (error) {
            toast.error('Failed to rescind mission.');
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

    const handleUpdateEvent = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.put(`/events/${eventToEdit._id}`, eventToEdit);
            toast.success('Event architecture updated');
            setIsEditModalOpen(false);
            setEventToEdit(null);
            fetchEvents();
        } catch (error) {
            toast.error('Failed to update event parameters');
        } finally {
            setLoading(false);
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

    const upcomingEvents = events.filter(e => getEventStatus(e) === 'upcoming' && e.hiring_status !== 'rejected').sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    const nextEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;

    const handleShowLogistics = (event) => {
        setSelectedEvent(event);
        setShowLogistics(true);
        fetchEventVolunteers(event._id);
        fetchEventTasks(event._id);
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

    const handleShowAiAssistant = (eventId) => {
        setAiEventId(eventId);
        setShowAiAssistant(true);
        setActiveMenu(null);
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
        <div className="main-content px-3 pb-32 sm:pb-4 relative">
            <div className="max-w-2xl mx-auto space-y-8">

                {/* Command Header */}
                <div className="flex items-center justify-between px-1">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none uppercase">
                            event <span className="text-gradient-gold-soft italic font-serif">DASHBOARD.</span>
                        </h1>
                        <p className="text-[11px] text-white/70 mt-3 uppercase tracking-[0.4em] font-black">Manage your events and logistics • Secure Access</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/chat')} className="w-11 h-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/70 hover:text-primary transition-all shadow-xl group">
                            <MessageSquare size={18} className="group-hover:scale-110 transition-transform" />
                        </button>
                        <button onClick={() => navigate('/create-event')} className="btn-icon-luxury shadow-glow">
                            <Plus size={20} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* Live Countdown for Next Event */}
                {nextEvent && (
                    <LiveCountdown targetDate={nextEvent.start_date} eventName={nextEvent.event_name} />
                )}

                {/* Live SOS Emergency Alerts */}
                {liveAlerts.length > 0 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[11px] text-rose-500 font-black animate-pulse flex items-center gap-2">
                                <ShieldAlert size={14} /> LIVE EMERGENCY LOG
                            </h3>
                            <button onClick={() => setLiveAlerts([])} className="text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Clear All</button>
                        </div>
                        <div className="space-y-3">
                            {liveAlerts.map(alert => (
                                <div key={alert.id} className="app-card p-5 flex items-center justify-between gap-4 bg-rose-500/10 border-rose-500/30 group animate-in slide-in-from-right duration-500">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-[1.25rem] bg-rose-500/20 border border-rose-500/40 flex items-center justify-center font-black text-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-pulse">
                                            <AlertCircle size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white uppercase tracking-widest leading-none mb-2">{alert.volunteerName}</p>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant="danger" className="text-[9px] px-2 py-0.5 rounded-lg uppercase font-black italic">SOS SIGNAL</Badge>
                                                <span className="text-[10px] text-white/70 font-bold uppercase tracking-tight">{alert.eventName} • {alert.location}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                                        <button onClick={() => setLiveAlerts(prev => prev.filter(a => a.id !== alert.id))} className="text-[9px] font-black text-rose-400/60 hover:text-rose-400 uppercase tracking-widest transition-colors">Dismiss</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

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
                                <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-widest leading-none">New Requests</h3>
                                <p className="text-[11px] text-white/70 font-bold uppercase mt-1.5">{pendingRequests.length} Hiring requests waiting for you</p>
                            </div>
                        </div>
                        <button onClick={() => setActiveTab('Pending')} className="text-[11px] font-black text-white bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-all uppercase tracking-widest">Review</button>
                    </motion.div>
                )}

                {/* Search & Intelligence */}
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/80 group-focus-within:text-primary transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-xs font-black uppercase tracking-widest text-white placeholder:text-white/80 focus:outline-none focus:border-primary/20 transition-all font-mono"
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
                                className={`flex-none px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                    ? 'btn-luxury min-h-0 h-10 px-6'
                                    : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/5'}`}
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
                                                <span className="text-[9px] text-amber-500 font-black uppercase tracking-widest">Awaiting Response</span>
                                            </div>
                                            <h3 className="text-xs font-black text-white uppercase tracking-tight mb-2 truncate">{request.event_name}</h3>
                                            <p className="text-[11px] text-white/80 font-bold uppercase tracking-widest mb-4">Client: {request.client_id?.name || 'User'}</p>
                                            <div className="flex gap-4 text-[11px] text-white/70 font-black uppercase tracking-widest">
                                                <div className="flex items-center gap-1.5"><Calendar size={12} className="text-primary/70" /> {new Date(request.start_date).toLocaleDateString()}</div>
                                                <div className="flex items-center gap-1.5"><MapPin size={12} className="text-primary/70" /> {request.venue}</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleRespondRequest(request._id, 'accepted')} className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20 flex items-center justify-center"><CheckCircle2 size={18} /></button>
                                                <button onClick={() => handleRespondRequest(request._id, 'rejected')} className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20 flex items-center justify-center"><XCircle size={18} /></button>
                                            </div>
                                            <button onClick={() => navigate('/chat', { state: { receiverId: request.client_id?._id, eventId: request._id } })} className="w-full h-10 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all border border-blue-500/20 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest"><MessageSquare size={14} /> Message</button>
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
                                    <p className="text-[11px] font-black uppercase tracking-[0.4em]">No events found</p>
                                </motion.div>
                            ) : (
                                filteredEvents.map((event, index) => {
                                    const status = getEventStatus(event);
                                    return (
                                        <motion.div
                                            key={event._id}
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.04 }}
                                            className={`relative app-card flex flex-col bg-zinc-950/80 border border-white/5 rounded-[2rem] group hover:border-primary/20 transition-all shadow-xl ${activeMenu === event._id ? 'z-50' : 'z-10'}`}
                                        >
                                            {status === 'ongoing' && (
                                                <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)] z-20" />
                                            )}

                                            {/* Top Segment: Event Details */}
                                            <div className="p-6 sm:p-8 relative z-10 flex flex-col items-start gap-6 bg-zinc-950/80">
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-0" />

                                                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between w-full gap-4 relative z-10">
                                                    <div className="w-full text-center sm:text-left flex-1 min-w-0">
                                                        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 mb-5">
                                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transform -skew-x-12 inline-block ${status === 'upcoming' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' :
                                                                status === 'ongoing' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' :
                                                                    'bg-white/5 text-white/50 border border-white/10'
                                                                }`}>
                                                                {status === 'ongoing' ? 'LIVE NOW' : status === 'upcoming' ? 'ADMIT ONE' : 'EXPIRED'}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <Scan size={12} className="text-white/30" />
                                                                <span className="text-[10px] text-white/50 font-black tracking-widest uppercase font-mono">TKT-{event._id.slice(-8).toUpperCase()}</span>
                                                            </div>
                                                        </div>
                                                        <h3 className="text-2xl sm:text-3xl font-serif text-white uppercase italic tracking-widest mb-6 truncate leading-none group-hover:text-glow-gold transition-all duration-500">{event.event_name}</h3>
                                                        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 text-[10px] sm:text-[11px] text-white/70 font-black uppercase tracking-widest">
                                                            <span className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5"><Calendar size={14} className={status === 'ongoing' ? 'text-emerald-500' : 'text-primary/70'} />{new Date(event.start_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                                            <span className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5"><MapPin size={14} className={status === 'ongoing' ? 'text-emerald-500' : 'text-primary/70'} />{event.venue}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Structured Divider */}
                                            <div className="relative flex items-center h-8 bg-zinc-950/80">
                                                <div className="absolute -left-4 w-8 h-8 rounded-full bg-background border-r border-white/5 group-hover:border-primary/20 shadow-inner z-20" />
                                                <div className="w-full border-t border-dashed border-white/20 mx-6 opacity-40 group-hover:border-primary/40 transition-colors" />
                                                <div className="absolute -right-4 w-8 h-8 rounded-full bg-background border-l border-white/5 group-hover:border-primary/20 shadow-inner z-20" />
                                            </div>

                                            {/* Action Stub */}
                                            <div className="p-6 bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-4 mt-[-1px] relative z-10">
                                                <div className="text-[9px] text-white/30 font-black uppercase tracking-[0.3em] hidden sm:block">
                                                    Action Required
                                                </div>
                                                <div className="flex items-center justify-center gap-3 w-full sm:w-auto">
                                                    <Tooltip text="AI Logistics Assistant">
                                                        <button onClick={() => handleShowAiAssistant(event._id)} className="flex-1 sm:flex-none h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-background transition-all shadow-glow group/ai">
                                                            <Zap size={16} fill="currentColor" className="group-hover/ai:scale-120 transition-transform " />
                                                        </button>
                                                    </Tooltip>

                                                    <Tooltip text="Open Volunteer Portal">
                                                        <button onClick={() => navigate('/volunteer')} className="flex-1 sm:flex-none h-12 px-6 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/90 hover:bg-white/10 hover:border-white/20 transition-all font-black text-[10px] uppercase tracking-widest gap-2 shadow-glow focus:outline-none focus:ring-1 focus:ring-primary/40">
                                                            <Scan size={14} /> Scan
                                                        </button>
                                                    </Tooltip>

                                                    <Tooltip text="Manage Logistics & Assign Task">
                                                        <button onClick={() => handleShowLogistics(event)} className="btn-icon-luxury shadow-glow group/btn">
                                                            <ArrowRight size={22} className="group-hover/btn:translate-x-1 transition-transform" />
                                                        </button>
                                                    </Tooltip>
                                                    <div className="relative flex-shrink-0">
                                                        <button
                                                            onClick={() => setActiveMenu(activeMenu === event._id ? null : event._id)}
                                                            className="btn-icon-ghost-luxury hover:text-primary transition-colors"
                                                        >
                                                            <MoreHorizontal size={26} />
                                                        </button>
                                                        <AnimatePresence>
                                                            {activeMenu === event._id && (
                                                                <>
                                                                    <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                                                                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="absolute right-0 bottom-full mb-3 w-48 rounded-2xl z-[70] overflow-hidden bg-zinc-950/95 border border-primary/30 shadow-[0_-20px_50px_rgba(0,0,0,0.9)] backdrop-blur-3xl">
                                                                        {/* <button onClick={() => { handleShowLogistics(event); setActiveMenu(null); }} className="w-full px-5 py-4 text-left text-xs font-black uppercase tracking-widest text-primary hover:bg-white/5 transition-colors border-b border-white/5 flex items-center justify-between group/opt">
                                                                            Manage Logistics
                                                                            <ArrowRight size={14} className="group-hover/opt:translate-x-1 transition-transform" />
                                                                        </button> */}
                                                                        <button onClick={() => handleEditClick(event)} className="w-full px-5 py-4 text-left text-xs font-black uppercase tracking-widest text-white hover:bg-white/5 transition-colors border-b border-white/5">Edit Event</button>
                                                                        <button onClick={() => handleDeleteEvent(event._id)} className="w-full px-5 py-4 text-left text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 transition-colors font-bold">Delete Event</button>
                                                                    </motion.div>
                                                                </>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            </div>
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
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-8">
                                        <div>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-glow" />
                                                <span className="text-[11px] font-black text-primary uppercase tracking-[0.4em]">Tactical Hub</span>
                                            </div>
                                            <h2 className="text-3xl font-serif text-white tracking-widest uppercase italic leading-none">{selectedEvent.event_name}</h2>
                                        </div>
                                        <button onClick={() => setShowLogistics(false)} className="w-14 h-14 rounded-2xl bg-white/5 text-white/80 hover:text-white transition-all border border-white/5 flex items-center justify-center shrink-0"><X size={24} /></button>
                                    </div>

                                    {/* Modal Tabs */}
                                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 mb-10 overflow-hidden">
                                        <button
                                            onClick={() => setLogisticsTab('resources')}
                                            className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${logisticsTab === 'resources' ? 'bg-primary text-background shadow-glow' : 'text-white/60 hover:text-white'}`}
                                        >
                                            Resource Planning
                                        </button>
                                        <button
                                            onClick={() => setLogisticsTab('missions')}
                                            className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${logisticsTab === 'missions' ? 'bg-primary text-background shadow-glow' : 'text-white/60 hover:text-white'}`}
                                        >
                                            Mission Control
                                        </button>
                                    </div>

                                    {logisticsTab === 'resources' ? (
                                        <>
                                            <div className="flex justify-between items-center mb-8">
                                                <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.5em]">Inventory Deployment</h3>
                                                <button
                                                    onClick={() => setIsManagingLogistics(!isManagingLogistics)}
                                                    className={`px-6 py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${isManagingLogistics
                                                        ? 'bg-primary text-background border-primary shadow-glow'
                                                        : 'bg-white/5 text-white/70 border-white/10 hover:border-white/20'}`}
                                                >
                                                    {isManagingLogistics ? 'Finish Setup' : 'Modify Resources'}
                                                </button>
                                            </div>

                                            {isManagingLogistics ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    {['Security', 'Food', 'Audio/Visual', 'Logistics', 'Decor', 'Technical'].map((cat) => (
                                                        <section key={cat}>
                                                            <h4 className="text-[11px] font-black text-primary/60 uppercase tracking-[0.4em] mb-4 flex items-center gap-3">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                                                {cat}
                                                            </h4>
                                                            <div className="space-y-3">
                                                                {allResources.filter(r => r.category === cat).map(resource => (
                                                                    <div key={resource._id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                                                                        <div className="flex justify-between items-center">
                                                                            <div>
                                                                                <p className="text-xs font-black text-white uppercase tracking-widest group-hover:text-primary transition-colors">{resource.name}</p>
                                                                                <p className="text-[11px] text-white/90 font-bold uppercase mt-1.5 tracking-tight">₹{resource.base_price.toLocaleString()} • {resource.unit}</p>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                {(() => {
                                                                                    const inCart = selectedEvent.logistics_cart?.find(item => (item.resource?._id || item.resource) === resource._id);
                                                                                    return inCart ? (
                                                                                        <div className="flex items-center gap-4 bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 shadow-xl">
                                                                                            <button onClick={() => handleAddResourceToEvent(resource._id, Math.max(0, inCart.quantity - 1))} className="text-rose-500/60 hover:text-rose-500 font-black text-[9px]">-</button>
                                                                                            <span className="text-xs font-black text-white w-4 text-center">{inCart.quantity}</span>
                                                                                            <button onClick={() => handleAddResourceToEvent(resource._id, inCart.quantity + 1)} className="text-emerald-500/60 hover:text-emerald-500 font-black text-[9px]">+</button>
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
                                                            <h4 className="text-[11px] font-black text-primary/60 uppercase tracking-[0.4em] mb-6">Core Telemetry</h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 relative group overflow-hidden">
                                                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity"><Users size={24} /></div>
                                                                    <p className="text-[9px] text-white/80 font-black uppercase tracking-[0.3em] mb-2">Expected Guests</p>
                                                                    <p className="text-3xl font-black text-white tracking-widest leading-none">{selectedEvent.expected_audience || 0}</p>
                                                                </div>
                                                                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 relative group overflow-hidden">
                                                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity"><Zap size={24} /></div>
                                                                    <p className="text-[9px] text-white/80 font-black uppercase tracking-[0.3em] mb-2">Event Status</p>
                                                                    <p className="text-lg font-black text-emerald-500 uppercase tracking-widest leading-none">{getEventStatus(selectedEvent)}</p>
                                                                </div>
                                                            </div>
                                                        </section>

                                                        <section>
                                                            <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em] mb-6">Capital Deployment</h4>
                                                            <div className="p-8 rounded-[2rem] bg-zinc-900 border border-blue-500/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                                                                <div className="absolute inset-0 bg-blue-500/2 blur-[80px] group-hover:bg-blue-500/5 transition-all" />
                                                                <p className="text-[9px] text-white/90 font-black uppercase tracking-[0.5em] mb-4">Total Estimated Cost</p>
                                                                <p className="text-4xl font-serif text-white italic tracking-widest">₹{selectedEvent.logistics_cart?.reduce((acc, curr) => acc + (curr.resource?.base_price || 0) * curr.quantity, 0).toLocaleString()}</p>
                                                                <div className="mt-6 flex gap-2">
                                                                    {[1, 2, 3, 4].map(i => <div key={i} className="h-0.5 flex-1 bg-blue-500/20 rounded-full" />)}
                                                                </div>
                                                            </div>
                                                        </section>
                                                    </div>

                                                    <div className="space-y-8">
                                                        <section>
                                                            <h4 className="text-[11px] font-black text-primary/60 uppercase tracking-[0.4em] mb-6">Inventory Feed</h4>
                                                            <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar scrollbar-hide pr-2">
                                                                {selectedEvent.logistics_cart?.length === 0 ? (
                                                                    <div className="py-24 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[2rem] opacity-20">
                                                                        <Activity size={32} className="mb-4" />
                                                                        <p className="text-[10px] font-black uppercase tracking-widest">No resources assigned</p>
                                                                    </div>
                                                                ) : (
                                                                    selectedEvent.logistics_cart.map((item, i) => (
                                                                        <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex justify-between items-center group hover:bg-white/[0.04] transition-all">
                                                                            <div>
                                                                                <p className="text-xs font-black text-white uppercase tracking-widest">{item.resource?.name || 'Processing...'}</p>
                                                                                <p className="text-[10px] text-white/50 font-black uppercase mt-1 tracking-widest">QTY: {item.quantity} • {item.resource?.category}</p>
                                                                            </div>
                                                                            <button onClick={() => handleAddResourceToEvent((item.resource?._id || item.resource), 0)} className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"><X size={14} /></button>
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </section>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            {/* Mission Tabs */}
                                            <div className="flex gap-4 mb-8">
                                                <button onClick={() => setMissionTab('feed')} className={`text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all ${missionTab === 'feed' ? 'bg-primary/20 text-primary border border-primary/20' : 'text-white/40 hover:text-white'}`}>Active Missions</button>
                                                <button onClick={() => setMissionTab('assign')} className={`text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all ${missionTab === 'assign' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20' : 'text-white/40 hover:text-white'}`}>Deploy New Mission</button>
                                            </div>

                                            {missionTab === 'assign' ? (
                                                <form onSubmit={handleAssignTask} className="space-y-8 max-w-2xl">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3 block">Mission Objective</label>
                                                        <input type="text" value={missionForm.title} onChange={(e) => setMissionForm({ ...missionForm, title: e.target.value.toUpperCase() })} placeholder="E.G., STAGE SETUP - PHASE 1" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm font-black uppercase tracking-widest text-white focus:outline-none focus:border-primary/40 transition-all font-mono" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3 block">Tactical Briefing</label>
                                                        <textarea value={missionForm.description} onChange={(e) => setMissionForm({ ...missionForm, description: e.target.value.toUpperCase() })} placeholder="MISSION CRITICAL DETAILS..." className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm font-black uppercase tracking-widest text-white focus:outline-none focus:border-primary/40 transition-all font-mono resize-none"></textarea>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3 block">Priority Scale</label>
                                                            <select value={missionForm.priority} onChange={(e) => setMissionForm({ ...missionForm, priority: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm font-black uppercase tracking-widest text-white focus:outline-none focus:border-primary/40 transition-all cursor-pointer">
                                                                <option value="Low" className="bg-black text-white">LOW</option>
                                                                <option value="Medium" className="bg-black text-white">MEDIUM</option>
                                                                <option value="High" className="bg-black text-white">HIGH</option>
                                                                <option value="Critical" className="bg-black text-white">CRITICAL</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3 block">Assigned Operations Agent</label>
                                                            <select value={missionForm.assignedTo} onChange={(e) => setMissionForm({ ...missionForm, assignedTo: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm font-black uppercase tracking-widest text-white focus:outline-none focus:border-primary/40 transition-all cursor-pointer">
                                                                {eventVolunteers.length === 0 ? (
                                                                    <option value="" className="bg-black text-white">NO VOLUNTEERS ARE THERE</option>
                                                                ) : (
                                                                    <option value="" className="bg-black text-white">SELECT FIELD AGENT...</option>
                                                                )}
                                                                {eventVolunteers.map(v => (
                                                                    <option key={v._id} value={v._id} className="bg-black text-white">{v.name.toUpperCase()}
                                                                        {/* (ID: {v._id.substring(v._id.length - 6).toUpperCase()}) */}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <button type="submit" disabled={eventVolunteers.length === 0} className={`w-full h-20 text-background font-black uppercase tracking-widest text-xs rounded-[2rem] transition-all italic ${eventVolunteers.length === 0 ? 'bg-zinc-700 cursor-not-allowed opacity-50' : 'bg-emerald-500 hover:scale-[1.01] active:scale-95 shadow-glow hover:shadow-emerald-500/30'}`}>
                                                        {eventVolunteers.length === 0 ? 'CANNOT DEPLOY' : 'Authorize & Deploy Mission'}
                                                    </button>
                                                </form>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {eventTasks.length === 0 ? (
                                                        <div className="col-span-full py-32 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[3rem] opacity-20">
                                                            <Target size={48} className="mb-4" />
                                                            <p className="text-[11px] font-black uppercase tracking-[0.5em]">No active mandates detected</p>
                                                        </div>
                                                    ) : (
                                                        eventTasks.map(task => (
                                                            <div key={task._id} className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all group overflow-hidden relative">
                                                                <div className="flex justify-between items-start mb-6">
                                                                    <Badge variant={task.status === 'Completed' ? 'success' : task.priority === 'Critical' ? 'error' : 'warning'} className="uppercase text-[9px] font-black tracking-widest py-1 px-3 rounded-xl italic">
                                                                        {task.status} • {task.priority}
                                                                    </Badge>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-2 h-2 rounded-full ${task.status === 'Completed' ? 'bg-emerald-500 shadow-glow' : 'bg-amber-500 animate-pulse'}`} />
                                                                        <button onClick={() => handleDeleteTask(task._id)} className="text-white/20 hover:text-red-500 transition-colors p-1" title="Rescind Mission">
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <h5 className="text-sm font-black text-white uppercase tracking-tight mb-3 truncate leading-none group-hover:text-primary transition-colors">{task.title}</h5>
                                                                <p className="text-[10px] text-white/50 font-black uppercase tracking-widest flex items-center gap-2 mb-6">
                                                                    <Users size={12} className="text-primary/40" />
                                                                    {task.assignedTo?.name || 'Unassigned'}
                                                                </p>
                                                                <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                                                                    <span className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">{new Date(task.createdAt).toLocaleTimeString()}</span>
                                                                    <div className="flex gap-1">
                                                                        {[1, 2, 3].map(i => <div key={i} className={`w-1.5 h-1.5 rounded-full ${task.status === 'Completed' ? 'bg-emerald-500' : 'bg-primary/20'}`} />)}
                                                                    </div>
                                                                </div>
                                                                <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                                                    <Target size={64} />
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="p-8 sm:p-10 bg-zinc-900/50 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-8">
                                    <div className="px-8 py-4 rounded-2xl bg-primary/5 border border-primary/10 w-full sm:w-auto">
                                        <p className="text-[9px] text-primary font-black uppercase tracking-[0.5em] mb-1.5 opacity-60">Total Budget</p>
                                        <p className="text-2xl font-serif text-white tracking-widest italic leading-none">
                                            ₹{selectedEvent.logistics_cart?.reduce((acc, curr) => acc + (curr.resource?.base_price || 0) * curr.quantity, 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <button onClick={() => setShowLogistics(false)} className="btn-luxury w-full sm:w-auto px-12 italic">
                                        Save & Close
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Edit Event Modal */}
                    {isEditModalOpen && eventToEdit && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-3xl" onClick={() => setIsEditModalOpen(false)}>
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-950/90 shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                                <div className="p-8 sm:p-10 flex-1">
                                    <div className="flex justify-between items-center mb-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-glow" />
                                            <span className="text-[11px] font-black text-primary uppercase tracking-[0.4em]">Architecture Override</span>
                                        </div>
                                        <button onClick={() => setIsEditModalOpen(false)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/80 hover:text-white transition-all"><X size={20} /></button>
                                    </div>

                                    <form onSubmit={handleUpdateEvent} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] uppercase tracking-[0.3em] font-black text-white/70 ml-1">Event Designation</label>
                                            <input
                                                type="text"
                                                value={eventToEdit.event_name}
                                                onChange={(e) => setEventToEdit({ ...eventToEdit, event_name: e.target.value })}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-xs font-black uppercase tracking-widest text-white focus:outline-none focus:border-primary/40 transition-all font-mono"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[11px] uppercase tracking-[0.3em] font-black text-white/70 ml-1">Start Date/Time</label>
                                                <input
                                                    type="datetime-local"
                                                    value={eventToEdit.start_date}
                                                    onChange={(e) => setEventToEdit({ ...eventToEdit, start_date: e.target.value })}
                                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-xs font-black text-white focus:outline-none focus:border-primary/40 transition-all font-mono"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] uppercase tracking-[0.3em] font-black text-white/70 ml-1">End Date/Time</label>
                                                <input
                                                    type="datetime-local"
                                                    value={eventToEdit.end_date}
                                                    onChange={(e) => setEventToEdit({ ...eventToEdit, end_date: e.target.value })}
                                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-xs font-black text-white focus:outline-none focus:border-primary/40 transition-all font-mono"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] uppercase tracking-[0.3em] font-black text-white/70 ml-1">Strategic Venue</label>
                                            <input
                                                type="text"
                                                value={eventToEdit.venue}
                                                onChange={(e) => setEventToEdit({ ...eventToEdit, venue: e.target.value })}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-xs font-black uppercase tracking-widest text-white focus:outline-none focus:border-primary/40 transition-all font-mono"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] uppercase tracking-[0.3em] font-black text-white/70 ml-1">Target Audience Stream</label>
                                            <input
                                                type="number"
                                                value={eventToEdit.expected_audience}
                                                onChange={(e) => setEventToEdit({ ...eventToEdit, expected_audience: e.target.value })}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-xs font-black text-white focus:outline-none focus:border-primary/40 transition-all font-mono"
                                                required
                                            />
                                        </div>

                                        <div className="pt-6">
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                isLoading={loading}
                                                className="btn-luxury w-full h-16 italic"
                                            >
                                                Synchronize Parameters
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* AI Command Center Modal */}
                    {showAiAssistant && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-3xl" onClick={() => setShowAiAssistant(false)}>
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => setShowAiAssistant(false)} className="absolute top-8 right-8 z-[110] w-12 h-12 rounded-2xl bg-white/5 text-white/80 hover:text-white transition-all border border-white/5 flex items-center justify-center backdrop-blur-xl">
                                    <X size={24} />
                                </button>
                                <div className="h-full overflow-y-auto no-scrollbar scrollbar-hide">
                                    <AICommandCenter eventId={aiEventId} />
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
