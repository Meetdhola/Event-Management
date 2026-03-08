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
        { label: 'Events Organized', value: '12', icon: Calendar, color: 'blue' },
        { label: 'Success Rate', value: '98%', icon: CheckCircle2, color: 'green' },
        { label: 'Security Level', value: 'High', icon: Shield, color: 'purple' },
    ];

    return (
        <div className="main-content">
            <div className="max-w-2xl mx-auto px-4 pt-4 pb-28 space-y-5">

                {/* Banner */}
                <div
                    className="relative w-full h-32 rounded-3xl overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.05) 100%)', border: '1px solid rgba(212,175,55,0.15)' }}
                >
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(212,175,55,0.15), transparent 70%)' }} />
                    <div className="absolute bottom-4 right-4 text-[80px] font-black text-primary/5 font-serif leading-none uppercase select-none">{user.name[0]}</div>
                </div>

                {/* Avatar + Name Row */}
                <div className="flex items-end justify-between -mt-10 px-4">
                    {/* Avatar */}
                    <div className="relative">
                        <div
                            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black overflow-hidden"
                            style={{ background: 'rgba(212,175,55,0.15)', border: '3px solid #D4AF37', boxShadow: '0 0 20px rgba(212,175,55,0.3)' }}
                        >
                            {user?.avatar ? (
                                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span style={{ color: '#D4AF37' }}>{user.name[0]}</span>
                            )}
                        </div>
                        <button className="absolute -bottom-1 -right-1 p-1.5 rounded-xl" style={{ background: '#D4AF37' }}>
                            <Camera size={12} className="text-background" />
                        </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mb-1">
                        <button onClick={() => setIsEditing(!isEditing)} className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all" style={{ background: isEditing ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#D4AF37,#F1D27A)', color: isEditing ? 'white' : '#0c0c0e', border: isEditing ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                            <Edit3 size={12} className="inline mr-1" />{isEditing ? 'Cancel' : 'Edit'}
                        </button>
                        <button onClick={handleLogout} className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <LogOut size={12} className="inline mr-1" />Logout
                        </button>
                    </div>
                </div>

                {/* Name / Email / Role */}
                <div className="px-1">
                    <h2 className="text-xl font-black text-white">{user.name}</h2>
                    <p className="text-sm text-white/40 mt-0.5">{user.email}</p>
                    <span className="inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest" style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.25)' }}>{user.role}</span>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                    {stats.map((stat, i) => (
                        <div key={i} className="stat-card">
                            <p className="stat-card-value">{stat.value}</p>
                            <p className="stat-card-label">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Personal Info */}
                <div>
                    <p className="section-title">Personal Info</p>
                    <div className="app-card p-5 space-y-4">
                        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success('Profile updated'); setIsEditing(false); }}>
                            {[
                                { label: 'Full Name', value: user.name, icon: User },
                                { label: 'Email', value: user.email, icon: Mail },
                                { label: 'Role', value: user.role, icon: Shield, disabled: true },
                                { label: 'Timezone', value: 'GMT +5:30 (IST)', icon: Globe },
                            ].map((field, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)' }}>
                                        <field.icon size={15} style={{ color: '#D4AF37' }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{field.label}</p>
                                        {isEditing && !field.disabled ? (
                                            <input defaultValue={field.value} className="bg-transparent text-sm font-bold text-white outline-none border-b border-primary/30 w-full mt-0.5 pb-0.5" />
                                        ) : (
                                            <p className="text-sm font-bold text-white mt-0.5 truncate">{field.value}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isEditing && (
                                <button type="submit" className="w-full py-3 rounded-full text-sm font-black uppercase tracking-widest" style={{ background: 'linear-gradient(135deg,#D4AF37,#F1D27A)', color: '#0c0c0e' }}>
                                    Save Changes
                                </button>
                            )}
                        </form>
                    </div>
                </div>

                {/* Security */}
                <div>
                    <p className="section-title">Security</p>
                    <div className="app-card divide-y" style={{ '--tw-divide-opacity': 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                        {[
                            { icon: Lock, label: 'Password', sub: 'Last changed 14 days ago', color: 'rgba(239,68,68,0.12)', iconColor: '#f87171', action: 'Change' },
                            { icon: Bell, label: 'Notifications', sub: 'Critical alerts & mission updates', color: 'rgba(59,130,246,0.12)', iconColor: '#60a5fa', action: 'Manage' },
                            { icon: Shield, label: 'Access Level', sub: 'Full System Synchronization', color: 'rgba(212,175,55,0.12)', iconColor: '#D4AF37', action: null },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: item.color }}>
                                        <item.icon size={16} style={{ color: item.iconColor }} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{item.label}</p>
                                        <p className="text-[10px] text-white/40 mt-0.5">{item.sub}</p>
                                    </div>
                                </div>
                                {item.action && <button className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#D4AF37' }}>{item.action}</button>}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Profile;

