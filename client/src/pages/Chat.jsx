import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, User as UserIcon, MessageSquare, ArrowLeft, Search, Calendar, MapPin, Badge as BadgeIcon, Clock, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, Input, Badge } from '../components/ui/Components';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const Chat = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [connections, setConnections] = useState([]);
    const [selectedConnection, setSelectedConnection] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const scrollRef = useRef();
    const messageContainerRef = useRef();
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    useEffect(() => {
        fetchChatContext();
    }, []);

    useEffect(() => {
        if (location.state?.receiverId) {
            const conn = connections.find(c => c.otherUser._id === location.state.receiverId);
            if (conn) setSelectedConnection(conn);
        } else if (location.state?.eventId && connections.length > 0) {
            const conn = connections.find(c => c.events?.some(e => e._id === location.state.eventId));
            if (conn) setSelectedConnection(conn);
        }
    }, [connections, location.state]);

    useEffect(() => {
        if (selectedConnection) {
            fetchMessages(selectedConnection.otherUser._id);
            const interval = setInterval(() => fetchMessages(selectedConnection.otherUser._id), 3000);
            return () => clearInterval(interval);
        }
    }, [selectedConnection]);

    // Track when we switch connections to trigger a one-time scroll
    const [lastOpenedId, setLastOpenedId] = useState(null);
    useEffect(() => {
        if (selectedConnection && selectedConnection.otherUser._id !== lastOpenedId && messages.length > 0) {
            scrollToBottom(true);
            setLastOpenedId(selectedConnection.otherUser._id);
        }
    }, [selectedConnection, messages]);



    const fetchChatContext = async () => {
        try {
            const [eventsRes, usersRes, adminsRes] = await Promise.all([
                axios.get('/events'),
                user.role === 'Admin' ? axios.get('/admin/users') : Promise.resolve({ data: [] }),
                axios.get('/auth/admins')
            ]);

            const connectionMap = new Map();

            // Add Admins to connections for everyone except Admins themselves (to avoid self-chat)
            // Or if Admin, maybe they want to chat with other Admins? For now, following "default chat with admin" for others.
            adminsRes.data.forEach(adminUser => {
                if (adminUser._id !== user._id) {
                    connectionMap.set(adminUser._id, { otherUser: adminUser, events: [] });
                }
            });

            // Logic for regular users (Client vs EventManager)
            if (user.role !== 'Admin') {
                const hiringEvents = eventsRes.data.filter(e => e.client_id && e.event_manager_id);
                hiringEvents.forEach(e => {
                    const isClient = user.role === 'Client';
                    const otherUser = isClient ? e.event_manager_id : e.client_id;
                    if (!otherUser) return;
                    if (!connectionMap.has(otherUser._id)) {
                        connectionMap.set(otherUser._id, { otherUser, events: [e] });
                    } else if (connectionMap.get(otherUser._id).events) {
                        connectionMap.get(otherUser._id).events.push(e);
                    }
                });
            } else {
                // Logic for Admin: See all EventManagers
                const managers = usersRes.data.filter(u => u.role === 'EventManager');
                managers.forEach(m => {
                    connectionMap.set(m._id, { otherUser: m, events: [] });
                });
            }

            const uniqueConnections = Array.from(connectionMap.values());
            setConnections(uniqueConnections);
            setLoading(false);

            if (location.state?.receiverId) {
                const found = uniqueConnections.find(c => c.otherUser._id === location.state.receiverId);
                if (found) setSelectedConnection(found);
            }
        } catch (error) {
            console.error('Error fetching chat context:', error);
            setLoading(false);
        }
    };

    const fetchMessages = async (receiverId) => {
        try {
            const res = await axios.get(`/messages/${receiverId}`);
            setMessages(res.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const content = newMessage.trim();
        if (!content || !selectedConnection) return;

        const tempId = Date.now().toString();
        const tempMsg = {
            _id: tempId,
            sender: { _id: user.id || user._id, name: user.name },
            content,
            created_at: new Date().toISOString(),
            isPending: true
        };

        setMessages(prev => [...prev, tempMsg]);
        setNewMessage('');

        try {
            const res = await axios.post('/messages', {
                receiver_id: selectedConnection.otherUser._id,
                content
            });
            setMessages(prev => prev.map(m => m._id === tempId ? { ...res.data, isPending: false } : m));
        } catch (error) {
            toast.error('Failed to send message');
            setMessages(prev => prev.map(m => m._id === tempId ? { ...m, error: true } : m));
        }
    };

    const scrollToBottom = (instant = false) => {
        setTimeout(() => {
            scrollRef.current?.scrollIntoView({
                behavior: instant ? 'auto' : 'smooth',
                block: 'end'
            });
        }, 100);
    };

    const filteredConnections = connections.filter(c =>
        c.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.events?.some(e => e.event_name.toLowerCase().includes(searchQuery.toLowerCase())) ?? false)
    );

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-80px)] bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {/* Background Orbs */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />

                <div className="relative z-10 flex flex-col items-center gap-8">
                    <div className="relative">
                        <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin shadow-[0_0_40px_rgba(212,175,55,0.2)]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-10 w-10 rounded-full bg-primary/20 blur-xl animate-pulse" />
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-[11px] font-black text-white/70 uppercase tracking-[0.5em] animate-pulse">Initializing System</span>
                        <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-32vh)] sm:h-[calc(100vh-100px)] flex flex-col overflow-hidden">
            <div className="w-full h-full flex flex-col min-h-0 relative z-10">
                {/* Main Glass Panel */}
                <div className="app-card overflow-hidden flex-1 min-h-0 flex rounded-t-[2rem] md:rounded-t-[3rem] border-white/5 bg-surface/40 backdrop-blur-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] border-b-0">

                    {/* Contacts Sidebar */}
                    <div className={`w-full md:w-80 border-r border-white/5 flex flex-col ${selectedConnection ? 'hidden md:flex' : 'flex'}`}>
                        <div className="p-6 border-b border-white/5">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 group-focus-within:text-primary transition-colors" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search chats..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-[11px] font-black uppercase tracking-widest text-white placeholder:text-white/80 focus:outline-none focus:border-primary/20 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {filteredConnections.length === 0 ? (
                                <div className="text-center py-20 opacity-20">
                                    <MessageSquare size={32} className="mx-auto mb-4" />
                                    <p className="text-[9px] font-black uppercase tracking-[0.5em]">No messages yet</p>
                                </div>
                            ) : (
                                filteredConnections.map((conn) => {
                                    const { otherUser, events } = conn;
                                    const isActive = selectedConnection?.otherUser._id === otherUser._id;

                                    return (
                                        <button
                                            key={otherUser._id}
                                            onClick={() => setSelectedConnection(conn)}
                                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 relative group ${isActive
                                                ? 'bg-primary/10 border border-primary/20 shadow-[0_0_30px_rgba(212,175,55,0.05)]'
                                                : 'hover:bg-white/[0.03] border border-transparent hover:border-white/5'}`}
                                        >
                                            <div className="relative">
                                                <div className="w-11 h-11 rounded-[1.25rem] bg-zinc-900 border border-white/10 flex items-center justify-center font-black text-[9px] text-primary transition-transform group-hover:scale-110">
                                                    {otherUser?.name?.[0] || 'U'}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0C0C0E] shadow-glow" />
                                            </div>
                                            <div className="flex-1 text-left min-w-0">
                                                <p className={`text-xs font-black uppercase tracking-widest truncate ${isActive ? 'text-white' : 'text-white/90 group-hover:text-white'}`}>
                                                    {otherUser?.name || 'Unknown User'}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[9px] text-primary font-black uppercase tracking-widest opacity-60">
                                                        {otherUser?.role}
                                                    </span>
                                                    {events?.length > 0 && (
                                                        <>
                                                            <span className="w-0.5 h-0.5 rounded-full bg-white/20" />
                                                            <span className="text-[9px] text-white/80 font-bold uppercase tracking-widest">
                                                                {events.length} Proj
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Active Conversation Area */}
                    <div className={`flex-1 flex flex-col bg-zinc-900/20 backdrop-blur-md ${!selectedConnection ? 'hidden md:flex' : 'flex'}`}>
                        {selectedConnection ? (
                            <>
                                {/* Chat Header */}
                                <div className="h-20 px-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/40">
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setSelectedConnection(null)} className="md:hidden p-2 text-white/70 hover:text-primary transition-all pr-2">
                                            <ArrowLeft size={18} />
                                        </button>
                                        <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center font-black text-[9px] text-primary shadow-lg">
                                            {selectedConnection.otherUser.name[0]}
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black text-white uppercase tracking-widest leading-none">{selectedConnection.otherUser.name}</h3>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-glow" />
                                                <span className="text-[9px] text-primary/60 font-black uppercase tracking-[0.2em]">{selectedConnection.otherUser.role}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="hidden sm:flex items-center gap-4">
                                        <Badge variant="ghost" className="text-[9px] font-black uppercase tracking-widest bg-white/5 border-white/5">Secure Connection</Badge>
                                    </div>
                                </div>

                                {/* Messages Scroll Zone */}
                                <div
                                    ref={messageContainerRef}
                                    className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.03),transparent_50%)]"
                                >
                                    <AnimatePresence initial={false}>
                                        {messages.map((msg, index) => {
                                            const isMe = (msg.sender._id || msg.sender) === (user.id || user._id);
                                            return (
                                                <motion.div
                                                    key={msg._id || index}
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-1.5`}>
                                                        <div className={`p-4 md:p-5 rounded-[1rem] text-[13px] font-bold leading-relaxed shadow-glow ${isMe
                                                            ? 'btn-prismatic text-primary rounded-br-sm'
                                                            : 'bg-white/[0.04] border border-white/5 text-white backdrop-blur-3xl rounded-bl-sm'
                                                            } ${msg.isPending ? 'opacity-50' : ''} ${msg.error ? 'border-rose-500/40 bg-rose-500/10 text-rose-400' : ''}`}>
                                                            {msg.content}
                                                        </div>
                                                        <span className="text-[9px] font-black text-white/70 uppercase tracking-widest px-2">
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                    <div ref={scrollRef} />
                                </div>

                                {/* Transmission Input */}
                                <div className="p-6 border-t border-white/5 bg-zinc-900/40 backdrop-blur-3xl">
                                    <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                                        <div className="flex-1 relative group">
                                            <input
                                                type="text"
                                                placeholder="Type a message..."
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                className="w-full bg-white/[0.03] border border-white/5 rounded-[1.5rem] py-4 px-6 text-xs font-bold text-white focus:outline-none focus:border-primary/20 transition-all placeholder:text-white/80"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                                <span className="text-[9px] font-black text-white/70 uppercase tracking-widest hidden sm:block">Press Enter</span>
                                            </div>
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={!newMessage.trim()}
                                            variant="prismatic"
                                            className="h-14 w-14 rounded-full flex items-center justify-center text-primary disabled:opacity-30 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-glow"
                                        >
                                            <Send size={20} fill="currentColor" />
                                        </Button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.02),transparent_70%)]" />
                                <div className="w-20 h-20 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6 relative">
                                    <MessageSquare size={32} className="text-primary/50" />
                                    <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
                                </div>
                                <h3 className="text-xs font-black text-white uppercase tracking-[0.4em] mb-2">Select a Chat</h3>
                                <p className="text-[11px] text-white/80 font-bold uppercase tracking-widest max-w-[200px]">Choose a person to start messaging</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
