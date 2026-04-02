import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    User,
    Mail,
    Shield,
    Calendar,
    Edit3,
    Lock,
    Bell,
    Globe,
    Camera,
    CheckCircle2,
    LogOut
} from 'lucide-react';
import { Card, Button, Badge, Input } from '../components/ui/Components';
import { toast } from 'react-hot-toast';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);

    if (!user) return null;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const stats = [
        { label: 'Events Organized', value: '12', icon: Calendar, color: 'text-blue-400' },
        { label: 'Success Rate', value: '98%', icon: CheckCircle2, color: 'text-emerald-500' },
        { label: 'Security Level', value: 'High', icon: Shield, color: 'text-primary' },
    ];

    return (
        <div className="main-content">
            <div className="max-w-2xl mx-auto px-4 pt-4 pb-28 space-y-8">

                {/* Banner */}
                <div className="relative w-full h-40 rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-white/5 shadow-2xl group">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(212,175,55,0.1),transparent_70%)]" />
                    <div className="absolute -bottom-6 -right-4 text-[120px] font-black text-white/[0.03] font-serif leading-none uppercase select-none group-hover:text-white/[0.05] transition-colors duration-700">
                        {user.name[0]}
                    </div>
                </div>

                {/* Avatar + Action Row */}
                <div className="flex items-end justify-between -mt-12 px-6 relative z-10">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-3xl bg-zinc-900 border-4 border-background flex items-center justify-center text-4xl font-black overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] ring-1 ring-white/10 group-hover:ring-primary/30 transition-all duration-500">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-gradient-gold-soft italic font-serif">{user.name[0]}</span>
                            )}
                        </div>
                        <button className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-primary text-background shadow-glow hover:scale-110 transition-transform active:scale-95">
                            <Camera size={14} />
                        </button>
                    </div>

                    <div className="flex gap-3 mb-2">
                        <Button
                            variant={isEditing ? 'ghost-luxury' : 'luxury'}
                            onClick={() => setIsEditing(!isEditing)}
                            className="h-10 px-6 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap"
                        >
                            <Edit3 size={12} className="mr-2" />
                            {isEditing ? 'Cancel Mapping' : 'Edit Identity'}
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleLogout}
                            className="h-10 px-6 rounded-xl text-[11px] font-black uppercase tracking-widest"
                        >
                            <LogOut size={12} className="mr-2" />
                            Logoff
                        </Button>
                    </div>
                </div>

                {/* Identity Header */}
                <div className="px-2 space-y-1">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none uppercase">
                            {user.name} <span className="text-gradient-gold-soft italic font-serif">IDENTITY.</span>
                        </h2>
                        <Badge variant="primary" className="px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg bg-primary/10 border-primary/20">
                            {user.role}
                        </Badge>
                    </div>
                    <p className="text-xs font-bold text-white/90 uppercase tracking-[0.3em]">{user.email}</p>
                </div>

                {/* Intelligence Metrics */}
                <div className="grid grid-cols-3 gap-4">
                    {stats.map((stat, i) => (
                        <div key={i} className="app-card p-5 flex flex-col items-center justify-center text-center group bg-surface/40 hover:border-primary/20 transition-all duration-500">
                            <stat.icon size={16} className={`${stat.color} opacity-40 mb-3 group-hover:opacity-100 transition-opacity`} />
                            <p className="text-xl font-black text-white tracking-tighter group-hover:text-primary transition-colors">{stat.value}</p>
                            <p className="text-[9px] text-white/90 font-black uppercase tracking-[0.2em] mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Registry Core */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-glow" />
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Registry Mapping</h3>
                    </div>
                    <div className="app-card p-8 bg-surface/40 backdrop-blur-3xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                        <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); toast.success('Parameters Synchronized'); setIsEditing(false); }}>
                            {[
                                { label: 'Signature', value: user.name, icon: User },
                                { label: 'Digital Denomination', value: user.email, icon: Mail },
                                { label: 'Mandate', value: user.role, icon: Shield, disabled: true },
                                { label: 'Temporal Basin', value: 'GMT +5:30 (IST)', icon: Globe },
                            ].map((field, i) => (
                                <div key={i} className="group flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/[0.03] border border-white/5 group-hover:border-primary/20 group-hover:bg-primary/5 transition-all duration-500">
                                        <field.icon size={18} className="text-white/80 group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-black text-white/80 uppercase tracking-[0.3em] mb-1.5">{field.label}</p>
                                        {isEditing && !field.disabled ? (
                                            <input
                                                defaultValue={field.value}
                                                className="w-full bg-transparent border-b border-white/10 text-[11px] font-bold text-white py-1 focus:outline-none focus:border-primary/40 transition-all placeholder:text-white/80"
                                            />
                                        ) : (
                                            <p className="text-[11px] font-black text-white/80 tracking-tight truncate">{field.value}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isEditing && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4">
                                    <Button type="submit" variant="luxury" className="w-full h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] shadow-glow">
                                        Save Protocol Changes
                                    </Button>
                                </motion.div>
                            )}
                        </form>
                    </div>
                </div>

                {/* Security Protocols */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Security Protocols</h3>
                    </div>
                    <div className="app-card divide-y divide-white/5 bg-surface/40">
                        {[
                            { icon: Lock, label: 'Encryption Key', sub: 'Last rotated 14 days ago', color: 'text-rose-500', iconBg: 'bg-rose-500/5', action: 'Rotate' },
                            { icon: Bell, label: 'Broadcast Channels', sub: 'Critical mission updates active', color: 'text-blue-400', iconBg: 'bg-blue-400/5', action: 'Calibrate' },
                            { icon: Shield, label: 'Validation Level', sub: 'L5 System Synchronization Active', color: 'text-primary', iconBg: 'bg-primary/5', action: null },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between px-6 py-5 group hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border border-white/5 transition-all duration-500 group-hover:border-current ${item.iconBg} ${item.color}`}>
                                        <item.icon size={18} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-white uppercase tracking-widest">{item.label}</p>
                                        <p className="text-[11px] text-white/90 font-bold tracking-tight mt-1">{item.sub}</p>
                                    </div>
                                </div>
                                {item.action && (
                                    <button className="text-[11px] font-black text-primary uppercase tracking-[0.2em] hover:text-white transition-colors">
                                        {item.action}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Profile;

