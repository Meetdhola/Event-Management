import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    Calendar,
    MapPin,
    Users,
    Activity,
    CheckCircle2,
    Clock,
    Shield,
    Target,
    Zap,
    Search,
    ChevronRight,
    QrCode,
    Camera,
    ListTodo
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, Card, Button, Input } from '../components/ui/Components';
import toast from 'react-hot-toast';

const VolunteerDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [ticketId, setTicketId] = useState('');
    const [activeTab, setActiveTab] = useState('tasks');

    useEffect(() => {
        fetchVolunteerData();
    }, []);

    const fetchVolunteerData = async () => {
        try {
            const [statsRes, tasksRes, eventsRes] = await Promise.all([
                axios.get('/volunteer/stats'),
                axios.get('/volunteer/tasks'),
                axios.get('/volunteer/events')
            ]);
            setStats(statsRes.data);
            setTasks(tasksRes.data);
            setEvents(eventsRes.data);
        } catch (error) {
            console.error('Error fetching volunteer data:', error);
            // toast.error('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyTicket = async (e) => {
        e.preventDefault();
        setVerifying(true);
        try {
            const res = await axios.post('/volunteer/verify-ticket', { ticketId });
            toast.success('Ticket Verified Successfully!');
            setTicketId('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Verification failed');
        } finally {
            setVerifying(false);
        }
    };

    const handleUpdateTaskStatus = async (taskId, newStatus) => {
        try {
            await axios.put(`/volunteer/tasks/${taskId}`, { status: newStatus });
            toast.success(`Task ${newStatus}`);
            fetchVolunteerData();
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

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

                {/* Command Header */}
                <div className="flex items-center justify-between px-1">
                    <div>
                        <h1 className="text-2xl font-black text-white leading-tight uppercase tracking-widest italic font-serif">Force Hub <span className="text-primary not-italic">⚡</span></h1>
                        <p className="text-[10px] text-white/40 mt-1 uppercase tracking-[0.4em] font-black">Authorized volunteer corps • Unit Active</p>
                    </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Deployed', value: stats?.upcomingEvents || 0, icon: Calendar, color: 'text-primary' },
                        { label: 'Protocol', value: stats?.completedTasks || 0, icon: CheckCircle2, color: 'text-emerald-500' },
                        { label: 'Uptime', value: `${stats?.totalHours || 0}H`, icon: Clock, color: 'text-blue-400' },
                        { label: 'Rank', value: stats?.impactScore || 0, icon: Zap, color: 'text-amber-500' },
                    ].map((stat, i) => (
                        <div key={i} className="app-card p-5 flex flex-col items-center justify-center text-center group bg-zinc-900/40">
                            <stat.icon size={14} className={`${stat.color} opacity-40 mb-2 group-hover:opacity-100 transition-opacity`} />
                            <p className="text-xl font-black text-white tracking-tighter group-hover:text-primary transition-colors">{stat.value}</p>
                            <p className="text-[8px] text-white/30 font-black uppercase tracking-[0.2em] mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Verification Scanner UI */}
                <div className="app-card p-2 bg-gradient-to-br from-primary/10 via-transparent to-transparent border-primary/20">
                    <div className="p-6 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-glow" />
                            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Gate Verification Node</h2>
                        </div>
                        <form onSubmit={handleVerifyTicket} className="space-y-4">
                            <div className="relative group">
                                <QrCode className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="SCANNING PROTOCOL: ENTER TICKET ID..."
                                    value={ticketId}
                                    onChange={(e) => setTicketId(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-[11px] font-black uppercase tracking-[0.2em] text-white placeholder:text-white/10 focus:outline-none focus:border-primary/40 transition-all font-mono"
                                />
                                <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-background transition-all">
                                    <Camera size={18} />
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={!ticketId || verifying}
                                className="w-full h-14 rounded-2xl bg-primary text-background font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_0_40px_rgba(212,175,55,0.2)] disabled:opacity-20 disabled:scale-95 transition-all italic hover:scale-[1.02]"
                            >
                                {verifying ? 'DECODING...' : 'AUTHORIZE ENTRY'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Operation Selection */}
                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
                    {[
                        { id: 'tasks', label: 'Mission Brief', icon: ListTodo },
                        { id: 'events', label: 'Field Ops', icon: Target }
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
                    {activeTab === 'tasks' ? (
                        <motion.div key="tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                            {tasks.length === 0 ? (
                                <div className="py-24 flex flex-col items-center justify-center app-card border-dashed opacity-10">
                                    <Shield size={48} className="mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">No active mandates detected</p>
                                </div>
                            ) : (
                                tasks.map((task, index) => (
                                    <div key={task._id} className="app-card p-5 group transition-all duration-500 bg-zinc-900/40 hover:border-primary/40">
                                        <div className="flex items-start justify-between gap-6">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <Badge variant={task.status === 'completed' ? 'success' : 'warning'} className="uppercase text-[8px] font-black tracking-widest px-2 py-0.5 rounded-lg italic">
                                                        {task.status}
                                                    </Badge>
                                                    <span className="text-[8px] text-white/10 font-bold uppercase tracking-widest">Op #{task._id.slice(-4).toUpperCase()}</span>
                                                </div>
                                                <h3 className="text-sm font-black text-white uppercase tracking-tight mb-2 truncate group-hover:text-primary transition-colors">{task.title}</h3>
                                                <p className="text-[10px] text-white/30 line-clamp-1 mb-4 italic leading-relaxed">{task.description}</p>
                                                <div className="flex items-center gap-4 text-[9px] text-white/20 font-black uppercase tracking-widest">
                                                    <span className="flex items-center gap-1.5"><Calendar size={12} className="text-primary/40" /> {new Date(task.deadline || Date.now()).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            {task.status !== 'completed' && (
                                                <button onClick={() => handleUpdateTaskStatus(task._id, 'completed')} className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-glow">
                                                    <CheckCircle2 size={24} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    ) : (
                        <motion.div key="events" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                            {events.map((event, index) => (
                                <div key={event._id} className="app-card p-5 group relative overflow-hidden bg-zinc-900/40 hover:border-primary/30 transition-all duration-500">
                                    <div className="flex items-start justify-between gap-6">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-glow animate-pulse" />
                                                <span className="text-[8px] text-emerald-500 font-black uppercase tracking-widest">Confirmed Deployment</span>
                                            </div>
                                            <h3 className="text-base font-black text-white uppercase tracking-tight mb-2 truncate leading-none group-hover:text-primary transition-colors">{event.event_name}</h3>
                                            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
                                                <div className="flex items-center gap-1.5 text-[9px] text-white/30 font-black uppercase tracking-widest">
                                                    <Calendar size={12} className="text-primary/40" /> {new Date(event.start_date).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[9px] text-white/30 font-black uppercase tracking-widest truncate max-w-[150px]">
                                                    <MapPin size={12} className="text-primary/40" /> {event.venue}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 text-white/20 transition-all flex items-center justify-center">
                                            <ChevronRight size={18} />
                                        </div>
                                    </div>
                                    <div className="absolute top-0 right-0 w-1.5 h-full bg-primary/10 group-hover:bg-primary transition-all duration-700" />
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default VolunteerDashboard;
