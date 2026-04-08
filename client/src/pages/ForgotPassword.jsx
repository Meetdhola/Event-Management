import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Button, Input, Card, Badge } from '../components/ui/Components';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Shield, Crown, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/auth/forgot-password', { email });
            toast.success("Identity verified. OTP sent to registry.");
            setStep(2);
        } catch (error) {
            toast.error(error.response?.data?.message || "Verification failed");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/auth/reset-password', { email, otp, password });
            toast.success("Security keys updated. Access restored.");
            setStep(3);
        } catch (error) {
            toast.error(error.response?.data?.message || "Reset failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-background">
            {/* Background Effects */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg relative z-10"
            >
                <div className="text-center mb-12">
                    <Badge variant="primary" className="mb-6 px-4 py-1.5 uppercase tracking-[0.4em] font-black text-[11px] rounded-full">Secure Recovery</Badge>
                    <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight leading-none mb-4 uppercase">
                        reset <span className="text-gradient-gold-soft italic font-serif">CODE.</span>
                    </h1>
                </div>

                <div className="app-card p-10 md:p-12 relative group bg-surface/50 backdrop-blur-3xl border border-white/5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] group">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.form
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleSendOTP}
                                className="space-y-8 relative z-10"
                            >
                                <p className="text-[11px] uppercase tracking-[0.3em] text-white/70 font-bold text-center leading-relaxed">
                                    Enter your registered email address to receive a security handshake code.
                                </p>
                                <Input
                                    id="email"
                                    type="email"
                                    label="Email Address"
                                    placeholder="registry@elite.managed"
                                    icon={Mail}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-white/5 border-white/10 rounded-2xl h-14"
                                />
                                <Button
                                    variant="primary"
                                    type="submit"
                                    isLoading={loading}
                                    className="w-full h-16 text-xs font-black uppercase tracking-[0.5em] rounded-2xl shadow-elite"
                                >
                                    Verify Identity
                                </Button>
                                <div className="text-center pt-4">
                                    <Link to="/login" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-black text-primary hover:text-white transition-all">
                                        <ArrowLeft size={12} /> Return to Login
                                    </Link>
                                </div>
                            </motion.form>
                        ) : step === 2 ? (
                            <motion.form
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleResetPassword}
                                className="space-y-8 relative z-10"
                            >
                                <div className="space-y-6">
                                    <Input
                                        id="otp"
                                        label="OTP Code"
                                        placeholder="••••••"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                        className="h-14 rounded-2xl text-center font-mono text-xl tracking-[0.5em]"
                                    />
                                    <Input
                                        id="password"
                                        type="password"
                                        label="New Password"
                                        placeholder="••••••••"
                                        icon={Lock}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="bg-white/5 border-white/10 rounded-2xl h-14"
                                    />
                                </div>
                                <Button
                                    variant="prismatic"
                                    type="submit"
                                    isLoading={loading}
                                    className="w-full h-16 text-xs font-black uppercase tracking-[0.5em] rounded-2xl shadow-glow"
                                >
                                    Update Security Key
                                </Button>
                            </motion.form>
                        ) : (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8 space-y-8"
                            >
                                <div className="inline-flex p-6 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-[0.2em]">Mandate Restored</h3>
                                <p className="text-[11px] text-white/60 font-medium uppercase tracking-[0.2em] leading-relaxed">
                                    Your security credentials have been successfully updated. You may now re-access the terminal.
                                </p>
                                <Button
                                    variant="luxury"
                                    onClick={() => navigate('/login')}
                                    className="w-full h-16 text-xs font-black uppercase tracking-[0.5em] rounded-2xl"
                                >
                                    Proceed to Login
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-16 text-center">
                    <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full bg-white/[0.02] border border-white/5">
                        <Shield className="w-3 h-3 text-primary/70" />
                        <span className="text-[11px] text-white/90 tracking-[0.4em] font-black uppercase">Secure Protocol v2.4</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
