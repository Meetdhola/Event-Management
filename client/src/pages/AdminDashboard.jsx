import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Users,
    Calendar,
    ShieldCheck,
    ShieldAlert,
    MoreVertical,
    CheckCircle2,
    XCircle,
    TrendingUp,
    Briefcase,
    User as UserIcon,
    AlertCircle,
    Clock,
    Activity,
    UserCheck,
    ArrowUpRight,
    Search,
    Filter,
    X,
    Trash2,
    Eye,
    ChevronRight,
    Lock,
    MapPin,
    Zap,
    ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Button, Card, Badge } from '../components/ui/Components';
import { socket, joinRoom, subscribeToNotifications } from '../lib/socket';

const AdminDashboard = () => {
    const { section } = useParams();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalUsers: 0,
        totalEvents: 0,
        pendingApprovals: 0,
        totalRevenue: 0
    });
    const [users, setUsers] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('All');
    const [logSearchTerm, setLogSearchTerm] = useState('');
    const [logFilterStatus, setLogFilterStatus] = useState('All');
    const [systemResources, setSystemResources] = useState([]);
    const [editingResource, setEditingResource] = useState(null);
    const [liveAlerts, setLiveAlerts] = useState([]);

    useEffect(() => {
        fetchAdminData();
        
        // Join admin global room
        joinRoom('admin_room');

        // Listen for emergencies
        socket.on('volunteer_emergency', (data) => {
            console.log('EMERGENCY RECEIVED:', data);
            setLiveAlerts(prev => [{
                id: Date.now(),
                ...data,
                type: 'EMERGENCY'
            }, ...prev]);

            toast.error(`EMERGENCY: ${data.volunteerName} at ${data.eventName}`, {
                duration: 10000,
                position: 'top-right',
                icon: '🚨',
                style: {
                    background: '#ef4444',
                    color: '#fff',
                    fontWeight: 'black',
                    border: '1px solid white'
                }
            });
        });

        return () => {
            socket.off('volunteer_emergency');
        };
    }, []);

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes, eventsRes, resourcesRes] = await Promise.all([
                axios.get('/admin/stats'),
                axios.get('/admin/users'),
                axios.get('/admin/events'),
                axios.get('/admin/resources')
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
            setEvents(eventsRes.data);
            setSystemResources(resourcesRes.data);
        } catch (error) {
            toast.error('Failed to fetch admin data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (userId) => {
        try {
            const res = await axios.put(`/admin/users/${userId}/status`);
            setUsers(users.map(u => u._id === userId ? res.data : u));
            toast.success(`User access set to ${res.data.status}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleApprove = async (userId) => {
        try {
            const res = await axios.put(`/admin/users/${userId}/approve`);
            setUsers(users.map(u => u._id === userId ? res.data : u));
            setStats(prev => ({
                ...prev,
                pendingApprovals: Math.max(0, (prev.pendingApprovals || 0) - 1)
            }));
            toast.success(`${res.data.role} verified successfully`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve user');
        }
    };

    const handleReject = async (userId) => {
        if (!window.confirm('Are you sure you want to REJECT and PERMANENTLY REMOVE this registration request?')) return;
        try {
            await axios.delete(`/admin/users/${userId}/reject`);
            setUsers(users.filter(u => u._id !== userId));
            setStats(prev => ({
                ...prev,
                pendingApprovals: Math.max(0, (prev.pendingApprovals || 0) - 1)
            }));
            toast.success('Registration request neutralized');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject');
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm('Are you sure you want to prune this archive? This action cannot be reversed.')) return;
        try {
            await axios.delete(`/events/${eventId}`);
            setEvents(events.filter(e => e._id !== eventId));
            setStats(prev => ({
                ...prev,
                totalEvents: Math.max(0, (prev.totalEvents || 0) - 1)
            }));
            toast.success('Archive pruned successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to prune archive');
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        try {
            const res = await axios.put(`/admin/users/${userId}/role`, { role: newRole });
            setUsers(users.map(u => u._id === userId ? res.data : u));
            toast.success(`Role updated to ${newRole}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update role');
        }
    };

    const handleUpdateResource = async (id, data) => {
        try {
            const res = await axios.put(`/admin/resources/${id}`, data);
            setSystemResources(systemResources.map(r => r._id === id ? res.data : r));
            setEditingResource(null);
            toast.success('Parameter synchronized');
        } catch (error) {
            toast.error('Failed to sync parameter');
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'All' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.event_name.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
            (event.event_manager_id?.name || '').toLowerCase().includes(logSearchTerm.toLowerCase());
        const matchesStatus = logFilterStatus === 'All' || event.status === logFilterStatus;
        return matchesSearch && matchesStatus;
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

    const StatCard = ({ title, value, icon: Icon, trend, colorClass }) => (
        <div className="app-card p-6 flex flex-col gap-1 transition-all group cursor-default bg-surface/40">
            <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-black uppercase tracking-[0.3em] ${colorClass}`}>{title}</span>
                <Icon size={18} className={`${colorClass} opacity-40 group-hover:opacity-100 transition-opacity`} />
            </div>
            <div className="flex items-baseline justify-between pt-1">
                <span className="text-3xl font-black text-white leading-none">{value}</span>
                <ArrowUpRight size={14} className="text-white/70 group-hover:text-primary transition-colors" />
            </div>
            <p className="text-[9px] font-bold text-white/80 uppercase tracking-[0.4em] mt-3">{trend}</p>
        </div>
    );

    const renderContent = () => {
        switch (section) {
            case 'users':
                return (
                    <motion.div
                        key="users"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="flex flex-col gap-5">
                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/80 group-focus-within:text-primary transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Filter system entities..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-xs font-black uppercase tracking-widest text-white placeholder:text-white/80 focus:outline-none focus:border-primary/20 transition-all"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2 px-1">
                                {['All', 'Admin', 'EventManager', 'Vendor', 'Volunteer', 'Attendee'].map(role => (
                                    <button
                                        key={role}
                                        onClick={() => setFilterRole(role)}
                                        className={`px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${filterRole === role
                                            ? 'btn-luxury min-h-0 h-10 px-6'
                                            : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/5'
                                            }`}
                                    >
                                        {role === 'EventManager' ? 'Managers' : role}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {filteredUsers.length === 0 ? (
                                <div className="py-24 flex flex-col items-center justify-center app-card bg-zinc-900/40 border-dashed opacity-30">
                                    <Users size={48} className="mb-4" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.4em]">No matching entities found</p>
                                </div>
                            ) : (
                                filteredUsers.map((user) => (
                                    <div key={user._id} className="app-card p-5 group flex items-center justify-between gap-6 hover:border-primary/30 transition-all">
                                        <div className="flex items-center gap-5 flex-1 min-w-0">
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-[1.25rem] bg-zinc-900 border border-white/10 flex items-center justify-center font-black text-primary text-[11px] shadow-xl group-hover:scale-105 transition-transform">
                                                    {user.name[0]}
                                                </div>
                                                {user.is_approved && <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-900 shadow-glow flex items-center justify-center"><CheckCircle2 size={8} className="text-white" /></div>}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xs font-black text-white uppercase tracking-widest leading-none">{user.name}</h3>
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleUpdateRole(user._id, e.target.value)}
                                                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] font-black text-primary uppercase focus:outline-none focus:border-primary/40 transition-all cursor-pointer"
                                                    >
                                                        {['Admin', 'EventManager', 'Vendor', 'Volunteer', 'Attendee', 'Client'].map(r => (
                                                            <option key={r} value={r} className="bg-zinc-900">{r}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[9px] text-primary/60 font-black uppercase tracking-widest">{user.role}</span>
                                                    <span className="w-1 h-1 rounded-full bg-white/10" />
                                                    <span className="text-[11px] text-white/90 font-bold tracking-tight truncate">{user.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {!user.is_approved && ['EventManager', 'Vendor', 'Volunteer'].includes(user.role) ? (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleApprove(user._id)} className="btn-luxury h-10 px-4 min-h-0 rounded-xl">
                                                        Verify
                                                    </button>
                                                    <button onClick={() => handleReject(user._id)} className="p-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all border border-rose-500/20">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-4">
                                                    <Badge
                                                        variant={user.status === 'blocked' ? 'danger' : user.is_approved ? 'success' : 'warning'}
                                                        className="px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg"
                                                    >
                                                        {user.status === 'blocked' ? 'Revoked' : user.is_approved ? 'Active' : 'Pending'}
                                                    </Badge>
                                                    <button
                                                        onClick={() => handleToggleStatus(user._id)}
                                                        className={`p-2.5 rounded-xl transition-all border ${user.status === 'active' ? 'bg-rose-500/5 border-rose-500/10 text-rose-500/40 hover:text-rose-500 hover:border-rose-500/30' : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500/40 hover:text-emerald-500 hover:border-emerald-500/30'}`}
                                                    >
                                                        {user.status === 'active' ? <Lock size={16} /> : <CheckCircle2 size={16} />}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                );
            case 'logs':
                return (
                    <motion.div
                        key="logs"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/80 group-focus-within:text-primary transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search the Elite Archive..."
                                value={logSearchTerm}
                                onChange={(e) => setLogSearchTerm(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-xs font-black uppercase tracking-widest text-white placeholder:text-white/80 focus:outline-none focus:border-primary/20 transition-all"
                            />
                        </div>

                        <div className="space-y-4">
                            {filteredEvents.length === 0 ? (
                                <div className="py-24 flex flex-col items-center justify-center app-card bg-zinc-900/40 border-dashed opacity-30">
                                    <Activity size={48} className="mb-4" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.4em]">Archive is empty or search failed</p>
                                </div>
                            ) : (
                                filteredEvents.map((event) => (
                                    <div key={event._id} className="app-card overflow-hidden group hover:border-primary/40 transition-all duration-700 bg-zinc-900/50">
                                        <div className="flex flex-col md:flex-row">
                                            {/* Photo Section */}
                                            <div className="w-full md:w-32 h-40 md:h-auto overflow-hidden relative border-r border-white/5">
                                                <img
                                                    src={event.image || `https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=200&h=200&auto=format&fit=crop`}
                                                    alt={event.event_name}
                                                    className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-r from-background/40 to-transparent" />
                                                <div className="absolute top-4 left-4">
                                                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/80 bg-black/60 backdrop-blur-md px-2 py-1 rounded-sm border border-white/10 italic">Archive</span>
                                                </div>
                                            </div>

                                            {/* Content Section */}
                                            <div className="flex-1 p-6 flex flex-col justify-between gap-4 relative">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-[9px] font-black text-primary uppercase tracking-[0.5em] italic font-serif opacity-70">Past Deployment</span>
                                                            <div className="w-1 h-1 rounded-full bg-primary/40" />
                                                            <span className="text-[9px] text-white/80 font-bold uppercase tracking-widest">#{event._id.slice(-6).toUpperCase()}</span>
                                                        </div>
                                                        <h3 className="text-2xl md:text-3xl font-serif text-white italic leading-none group-hover:text-primary transition-colors tracking-tight uppercase">{event.event_name}</h3>
                                                        <p className="text-[11px] text-white/90 font-black uppercase tracking-widest mt-3 flex items-center gap-2">
                                                            <Zap size={10} className="text-primary/70" />
                                                            ID: {event.event_manager_id?._id?.slice(-8).toUpperCase() || 'EXTERNAL'}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => navigate(`/chat`, { state: { eventId: event._id } })}
                                                            className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center group/btn"
                                                        >
                                                            <ArrowUpRight size={18} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteEvent(event._id)}
                                                            className="w-10 h-10 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-500/40 hover:text-rose-500 hover:border-rose-500/40 transition-all flex items-center justify-center"
                                                        >
                                                            <MoreVertical size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-6 pt-2">
                                                    <div className="flex items-center gap-2.5 text-[11px] text-white/70 font-black uppercase tracking-widest">
                                                        <Calendar size={14} className="text-primary/70" />
                                                        {new Date(event.start_date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                    </div>
                                                    <div className="flex items-center gap-2.5 text-[11px] text-white/70 font-black uppercase tracking-widest">
                                                        <MapPin size={14} className="text-primary/70" />
                                                        {event.venue || 'Global Locale'}
                                                    </div>
                                                    <div className="flex items-center gap-2.5 text-[11px] text-white/70 font-black uppercase tracking-widest ml-auto">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
                                                        DEPLOYED
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                );
            case 'parameters':
                return (
                    <motion.div
                        key="parameters"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {systemResources.map(resource => (
                                <div key={resource._id} className="app-card p-6 group hover:border-primary/20 transition-all bg-zinc-900/40">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <p className="text-[11px] font-black text-primary uppercase tracking-[0.4em] mb-1">{resource.category}</p>
                                            <h3 className="text-[11px] font-black text-white uppercase tracking-widest">{resource.name}</h3>
                                        </div>
                                        <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                                            <Zap size={14} className="text-primary/70" />
                                        </div>
                                    </div>

                                    {editingResource === resource._id ? (
                                        <div className="space-y-4 pt-2 border-t border-white/5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-white/80 uppercase tracking-widest ml-1">Base Price</label>
                                                    <input
                                                        type="number"
                                                        defaultValue={resource.base_price}
                                                        onBlur={(e) => handleUpdateResource(resource._id, { base_price: Number(e.target.value) })}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[9px] font-bold text-white focus:outline-none focus:border-primary/40 transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-white/80 uppercase tracking-widest ml-1">Capacity</label>
                                                    <input
                                                        type="number"
                                                        defaultValue={resource.capacity_per_unit}
                                                        onBlur={(e) => handleUpdateResource(resource._id, { capacity_per_unit: Number(e.target.value) })}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[9px] font-bold text-white focus:outline-none focus:border-primary/40 transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setEditingResource(null)}
                                                className="w-full py-2.5 rounded-xl btn-prismatic text-primary text-[11px] font-black uppercase tracking-widest shadow-glow"
                                            >
                                                Confirm Calibration
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <div className="flex gap-6">
                                                <div>
                                                    <p className="text-[11px] font-black text-white/80 uppercase tracking-[0.2em] mb-1">Standard Rate</p>
                                                    <p className="text-[11px] font-black text-white">₹{resource.base_price}<span className="text-[11px] text-white/90 ml-1">/{resource.unit}</span></p>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-white/80 uppercase tracking-[0.2em] mb-1">AI Capacity</p>
                                                    <p className="text-[11px] font-black text-white">{resource.capacity_per_unit}<span className="text-[11px] text-white/90 ml-1">nodes/unit</span></p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setEditingResource(resource._id)}
                                                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 hover:text-primary transition-all"
                                            >
                                                <Activity size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );
            case 'overview':
            default:
                return (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <StatCard
                                title="Users"
                                value={stats.totalUsers}
                                icon={Users}
                                colorClass="text-primary"
                                trend="Total platform members"
                            />
                            <StatCard
                                title="Events"
                                value={stats.totalEvents}
                                icon={Calendar}
                                colorClass="text-blue-400"
                                trend="All hosted events"
                            />
                            <StatCard
                                title="Pending"
                                value={stats.pendingApprovals}
                                icon={ShieldAlert}
                                colorClass="text-amber-500"
                                trend="Awaiting approval"
                            />
                            <StatCard
                                title="Status"
                                value="Online"
                                icon={Activity}
                                colorClass={liveAlerts.length > 0 ? 'text-rose-500' : 'text-emerald-500'}
                                trend={liveAlerts.length > 0 ? `${liveAlerts.length} Active Alerts` : 'System is healthy'}
                            />
                        </div>

                        {/* Live Alerts Panel */}
                        {liveAlerts.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="section-title !mb-0 text-[11px] text-rose-500 font-black animate-pulse flex items-center gap-2">
                                        <ShieldAlert size={14} /> LIVE EMERGENCY LOG
                                    </h3>
                                    <button onClick={() => setLiveAlerts([])} className="text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Clear</button>
                                </div>
                                <div className="space-y-3">
                                    {liveAlerts.map(alert => (
                                        <div key={alert.id} className="app-card p-4 flex items-center justify-between gap-4 bg-rose-500/10 border-rose-500/30 group animate-in slide-in-from-right duration-500">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-[1.25rem] bg-rose-500/20 border border-rose-500/40 flex items-center justify-center font-black text-rose-500 text-[11px] animate-pulse">
                                                    <AlertCircle size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-white uppercase tracking-widest leading-none mb-1.5">{alert.volunteerName}</p>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="danger" className="text-[9px] px-1.5 py-0.5 rounded-md uppercase font-black italic">SOS SIGNAL</Badge>
                                                        <span className="text-[9px] text-white/70 font-bold uppercase">{alert.eventName} • {alert.location}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Entities Panel */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="section-title !mb-0 text-[11px] opacity-60">Recent Users</h3>
                                <button onClick={() => navigate('/admin/users')} className="text-[11px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors">View All Users</button>
                            </div>
                            <div className="space-y-3">
                                {users.slice(0, 4).map(user => (
                                    <div key={user._id} className="app-card p-4 flex items-center justify-between gap-4 bg-zinc-900/30 group cursor-default hover:border-primary/20 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-[1.25rem] bg-zinc-900 border border-white/5 flex items-center justify-center font-black text-primary/80 group-hover:text-primary text-[11px] transition-colors">
                                                {user.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-white uppercase tracking-widest leading-none mb-1.5">{user.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="ghost" className="text-[11px] px-1.5 py-0.5 rounded-md bg-white/5 text-white/80 group-hover:text-primary group-hover:bg-primary/5 transition-all uppercase font-black">{user.role}</Badge>
                                                    <span className="text-[9px] text-white/70 font-bold uppercase">{new Date().toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className="text-white/70 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                );
        }
    };

    return (
        <div className="main-content px-3 pb-32 sm:pb-4">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Infrastructure Header */}
                <div className="flex items-center justify-between px-1">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none uppercase">
                            admin <span className="text-gradient-gold-soft italic font-serif">CONTROL.</span>
                        </h1>
                        <p className="text-[11px] text-white/70 mt-3 uppercase tracking-[0.4em] font-black">Manage members, events, and settings • Level 5 access</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="success" className="h-8 rounded-full px-4 text-[9px] font-black shadow-glow animate-pulse">Secure Connect</Badge>
                    </div>
                </div>

                {/* Sub-Navigation Switcher */}
                <div className="flex items-center gap-2 px-1 overflow-x-auto no-scrollbar scrollbar-hide pb-2">
                    {[
                        { id: 'overview', label: 'Dashboard' },
                        { id: 'users', label: 'User List' },
                        { id: 'logs', label: 'Event Logs' },
                        { id: 'parameters', label: 'Settings' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => navigate(`/admin/${tab.id}`)}
                            className={`flex-none px-8 py-4 rounded-full text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-500 whitespace-nowrap border ${(section === tab.id || (!section && tab.id === 'overview'))
                                ? 'btn-luxury border-none min-h-0 h-12 shadow-glow'
                                : 'bg-white/5 border-white/5 text-white/70 hover:text-white hover:bg-white/10'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="min-h-[500px] relative">
                    <AnimatePresence mode="wait">
                        {renderContent()}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
