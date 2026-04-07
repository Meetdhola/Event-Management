import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Card, Badge } from '../components/ui/Components';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Briefcase, Heart, Calendar, Crown, CheckCircle2, ArrowRight, ShieldCheck, Mail, Phone, Lock, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

const Register = () => {
    const phoneRegex = /^(?:\+91\s?)?\d{10}$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: '',
        phone: '',
        otp: ''
    });
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const { register, sendOTP } = useAuth();
    const navigate = useNavigate();

    const handleRoleSelect = (role) => {
        setFormData({ ...formData, role });
    };

    const handleSendOTP = async () => {
        if (!formData.email) {
            toast.error("Digital identity required first");
            return;
        }
        setLoading(true);
        const success = await sendOTP(formData.email);
        setLoading(false);
        if (success) setOtpSent(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (step === 1) {
            if (!formData.role) {
                toast.error("Selective mandate required");
                return;
            }
            setStep(2);
            return;
        }

        if (step === 2) {
            if (!otpSent) {
                toast.error("Verification protocol required");
                return;
            }
            if (!formData.otp) {
                toast.error("Auth code required");
                return;
            }
            setStep(3);
            return;
        }

        const normalizedPhone = formData.phone.trim();
        if (!phoneRegex.test(normalizedPhone)) {
            toast.error('Phone must be exactly 10 digits (optional +91 prefix)');
            return;
        }

        if (!passwordRegex.test(formData.password)) {
            toast.error('Password must be at least 8 chars with 1 uppercase, 1 number, and 1 special character');
            return;
        }

        setLoading(true);
        const success = await register({
            ...formData,
            phone: normalizedPhone
        });
        setLoading(false);
        if (success) navigate('/dashboard');
    };

    const roles = [
        { id: 'Attendee', icon: User, label: 'Attendee', desc: 'Secure access to elite gatherings' },
        { id: 'Client', icon: Briefcase, label: 'Client', desc: 'Direct extraordinary ventures' },
        { id: 'EventManager', icon: Calendar, label: 'Event Manager', desc: 'Architect high-scale experiences' },
        { id: 'Vendor', icon: ShieldCheck, label: 'Vendor', desc: 'Deliver couture services' },
        { id: 'Volunteer', icon: Heart, label: 'Volunteer', desc: 'Provide diplomatic support' },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-background">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-4xl relative z-10"
            >
                <div className="text-center mb-12">
                    <Badge variant="primary" className="mb-6 px-4 py-1.5 uppercase tracking-[0.4em] font-black text-[11px] rounded-full">Secure Registry</Badge>
                    <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight leading-none mb-6">
                        signup <span className="text-gradient-gold-soft italic font-serif">MANDATE.</span>
                    </h1>

                    <div className="flex items-center justify-center gap-3 mt-8">
                        {[1, 2, 3].map(s => (
                            <div key={s} className="flex flex-col items-center gap-2">
                                <div className={cn(
                                    "h-1 px-8 rounded-full transition-all duration-700",
                                    step >= s ? 'bg-primary shadow-[0_0_10px_rgba(212,175,55,0.5)]' : 'bg-white/5'
                                )} />
                                <span className={cn(
                                    "text-[9px] font-black uppercase tracking-widest",
                                    step === s ? "text-primary" : "text-white/80"
                                )}>Step 0{s}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="app-card p-10 md:p-14 relative overflow-hidden min-h-[500px] bg-surface/50 backdrop-blur-3xl border border-white/5 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.8)]">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

                    <AnimatePresence mode="wait">
                        <form key={step} onSubmit={handleSubmit} className="space-y-8 relative z-10">
                            {step === 1 ? (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-12"
                                >
                                    <div className="text-center">
                                        <p className="text-[11px] uppercase tracking-[0.4em] text-white/70 font-black mb-10">Classification of Deployment</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {roles.map((role) => {
                                            const Icon = role.icon;
                                            const isSelected = formData.role === role.id;
                                            return (
                                                <div
                                                    key={role.id}
                                                    onClick={() => handleRoleSelect(role.id)}
                                                    className={cn(
                                                        "cursor-pointer p-8 rounded-3xl border transition-all duration-700 flex flex-col items-center text-center gap-5 group hover:border-primary/40",
                                                        isSelected
                                                            ? "border-primary/40 bg-primary/10 shadow-[0_0_40px_rgba(212,175,55,0.1)] scale-[1.02]"
                                                            : "border-white/5 bg-white/[0.02]"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "p-5 rounded-[2rem] border transition-all duration-700",
                                                        isSelected ? "bg-primary text-background border-primary" : "bg-white/5 border-white/10 text-primary opacity-40 group-hover:opacity-100"
                                                    )}>
                                                        <Icon size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-3 group-hover:text-primary transition-colors">{role.label}</h4>
                                                        <p className="text-[11px] text-white/90 font-bold uppercase tracking-widest leading-relaxed px-2">{role.desc}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="max-w-xs mx-auto pt-6">
                                        <Button
                                            type="button"
                                            variant="primary"
                                            className="w-full h-16 text-xs font-black uppercase tracking-[0.4em] rounded-2xl"
                                            onClick={() => formData.role ? setStep(2) : toast.error("Selective mandate required")}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </motion.div>
                            ) : step === 2 ? (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-10 max-w-xl mx-auto"
                                >
                                    <div className="text-center">
                                        <p className="text-[11px] uppercase tracking-[0.4em] text-white/70 font-black mb-4">Verification Phase</p>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
                                            <ShieldCheck size={12} className="text-primary" />
                                            <p className="text-[11px] text-primary font-black uppercase tracking-widest">Global Auth Active</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <Input
                                            id="email"
                                            type="email"
                                            label="Email"
                                            placeholder="registry@elite.global"
                                            icon={Mail}
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                            disabled={otpSent}
                                            className="h-14 rounded-2xl"
                                        />
                                        {!otpSent ? (
                                            <Button
                                                type="button"
                                                variant="primary"
                                                onClick={handleSendOTP}
                                                className="w-full h-16 text-xs font-black uppercase tracking-[0.4em] rounded-2xl"
                                                isLoading={loading}
                                            >
                                                Request OTP
                                            </Button>
                                        ) : (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="space-y-10"
                                            >
                                                <Input
                                                    id="otp"
                                                    label="6-Digit Code"
                                                    placeholder="••••••"
                                                    value={formData.otp}
                                                    onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                                                    required
                                                    maxLength={6}
                                                    className="h-14 rounded-2xl text-center font-mono text-xl tracking-[0.5em]"
                                                />
                                                <div className="flex gap-4">
                                                    <button type="button" onClick={() => { setStep(1); setOtpSent(false); }} className="flex-1 h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] text-white/90 hover:text-white border border-white/5 bg-white/[0.02] transition-all">
                                                        Revise Role
                                                    </button>
                                                    <Button type="submit" variant="primary" className="flex-[2] h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.4em]">
                                                        Verify OTP
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-10 max-w-xl mx-auto"
                                >
                                    <div className="text-center">
                                        <p className="text-[11px] uppercase tracking-[0.4em] text-white/70 font-black mb-4">Finalize Registry</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input
                                            id="name"
                                            label="Full Name"
                                            placeholder="Ex: Alexander Hunt"
                                            icon={User}
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            className="h-14 rounded-2xl"
                                        />
                                        <Input
                                            id="phone"
                                            label="Phone number"
                                            placeholder="1234567890"
                                            icon={Phone}
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            required
                                            className="h-14 rounded-2xl"
                                        />
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        label="Password"
                                        placeholder="••••••••"
                                        icon={Lock}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        className="h-14 rounded-2xl"
                                    />

                                    <div className="flex gap-4 pt-4">
                                        <button type="button" onClick={() => setStep(2)} className="flex-1 h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] text-white/90 hover:text-white border border-white/5 bg-white/[0.02] transition-all">
                                            Return
                                        </button>
                                        <Button type="submit" variant="prismatic" isLoading={loading} className="flex-[2] h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.5em] shadow-glow">
                                            signup
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </form>
                    </AnimatePresence>
                </div>

                <div className="mt-12 text-center pb-12">
                    <p className="text-[11px] uppercase tracking-[0.4em] text-white/90 font-bold">Already part of the Website?</p>
                    <Link to="/login" className="group inline-flex items-center gap-2 mt-4 text-[11px] uppercase tracking-[0.5em] font-black text-primary hover:text-white transition-all py-2">
                        Sign In <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
