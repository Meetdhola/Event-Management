import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    Calendar,
    MapPin,
    Users,
    Activity,
    CheckCircle2,
    Clock,
    Shield,
    Target,
    Zap,
    Search,
    ChevronRight,
    QrCode,
    Camera,
    ListTodo,
    X,
    Ticket,
    Bell,
    Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, Card, Button, Input } from '../components/ui/Components';
import toast from 'react-hot-toast';
import QRScanner from '../components/QRScanner';
import { socket, joinRoom } from '../lib/socket';

const VolunteerDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [events, setEvents] = useState([]);
    const [history, setHistory] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [ticketId, setTicketId] = useState('');
    const [activeTab, setActiveTab] = useState('tasks');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [emergencyLoading, setEmergencyLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const requestNotificationPermission = async () => {
        try {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
            
            if (permission === 'granted') {
                // Register Service Worker if not already
                if ('serviceWorker' in navigator) {
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    
                    // Subscribe to Push Notifications
                    const subscribeOptions = {
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array('BK4P4e8cFYDqf8aSP6hZFQk_bFxVOlVm_rlPNTJyKOqP2RDbBo4Hchq1C32Q3sTgj1yWAW7wVA47aHoIrW-r2kg')
                    };
                    
                    const subscription = await registration.pushManager.subscribe(subscribeOptions);
                    
                    // Send to backend
                    await axios.post('/volunteer/subscribe', { subscription });

                    toast.success('Alert System Linked', {
                        icon: '🛰️',
                        style: { background: '#d4af37', color: '#000', fontWeight: 'bold' }
                    });
                }
            }
        } catch (error) {
            console.error('Push sync failed:', error);
            toast.error('Alert sync failed. Please check your connection.');
        }
    };

    const playStrategicAlert = () => {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const osc = context.createOscillator();
            const gain = context.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, context.currentTime); // High tactical pitch
            osc.frequency.exponentialRampToValueAtTime(440, context.currentTime + 0.3); // Quick slide down

            gain.gain.setValueAtTime(0.1, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);

            osc.connect(gain);
            gain.connect(context.destination);

            osc.start();
            osc.stop(context.currentTime + 0.3);
        } catch (e) {
            console.error('Audio sync failed', e);
        }
    };

    let titleInterval;
    const startTabFlashing = () => {
        let isFlash = true;
        const originalTitle = document.title || "Volunteer Hub";
        clearInterval(titleInterval);
        titleInterval = setInterval(() => {
            document.title = isFlash ? "🚨 (1) NEW MISSION!" : originalTitle;
            isFlash = !isFlash;
        }, 1000);
        
        // Stop flashing when user focuses back on the tab
        const stopFlash = () => {
            clearInterval(titleInterval);
            document.title = originalTitle;
            window.removeEventListener('focus', stopFlash);
            window.removeEventListener('mousemove', stopFlash);
            window.removeEventListener('click', stopFlash);
        };
        window.addEventListener('focus', stopFlash);
        window.addEventListener('mousemove', stopFlash);
        window.addEventListener('click', stopFlash);
    };

    const sendNativeNotification = async (title, body) => {
        // Always flash the tab if they are in another tab!
        startTabFlashing();

        // 1. Play zero-network local Beep Sound
        try {
            // A short, loud digital beep encoded in base64 (always works, no network needed)
            const beepAudio = new Audio('data:audio/mp3;base64,//OExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//OExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq');
            beepAudio.volume = 1.0;
            const playPromise = beepAudio.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => playStrategicAlert());
            }
        } catch (e) {
            playStrategicAlert();
        }

        // 2. Native Notification (Crash-proof)
        if (Notification.permission === 'granted') {
            try {
                if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                
                // Keep it absolutely simple (No requireInteraction bug for Safari)
                const n = new Notification(title, {
                    body: body,
                    icon: '/favicon.ico'
                });
                
                n.onclick = () => {
                    window.focus();
                    n.close();
                };
            } catch (err) {
                // If standard notification crashes, fall back to Service Worker
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistration().then(reg => {
                        if (reg) reg.showNotification(title, { body, icon: '/favicon.ico' });
                    }).catch(e => console.error(e));
                }
            }
        }
    };

    useEffect(() => {
        fetchInitialData();
        // Pre-register service worker for better background reliability
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW Registration failed:', err));
        }
    }, []);

    useEffect(() => {
        if (!user) return;
        
        const volunteerId = user.id || user._id;
        joinRoom(`volunteer_${volunteerId}`);
        
        const handleNewMission = (newTask) => {
            toast.success(`NEW TASK ASSIGNED: ${newTask.title}`, {
                icon: '🎯',
                style: { background: '#d4af37', color: '#000', fontWeight: 'bold' }
            });
            
            const newNotification = {
                id: Date.now(),
                type: 'mission',
                title: 'New Task Alert',
                message: `Assigned: ${newTask.title}`,
                eventName: newTask.eventId?.event_name || 'Event Assignment',
                timestamp: new Date(),
                read: false
            };
            
            setNotifications(prev => [newNotification, ...prev]);
            sendNativeNotification('NEW TASK ASSIGNED', `Task: ${newTask.title} | Event: ${newNotification.eventName}`);
            fetchInitialData();
        };

        const handleTaskDeleted = (data) => {
            const taskTitle = typeof data === 'string' ? 'Task' : data.title;
            toast.error('Task cancelled by system administrator.', {
                icon: '🗑️',
                style: { background: '#ef4444', color: '#fff', fontWeight: 'bold' }
            });
            
            const newNotification = {
                id: Date.now(),
                type: 'aborted',
                title: 'Task Cancelled',
                message: `Removed: ${taskTitle}`,
                eventName: data.eventName || 'Event Update',
                timestamp: new Date(),
                read: false
            };
            
            setNotifications(prev => [newNotification, ...prev]);
            sendNativeNotification('TASK CANCELLED', `Removed: ${taskTitle} | Status: Cancelled by admin`);
            setTasks(prev => prev.filter(t => t._id !== (data.taskId || data)));
            fetchInitialData();
        };
        
        socket.on('new_mission_alert', handleNewMission);
        socket.on('task_deleted_alert', handleTaskDeleted);
        
        return () => {
            socket.off('new_mission_alert', handleNewMission);
            socket.off('task_deleted_alert', handleTaskDeleted);
        };
    }, [user]);

    useEffect(() => {
        if (selectedEvent) {
            fetchEventData(selectedEvent._id);
            joinRoom(`event_${selectedEvent._id}`);

            // Listen for attendance updates from other volunteers
            socket.on('attendance_update', (data) => {
                if (data.eventId === selectedEvent._id) {
                    setStats(prev => ({
                        ...prev,
                        checkedIn: data.totalCheckedIn,
                        remaining: prev.totalTickets - data.totalCheckedIn
                    }));
                }
            });

            // Listen for task updates from other volunteers
            socket.on('task_update', (data) => {
                setTasks(prev => prev.map(t => t._id === data.taskId ? { ...t, status: data.status } : t));
            });

            // Listen for direct assignments if currently looking at the same event
            socket.on('task_assigned', (newTask) => {
                if ((newTask.assignedTo._id === user.id || newTask.assignedTo === user.id) && newTask.eventId === selectedEvent._id) {
                    setTasks(prev => [newTask, ...prev]);
                }
            });
        }

        return () => {
            socket.off('attendance_update');
            socket.off('task_update');
            socket.off('task_assigned');
        };
    }, [selectedEvent]);

    const handleSOS = async () => {
        if (!selectedEvent) {
            toast.error('Tactical Error: Select an active deployment zone first', { icon: '⚠️' });
            return;
        }
        
        setEmergencyLoading(true);
        try {
            // REST-based SOS is much more reliable on flaky mobile/cellular connections
            await axios.post('/volunteer/sos', {
                eventId: selectedEvent._id,
                eventName: selectedEvent.event_name,
                volunteerName: user.name,
                location: selectedEvent.venue,
                timestamp: new Date().toISOString()
            });

            // Sound confirmation for volunteer
            try {
                const alarm = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                alarm.volume = 0.3;
                alarm.play().catch(e => console.log('Audio playback prevented:', e));
            } catch (e) {
                console.error('Sound system error:', e);
            }

            toast.error('EMERGENCY SIGNAL DISPATCHED', {
                duration: 5000,
                icon: '🚨',
                style: {
                    background: '#7f1d1d',
                    color: '#fff',
                    fontWeight: 'black',
                    border: '1px solid #ef4444'
                }
            });
        } catch (error) {
            console.error('SOS Failure:', error);
            toast.error('COMMUNICATIONS FAILURE: Manual alert required');
        } finally {
            setEmergencyLoading(false);
        }
    };

    const fetchInitialData = async () => {
        try {
            const [eventsRes, allTasksRes] = await Promise.all([
                axios.get('/volunteer/events'),
                axios.get('/volunteer/all-tasks')
            ]);
            
            setEvents(eventsRes.data);
            setAllTasks(allTasksRes.data);
            
            if (eventsRes.data.length > 0 && !selectedEvent) {
                setSelectedEvent(eventsRes.data[0]);
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEventData = async (eventId) => {
        try {
            const [statsRes, tasksRes, historyRes] = await Promise.all([
                axios.get(`/volunteer/stats/${eventId}`),
                axios.get(`/volunteer/tasks/${eventId}`),
                axios.get(`/volunteer/history/${eventId}`)
            ]);
            setStats(statsRes.data);
            setTasks(tasksRes.data);
            setHistory(historyRes.data);
        } catch (error) {
            console.error('Error fetching event details:', error);
        }
    };

    const handleVerifyTicket = async (code) => {
        const qrCodeToVerify = typeof code === 'string' ? code : ticketId;
        if (!qrCodeToVerify) return { success: false, error: 'No QR code provided' };

        setVerifying(true);
        try {
            const res = await axios.post('/volunteer/check-in', {
                qr_code: qrCodeToVerify, // or ticket UI code
                gate: 'Main Activation'
            });
            toast.success(`Check-in Successful: ${res.data.attendee}`);
            setTicketId('');
            if (selectedEvent) fetchEventData(selectedEvent._id);
            if (typeof code !== 'string') setIsScannerOpen(false); // If it came from manual text input outside scanner, close any open modal just in case, though the scanner has its own logic now
            return { success: true, attendee: res.data.attendee, ticketId: res.data.ticketId };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Verification failed';
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setVerifying(false);
        }
    };

    const handleUpdateTaskStatus = async (taskId, newStatus) => {
        try {
            await axios.patch(`/volunteer/tasks/${taskId}`, { status: newStatus });
            toast.success(`Task Update: ${newStatus}`);
            fetchInitialData(); 
            if (selectedEvent) fetchEventData(selectedEvent._id); // Refresh current event list
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-80px)] bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="relative z-10 flex flex-col items-center gap-8">
                    <div className="relative">
                        <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin shadow-[0_0_40px_rgba(212,175,55,0.2)]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-10 w-10 rounded-full bg-primary/20 blur-xl animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="main-content px-3 pb-28 sm:pb-4">
            <div className="max-w-2xl mx-auto space-y-8">

                {/* Volunteer Tactical Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-1 mt-4">
                    <div className="space-y-1">
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none uppercase">
                            Volunteer <span className="text-primary italic font-serif glow-text-gold">CENTER.</span>
                        </h1>
                        <div className="flex items-center gap-3">
                            <div className="h-[1px] w-8 bg-primary/40" />
                            <p className="text-[10px] text-white/50 uppercase tracking-[0.4em] font-black italic">
                                Sector: <span className="text-white">HQ_OPS</span> • Agent: <span className="text-white">{user.name.split(' ')[0]}</span>
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-start sm:justify-end">
                        {/* Native Notification Sync */}
                        {notificationPermission !== 'granted' && (
                            <button 
                                onClick={requestNotificationPermission}
                                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:bg-primary/10 hover:text-primary transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2 group"
                            >
                                <Zap size={12} className="group-hover:animate-bounce" />
                                Sync Alerts
                            </button>
                        )}

                        {/* Notification Bell Hub */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all relative ${showNotifications ? 'bg-primary text-background' : 'bg-zinc-900 border border-white/5 text-white/50 hover:bg-white/10'}`}
                            >
                                <Bell size={18} className={notifications.some(n => !n.read) ? 'animate-tada' : ''} />
                                {notifications.some(n => !n.read) && (
                                    <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-zinc-950 animate-pulse" />
                                )}
                            </button>

                            <AnimatePresence>
                                {showNotifications && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-full mt-4 right-0 w-80 bg-zinc-950 border border-white/10 rounded-[2.5rem] shadow-2xl z-[100] overflow-hidden backdrop-blur-3xl"
                                    >
                                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Transmission Log</h3>
                                            <button 
                                                onClick={() => {
                                                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                                                    setShowNotifications(false);
                                                }}
                                                className="text-[9px] font-black text-primary uppercase tracking-widest hover:brightness-125 transition-all"
                                            >
                                                Wipe Logs
                                            </button>
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto no-scrollbar pb-4">
                                            {notifications.length === 0 ? (
                                                <div className="py-20 text-center opacity-10">
                                                    <Zap size={32} className="mx-auto mb-4" />
                                                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">Silence in Sector</p>
                                                </div>
                                            ) : (
                                                notifications.map(notification => (
                                                    <div key={notification.id} className={`p-6 border-b border-white/5 hover:bg-white/[0.03] transition-colors relative ${!notification.read ? 'bg-primary/[0.03]' : ''}`}>
                                                        {!notification.read && <div className="absolute top-8 left-2.5 w-1.5 h-1.5 bg-primary rounded-full shadow-glow" />}
                                                        <div className="flex items-start gap-5">
                                                            <div className={`mt-1 p-2.5 rounded-xl ${notification.type === 'mission' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                                {notification.type === 'mission' ? <Target size={14} /> : <Trash2 size={14} />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-1.5">
                                                                    <p className="text-[11px] font-black text-white uppercase tracking-tight">{notification.title}</p>
                                                                    <span className="text-[8px] font-black text-white/20 uppercase tabular-nums">{new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                </div>
                                                                <p className="text-[10px] text-white/60 mb-2 leading-relaxed">{notification.message}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1 h-1 rounded-full bg-primary/40" />
                                                                    <p className="text-[8px] font-black text-primary/70 uppercase tracking-[0.3em] font-serif italic truncate">{notification.eventName}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button 
                            onClick={handleSOS}
                            disabled={emergencyLoading}
                            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border-2 transition-all duration-500 relative overflow-hidden group ${emergencyLoading ? 'bg-red-600 border-red-600 text-white animate-pulse' : 'bg-red-950/20 border-red-500/30 text-red-500 hover:bg-red-600 hover:border-red-600 hover:text-white shadow-[0_0_30px_rgba(239,68,68,0.1)] hover:shadow-[0_0_40px_rgba(239,68,68,0.4)]'}`}
                        >
                            <div className="relative z-10 flex items-center justify-center gap-3">
                                <Shield size={14} className="group-hover:rotate-12 transition-transform" fill="currentColor" />
                                <span>{emergencyLoading ? 'BROADCASTING...' : 'EMERGENCY SOS'}</span>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        </button>
                    </div>
                </div>

                {/* Performance Array */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Guests', value: stats?.totalTickets || 0, icon: Users, color: 'text-primary' },
                        { label: 'Verified', value: stats?.checkedIn || 0, icon: CheckCircle2, color: 'text-emerald-500' },
                        { label: 'Remaining', value: stats?.remaining || 0, icon: Activity, color: 'text-blue-400' },
                        { label: 'My Tasks', value: tasks.length || 0, icon: Target, color: 'text-amber-500' },
                    ].map((stat, i) => (
                        <div key={i} className="app-card p-6 flex flex-col items-center justify-center text-center group bg-zinc-950 border border-white/5 relative overflow-hidden transition-all hover:border-primary/20 hover:-translate-y-1">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all" />
                            <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <stat.icon size={18} className={`${stat.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                            </div>
                            <p className="text-3xl font-black text-white tracking-tighter tabular-nums drop-shadow-glow-soft">{stat.value}</p>
                            <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.3em] mt-2 group-hover:text-primary/70 transition-colors">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Mission Intake Hub (High Priority - Across all assigned events) */}
                {allTasks.filter(t => t.status === 'Pending').length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="p-8 rounded-[3rem] bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-950 border border-amber-500/20 shadow-[0_0_80px_rgba(245,158,11,0.05)] relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                            <Target size={180} className="text-amber-500" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.8)]" />
                                    <h2 className="text-[12px] font-black text-amber-500 uppercase tracking-[0.5em]">Active Briefings</h2>
                                </div>
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[9px] px-3 py-1 font-black uppercase tracking-widest">{allTasks.filter(t => t.status === 'Pending').length} Pending</Badge>
                            </div>
                            <div className="space-y-5">
                                {allTasks.filter(t => t.status === 'Pending').map(task => {
                                    const eventName = events.find(e => e._id === task.eventId)?.event_name || 'Central Command';
                                    return (
                                        <div key={task._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6 rounded-3xl bg-white/[0.02] border border-white/5 group/task hover:bg-white/[0.04] hover:border-amber-500/30 transition-all duration-500">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest font-serif italic">{eventName}</span>
                                                    <div className="w-1 h-1 rounded-full bg-white/10" />
                                                    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">ID_{task._id.slice(-6).toUpperCase()}</span>
                                                </div>
                                                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 group-hover/task:text-amber-500 transition-colors drop-shadow-sm">{task.title}</h3>
                                                <p className="text-[11px] text-white/50 uppercase tracking-widest italic line-clamp-1">{task.description}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleUpdateTaskStatus(task._id, 'In Progress')}
                                                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-amber-500 text-zinc-950 text-[11px] font-black uppercase tracking-[0.2em] hover:scale-[1.03] active:scale-95 transition-all shadow-[0_10px_30px_rgba(245,158,11,0.2)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.4)] italic whitespace-nowrap overflow-hidden relative group/btn"
                                            >
                                                <span className="relative z-10 transition-transform group-hover/btn:translate-x-1 inline-block">Accept Mission</span>
                                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Tactical Verification Hub */}
                <div className="app-card overflow-hidden bg-zinc-950 border-white/5 relative">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                    <div className="p-8 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-glow" />
                                <h2 className="text-[12px] font-black text-white uppercase tracking-[0.5em]">System Entry</h2>
                            </div>
                            <Badge variant="outline" className="border-primary/20 text-primary/60 text-[9px] uppercase font-black tracking-widest bg-primary/5">Node_01</Badge>
                        </div>
                        <div className="space-y-6">
                            <div className="relative group">
                                <QrCode className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-all scale-110" size={20} />
                                <input
                                    type="text"
                                    placeholder="Enter Protocol (Ticket ID)..."
                                    value={ticketId}
                                    onChange={(e) => setTicketId(e.target.value.toLowerCase())}
                                    onKeyPress={(e) => e.key === 'Enter' && handleVerifyTicket()}
                                    className="w-full bg-white/[0.02] border border-white/10 rounded-[1.5rem] py-6 pl-16 pr-20 text-sm font-black uppercase tracking-[0.3em] text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.04] transition-all font-mono"
                                />
                                <button
                                    onClick={() => setIsScannerOpen(true)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-zinc-950 transition-all shadow-glow hover:shadow-primary/40"
                                >
                                    <Camera size={22} className="group-hover:scale-110 transition-transform" />
                                </button>
                            </div>
                            <Button
                                onClick={() => handleVerifyTicket()}
                                disabled={!ticketId || verifying}
                                variant="luxury"
                                className="w-full h-16 rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-[0_20px_50px_rgba(212,175,55,0.1)] disabled:opacity-20 disabled:scale-[0.98] transition-all italic relative overflow-hidden"
                            >
                                <span className="relative z-10">{verifying ? 'Verifying Protocol...' : 'Confirm Guest Entry'}</span>
                            </Button>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {isScannerOpen && (
                        <QRScanner
                            onScan={handleVerifyTicket}
                            onClose={() => setIsScannerOpen(false)}
                        />
                    )}
                </AnimatePresence>

                {/* Operations Intel Feed */}
                <div className="flex bg-zinc-950 p-2 rounded-[2rem] border border-white/5 shadow-2xl backdrop-blur-xl">
                    {[
                        { id: 'tasks', label: 'My Intel', icon: ListTodo },
                        { id: 'history', label: 'History', icon: Activity },
                        { id: 'events', label: 'Sectors', icon: Target }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-4 py-4 rounded-[1.5rem] transition-all duration-500 relative group ${activeTab === tab.id
                                ? 'bg-zinc-900 text-primary shadow-glow-soft border border-white/5'
                                : 'text-white/30 hover:text-white/60'}`}
                        >
                            {tab.id === 'tasks' && tasks.filter(t => t.status === 'Pending').length > 0 && (
                                <span className="absolute top-3 right-4 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]"></span>
                                </span>
                            )}
                            <tab.icon size={16} className={`hidden sm:block transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'opacity-100' : 'opacity-40'}`} />
                            <span className="text-[12px] font-black uppercase tracking-[0.2em] leading-none">{tab.label}</span>
                            {activeTab === tab.id && <motion.div layoutId="tab-underline" className="absolute bottom-2 w-4 h-1 bg-primary rounded-full" />}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'tasks' ? (
                        <motion.div key="tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                            {tasks.length === 0 ? (
                                <div className="py-32 flex flex-col items-center justify-center app-card border-dashed bg-zinc-950/20 opacity-20">
                                    <Shield size={64} className="mb-6" />
                                    <p className="text-[12px] font-black uppercase tracking-[0.6em] text-center">No assignments<br/>at this coordinates</p>
                                </div>
                            ) : (
                                tasks.map((task) => (
                                    <div key={task._id} className="app-card p-6 group/item transition-all duration-700 bg-zinc-950 border-white/5 hover:border-primary/30 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-[2px] h-full bg-primary/20 group-hover/item:bg-primary transition-colors" />
                                        <div className="flex items-start justify-between gap-8">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <Badge 
                                                        variant={task.status === 'Completed' ? 'success' : task.status === 'In Progress' ? 'primary' : 'warning'} 
                                                        className="uppercase text-[10px] font-black tracking-widest px-4 py-1 rounded-xl italic border-0 shadow-sm"
                                                    >
                                                        {task.status.toUpperCase()}
                                                    </Badge>
                                                    <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">OPS_REF_{task._id.slice(-6).toUpperCase()}</span>
                                                </div>
                                                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-3 truncate group-hover/item:text-primary transition-colors leading-tight">{task.title}</h3>
                                                <p className="text-[12px] text-white/50 line-clamp-2 mb-6 italic leading-relaxed font-serif">{task.description}</p>
                                                <div className="flex items-center gap-6 text-[11px] text-white/30 font-black uppercase tracking-widest">
                                                    <span className="flex items-center gap-2"><Calendar size={14} className="text-primary/40" /> {new Date(task.deadline || Date.now()).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-4">
                                                {task.status === 'Pending' ? (
                                                    <button 
                                                        onClick={() => handleUpdateTaskStatus(task._id, 'In Progress')} 
                                                        className="px-6 py-3 rounded-2xl bg-primary text-zinc-950 font-black uppercase text-[11px] tracking-widest hover:scale-[1.05] active:scale-95 transition-all shadow-glow italic"
                                                    >
                                                        Activate
                                                    </button>
                                                ) : task.status !== 'Completed' ? (
                                                    <button 
                                                        onClick={() => handleUpdateTaskStatus(task._id, 'Completed')} 
                                                        className="w-16 h-16 rounded-[2rem] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500 hover:text-zinc-950 transition-all shadow-glow hover:shadow-emerald-500/40 group/check"
                                                    >
                                                        <CheckCircle2 size={32} className="group-hover/check:scale-110 transition-transform" />
                                                    </button>
                                                ) : (
                                                    <div className="w-16 h-16 rounded-[2rem] bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 flex items-center justify-center">
                                                        <CheckCircle2 size={32} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    ) : activeTab === 'history' ? (
                        <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                            {history.length === 0 ? (
                                <div className="py-32 flex flex-col items-center justify-center app-card border-dashed bg-zinc-950/20 opacity-20">
                                    <Activity size={64} className="mb-6 text-emerald-500" />
                                    <p className="text-[12px] font-black uppercase tracking-[0.6em] text-center">Transmission scan log<br/>is blank</p>
                                </div>
                            ) : (
                                history.map((record, i) => (
                                    <div key={i} className="app-card p-6 group transition-all duration-700 bg-zinc-950 border-white/5 hover:border-emerald-500/40 relative">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex items-start justify-between gap-8 relative z-10">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <Badge variant="success" className="uppercase text-[10px] font-black tracking-widest px-4 py-1 rounded-xl italic border-0 shadow-emerald-500/10">
                                                        AUTHORIZED
                                                    </Badge>
                                                    <span className="text-[10px] text-emerald-500/40 font-black uppercase tracking-[0.3em] leading-none">
                                                        Point Control: {record.gate.toUpperCase()}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-3 truncate group-hover:text-emerald-400 transition-colors leading-tight">{record.name}</h3>
                                                <div className="flex flex-col gap-3">
                                                    <p className="text-[11px] text-white/30 tracking-[0.3em] font-mono">CODE_{record.ticketId.toUpperCase()}</p>
                                                    <div className="flex items-center gap-5 text-[11px] text-white/40 font-black uppercase tracking-widest">
                                                        <span className="flex items-center gap-2"><Clock size={14} className="text-emerald-500/40" /> {new Date(record.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-16 h-16 rounded-[2rem] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shadow-glow-emerald">
                                                <CheckCircle2 size={32} />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    ) : (
                        <motion.div key="events" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                            {events.map((event) => (
                                <div
                                    key={event._id}
                                    onClick={() => setSelectedEvent(event)}
                                    className={`app-card p-6 group relative overflow-hidden transition-all duration-700 cursor-pointer ${selectedEvent?._id === event._id ? 'border-primary/50 bg-zinc-900' : 'bg-zinc-950 border-white/5 hover:border-primary/30'}`}
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                                    <div className="flex items-start justify-between gap-8 relative z-10">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className={`w-2 h-2 rounded-full ${selectedEvent?._id === event._id ? 'bg-primary animate-pulse shadow-glow' : 'bg-emerald-500 shadow-glow-emerald'}`} />
                                                <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${selectedEvent?._id === event._id ? 'text-primary animate-shine' : 'text-emerald-500'}`}>
                                                    {selectedEvent?._id === event._id ? 'OPERATIONAL SECTOR' : 'ASSIGNED SECTOR'}
                                                </span>
                                            </div>
                                            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4 truncate leading-none group-hover:text-primary transition-colors">{event.event_name}</h3>
                                            <div className="flex flex-wrap gap-x-8 gap-y-3 mt-6">
                                                <div className="flex items-center gap-3 text-[11px] text-white/40 font-black uppercase tracking-widest">
                                                    <Calendar size={14} className="text-primary/50" /> {new Date(event.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px] text-white/40 font-black uppercase tracking-[0.2em] truncate max-w-[200px] italic">
                                                    <MapPin size={14} className="text-primary/50" /> {event.venue}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 text-white/20 transition-all duration-500 flex items-center justify-center group-hover:bg-primary group-hover:text-zinc-950 group-hover:scale-110 group-hover:rotate-12 ${selectedEvent?._id === event._id ? 'bg-primary text-zinc-950' : ''}`}>
                                            <ChevronRight size={28} className="translate-x-0.5" />
                                        </div>
                                    </div>
                                    {selectedEvent?._id === event._id && (
                                        <motion.div layoutId="event-indicator" className="absolute top-0 left-0 w-1.5 h-full bg-primary shadow-glow" />
                                    )}
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default VolunteerDashboard;
