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
        name: '', category: 'Security', base_price: '', unit: '', capacity_per_unit: '', description: '', is_available: true
    });

    const categories = ['Security', 'Food', 'Audio/Visual', 'Logistics', 'Decor', 'Technical'];

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
            toast.error('Operation failed');
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
                        <h1 className="text-2xl font-black text-white leading-tight uppercase tracking-widest italic font-serif">Vendor Hub <span className="text-primary not-italic">📦</span></h1>
                        <p className="text-[10px] text-white/40 mt-1 uppercase tracking-[0.4em] font-black">Authorized resource deployment • Supply Node</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${showForm
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            : 'bg-primary text-background shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95'}`}
                    >
                        {showForm ? <Trash2 size={24} className="rotate-45" /> : <Plus size={24} strokeWidth={3} />}
                    </button>
                </div>

                {/* Intelligence Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Deployed', value: stats?.totalServices || 0, icon: Package, color: 'text-primary' },
                        { label: 'Revenue', value: `₹${((stats?.estimatedRevenue || 0) / 1000).toFixed(1)}K`, icon: IndianRupee, color: 'text-emerald-500' },
                        { label: 'Mandates', value: stats?.activeBookings || 0, icon: Activity, color: 'text-blue-400' },
                        { label: 'Pulse', value: stats?.monthlyRevenue ? `₹${(stats.monthlyRevenue / 1000).toFixed(1)}K` : '₹0', icon: Zap, color: 'text-amber-500' },
                    ].map((stat, i) => (
                        <div key={i} className="app-card p-5 flex flex-col items-center justify-center text-center group cursor-default bg-zinc-900/40">
                            <stat.icon size={14} className={`${stat.color} opacity-40 mb-2 group-hover:opacity-100 transition-opacity`} />
                            <p className="text-xl font-black text-white tracking-tighter group-hover:text-primary transition-colors">{stat.value}</p>
                            <p className="text-[8px] text-white/30 font-black uppercase tracking-[0.2em] mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Operational Area */}
                <AnimatePresence mode="wait">
                    {showForm ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="app-card p-8 bg-zinc-900/60 border-primary/20 backdrop-blur-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-glow" />
                                <h2 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Resource Configuration</h2>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-5">
                                    <Input label="Resource Designation" placeholder="e.g. Professional Security Grid" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />

                                    <div className="space-y-1.5 px-1">
                                        <label className="text-[9px] font-black text-white/20 uppercase tracking-widest px-2">Category Sector</label>
                                        <select
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-[12px] outline-none transition-all text-white font-bold tracking-tight focus:border-primary/40"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            {categories.map(c => <option key={c} value={c} className="bg-zinc-900">{c.toUpperCase()}</option>)}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Base Value (₹)" type="number" placeholder="1000.00" value={formData.base_price} onChange={(e) => setFormData({ ...formData, base_price: e.target.value })} required />
                                        <Input label="Operational Unit" placeholder="per person / shift" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} required />
                                    </div>

                                    <Input label="Deployment Capacity" type="number" placeholder="50" value={formData.capacity_per_unit} onChange={(e) => setFormData({ ...formData, capacity_per_unit: e.target.value })} required />

                                    <div className="space-y-1.5 px-1">
                                        <label className="text-[9px] font-black text-white/20 uppercase tracking-widest px-2">Deployment Scope</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-white text-[12px] min-h-[120px] focus:outline-none focus:border-primary/40 transition-all font-medium leading-relaxed placeholder:text-white/10"
                                            placeholder="Outline the operational capabilities..."
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 h-14 rounded-2xl bg-white/5 text-white/40 border border-white/5 font-black uppercase text-[10px] tracking-widest hover:text-white transition-all">Abort</button>
                                    <button type="submit" className="flex-1 h-14 rounded-2xl bg-primary text-background font-black uppercase text-[10px] tracking-[0.2em] shadow-[0_0_30px_rgba(212,175,55,0.2)] hover:scale-105 transition-all italic">Commit Deployment</button>
                                </div>
                            </form>
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
                                <h2 className="text-[10px] font-black text-white/30 px-1 uppercase tracking-[0.4em]">Active Inventory</h2>
                                {services.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-24 app-card bg-zinc-900/40 border-dashed opacity-20">
                                        <Target size={48} className="mb-4 text-white" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">No active resources detected</p>
                                    </div>
                                ) : (
                                    services.map((service, index) => (
                                        <motion.div
                                            key={service._id}
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.04 }}
                                            className="app-card p-5 group transition-all duration-500 bg-zinc-900/40 hover:border-primary/40"
                                        >
                                            <div className="flex items-start justify-between gap-6">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <span className="px-2 py-0.5 rounded-md text-[8px] font-black tracking-widest uppercase bg-white/5 text-primary/60 border border-white/5">{service.category}</span>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${service.is_available ? 'bg-emerald-500 shadow-glow animate-pulse' : 'bg-rose-500 opacity-40'}`} />
                                                    </div>
                                                    <h3 className="text-sm font-black text-white uppercase tracking-tight mb-2 truncate group-hover:text-primary transition-colors">{service.name}</h3>
                                                    <p className="text-[10px] text-white/30 line-clamp-1 mb-4 italic leading-relaxed">{service.description || 'No operational briefing available.'}</p>
                                                    <div className="flex items-center gap-4 text-[9px] text-white/20 font-black uppercase tracking-widest">
                                                        <span className="flex items-center gap-2 text-primary/50"><IndianRupee size={12} /> {service.base_price.toLocaleString()}</span>
                                                        <span className="w-1 h-1 rounded-full bg-white/10" />
                                                        <span>{service.unit}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button onClick={() => { setFormData({ ...service }); setShowForm(true); }} className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20 hover:text-primary hover:border-primary/20 transition-all"><Edit3 size={16} /></button>
                                                    <button onClick={() => handleDelete(service._id)} className="w-10 h-10 rounded-xl bg-rose-500/5 border border-rose-500/10 flex items-center justify-center text-rose-500/30 hover:text-rose-500 hover:border-rose-500/30 transition-all"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            {/* Telemetry Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Live Telemetry</h2>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-glow" />
                                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Active Stream</span>
                                    </div>
                                </div>
                                <div className="app-card border-white/5 divide-y divide-white/5 bg-zinc-900/40">
                                    {stats?.recentBookings?.length > 0 ? stats.recentBookings.map((booking, i) => (
                                        <div key={i} className="p-5 flex items-center justify-between group hover:bg-white/[0.02] transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-[1.25rem] bg-zinc-900 border border-white/10 flex items-center justify-center text-primary font-black group-hover:scale-105 transition-transform italic">
                                                    {booking.name[0]}
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-white uppercase tracking-widest leading-none mb-2">{booking.name}</p>
                                                    <p className="text-[8px] text-white/20 font-bold uppercase tracking-[0.2em]">Contact: {booking.manager}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] text-white/20 font-black tracking-widest uppercase mb-1.5">{new Date(booking.date).toLocaleDateString()}</p>
                                                <Badge
                                                    variant={booking.status === 'upcoming' ? 'primary' : 'success'}
                                                    className="px-2 py-0.5 text-[7px] font-black uppercase tracking-widest rounded-md"
                                                >
                                                    {booking.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-24 flex flex-col items-center justify-center text-center opacity-10">
                                            <ShieldCheck size={48} className="mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.5em]">Awaiting booking synchronization</p>
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
