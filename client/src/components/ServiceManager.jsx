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
        <div className="space-y-8">
            {/* Grid of Services */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((res) => (
                    <motion.div
                        key={res._id}
                        layout
                        className="glass-panel group p-6 rounded-[32px] border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                                {res.category}
                            </span>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(res)} className="p-2 rounded-xl bg-white/5 hover:bg-white/20 text-gray-400 transition-all">
                                    <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleDelete(res._id)} className="p-2 rounded-xl bg-red-500/5 hover:bg-red-500/20 text-red-500 transition-all opacity-0 group-hover:opacity-100">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                        <h4 className="text-xl font-bold text-white mb-2">{res.name}</h4>
                        <p className="text-xs text-gray-500 mb-6 line-clamp-2">{res.description}</p>

                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                            <div>
                                <span className="text-2xl font-black text-white">₹{res.base_price}</span>
                                <span className="text-[10px] text-gray-500 uppercase font-bold ml-2 tracking-widest">{res.unit}</span>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${res.is_available ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-600'}`} />
                        </div>
                    </motion.div>
                ))}

                {/* Blank Add Card */}
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="h-full min-h-[220px] rounded-[32px] border border-dashed border-white/10 bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-4 group"
                    >
                        <div className="p-4 rounded-full bg-white/5 group-hover:bg-primary/20 group-hover:text-primary transition-all">
                            <Plus size={32} />
                        </div>
                        <span className="text-sm font-bold text-gray-500">Add New Resource</span>
                    </button>
                )}
            </div>

            {/* Modal/Form Overlay */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="w-full max-w-2xl glass-panel p-10 rounded-[48px] border border-white/10 bg-[#0a0a0b]"
                        >
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <h2 className="text-3xl font-black text-white tracking-tighter">
                                        {editingService ? 'Optimize Service' : 'Publish Resource'}
                                    </h2>
                                    <p className="text-gray-500 text-sm mt-1">Configure your tactical event services.</p>
                                </div>
                                <button
                                    onClick={() => { setIsAdding(false); setEditingService(null); }}
                                    className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Service Name</label>
                                        <div className="relative group">
                                            <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors" size={18} />
                                            <input
                                                required
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                                                placeholder="Elite Sound System..."
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Category</label>
                                        <div className="relative group">
                                            <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors" size={18} />
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all appearance-none"
                                            >
                                                {['Security', 'Food', 'Audio/Visual', 'Logistics', 'Decor', 'Technical'].map(cat => (
                                                    <option key={cat} value={cat} className="bg-[#1a1a1c]">{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Base Price</label>
                                        <div className="relative group">
                                            <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors" size={18} />
                                            <input
                                                required
                                                type="number"
                                                value={formData.base_price}
                                                onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Pricing Unit</label>
                                        <div className="relative group">
                                            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors" size={18} />
                                            <input
                                                type="text"
                                                value={formData.unit}
                                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                                                placeholder="per guard"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Capacity/U</label>
                                        <div className="relative group">
                                            <Info className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors" size={18} />
                                            <input
                                                type="number"
                                                value={formData.capacity_per_unit}
                                                onChange={(e) => setFormData({ ...formData, capacity_per_unit: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                                                placeholder="250"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows="3"
                                        className="w-full bg-white/5 border border-white/10 rounded-[32px] p-6 text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all resize-none"
                                        placeholder="Detailed capabilities and terms..."
                                    />
                                </div>

                                <div className="flex items-center gap-4 py-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, is_available: !formData.is_available })}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${formData.is_available
                                            ? 'bg-green-500/10 border-green-500/30 text-green-500'
                                            : 'bg-white/5 border-white/10 text-gray-500'
                                            }`}
                                    >
                                        {formData.is_available ? <Check size={16} /> : <X size={16} />}
                                        <span className="text-xs font-bold uppercase tracking-widest">Available for Booking</span>
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full !bg-white py-5 rounded-[32px] !text-slate-950 font-black text-lg shadow-xl shadow-white/5 hover:scale-[1.01] transition-all active:scale-95"
                                >
                                    {editingService ? 'Sync Optimization' : 'Authorize Release'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ServiceManager;
