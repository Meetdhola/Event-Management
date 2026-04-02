import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    ShieldCheck,
    PlusCircle,
    LogOut,
    Calendar,
    User as UserIcon,
    ChevronRight,
    Zap,
    Users,
    Activity,
    MessageSquare,
    Briefcase,
    Archive,
    X,
    Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Components';

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    if (!user) return null;

    const navItems = [
        {
            label: 'Dashboard',
            path: '/dashboard',
            icon: LayoutDashboard,
            roles: ['Admin', 'EventManager', 'Vendor', 'Volunteer', 'Attendee', 'Client']
        },
        {
            label: 'Hire Managers',
            path: '/hire-manager',
            icon: Briefcase,
            roles: ['Client']
        },
        {
            label: 'Messages',
            path: '/chat',
            icon: MessageSquare,
            roles: ['Client', 'EventManager']
        },
        {
            label: 'Rejected Events',
            path: '/rejected-events',
            icon: Archive,
            roles: ['EventManager']
        },
        {
            label: 'Admin Control',
            path: '/admin',
            icon: ShieldCheck,
            roles: ['Admin']
        },
        {
            label: 'User List',
            path: '/admin/users',
            icon: Users,
            roles: ['Admin']
        },
        {
            label: 'Event Logs',
            path: '/admin/logs',
            icon: Activity,
            roles: ['Admin']
        },
        {
            label: 'Create Event',
            path: '/create-event',
            icon: PlusCircle,
            roles: ['Admin', 'EventManager']
        },
        {
            label: 'AI Assistant',
            path: '/ai-center',
            icon: Zap,
            roles: ['Admin', 'EventManager']
        }
    ].filter(item => item.roles.includes(user.role));

    return (
        <>
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/95 backdrop-blur-xl z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            <aside className={`fixed left-0 top-0 h-screen w-72 border-r border-white/5 bg-[#0C0C0E] z-50 flex flex-col transition-transform duration-700 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Logo Section */}
                <div className="p-8 pb-10 flex items-center justify-between lg:justify-center border-b border-white/5 relative">
                    <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                    <div className="flex flex-col items-center gap-1 group cursor-pointer relative">
                        <div className="absolute -inset-4 bg-primary/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        <div className="flex items-center gap-2 relative z-10">
                            <Crown className="text-primary group-hover:rotate-[15deg] transition-transform duration-500" size={26} />
                            <span className="text-xl font-serif tracking-[0.3em] font-black text-white italic">ELITE</span>
                        </div>
                        <span className="text-[9px] tracking-[0.7em] text-primary/70 font-black uppercase relative z-10">Global Network</span>
                    </div>
                    <Button
                        onClick={onClose}
                        variant="ghost-luxury"
                        className="lg:hidden w-10 h-10 p-0 text-white/80 hover:text-primary rounded-[1.25rem] border border-white/5 transition-all"
                    >
                        <X size={20} />
                    </Button>
                </div>

                {/* Navigation Section */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-10 custom-scrollbar">
                    <nav className="space-y-4">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center justify-between group px-5 py-4 rounded-[1.5rem] transition-all duration-500 relative ${isActive
                                        ? 'bg-primary/5 text-primary border border-primary/20 shadow-[0_0_30px_rgba(212,175,55,0.05)]'
                                        : 'text-white/70 hover:text-white hover:bg-white/[0.03]'
                                        }`}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`transition-all duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:text-primary'}`}>
                                            <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-[0.4em] leading-none">{item.label}</span>
                                    </div>
                                    {isActive && (
                                        <motion.div
                                            layoutId="sidebar-active"
                                            className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_15px_rgba(212,175,55,1)]"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer Section (Profile & Signout) */}
                <div className="p-6 mt-auto border-t border-white/5 relative">
                    <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                    <Link
                        to="/profile"
                        className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-white/[0.02] border border-white/5 mb-6 transition-all hover:border-primary/30 group/profile overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/profile:opacity-100 transition-opacity duration-700" />
                        <div className="w-11 h-11 rounded-[1.25rem] bg-zinc-900 border border-white/10 flex items-center justify-center text-primary group-hover/profile:scale-105 group-hover/profile:border-primary/40 transition-all text-[9px] font-black relative z-10 shadow-lg">
                            {user.name[0]}
                        </div>
                        <div className="overflow-hidden flex-1 relative z-10">
                            <p className="text-[11px] font-black text-white uppercase tracking-widest truncate">{user.name}</p>
                            <p className="text-[9px] text-primary font-black uppercase tracking-[0.3em] mt-1.5 flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                                {user.role}
                            </p>
                        </div>
                        <ChevronRight size={14} className="text-white/80 group-hover/profile:text-primary group-hover/profile:translate-x-1 transition-all relative z-10" />
                    </Link>

                    <Button
                        variant="danger"
                        onClick={logout}
                        className="w-full h-14 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.5em] group/logout"
                    >
                        <LogOut size={18} className="mr-2 group-hover/logout:-translate-x-1 transition-transform" />
                        Sign Out
                    </Button>

                    <div className="mt-6 text-center">
                        <span className="text-[11px] text-white/70 font-black uppercase tracking-[0.8em]">Elite Platform v2.4</span>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
