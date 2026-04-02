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

                    toast.success('Offline Command Linked', {
                        icon: '🛰️',
                        style: { background: '#d4af37', color: '#000', fontWeight: 'bold' }
                    });
                }
            }
        } catch (error) {
            console.error('Push sync failed:', error);
            toast.error('Tactical sync failed. Ensure you are on a secure connection.');
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
            toast.success(`NEW MISSION DETECTED: ${newTask.title}`, {
                icon: '🎯',
                style: { background: '#d4af37', color: '#000', fontWeight: 'bold' }
            });
            
            const newNotification = {
                id: Date.now(),
                type: 'mission',
                title: 'New Mission Target',
                message: `Assigned: ${newTask.title}`,
                eventName: newTask.eventId?.event_name || 'Global Command',
                timestamp: new Date(),
                read: false
            };
            
            setNotifications(prev => [newNotification, ...prev]);
            sendNativeNotification('COMMAND: NEW MISSION TARGET', `Objective: ${newTask.title} | Sector: ${newNotification.eventName}`);
            fetchInitialData();
        };

        const handleTaskDeleted = (data) => {
            const missionTitle = typeof data === 'string' ? 'Target' : data.title;
            toast.error('Mission aborted/rescinded by centralized command.', {
                icon: '🗑️',
                style: { background: '#ef4444', color: '#fff', fontWeight: 'bold' }
            });
            
            const newNotification = {
                id: Date.now(),
                type: 'aborted',
                title: 'Mission Rescinded',
                message: `Aborted: ${missionTitle}`,
                eventName: data.eventName || 'Global Command',
                timestamp: new Date(),
                read: false
            };
            
            setNotifications(prev => [newNotification, ...prev]);
            sendNativeNotification('COMMAND: MISSION RESCINDED', `Objective: ${missionTitle} | Status: Aborted by centralized command`);
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

    const handleSOS = () => {
        if (!selectedEvent) return;
        
        setEmergencyLoading(true);
        socket.emit('volunteer_emergency', {
            eventId: selectedEvent._id,
            eventName: selectedEvent.event_name,
            volunteerName: user.name,
            location: selectedEvent.venue,
            timestamp: new Date().toISOString()
        });

        setTimeout(() => {
            setEmergencyLoading(false);
            toast.error('EMERGENCY SIGNAL DISPATCHED', {
                duration: 5000,
                icon: '🚨',
                style: {
                    background: '#ef4444',
                    color: '#fff',
                    fontWeight: 'bold'
                }
            });
        }, 1000);
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
            toast.success(`Mission Update: ${newStatus}`);
            fetchInitialData(); // Refresh global list
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

                {/* Command Header */}
                <div className="flex items-center justify-between px-1">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none uppercase">
                            force <span className="text-gradient-gold-soft italic font-serif">HUB.</span>
                        </h1>
                        <p className="text-[11px] text-white/70 mt-3 uppercase tracking-[0.4em] font-black italic">Authorized volunteer corps • Unit {user.name.split(' ')[0]}</p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-3">
                            {/* Native Notification Sync */}
                            {notificationPermission !== 'granted' && (
                                <button 
                                    onClick={requestNotificationPermission}
                                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:bg-primary/10 hover:text-primary transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2"
                                    title="Enable WhatsApp-style System Alerts"
                                >
                                    <Zap size={12} className="animate-pulse" />
                                    Sync Alerts
                                </button>
                            )}

                            {/* Notification Bell Hub */}
                            <div className="relative">
                                <button 
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative ${showNotifications ? 'bg-primary text-background' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                                >
                                    <Bell size={18} className={notifications.some(n => !n.read) ? 'animate-tada' : ''} />
                                    {notifications.some(n => !n.read) && (
                                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                                    )}
                                </button>

                                <AnimatePresence>
                                    {showNotifications && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute top-full mt-3 right-0 w-80 bg-zinc-950 border border-white/10 rounded-[2rem] shadow-2xl z-[100] overflow-hidden"
                                        >
                                            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Tactical Comms</h3>
                                                <button 
                                                    onClick={() => {
                                                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                                                        setShowNotifications(false);
                                                    }}
                                                    className="text-[9px] font-black text-primary uppercase"
                                                >
                                                    Clear All
                                                </button>
                                            </div>
                                            <div className="max-h-[350px] overflow-y-auto no-scrollbar">
                                                {notifications.length === 0 ? (
                                                    <div className="p-12 text-center opacity-20">
                                                        <Zap size={24} className="mx-auto mb-3" />
                                                        <p className="text-[9px] font-black uppercase tracking-widest">No signals detected</p>
                                                    </div>
                                                ) : (
                                                    notifications.map(notification => (
                                                        <div key={notification.id} className={`p-5 border-b border-white/5 hover:bg-white/[0.03] transition-colors relative ${!notification.read ? 'bg-primary/[0.02]' : ''}`}>
                                                            {!notification.read && <div className="absolute top-6 left-2 w-1 h-1 bg-primary rounded-full shadow-glow" />}
                                                            <div className="flex items-start gap-4">
                                                                <div className={`mt-1 p-2 rounded-lg ${notification.type === 'mission' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                                    {notification.type === 'mission' ? <Target size={14} /> : <Trash2 size={14} />}
                                                                 </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <p className="text-[10px] font-black text-white uppercase tracking-tight">{notification.title}</p>
                                                                        <span className="text-[8px] font-black text-white/30 uppercase">{new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                    </div>
                                                                    <p className="text-[10px] text-white/60 mb-1">{notification.message}</p>
                                                                    <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">{notification.eventName}</p>
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
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/50 flex items-center gap-2 transition-all duration-300 ${emergencyLoading ? 'bg-red-500 text-white animate-pulse' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]'}`}
                            >
                                <Shield size={12} fill="currentColor" />
                                {emergencyLoading ? 'SENDING...' : 'SOS'}
                            </button>
                        </div>
                        {selectedEvent && (
                            <div className="text-right hidden sm:block px-1">
                                <p className="text-[9px] text-primary font-black uppercase tracking-widest mb-1 italic leading-none">Active Operations Node</p>
                                <p className="text-[9px] font-black text-white uppercase truncate max-w-[150px] opacity-60 tracking-wider">SEC_{selectedEvent.event_name.toUpperCase().replace(/\s+/g, '_')}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Guests', value: stats?.totalTickets || 0, icon: Users, color: 'text-primary' },
                        { label: 'Verified', value: stats?.checkedIn || 0, icon: CheckCircle2, color: 'text-emerald-500' },
                        { label: 'Remaining', value: stats?.remaining || 0, icon: Activity, color: 'text-blue-400' },
                        { label: 'My Ops', value: tasks.length || 0, icon: Target, color: 'text-amber-500' },
                    ].map((stat, i) => (
                        <div key={i} className="app-card p-5 flex flex-col items-center justify-center text-center group bg-zinc-900/40 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <stat.icon size={14} className={`${stat.color} opacity-40 mb-2 group-hover:opacity-100 transition-opacity`} />
                            <p className="text-xl font-black text-white tracking-tighter group-hover:text-primary transition-colors">{stat.value}</p>
                            <p className="text-[9px] text-white/90 font-black uppercase tracking-[0.2em] mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Mission Intake Hub (High Priority - Across all assigned events) */}
                {allTasks.filter(t => t.status === 'Pending').length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }} 
                        animate={{ opacity: 1, x: 0 }}
                        className="p-6 rounded-[2rem] bg-gradient-to-br from-amber-500/20 via-amber-500/5 to-transparent border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.1)] relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Target size={120} className="text-amber-500" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                                <h2 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.4em]">Strategic Mission Requests</h2>
                            </div>
                            <div className="space-y-4">
                                {allTasks.filter(t => t.status === 'Pending').map(task => {
                                    const eventName = events.find(e => e._id === task.eventId)?.event_name || 'Assigned Sector';
                                    return (
                                        <div key={task._id} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-black/40 border border-white/5 group hover:border-amber-500/40 transition-all">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-[11px] font-black text-white uppercase tracking-tight mb-1 truncate">{task.title}</h3>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[8px] py-0 px-2 opacity-60">{eventName}</Badge>
                                                    <span className="text-[9px] text-white/30 uppercase tracking-widest italic truncate">{task.description}</span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleUpdateTaskStatus(task._id, 'In Progress')}
                                                className="px-6 py-2.5 rounded-xl bg-amber-500 text-background text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-glow shadow-amber-500/30 italic whitespace-nowrap"
                                            >
                                                Accept Mission
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Verification Scanner UI */}
                <div className="app-card p-2 bg-gradient-to-br from-primary/10 via-transparent to-transparent border-primary/20">
                    <div className="p-6 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-glow" />
                            <h2 className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Gate Verification Node</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="relative group">
                                <QrCode className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/70 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="SCANNING PROTOCOL: ENTER TICKET ID..."
                                    value={ticketId}
                                    onChange={(e) => setTicketId(e.target.value.toLowerCase())}
                                    onKeyPress={(e) => e.key === 'Enter' && handleVerifyTicket()}
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-5 pl-14 pr-16 text-xs font-black uppercase tracking-[0.2em] text-white placeholder:text-white/80 focus:outline-none focus:border-primary/40 transition-all font-mono"
                                />
                                <button
                                    onClick={() => setIsScannerOpen(true)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-background transition-all"
                                >
                                    <Camera size={18} />
                                </button>
                            </div>
                            <Button
                                onClick={() => handleVerifyTicket()}
                                disabled={!ticketId || verifying}
                                variant="luxury"
                                className="w-full h-14 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-[0_0_40px_rgba(212,175,55,0.2)] disabled:opacity-20 disabled:scale-95 transition-all italic"
                            >
                                {verifying ? 'DECODING...' : 'AUTHORIZE ENTRY'}
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

                {/* Operation Selection */}
                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
                    {[
                        { id: 'tasks', label: 'Mission Brief', icon: ListTodo },
                        { id: 'history', label: 'History', icon: Activity },
                        { id: 'events', label: 'Field Ops', icon: Target }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl transition-all duration-300 relative ${activeTab === tab.id
                                ? 'bg-surface text-primary shadow-xl border border-white/5'
                                : 'text-white/90 hover:text-white/60'}`}
                        >
                            {tab.id === 'tasks' && tasks.filter(t => t.status === 'Pending').length > 0 && (
                                <span className="absolute top-2 right-2 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                                </span>
                            )}
                            <tab.icon size={14} className="hidden sm:block" />
                            <span className="text-[11px] font-black uppercase tracking-widest leading-none">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'tasks' ? (
                        <motion.div key="tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                            {tasks.length === 0 ? (
                                <div className="py-24 flex flex-col items-center justify-center app-card border-dashed opacity-10">
                                    <Shield size={48} className="mb-4" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.5em]">No active mandates detected</p>
                                </div>
                            ) : (
                                tasks.map((task) => (
                                    <div key={task._id} className="app-card p-5 group transition-all duration-500 bg-zinc-900/40 hover:border-primary/40">
                                        <div className="flex items-start justify-between gap-6">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <Badge 
                                                        variant={task.status === 'Completed' ? 'success' : task.status === 'In Progress' ? 'primary' : 'warning'} 
                                                        className="uppercase text-[9px] font-black tracking-widest px-2 py-0.5 rounded-lg italic"
                                                    >
                                                        {task.status}
                                                    </Badge>
                                                    <span className="text-[9px] text-white/70 font-bold uppercase tracking-widest">Op #{task._id.slice(-4).toUpperCase()}</span>
                                                </div>
                                                <h3 className="text-[11px] font-black text-white uppercase tracking-tight mb-2 truncate group-hover:text-primary transition-colors">{task.title}</h3>
                                                <p className="text-[11px] text-white/90 line-clamp-1 mb-4 italic leading-relaxed">{task.description}</p>
                                                <div className="flex items-center gap-4 text-[11px] text-white/80 font-black uppercase tracking-widest">
                                                    <span className="flex items-center gap-1.5"><Calendar size={12} className="text-primary/70" /> {new Date(task.deadline || Date.now()).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            {task.status === 'Pending' ? (
                                                <button 
                                                    onClick={() => handleUpdateTaskStatus(task._id, 'In Progress')} 
                                                    className="px-4 py-2 rounded-xl bg-primary text-background font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-glow shadow-primary/20 italic"
                                                >
                                                    Accept Mission
                                                </button>
                                            ) : task.status !== 'Completed' ? (
                                                <button 
                                                    onClick={() => handleUpdateTaskStatus(task._id, 'Completed')} 
                                                    className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-glow"
                                                >
                                                    <CheckCircle2 size={24} />
                                                </button>
                                            ) : (
                                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 flex items-center justify-center">
                                                    <CheckCircle2 size={24} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    ) : activeTab === 'history' ? (
                        <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                            {history.length === 0 ? (
                                <div className="py-24 flex flex-col items-center justify-center app-card border-dashed opacity-10">
                                    <Activity size={48} className="mb-4 text-emerald-500" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-center">No scanning history<br/>for this operating node</p>
                                </div>
                            ) : (
                                history.map((record, i) => (
                                    <div key={i} className="app-card p-5 group transition-all duration-500 bg-zinc-900/40 hover:border-emerald-500/40">
                                        <div className="flex items-start justify-between gap-6">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <Badge variant="success" className="uppercase text-[9px] font-black tracking-widest px-2 py-0.5 rounded-lg italic">
                                                        VERIFIED
                                                    </Badge>
                                                    <span className="text-[9px] text-emerald-500/50 font-bold uppercase tracking-widest leading-none">
                                                        Gate: {record.gate}
                                                    </span>
                                                </div>
                                                <h3 className="text-[11px] font-black text-white uppercase tracking-tight mb-2 truncate group-hover:text-emerald-400 transition-colors">{record.name}</h3>
                                                <div className="flex flex-col gap-2">
                                                    <p className="text-[11px] text-white/90 italic">Ticket: #{record.ticketId}</p>
                                                    <div className="flex items-center gap-4 text-[11px] text-white/80 font-black uppercase tracking-widest">
                                                        <span className="flex items-center gap-1.5"><Clock size={12} className="text-emerald-500/40" /> {new Date(record.checkedInAt).toLocaleTimeString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shadow-glow">
                                                <CheckCircle2 size={24} />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    ) : (
                        <motion.div key="events" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                            {events.map((event) => (
                                <div
                                    key={event._id}
                                    onClick={() => setSelectedEvent(event)}
                                    className={`app-card p-5 group relative overflow-hidden transition-all duration-500 cursor-pointer ${selectedEvent?._id === event._id ? 'border-primary/40 bg-primary/5' : 'bg-zinc-900/40 hover:border-primary/30'}`}
                                >
                                    <div className="flex items-start justify-between gap-6">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className={`w-1.5 h-1.5 rounded-full ${selectedEvent?._id === event._id ? 'bg-primary animate-pulse shadow-glow' : 'bg-emerald-500'}`} />
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${selectedEvent?._id === event._id ? 'text-primary' : 'text-emerald-500'}`}>
                                                    {selectedEvent?._id === event._id ? 'Current Node' : 'Confirmed Deployment'}
                                                </span>
                                            </div>
                                            <h3 className="text-xs font-black text-white uppercase tracking-tight mb-2 truncate leading-none group-hover:text-primary transition-colors">{event.event_name}</h3>
                                            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
                                                <div className="flex items-center gap-1.5 text-[11px] text-white/90 font-black uppercase tracking-widest">
                                                    <Calendar size={12} className="text-primary/70" /> {new Date(event.start_date).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] text-white/90 font-black uppercase tracking-widest truncate max-w-[150px]">
                                                    <MapPin size={12} className="text-primary/70" /> {event.venue}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 text-white/80 transition-all flex items-center justify-center">
                                            <ChevronRight size={18} />
                                        </div>
                                    </div>
                                    <div className={`absolute top-0 right-0 w-1.5 h-full transition-all duration-700 ${selectedEvent?._id === event._id ? 'bg-primary' : 'bg-primary/10 group-hover:bg-primary'}`} />
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
