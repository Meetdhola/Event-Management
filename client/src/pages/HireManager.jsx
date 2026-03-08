import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Button, Input, Badge } from '../components/ui/Components';
import {
    User,
    Calendar,
    MapPin,
    ArrowRight,
    Users,
    CheckCircle2,
    Briefcase,
    ChevronRight,
    Search,
    ArrowLeft,
    Shield,
    Target,
    Zap,
    X,
    Target as TargetIcon,
    Crosshair
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const HireManager = () => {
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedManager, setSelectedManager] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        event_name: '',
        event_type: '',
        description: '',
        venue: '',
        start_date: '',
        end_date: '',
        expected_audience: ''
    });

    useEffect(() => {
        fetchManagers();
    }, []);

    const fetchManagers = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/hiring/managers');
            setManagers(res.data);
        } catch (error) {
            toast.error('Failed to load managers');
        } finally {
            setLoading(false);
        }
    };

    const handleHire = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/hiring/hire', {
                ...formData,
                manager_id: selectedManager._id
            });
            toast.success(`Hired ${selectedManager.name} successfully!`);
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Hiring failed');
        }
    };

    const filteredManagers = managers.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <h1 className="text-2xl font-black text-white leading-tight uppercase tracking-widest italic font-serif">Hire Manager <span className="text-primary not-italic">🤝</span></h1>
                        <p className="text-[10px] text-white/40 mt-1 uppercase tracking-[0.4em] font-black">Choose an event manager for your next event • Secure Access</p>
                    </div>
                </div>

                {!selectedManager ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        {/* Intelligence Flow */}
                        <div className="relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search managers..."
                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-[11px] font-black uppercase tracking-widest text-white placeholder:text-white/10 focus:outline-none focus:border-primary/20 transition-all font-mono"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-[10px] font-black text-white/30 px-1 uppercase tracking-[0.4em]">Available Managers</h2>
                            {filteredManagers.length === 0 ? (
                                <div className="py-24 flex flex-col items-center justify-center app-card bg-zinc-900/40 border-dashed opacity-10">
                                    <Crosshair size={48} className="text-white mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">No managers found</p>
                                </div>
                            ) : (
                                filteredManagers.map((manager, index) => (
                                    <motion.div
                                        key={manager._id}
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.04 }}
                                        className="app-card p-5 flex items-center justify-between gap-6 group hover:border-primary/30 transition-all duration-500"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-primary font-serif italic text-xl shadow-inner group-hover:scale-105 transition-transform duration-500">
                                                {manager.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors">{manager.name}</h3>
                                                <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.3em] mt-1.5">{manager.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedManager(manager)}
                                            className="w-11 h-11 rounded-xl bg-white/5 border border-white/5 text-white/20 group-hover:text-primary group-hover:border-primary/20 transition-all flex items-center justify-center"
                                        >
                                            <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-10"
                    >
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setSelectedManager(null)}
                                className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 text-white/40 hover:text-rose-500 hover:border-rose-500/20 transition-all flex items-center justify-center"
                            >
                                <ArrowLeft size={18} />
                            </button>
                            <div>
                                <h2 className="text-2xl font-serif text-white tracking-widest uppercase italic leading-none">
                                    Hiring <span className="text-primary not-italic">Request</span>
                                </h2>
                                <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.4em] mt-3">Manager: {selectedManager.name}</p>
                            </div>
                        </div>

                        <div className="app-card p-10 bg-zinc-950/40 relative group overflow-hidden shadow-2xl">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                            <form onSubmit={handleHire} className="space-y-8">
                                <div className="space-y-6">
                                    <Input
                                        label="Event Name"
                                        placeholder="Enter event name"
                                        required
                                        value={formData.event_name}
                                        onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                                    />
                                    <div className="grid grid-cols-2 gap-6">
                                        <Input
                                            label="Event Type"
                                            placeholder="Gala, Music, etc."
                                            required
                                            value={formData.event_type}
                                            onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                                        />
                                        <Input
                                            type="number"
                                            label="Expected Guests"
                                            placeholder="1000"
                                            required
                                            value={formData.expected_audience}
                                            onChange={(e) => setFormData({ ...formData, expected_audience: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-1.5 px-1">
                                        <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] px-2 italic">Operation Briefing</label>
                                        <textarea
                                            className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-white text-[12px] focus:outline-none focus:border-primary/40 transition-all min-h-[140px] font-medium leading-relaxed placeholder:text-white/10"
                                            placeholder="Describe what you need for this event..."
                                            required
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>

                                    <Input
                                        label="Venue Location"
                                        placeholder="Ex: Mumbai Stadium"
                                        required
                                        value={formData.venue}
                                        onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                                    />
                                    <div className="grid grid-cols-2 gap-6">
                                        <Input
                                            type="date"
                                            label="Start Date"
                                            required
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        />
                                        <Input
                                            type="date"
                                            label="End Date"
                                            required
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-6 pt-6">
                                    <button
                                        type="button"
                                        className="flex-1 h-16 rounded-2xl bg-white/5 text-white/20 border border-white/5 font-black uppercase text-[10px] tracking-widest hover:text-white transition-all"
                                        onClick={() => setSelectedManager(null)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] h-16 rounded-2xl bg-primary text-background font-black uppercase text-[11px] tracking-[0.4em] shadow-[0_0_40px_rgba(212,175,55,0.2)] hover:scale-[1.02] transition-all italic"
                                    >
                                        Send Request
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default HireManager;
