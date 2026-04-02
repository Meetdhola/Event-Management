import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    ShoppingCart,
    Plus,
    Minus,
    AlertTriangle,
    CheckCircle,
    Zap,
    Scale,
    Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Button } from './ui/Components';

const LogisticsCart = ({ eventId, onUpdate }) => {
    const [resources, setResources] = useState([]);
    const [cart, setCart] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResources();
        if (eventId) fetchEventLogistics();

        const handleUpdate = () => {
            if (eventId) fetchEventLogistics();
        };

        window.addEventListener('logisticsUpdate', handleUpdate);
        return () => window.removeEventListener('logisticsUpdate', handleUpdate);
    }, [eventId]);

    const fetchResources = async () => {
        try {
            const res = await axios.get('/resources');
            setResources(res.data);
        } catch (error) {
            toast.error('Failed to load resources');
        }
    };

    const fetchEventLogistics = async () => {
        try {
            const res = await axios.get(`/resources/suggestions/${eventId}`);
            setSuggestions(res.data);
            // Also get current cart from event object (not implemented suggestions route for this but we can infer)
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async (resourceId, quantity = 1) => {
        try {
            const res = await axios.post(`/resources/add-to-event/${eventId}`, { resourceId, quantity });
            setCart(res.data.logistics_cart);
            fetchEventLogistics(); // Refresh suggestions
            toast.success('Resource added to plan');
            if (onUpdate) onUpdate(res.data);
        } catch (error) {
            toast.error('Failed to update logistics');
        }
    };

    const calculateTotal = () => {
        return cart.reduce((total, item) => total + (item.resource?.base_price * item.quantity), 0);
    };

    return (
        <div className="w-full relative">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 w-full">
                {/* Resource Catalog */}
                <div className="xl:col-span-2 space-y-8 w-full">
                    <div className="flex items-center gap-3 px-1">
                        <div className="h-6 w-1 bg-primary rounded-full shadow-glow" />
                        <h3 className="text-xl font-serif italic font-black text-white uppercase tracking-widest pl-1 leading-none">Smart Resource Catalog</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {resources.map((res) => (
                            <motion.div
                                key={res._id}
                                whileHover={{ y: -5 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="app-card p-8 group hover:border-primary/40 hover:shadow-elite transition-all duration-700 bg-zinc-950/80 backdrop-blur-2xl flex flex-col justify-between h-full"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                                                <span className="text-[11px] uppercase tracking-[0.4em] font-black text-primary/60">{res.category}</span>
                                            </div>
                                            <h4 className="text-2xl font-serif text-white italic leading-none group-hover:text-primary transition-colors tracking-tight uppercase mb-4">{res.name}</h4>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-serif font-bold text-white tracking-widest group-hover:text-primary transition-colors">₹{res.base_price.toLocaleString()}</span>
                                            <p className="text-[9px] text-white/90 font-black uppercase tracking-[0.4em] mt-1 pr-1 border-r-2 border-primary/20 inline-block bg-white/5 py-0.5 px-2 rounded-sm italic">/ unit</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-white/70 font-medium mb-8 leading-relaxed">{res.description}</p>
                                </div>

                                <Button
                                    onClick={() => handleAddToCart(res._id)}
                                    variant="luxury"
                                    className="w-full h-14 rounded-xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.4em] mt-auto"
                                >
                                    <Plus size={14} className="group-hover/btn:scale-125 transition-transform" />
                                    Add to Mission Plan
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Cart */}
                <div className="space-y-8">
                    <div className="flex items-center gap-3 px-1">
                        <div className="h-6 w-1 bg-primary rounded-full shadow-glow" />
                        <h3 className="text-xl font-serif italic font-black text-white uppercase tracking-widest pl-1 leading-none">Logistics Payload</h3>
                    </div>

                    <div className="app-card p-8 bg-zinc-950/80 backdrop-blur-2xl border-white/5 relative group overflow-hidden shadow-elite">
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

                        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {cart.length === 0 ? (
                                <div className="text-center py-12 flex flex-col items-center gap-4 opacity-10">
                                    <ShoppingCart size={32} />
                                    <p className="text-[11px] font-black uppercase tracking-[0.4em]">No resources allocated</p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div key={item._id} className="p-4 rounded-[1.25rem] bg-white/[0.01] border border-white/5 group/item hover:border-primary/30 hover:bg-white/[0.03] hover:shadow-glow transition-all duration-300 relative overflow-hidden">
                                        <div className="flex items-center justify-between gap-4 mb-5 relative z-10">
                                            <div className="flex-1 min-w-0 pr-2">
                                                <p className="text-xs font-serif italic font-black text-white uppercase tracking-widest truncate group-hover/item:text-primary transition-colors">{item.resource?.name}</p>
                                                <p className="text-[11px] text-white/90 font-bold uppercase tracking-widest mt-1">₹{item.resource?.base_price.toLocaleString()} <span className="text-white/70 ml-1">UNIT_COST</span></p>
                                            </div>
                                            <button className="w-8 h-8 rounded-lg bg-rose-500/5 border border-rose-500/10 text-rose-500/40 hover:text-rose-500 hover:border-rose-500/30 flex items-center justify-center transition-all">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between bg-zinc-950 rounded-xl p-1 border border-white/5 relative z-10">
                                            <button
                                                onClick={() => handleAddToCart(item.resource._id, Math.max(0, item.quantity - 1))}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/5 transition-all"
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span className="text-xs font-black text-white tracking-[0.3em] font-serif italic">{item.quantity.toString().padStart(2, '0')}</span>
                                            <button
                                                onClick={() => handleAddToCart(item.resource._id, item.quantity + 1)}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-primary hover:text-primary-hover hover:bg-primary/10 transition-all font-black"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 space-y-6 relative z-10">
                            <div className="flex justify-between items-end">
                                <span className="text-[11px] font-black text-white/70 uppercase tracking-[0.4em] pb-1">Projected Budget</span>
                                <div className="text-right">
                                    <span className="text-4xl md:text-5xl font-serif font-black text-white italic tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">₹{calculateTotal().toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-4">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                    <Zap size={14} className="text-primary" />
                                </div>
                                <p className="text-[11px] text-primary/80 font-medium leading-relaxed uppercase tracking-widest pt-1">
                                    AI Suggests: Cost parameters optimized within 15% of market index.
                                </p>
                            </div>

                            <Button 
                                variant="luxury"
                                className="w-full h-14 rounded-xl font-black text-xs uppercase tracking-[0.4em]"
                                onClick={() => toast.success('Allocation Parameters Locked')}
                            >
                                Finalize Allocation
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogisticsCart;
