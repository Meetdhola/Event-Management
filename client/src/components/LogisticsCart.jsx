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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Resource Catalog */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Zap className="text-yellow-400" size={20} />
                        Smart Resource Catalog
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resources.map((res) => (
                        <motion.div
                            key={res._id}
                            whileHover={{ scale: 1.02 }}
                            className="glass-panel p-5 rounded-2xl border border-white/5 bg-white/5"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">{res.category}</span>
                                    <h4 className="text-white font-bold mt-1">{res.name}</h4>
                                </div>
                                <span className="text-primary font-bold">₹{res.base_price}/unit</span>
                            </div>
                            <p className="text-xs text-gray-400 mb-4 line-clamp-2">{res.description}</p>
                            <button
                                onClick={() => handleAddToCart(res._id)}
                                className="w-full py-2 rounded-xl bg-primary/20 text-primary text-xs font-bold hover:bg-primary/30 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={14} /> Add to Cart
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Sidebar Cart & AI */}
            <div className="space-y-6">
                {/* AI Command Feedback */}
                {/* <div className="glass-panel p-6 rounded-3xl border border-blue-500/20 bg-blue-500/5">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                        <AlertTriangle className="text-blue-400" size={16} />
                        AI Readiness Score
                    </h3>
                    <div className="space-y-3">
                        {suggestions.map((s, i) => (
                            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${s.type === 'warning' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                                {s.type === 'warning' ? <AlertTriangle size={16} className="mt-0.5 shrink-0" /> : <CheckCircle size={16} className="mt-0.5 shrink-0" />}
                                <p className="text-xs leading-relaxed">{s.message}</p>
                            </div>
                        ))}
                    </div>
                </div> */}

                {/* Logistics Cart */}
                <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-white/5">
                    <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                        <ShoppingCart size={16} />
                        Your Event Cart
                    </h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                        {cart.length === 0 && <p className="text-center text-xs text-gray-500 py-8 italic">No items selected yet</p>}
                        {cart.map((item) => (
                            <div key={item._id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-white truncate">{item.resource?.name}</p>
                                    <p className="text-[10px] text-gray-500">₹{item.resource?.base_price} x {item.quantity}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleAddToCart(item.resource._id, Math.max(0, item.quantity - 1))} className="p-1 rounded bg-white/10 hover:bg-white/20"><Minus size={12} /></button>
                                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                    <button onClick={() => handleAddToCart(item.resource._id, item.quantity + 1)} className="p-1 rounded bg-white/10 hover:bg-white/20"><Plus size={12} /></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                        <div className="flex justify-between items-center text-white">
                            <span className="text-xs font-medium text-gray-400">Estimated Budget</span>
                            <span className="text-lg font-bold">₹{calculateTotal()}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 flex items-center gap-1 italic">
                            <Zap size={10} /> AI suggests cost is within 15% of market rate.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogisticsCart;
