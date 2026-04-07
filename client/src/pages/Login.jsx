import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Card, Badge } from '../components/ui/Components';
import { motion } from 'framer-motion';
import { Mail, Lock, Shield, Crown, ArrowRight } from 'lucide-react';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const success = await login(formData.email, formData.password);
        setLoading(false);
        if (success) navigate('/dashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-background">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-lg relative z-10"
            >
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center justify-center mb-8"
                    >
                        <div className="p-4 rounded-[2.5rem] bg-zinc-900 border border-white/5 shadow-[0_0_50px_rgba(212,175,55,0.15)] relative group">
                            <div className="absolute inset-0 rounded-[2.5rem] bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            <Crown className="w-10 h-10 text-primary relative z-10" />
                        </div>
                    </motion.div>

                    <div className="flex flex-col items-center">
                        <Badge variant="primary" className="mb-6 px-4 py-1.5 uppercase tracking-[0.4em] font-black text-[11px] rounded-full">Secure Terminal</Badge>
                        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight leading-none mb-4 uppercase">
                            login <span className="text-gradient-gold-soft italic font-serif">IDENTITY.</span>
                        </h1>
                        <p className="text-white/70 font-bold uppercase tracking-[0.3em] text-[11px]">
                            Gateway to High-Scale Architecture
                        </p>
                    </div>
                </div>

                <div className="app-card p-10 md:p-12 relative group bg-surface/50 backdrop-blur-3xl border border-white/5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] group">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                    <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                        <div className="space-y-6">
                            <Input
                                id="email"
                                type="email"
                                label="Email"
                                placeholder="registry@elite.managed"
                                icon={Mail}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                className="bg-white/5 border-white/10 rounded-2xl h-14"
                            />
                            <Input
                                id="password"
                                type="password"
                                label="Password"
                                placeholder="••••••••"
                                icon={Lock}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                className="bg-white/5 border-white/10 rounded-2xl h-14"
                            />
                        </div>

                        <Button
                            variant="prismatic"
                            type="submit"
                            isLoading={loading}
                            className="w-full h-16 text-xs font-black uppercase tracking-[0.5em] rounded-2xl shadow-elite"
                        >
                            Login
                        </Button>
                    </form>

                    <div className="mt-12 text-center pt-8 border-t border-white/5">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-white/90 font-bold">
                            New to website
                        </p>
                        <Link to="/register" className="group inline-flex items-center gap-2 mt-4 text-[11px] uppercase tracking-[0.4em] font-black text-primary hover:text-white transition-all">
                            Sign up <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                <div className="mt-16 text-center">
                    <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full bg-white/[0.02] border border-white/5">
                        <Shield className="w-3 h-3 text-primary/70" />
                        <span className="text-[11px] text-white/90 tracking-[0.4em] font-black uppercase">End-to-End Encryption Active</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
