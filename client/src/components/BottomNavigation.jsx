import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, MessageSquare, User, ShieldCheck,
    PlusCircle
} from 'lucide-react';

const BottomNavigation = () => {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) return null;

    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Home', roles: ['Admin', 'EventManager', 'Vendor', 'Volunteer', 'Attendee', 'Client'] },
        { path: '/admin', icon: ShieldCheck, label: 'System', roles: ['Admin'] },
        { path: '/create-event', icon: PlusCircle, label: 'Create', roles: ['Admin', 'EventManager'] },
        { path: '/chat', icon: MessageSquare, label: 'Chat', roles: ['Admin', 'Client', 'EventManager'] },
        { path: '/profile', icon: User, label: 'Profile', roles: ['Admin', 'EventManager', 'Vendor', 'Volunteer', 'Attendee', 'Client'] }
    ].filter(item => item.roles.includes(user.role));

    return (
        <nav className="fixed bottom-0 left-0 w-full z-50 lg:hidden flex justify-center pb-8 px-4 pointer-events-none">
            {/* The single unified dark pill bar */}
            <div
                className="pointer-events-auto flex items-center gap-1 px-2 h-16 rounded-full shadow-2xl"
                style={{
                    background: 'rgba(15, 15, 18, 0.95)',
                    backdropFilter: 'blur(25px)',
                    WebkitBackdropFilter: 'blur(25px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
            >
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className="outline-none"
                        >
                            <motion.div
                                layout
                                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                className="flex items-center overflow-hidden rounded-full h-10"
                                style={{
                                    background: isActive
                                        ? 'linear-gradient(135deg, #D4AF37 0%, #F1D27A 50%, #D4AF37 100%)'
                                        : 'transparent',
                                    paddingLeft: isActive ? '12px' : '10px',
                                    paddingRight: isActive ? '16px' : '10px',
                                    boxShadow: isActive
                                        ? '0 0 20px rgba(212,175,55,0.4), inset 0 1px rgba(255,255,255,0.3)'
                                        : 'none',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                <motion.div
                                    animate={{ rotate: isActive ? 0 : 0 }}
                                    className="flex-shrink-0"
                                >
                                    <item.icon
                                        size={20}
                                        strokeWidth={2.2}
                                        style={{
                                            color: isActive ? '#0c0c0e' : 'rgba(255,255,255,0.45)',
                                        }}
                                    />
                                </motion.div>

                                {isActive && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="ml-2 text-[13px] font-bold tracking-wide"
                                        style={{ color: '#0c0c0e', lineHeight: 1 }}
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </motion.div>
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNavigation;
