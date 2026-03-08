import { useNavigate } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const MobileHeader = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) return null;

    return (
        <header className="lg:hidden fixed top-0 w-full z-40 px-4 py-3 flex items-center justify-between h-16"
            style={{
                background: 'rgba(12, 12, 14, 0.85)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            {/* Brand / Logo */}
            <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => navigate('/dashboard')}
            >
                <div className="relative">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(135deg, #D4AF37, #F1D27A)',
                            boxShadow: '0 0 16px rgba(212,175,55,0.3)',
                        }}
                    >
                        <Crown size={18} className="text-background" strokeWidth={2.5} />
                    </div>
                    {/* Online dot */}
                    <div
                        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background bg-emerald-500"
                        style={{ boxShadow: '0 0 6px rgba(16,185,129,0.8)' }}
                    />
                </div>
                <div className="flex flex-col leading-none">
                    <span className="text-xs font-black uppercase tracking-[0.25em] text-white">ELITE</span>
                    <span className="text-[9px] font-semibold uppercase tracking-[0.2em] mt-0.5" style={{ color: 'rgba(212,175,55,0.6)' }}>
                        Events
                    </span>
                </div>
            </motion.div>

            {/* Right — Avatar */}
            <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => navigate('/profile')}
            >
                {/* Role badge */}
                <span
                    className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full"
                    style={{
                        background: 'rgba(212,175,55,0.1)',
                        color: '#D4AF37',
                        border: '1px solid rgba(212,175,55,0.25)',
                    }}
                >
                    {user.role}
                </span>

                {/* Avatar */}
                <div
                    className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden"
                    style={{
                        background: 'rgba(212,175,55,0.15)',
                        border: '2px solid rgba(212,175,55,0.4)',
                    }}
                >
                    {user?.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-sm font-black" style={{ color: '#D4AF37' }}>
                            {user.name?.[0]?.toUpperCase()}
                        </span>
                    )}
                </div>
            </motion.div>
        </header>
    );
};

export default MobileHeader;
