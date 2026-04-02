import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Package,
    Trash2,
    Edit2,
    Plus,
    Check,
    X,
    Tag,
    Layers,
    Info,
    IndianRupee
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Button, Badge } from './ui/Components';

const ServiceManager = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingService, setEditingService] = useState(null);
    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        category: 'Technical',
        base_price: '',
        unit: 'per unit',
        capacity_per_unit: 0,
        description: '',
        is_available: true
    });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const res = await axios.get('/vendor/services');
            setServices(res.data);
        } catch (error) {
            toast.error('Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (service) => {
        setEditingService(service._id);
        setFormData({
            ...service,
            resourceId: service._id
        });
        setIsAdding(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this service? This may affect existing event plans.')) return;
        try {
            await axios.delete(`/vendor/services/${id}`);
            toast.success('Service removed');
            fetchServices();
        } catch (error) {
            toast.error('Failed to delete service');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/vendor/services', formData);
            toast.success(editingService ? 'Service updated' : 'New service published');
            setIsAdding(false);
            setEditingService(null);
            fetchServices();
            setFormData({
                name: '', category: 'Technical', base_price: '', unit: 'per unit',
                capacity_per_unit: 0, description: '', is_available: true
            });
        } catch (error) {
            toast.error('Operation failed');
        }
    };

    if (loading) return null;

    return (
        <div className="space-y-10">
            {/* Grid of Services */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map((res) => (
                    <motion.div
                        key={res._id}
                        layout
                        className="app-card group p-8 relative overflow-hidden bg-zinc-900/40 backdrop-blur-3xl border-white/5 hover:border-primary/20 transition-all duration-500"
                    >
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex justify-between items-start mb-6">
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-black uppercase tracking-[0.2em] border border-primary/20 shadow-glow">
                                {res.category}
                            </span>
                            <div className="flex gap-3">
                                <button onClick={() => handleEdit(res)} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-primary/20 text-white/80 hover:text-primary transition-all">
                                    <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleDelete(res._id)} className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/10 hover:border-rose-500/30 text-rose-500/20 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                        <h4 className="text-lg font-black text-white mb-3 uppercase tracking-tight group-hover:text-primary transition-colors">{res.name}</h4>
                        <p className="text-xs text-white/70 font-medium mb-8 line-clamp-2 leading-relaxed">{res.description}</p>

                        <div className="flex items-center justify-between pt-6 border-t border-white/5 bg-black/20 -mx-8 px-8 -mb-8 pb-8">
                            <div>
                                <span className="text-2xl font-black text-white italic font-serif tracking-tighter">₹{res.base_price}</span>
                                <span className="text-[11px] text-white/80 font-black uppercase ml-2 tracking-widest">{res.unit}</span>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                                <div className={`w-2.5 h-2.5 rounded-full ${res.is_available ? 'bg-emerald-500 shadow-glow animate-pulse' : 'bg-white/10'}`} />
                                <span className="text-[11px] font-black text-white/80 uppercase tracking-widest">{res.is_available ? 'Active' : 'Inactive'}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Tactical Add Card */}
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="h-full min-h-[260px] rounded-[2.5rem] border-2 border-dashed border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-primary/20 transition-all duration-500 flex flex-col items-center justify-center gap-6 group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="p-5 rounded-2xl bg-white/5 group-hover:bg-primary/20 group-hover:text-primary transition-all shadow-xl relative z-10">
                            <Plus size={36} strokeWidth={1.5} />
                        </div>
                        <div className="text-center relative z-10">
                            <span className="block text-xs font-black text-white/70 uppercase tracking-[0.4em] group-hover:text-white transition-colors">Authorize New Resource</span>
                            <span className="text-[9px] text-white/70 font-bold uppercase tracking-widest mt-2 block">Tactical Deployment System</span>
                        </div>
                    </button>
                )}
            </div>

            {/* Tactical Configuration Portal */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0C0C0E]/95 backdrop-blur-xl p-4 sm:p-6"
                    >
                        {/* Background Orbs */}
                        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
                        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />

                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="w-full max-w-2xl app-card p-10 md:p-12 rounded-[3.5rem] border-white/10 bg-zinc-950 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <Badge variant="primary" className="mb-4 px-3 py-1 uppercase tracking-widest font-black text-[11px]">Resource Protocol</Badge>
                                    <h2 className="text-3xl font-black text-white tracking-widest uppercase italic font-serif">
                                        {editingService ? 'Optimize' : 'Publish'} <span className="text-primary not-italic">Entity</span>
                                    </h2>
                                    <p className="text-white/80 text-[11px] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                        Tactical configuration mode active
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setIsAdding(false); setEditingService(null); }}
                                    className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-rose-500/20 hover:text-rose-500 text-white/80 transition-all group"
                                >
                                    <X size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-white/80 uppercase tracking-[0.4em] ml-1 italic">Identification</label>
                                        <div className="relative group">
                                            <Package className="absolute left-5 top-1/2 -translate-y-1/2 text-white/70 group-focus-within:text-primary transition-colors" size={18} />
                                            <input
                                                required
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-[9px] font-bold placeholder:text-white/80 focus:outline-none focus:border-primary/30 transition-all font-mono"
                                                placeholder="ELITE_SYSTEM_NAME"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-white/80 uppercase tracking-[0.4em] ml-1 italic">Classification</label>
                                        <div className="relative group">
                                            <Layers className="absolute left-5 top-1/2 -translate-y-1/2 text-white/70 group-focus-within:text-primary transition-colors" size={18} />
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-[9px] font-bold focus:outline-none focus:border-primary/30 transition-all appearance-none cursor-pointer"
                                            >
                                                {['Security', 'Food', 'Audio/Visual', 'Logistics', 'Decor', 'Technical'].map(cat => (
                                                    <option key={cat} value={cat} className="bg-zinc-950">{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-white/80 uppercase tracking-[0.4em] ml-1 italic">Value Baseline</label>
                                        <div className="relative group">
                                            <IndianRupee className="absolute left-5 top-1/2 -translate-y-1/2 text-white/70 group-focus-within:text-primary transition-colors" size={16} />
                                            <input
                                                required
                                                type="number"
                                                value={formData.base_price}
                                                onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                                                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-[9px] font-bold focus:outline-none focus:border-primary/30 transition-all font-mono"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-white/80 uppercase tracking-[0.4em] ml-1 italic">Unit Metric</label>
                                        <div className="relative group">
                                            <Tag className="absolute left-5 top-1/2 -translate-y-1/2 text-white/70 group-focus-within:text-primary transition-colors" size={16} />
                                            <input
                                                type="text"
                                                value={formData.unit}
                                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-[9px] font-bold focus:outline-none focus:border-primary/30 transition-all font-mono"
                                                placeholder="PER_UNIT"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-white/80 uppercase tracking-[0.4em] ml-1 italic">Capacity Index</label>
                                        <div className="relative group">
                                            <Info className="absolute left-5 top-1/2 -translate-y-1/2 text-white/70 group-focus-within:text-primary transition-colors" size={16} />
                                            <input
                                                type="number"
                                                value={formData.capacity_per_unit}
                                                onChange={(e) => setFormData({ ...formData, capacity_per_unit: e.target.value })}
                                                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-[9px] font-bold focus:outline-none focus:border-primary/30 transition-all font-mono"
                                                placeholder="250"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-white/80 uppercase tracking-[0.4em] ml-1 italic">Operational Briefing</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows="4"
                                        className="w-full bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 text-white text-[9px] font-medium placeholder:text-white/80 focus:outline-none focus:border-primary/30 transition-all resize-none leading-relaxed"
                                        placeholder="Enter detailed resource capabilities and mission parameters..."
                                    />
                                </div>

                                <div className="flex items-center gap-6 py-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, is_available: !formData.is_available })}
                                        className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all duration-500 ${formData.is_available
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-glow'
                                            : 'bg-white/5 border-white/10 text-white/60'
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${formData.is_available ? 'bg-emerald-500 shadow-glow animate-pulse' : 'bg-white/20'}`} />
                                        <span className="text-[11px] font-black uppercase tracking-widest">{formData.is_available ? 'Operational' : 'Off-Line'}</span>
                                    </button>
                                </div>

                                <Button
                                    type="submit"
                                    variant="luxury"
                                    className="w-full h-16 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.5em] mt-4 italic"
                                >
                                    {editingService ? 'Sync Optimization' : 'Authorize Deployment'}
                                </Button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ServiceManager;
