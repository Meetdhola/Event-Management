import { useEffect, useRef, useState } from 'react';
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
    ChevronDown,
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
    const eventTypeOptions = ['Concert', 'Fest', 'Conference', 'Exhibition', 'Workshop', 'Seminar', 'Meetup', 'Sports', 'Other'];

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [createdEventId, setCreatedEventId] = useState(null);
    const [customEventType, setCustomEventType] = useState('');
    const [isEventTypeOpen, setIsEventTypeOpen] = useState(false);
    const eventTypeMenuRef = useRef(null);
    const [formData, setFormData] = useState({
        event_name: '',
        event_type: 'Concert',
        description: '',
        venue: '',
        start_date: '',
        end_date: '',
        expected_audience: '',
        budget_planned: '',
        image: ''
    });
    const navigate = useNavigate();

    const getLocalDateTimeMin = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    const [minDateTime] = useState(getLocalDateTimeMin());

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (eventTypeMenuRef.current && !eventTypeMenuRef.current.contains(event.target)) {
                setIsEventTypeOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    const { event_name, event_type, description, venue, start_date, end_date, expected_audience, budget_planned, image } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        const selectedEventType = event_type === 'Other' ? customEventType.trim() : event_type;

        if (step === 1) {
            if (!event_name || !selectedEventType || !description) {
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

            const now = new Date();
            const start = new Date(start_date);
            const end = new Date(end_date);

            if (start < now) {
                toast.error('Commencement cannot be before current date/time');
                return;
            }

            if (end <= start) {
                toast.error('Conclusion must be after commencement');
                return;
            }

            setStep(3);
            return;
        }

        setLoading(true);

        try {
            const payload = {
                ...formData,
                event_type: selectedEventType
            };
            const res = await axios.post('/events', payload);
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

    const handleImageFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                setFormData((prev) => ({ ...prev, image: reader.result }));
                toast.success('Image loaded from local file');
            }
        };
        reader.onerror = () => toast.error('Failed to read selected image');
        reader.readAsDataURL(file);
    };

    return (
        <div className="main-content">
            <div className={`mx-auto px-4 pt-4 pb-32 sm:pb-4 space-y-6 transition-all duration-500 ${step === 4 ? 'max-w-7xl' : 'max-w-2xl'}`}>

                {/* Header Section */}
                <div className="flex items-center justify-between px-1">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none uppercase">
                            create <span className="text-gradient-gold-soft italic font-serif">EVENT.</span>
                        </h1>
                        <p className="text-[11px] text-white/70 mt-3 uppercase tracking-[0.4em] font-black">Fill in the details to host your next event | Secured</p>
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
                                            <div ref={eventTypeMenuRef} className="relative">
                                                <Layers size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted transition-colors pointer-events-none z-10" />
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEventTypeOpen((prev) => !prev)}
                                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-[11px] font-bold text-white text-left focus:outline-none focus:border-primary/40 transition-all"
                                                >
                                                    {event_type}
                                                </button>
                                                <ChevronDown
                                                    size={16}
                                                    className={`absolute right-5 top-1/2 -translate-y-1/2 text-white/70 transition-transform ${isEventTypeOpen ? 'rotate-180' : ''}`}
                                                />

                                                <AnimatePresence>
                                                    {isEventTypeOpen && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                                            className="absolute z-[80] mt-2 w-full rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden"
                                                        >
                                                            <div className="max-h-64 overflow-y-auto no-scrollbar">
                                                                {eventTypeOptions.map((typeOption) => (
                                                                    <button
                                                                        key={typeOption}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setFormData((prev) => ({ ...prev, event_type: typeOption }));
                                                                            if (typeOption !== 'Other') setCustomEventType('');
                                                                            setIsEventTypeOpen(false);
                                                                        }}
                                                                        className={`w-full px-5 py-3 text-left text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${event_type === typeOption
                                                                            ? 'bg-primary/15 text-primary'
                                                                            : 'text-white hover:bg-white/[0.05]'
                                                                            }`}
                                                                    >
                                                                        {typeOption}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>
                                    {event_type === 'Other' && (
                                        <Input
                                            label="Specify Event Type"
                                            name="custom_event_type"
                                            icon={Layers}
                                            value={customEventType}
                                            onChange={(e) => setCustomEventType(e.target.value)}
                                            required
                                            placeholder="Ex: Charity Gala"
                                            className="h-14 rounded-2xl"
                                        />
                                    )}
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
                                            min={minDateTime}
                                            required
                                            className="h-14 rounded-2xl inline-block"
                                        />
                                        <Input
                                            label="Conclusion"
                                            type="datetime-local"
                                            name="end_date"
                                            value={end_date}
                                            onChange={onChange}
                                            min={start_date || minDateTime}
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
                                    <Input
                                        label="Planned Budget (INR)"
                                        type="number"
                                        name="budget_planned"
                                        icon={Zap}
                                        value={budget_planned}
                                        onChange={onChange}
                                        placeholder="Ex: 250000"
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
                                        label="Image URL (Optional)"
                                        type="url"
                                        name="image"
                                        icon={ImageIcon}
                                        value={image}
                                        onChange={onChange}
                                        placeholder="https://images.unsplash.com/..."
                                        className="h-14 rounded-2xl"
                                    />
                                    <div className="space-y-2">
                                        <label className="text-[11px] uppercase tracking-[0.3em] font-bold text-muted ml-1">Or Upload from Device</label>
                                        <div className="relative">
                                            <ImageIcon size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageFileChange}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-[11px] font-bold text-white file:mr-4 file:rounded-xl file:border-0 file:bg-primary/15 file:px-3 file:py-1.5 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:text-primary"
                                            />
                                        </div>
                                    </div>
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
