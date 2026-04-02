import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, IndianRupee, Calendar, TrendingUp, Plus, Trash2, Edit3, CheckCircle2, LayoutDashboard, Zap, Activity, Target, ShieldCheck } from 'lucide-react';
import { Card, Button, Input, Badge } from '../components/ui/Components';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const VendorDashboard = () => {
    const [services, setServices] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '', category: 'Security', base_price: '', unit: 'Per Unit', capacity_per_unit: '', description: '', is_available: true
    });

    const categories = ['Security', 'Food', 'Audio/Visual', 'Logistics', 'Decor', 'Technical'];
    const unitOptions = ['Per Unit', 'Per Hour', 'Per Day', 'Per Event', 'Per Person', 'Per Shift', 'Flat Rate'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [servicesRes, statsRes] = await Promise.all([
                axios.get('/vendor/services'),
                axios.get('/vendor/stats')
            ]);
            setServices(servicesRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Error fetching vendor data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (formData.id || formData._id) {
                await axios.post('/vendor/services', { ...formData, resourceId: formData._id || formData.id });
                toast.success('Service updated');
            } else {
                await axios.post('/vendor/services', formData);
                toast.success('Service added');
            }
            setShowForm(false);
            setFormData({ name: '', category: 'Security', base_price: '', unit: '', capacity_per_unit: '', description: '', is_available: true });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this service?')) return;
        try {
            await axios.delete(`/vendor/services/${id}`);
            toast.success('Service removed');
            fetchData();
        } catch (error) {
            toast.error('Delete failed');
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

                {/* Command Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-1">
                    <div className="text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
                            <div className="w-2 h-2 rounded-full bg-primary shadow-glow animate-pulse" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Supply Node Alpha</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none uppercase">
                            vendor <span className="text-gradient-gold-soft italic font-serif">HUB.</span>
                        </h1>
                        <p className="text-[11px] text-white/50 mt-4 uppercase tracking-[0.4em] font-black max-w-sm">Authorized resource deployment • Unified Manifest</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className={`group relative h-14 px-8 flex items-center justify-center gap-4 transition-all overflow-hidden shrink-0 ${showForm
                            ? 'bg-rose-500/5 text-rose-500 border border-rose-500/20 rounded-full'
                            : 'btn-ghost-luxury'}`}
                    >
                        <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.3em] italic">{showForm ? 'Abort Protocol' : 'Initiate Deployment'}</span>
                        <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${showForm ? 'bg-rose-500/20' : 'bg-primary/10'}`}>
                            {showForm ? <Trash2 size={16} className="rotate-45" /> : <Plus size={16} strokeWidth={3} />}
                        </div>
                    </button>
                </div>

                {/* Intelligence Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-1">
                    {[
                        { label: 'Active Assets', value: stats?.totalServices || 0, icon: Package, prefix: '' },
                        { label: 'Total Yield', value: (stats?.estimatedRevenue || 0) >= 1000 ? `${(stats.estimatedRevenue / 1000).toFixed(1)}K` : (stats?.estimatedRevenue || 0), icon: IndianRupee, prefix: '₹' },
                        { label: 'Active Mandates', value: stats?.activeBookings || 0, icon: Activity, prefix: '' },
                        { label: 'Revenue Pulse', value: (stats?.monthlyRevenue || 0) >= 1000 ? `${(stats.monthlyRevenue / 1000).toFixed(1)}K` : (stats?.monthlyRevenue || 0), icon: Zap, prefix: '₹' },
                    ].map((stat, i) => (
                        <motion.div 
                            key={i} 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="relative group cursor-default"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[1.5rem]" />
                            <div className="app-card p-6 flex flex-col items-center justify-center text-center bg-zinc-950/40 border-white/5 group-hover:border-primary/20 h-32 relative">
                                <div className="absolute top-3 right-3 opacity-20 group-hover:opacity-100 group-hover:text-primary transition-all duration-500">
                                    <stat.icon size={12} strokeWidth={3} />
                                </div>
                                <div className="flex items-baseline gap-0.5">
                                    {stat.prefix && <span className="text-xs font-black text-primary/60 mr-1">{stat.prefix}</span>}
                                    <p className="text-3xl font-mono font-black text-white tracking-tighter leading-none">{stat.value}</p>
                                </div>
                                <p className="text-[8px] text-white/40 font-black uppercase tracking-[0.3em] mt-4 group-hover:text-white/70 transition-colors">{stat.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Operational Area */}
                <AnimatePresence mode="wait">
                    {showForm ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 32, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative"
                        >
                            {/* Cinematic Form Shell */}
                            <div className="app-card p-8 sm:p-12 bg-zinc-950/90 border-primary/30 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                                
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                            <Zap size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-serif italic text-white uppercase tracking-widest leading-none mb-1">Configuration Deck</h2>
                                            <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Authorized Deployment Protocol</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="sm:self-start py-1 border-white/10 text-white/40 text-[9px] font-mono tracking-widest uppercase">
                                        NODE: {formData._id ? formData._id.slice(-8).toUpperCase() : 'NEW-ALLOCATION'}
                                    </Badge>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-6 col-span-1 md:col-span-2">
                                            <Input 
                                                label="Resource Designation" 
                                                placeholder="e.g. ULTRA-TECH AUDIO GRID" 
                                                value={formData.name} 
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                                                required 
                                                className="uppercase tracking-widest font-black"
                                            />
                                        </div>

                                        <div className="space-y-2 px-1">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
                                                <Target size={10} /> Category Sector
                                            </label>
                                            <select
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-xs outline-none transition-all text-white font-bold tracking-widest focus:border-primary/40 appearance-none cursor-pointer hover:bg-white/[0.05]"
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            >
                                                {categories.map(c => <option key={c} value={c} className="bg-zinc-900">{c.toUpperCase()}</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-2 px-1">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
                                                <IndianRupee size={10} /> Operational Unit
                                            </label>
                                            <select
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-xs outline-none transition-all text-white font-bold tracking-widest focus:border-primary/40 appearance-none cursor-pointer hover:bg-white/[0.05]"
                                                value={formData.unit}
                                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                                required
                                            >
                                                {unitOptions.map(u => <option key={u} value={u} className="bg-zinc-900">{u.toUpperCase()}</option>)}
                                            </select>
                                        </div>

                                        <Input label="Yield Value (INR)" type="number" placeholder="5000" value={formData.base_price} onChange={(e) => setFormData({ ...formData, base_price: e.target.value })} required />
                                        <Input label="Fleet Capacity" type="number" placeholder="100" value={formData.capacity_per_unit} onChange={(e) => setFormData({ ...formData, capacity_per_unit: e.target.value })} required />
                                        
                                        <div className="space-y-2 px-1 md:col-span-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] px-2">Deployment Specifications</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-white text-xs min-h-[140px] focus:outline-none focus:border-primary/40 transition-all font-medium leading-relaxed placeholder:text-white/20"
                                                placeholder="Outline technical capabilities and operational scope..."
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                        <button 
                                            type="button" 
                                            onClick={() => setShowForm(false)} 
                                            className="btn-ghost-luxury flex-1 h-14"
                                        >
                                            Abort Operations
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="btn-luxury flex-1 h-14 italic"
                                        >
                                            <span className="relative z-10">Commit Deployment</span>
                                            <div className="relative z-10 w-1 h-1 rounded-full bg-background shadow-glow animate-pulse" />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            {/* Inventory Stream */}
                            <div className="space-y-4">
                                <h2 className="text-[11px] font-black text-white/90 px-1 uppercase tracking-[0.4em]">Active Inventory</h2>
                                {services.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-24 app-card bg-zinc-900/40 border-dashed opacity-20">
                                        <Target size={48} className="mb-4 text-white" />
                                        <p className="text-[11px] font-black uppercase tracking-[0.4em]">No active resources detected</p>
                                    </div>
                                ) : (
                                    services.map((service, index) => (
                                        <motion.div
                                            key={service._id}
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.04 }}
                                            className="relative group transition-all duration-500 hover:scale-[1.01]"
                                        >
                                            {/* Digital Asset Ticket Body */}
                                            <div className="relative app-card p-6 sm:p-8 bg-zinc-950/80 hover:border-primary/40 shadow-glow overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-white/5">
                                                {/* VIP Notches */}
                                                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background border border-white/10 z-20" />
                                                <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background border border-white/10 z-20" />
                                                
                                                {/* Holographic Overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-0" />
                                                
                                                {/* Status Bar */}
                                                {service.is_available && (
                                                    <div className="absolute top-0 left-0 w-[3px] h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] z-20" />
                                                )}

                                                <div className="flex-1 min-w-0 relative z-10 w-full">
                                                    <div className="flex items-center gap-3 mb-5">
                                                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black tracking-[0.2em] uppercase border ${service.is_available ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                                            {service.category}
                                                        </span>
                                                        <div className="flex items-center gap-2 opacity-50">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${service.is_available ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                                            <span className="text-[8px] uppercase font-black tracking-[0.3em] italic">{service.is_available ? 'Node Online' : 'Node Offline'}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <h3 className="text-2xl sm:text-3xl font-serif italic text-white uppercase tracking-wider mb-3 truncate group-hover:text-primary transition-all duration-300">
                                                        {service.name}
                                                    </h3>
                                                    
                                                    <p className="text-[11px] text-white/50 line-clamp-2 md:line-clamp-1 mb-6 font-medium leading-relaxed max-w-2xl uppercase tracking-wider">
                                                        {service.description || 'No operational briefing available.'}
                                                    </p>
                                                    
                                                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                                                        <div className="flex items-center gap-4 text-[11px] text-white font-black uppercase tracking-widest bg-white/[0.03] px-5 py-3 rounded-2xl border border-white/5">
                                                            <span className="flex items-center gap-2 text-primary">
                                                                <IndianRupee size={14} /> 
                                                                <span className="text-sm tracking-tight">{service.base_price.toLocaleString()}</span>
                                                            </span>
                                                            <div className="w-[1px] h-4 bg-white/10" />
                                                            <span className="opacity-70 text-[9px] font-bold italic">
                                                                {service.unit}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[9px] text-white/40 font-black uppercase tracking-widest">
                                                            <span>Asset ID:</span>
                                                            <span className="font-mono text-[10px] text-white/60">{service._id.slice(-8).toUpperCase()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Action Stub: Hero Identity & Management */}
                                                <div className="hidden sm:block w-[1px] h-32 border-l border-dashed border-white/10 mx-6 relative z-10" />

                                                <div className="flex sm:flex-col items-center justify-between gap-6 shrink-0 relative z-10 w-full sm:w-24 mt-4 sm:mt-0 pt-6 sm:pt-0 border-t sm:border-t-0 border-white/5 h-full">
                                                    {/* Hero Identity Circle */}
                                                    <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center relative group/hero overflow-hidden shadow-2xl bg-zinc-900/50">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50 transition-opacity duration-500 group-hover/hero:opacity-100" />
                                                        <span className="text-3xl font-serif italic text-primary group-hover:scale-110 transition-transform duration-500">
                                                            {service.name[0]}
                                                        </span>
                                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-primary/30 blur-sm" />
                                                    </div>

                                                    {/* Management Actions */}
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => { setFormData({ ...service }); setShowForm(true); }} 
                                                            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary/60 hover:text-primary hover:bg-primary/10 hover:border-primary/30 transition-all group/edit"
                                                        >
                                                            <Edit3 size={14} className="group-hover/edit:rotate-12 transition-transform" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(service._id)} 
                                                            className="w-10 h-10 rounded-xl bg-rose-500/5 border border-rose-500/10 flex items-center justify-center text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all group/delete"
                                                        >
                                                            <Trash2 size={14} className="group-hover/delete:scale-110 transition-transform" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            {/* Telemetry Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <h2 className="text-[11px] font-black text-white/90 uppercase tracking-[0.4em]">Live Telemetry</h2>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-glow" />
                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active Stream</span>
                                    </div>
                                </div>
                                <div className="app-card border-white/5 divide-y divide-white/5 bg-zinc-950/60 overflow-hidden">
                                    <div className="px-6 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em]">Telemetry Stream Online</span>
                                        </div>
                                        <span className="text-[8px] font-mono text-white/30 uppercase">ID: NODE-VND-{stats?.totalServices || 0}</span>
                                    </div>
                                    {stats?.recentBookings?.length > 0 ? stats.recentBookings.map((booking, i) => (
                                        <div key={i} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between group hover:bg-white/[0.04] transition-all gap-4">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-primary font-serif sm:text-2xl group-hover:scale-110 group-hover:bg-primary group-hover:text-background transition-all duration-500 italic shadow-glow">
                                                    {booking.name[0]}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <p className="text-sm font-black text-white uppercase tracking-wider">{booking.name}</p>
                                                        <span className="w-1 h-1 rounded-full bg-white/10" />
                                                        <span className="text-[10px] font-mono text-primary/60 uppercase">{booking.id.slice(-6)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.2em]">Mandate Lead: <span className="text-white/70 italic">{booking.manager}</span></p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/5">
                                                <div className="flex flex-col items-end">
                                                    <p className="text-[10px] text-white/60 font-mono tracking-wider uppercase mb-2">{new Date(booking.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                    <Badge
                                                        variant={booking.status === 'upcoming' ? 'primary' : 'success'}
                                                        className="px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg border border-white/10 flex items-center gap-2"
                                                    >
                                                        <div className={`w-1 h-1 rounded-full ${booking.status === 'upcoming' ? 'bg-primary' : 'bg-emerald-500'} animate-pulse`} />
                                                        {booking.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-24 flex flex-col items-center justify-center text-center opacity-10">
                                            <ShieldCheck size={48} className="mb-4" />
                                            <p className="text-[11px] font-black uppercase tracking-[0.5em]">Awaiting booking synchronization</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default VendorDashboard;
