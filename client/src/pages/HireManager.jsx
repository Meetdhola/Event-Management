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
                <div className="flex items-center justify-between px-1">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none uppercase">
                            hire <span className="text-gradient-gold-soft italic font-serif">MANAGER.</span>
                        </h1>
                        <p className="text-[11px] text-white/70 mt-3 uppercase tracking-[0.4em] font-black">Choose an event manager for your next event • Secure Access</p>
                    </div>
                </div>

                {!selectedManager ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        {/* Intelligence Flow */}
                        <div className="relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/80 group-focus-within:text-primary transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search managers..."
                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-xs font-black uppercase tracking-widest text-white placeholder:text-white/80 focus:outline-none focus:border-primary/20 transition-all font-mono"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-[11px] font-black text-white/90 px-1 uppercase tracking-[0.4em]">Available Managers</h2>
                            {filteredManagers.length === 0 ? (
                                <div className="py-24 flex flex-col items-center justify-center app-card bg-surface/40 border-dashed opacity-10">
                                    <Crosshair size={48} className="text-white mb-4" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.5em]">No managers found</p>
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
                                                <h3 className="text-[11px] font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors">{manager.name}</h3>
                                                <p className="text-[11px] text-white/80 font-black uppercase tracking-[0.3em] mt-1.5">{manager.email}</p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => setSelectedManager(manager)}
                                            variant="ghost-luxury"
                                            className="btn-icon-ghost-luxury p-0"
                                        >
                                            <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                                        </Button>
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
                            <Button
                                onClick={() => setSelectedManager(null)}
                                variant="ghost-luxury"
                                className="w-14 h-14 rounded-2xl p-0 flex items-center justify-center hover:text-rose-500 hover:border-rose-500/20"
                            >
                                <ArrowLeft size={18} />
                            </Button>
                            <div>
                                <h2 className="text-2xl font-serif text-white tracking-widest uppercase italic leading-none">
                                    Hiring <span className="text-primary not-italic">Request</span>
                                </h2>
                                <p className="text-[11px] text-white/80 font-black uppercase tracking-[0.4em] mt-3">Manager: {selectedManager.name}</p>
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                        <label className="text-[11px] font-black text-white/80 uppercase tracking-[0.4em] px-2 italic">Operation Briefing</label>
                                        <textarea
                                            className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-white text-xs focus:outline-none focus:border-primary/40 transition-all min-h-[140px] font-medium leading-relaxed placeholder:text-white/80"
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                    <Button
                                        type="button"
                                        variant="ghost-luxury"
                                        className="flex-1 h-16 rounded-2xl text-[11px] font-black uppercase tracking-widest"
                                        onClick={() => setSelectedManager(null)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="luxury"
                                        className="flex-[2] h-16 rounded-2xl text-xs font-black uppercase tracking-[0.4em] italic shadow-glow"
                                    >
                                        Send Request
                                    </Button>
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
