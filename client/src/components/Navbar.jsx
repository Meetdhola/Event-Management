import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Menu, Globe, Shield, Zap, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <nav className="hidden lg:flex fixed top-0 right-0 left-72 z-40 bg-[#0C0C0E]/60 backdrop-blur-3xl border-b border-white/5 transition-all duration-700">
            <div className="w-full px-10">
                <div className="flex h-24 items-center justify-between">
                    {/* System Status Section */}
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col">
                            <h2 className="text-[10px] font-black tracking-[0.4em] text-white/90 uppercase leading-none italic font-serif">Infrastructure Dashboard</h2>
                            <div className="flex items-center gap-3 mt-2.5">
                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-[8px] font-black text-emerald-500 uppercase tracking-widest">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                    System Active
                                </span>
                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10 text-[8px] font-black text-primary uppercase tracking-widest">
                                    <Zap size={8} className="fill-primary" />
                                    Secure Node
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Action Section */}
                    <div className="flex items-center gap-12">
                        {/* Quick Metrics */}
                        <div className="hidden xl:flex items-center gap-10">
                            {['Network', 'Security', 'Operations'].map(item => (
                                <button key={item} className="text-[9px] uppercase tracking-[0.5em] font-black text-white/30 hover:text-primary transition-all relative group py-2">
                                    {item}
                                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary transition-all duration-500 group-hover:w-full opacity-0 group-hover:opacity-100" />
                                </button>
                            ))}
                        </div>

                        <div className="h-10 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent" />

                        {/* Profile Badge */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center gap-4 py-2.5 px-5 rounded-[1.75rem] bg-white/[0.03] border border-white/5 hover:border-primary/20 transition-all cursor-pointer group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                            <div className="flex flex-col text-right relative z-10">
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">{user.name}</span>
                                <span className="text-[8px] font-black text-primary tracking-[0.3em] opacity-60 uppercase mt-1">{user.role}</span>
                            </div>

                            <div className="w-9 h-9 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-primary text-[11px] font-black relative z-10 group-hover:border-primary/40 transition-all shadow-xl">
                                {user.name[0]}
                            </div>

                            <ChevronDown size={12} className="text-white/20 group-hover:text-primary transition-colors relative z-10" />
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Subtle glow edge */}
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
        </nav>
    );
};

export default Navbar;
