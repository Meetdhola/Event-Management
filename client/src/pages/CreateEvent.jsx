import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    Calendar,
    MapPin,
    Type,
    AlignLeft,
    Image as ImageIcon,
    ArrowLeft,
    Loader2,
    Users,
    Layers,
    ChevronRight,
    Check,
    Zap,
    ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Card, Badge } from '../components/ui/Components';
import LogisticsCart from '../components/LogisticsCart';

const CreateEvent = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [createdEventId, setCreatedEventId] = useState(null);
    const [formData, setFormData] = useState({
        event_name: '',
        event_type: 'Concert',
        description: '',
        venue: '',
        start_date: '',
        end_date: '',
        expected_audience: '',
        image: ''
    });
    const navigate = useNavigate();

    const { event_name, event_type, description, venue, start_date, end_date, expected_audience, image } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (step === 1) {
            if (!event_name || !event_type || !description) {
                toast.error('Please fill all basic details');
                return;
            }
            setStep(2);
            return;
        }

        if (step === 2) {
            if (!venue || !start_date || !end_date || !expected_audience) {
                toast.error('Please fill all logistics details');
                return;
            }
            setStep(3);
            return;
        }

        setLoading(true);

        try {
            const res = await axios.post('/events', formData);
            setCreatedEventId(res.data._id);
            setStep(4);
            toast.success('Event details saved! Now plan your logistics.');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to create event');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { id: 1, label: 'Basics' },
        { id: 2, label: 'Location' },
        { id: 3, label: 'Images' },
        { id: 4, label: 'Resources' }
    ];

    return (
        <div className="main-content">
            <div className={`mx-auto px-4 pt-4 pb-32 sm:pb-4 space-y-6 transition-all duration-500 ${step === 4 ? 'max-w-7xl' : 'max-w-2xl'}`}>

                {/* Header Section */}
                <div className="flex items-center justify-between px-1">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none uppercase">
                            create <span className="text-gradient-gold-soft italic font-serif">EVENT.</span>
                        </h1>
                        <p className="text-[11px] text-white/70 mt-3 uppercase tracking-[0.4em] font-black">Fill in the details to host your next event • Secured</p>
                    </div>
                    <Link to="/dashboard" className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-primary/20 hover:text-primary transition-all group">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar px-1">
                    {steps.map((s) => (
                        <button
                            key={s.id}
                            className={`flex items-center gap-3 px-6 py-3 rounded-full border transition-all duration-500 whitespace-nowrap ${step >= s.id
                                ? 'btn-luxury min-h-0 h-11 border-none px-6'
                                : 'bg-white/[0.02] border-white/5 text-white/60'}`}
                            onClick={() => step > s.id && setStep(s.id)}
                        >
                            <span className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2`}>
                                {step > s.id ? (
                                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-background scale-110 shadow-lg">
                                        <Check size={12} strokeWidth={4} />
                                    </div>
                                ) : (
                                    <span className={step === s.id ? 'text-primary' : ''}>0{s.id}</span>
                                )}
                                {s.label}
                            </span>
                        </button>
                    ))}
                </div>

                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="app-card p-8 md:p-10 relative overflow-hidden bg-surface/40 backdrop-blur-3xl"
                >
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

                    {step < 4 ? (
                        <form onSubmit={handleSubmit} className="space-y-10">
                            {step === 1 && (
                                <div className="space-y-8">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-4 w-1 bg-primary rounded-full" />
                                        <p className="text-[11px] font-black text-white/70 uppercase tracking-[0.4em]">Basic details</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
                                        <Input
                                            label="Event Name"
                                            name="event_name"
                                            icon={Type}
                                            value={event_name}
                                            onChange={onChange}
                                            required
                                            placeholder="Ex: Music Festival 2024"
                                            className="h-14 rounded-2xl"
                                        />
                                        <div className="space-y-2 group">
                                            <label className="text-[11px] uppercase tracking-[0.3em] font-bold text-muted ml-1 group-focus-within:text-primary transition-colors">Event Type <span className="text-red-500 ml-1 text-xs leading-none">*</span></label>
                                            <div className="relative">
                                                <Layers size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" />
                                                <select
                                                    name="event_type"
                                                    value={event_type}
                                                    onChange={onChange}
                                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-[11px] font-bold text-white focus:outline-none focus:border-primary/40 transition-all appearance-none"
                                                >
                                                    <option value="Concert" className="bg-background">Concert</option>
                                                    <option value="Fest" className="bg-background">Fest</option>
                                                    <option value="Conference" className="bg-background">Conference</option>
                                                    <option value="Exhibition" className="bg-background">Exhibition</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] uppercase tracking-[0.3em] font-bold text-muted ml-1">Event Description <span className="text-red-500 ml-1 text-xs leading-none">*</span></label>
                                        <textarea
                                            name="description"
                                            value={description}
                                            onChange={onChange}
                                            required
                                            rows="5"
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-[11px] font-bold text-white placeholder:text-white/80 focus:outline-none focus:border-primary/40 transition-all resize-none"
                                            placeholder="Describe your event here..."
                                        />
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-8">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-4 w-1 bg-primary rounded-full" />
                                        <p className="text-[11px] font-black text-white/70 uppercase tracking-[0.4em]">Location & Timing</p>
                                    </div>
                                    <Input
                                        label="Event Venue"
                                        name="venue"
                                        icon={MapPin}
                                        value={venue}
                                        onChange={onChange}
                                        required
                                        placeholder="Grand Plaza or City Stadium"
                                        className="h-14 rounded-2xl"
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
                                        <Input
                                            label="Commencement"
                                            type="datetime-local"
                                            name="start_date"
                                            value={start_date}
                                            onChange={onChange}
                                            required
                                            className="h-14 rounded-2xl inline-block"
                                        />
                                        <Input
                                            label="Conclusion"
                                            type="datetime-local"
                                            name="end_date"
                                            value={end_date}
                                            onChange={onChange}
                                            required
                                            className="h-14 rounded-2xl"
                                        />
                                    </div>
                                    <Input
                                        label="Projected Audience"
                                        type="number"
                                        name="expected_audience"
                                        icon={Users}
                                        value={expected_audience}
                                        onChange={onChange}
                                        required
                                        placeholder="Ex: 500"
                                        className="h-14 rounded-2xl"
                                    />
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-8">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-4 w-1 bg-primary rounded-full" />
                                        <p className="text-[11px] font-black text-white/70 uppercase tracking-[0.4em]">Event Image</p>
                                    </div>
                                    <Input
                                        label="Image URL"
                                        type="url"
                                        name="image"
                                        icon={ImageIcon}
                                        value={image}
                                        onChange={onChange}
                                        placeholder="https://images.unsplash.com/..."
                                        className="h-14 rounded-2xl"
                                    />
                                    <div className="relative w-full aspect-video rounded-[2.5rem] border-2 border-dashed border-white/5 bg-white/[0.02] flex flex-col items-center justify-center text-muted overflow-hidden group hover:border-primary/20 transition-all">
                                        {image ? (
                                            <motion.img
                                                initial={{ scale: 1.1, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                src={image}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="text-center p-10">
                                                <div className="p-5 rounded-full bg-white/5 inline-block mb-4">
                                                    <ImageIcon size={40} className="text-primary/50" />
                                                </div>
                                                <p className="text-[11px] uppercase font-black tracking-widest text-white/80">Image Preview</p>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-5 pt-4">
                                {step > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setStep(step - 1)}
                                        className="btn-ghost-luxury flex-1 h-16"
                                    >
                                        <ArrowLeft size={16} className="mr-2" /> Back
                                    </button>
                                )}
                                <Button
                                    type="submit"
                                    variant="primary"
                                    isLoading={loading}
                                    className="btn-luxury flex-1 sm:flex-[2] h-16 italic"
                                >
                                    {step === 3 ? 'Create Event' : 'Next Step'}
                                    {step < 3 && <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-12"
                        >
                            <LogisticsCart eventId={createdEventId} />
                            <div className="flex flex-col items-center gap-8 pt-8 border-t border-white/5">
                                <div className="text-center">
                                    <p className="text-[11px] font-black text-primary uppercase tracking-[0.5em] mb-2 animate-pulse">Success</p>
                                    <h3 className="text-2xl font-black text-white">Event Created!</h3>
                                </div>
                                <Button
                                    onClick={() => navigate('/dashboard')}
                                    variant="prismatic"
                                    className="px-14 h-16 rounded-2xl text-xs font-black uppercase tracking-[0.4em] shadow-elite"
                                >
                                    Go to Dashboard
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* Secure Note */}
                <div className="flex items-center justify-center gap-3 opacity-20 py-10">
                    <ShieldCheck size={14} className="text-primary" />
                    <span className="text-[11px] font-black uppercase tracking-[0.5em] text-white">Securely Created & Encrypted</span>
                </div>
            </div>
        </div>
    );
};

export default CreateEvent;
