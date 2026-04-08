import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import {
    Bot,
    Send,
    Sparkles,
    Terminal,
    Zap,
    AlertCircle,
    TrendingUp,
    Shield,
    ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Button } from './ui/Components';

const AICommandCenter = ({ eventId }) => {
    const location = useLocation();
    const [messages, setMessages] = useState([
        { role: 'assistant', text: "Systems online. I'm your AI Logistics Assistant. How can I optimize your event today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [availableEvents, setAvailableEvents] = useState([]);
    const [resolvedEventId, setResolvedEventId] = useState(eventId || null);
    const [isEventMenuOpen, setIsEventMenuOpen] = useState(false);
    const scrollRef = useRef(null);
    const eventMenuRef = useRef(null);

    useEffect(() => {
        const incomingEventId = eventId || location.state?.eventId || null;
        setResolvedEventId(incomingEventId);
    }, [eventId, location.state]);

    useEffect(() => {
        const bootstrapEvents = async () => {
            try {
                const res = await axios.get('/events');
                const rows = Array.isArray(res.data) ? res.data : [];
                setAvailableEvents(rows);

                if (!rows.length) return;

                const currentId = eventId || location.state?.eventId || null;
                if (currentId && rows.some((e) => e._id === currentId)) {
                    setResolvedEventId(currentId);
                    return;
                }

                const now = Date.now();
                const upcoming = rows
                    .filter((e) => new Date(e.end_date).getTime() >= now)
                    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
                const fallback = upcoming[0] || rows[0];
                setResolvedEventId(fallback?._id || null);
            } catch (error) {
                console.error('Error loading AI event context:', error);
            }
        };

        bootstrapEvents();
    }, [eventId, location.state]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (eventMenuRef.current && !eventMenuRef.current.contains(event.target)) {
                setIsEventMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        if (!resolvedEventId) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: 'Please select an event first so I can plan logistics for the correct event.'
            }]);
            return;
        }

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            const res = await axios.post('/ai/command', { command: userMsg, eventId: resolvedEventId });
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: res.data.message,
                action: res.data.action,
                data: res.data.data
            }]);
        } catch (error) {
            const backendMessage = error?.response?.data?.error || error?.response?.data?.message;
            setMessages(prev => [...prev, { role: 'assistant', text: backendMessage || "Error processing command. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleExecute = async (msgIndex) => {
        const msg = messages[msgIndex];
        setLoading(true);
        try {
            const res = await axios.post('/ai/execute', {
                action: msg.action,
                data: msg.data,
                eventId: resolvedEventId
            });
            toast.success(res.data.message);
            setMessages(prev => [...prev, { role: 'assistant', text: `Optimization applied successfully: ${res.data.message}` }]);

            // Auto-recheck readiness after optimization so user sees updated overall status.
            try {
                const statusRes = await axios.post('/ai/command', {
                    command: 'status overview',
                    eventId: resolvedEventId
                });
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    text: statusRes.data.message,
                    action: statusRes.data.action,
                    data: statusRes.data.data
                }]);
            } catch {
                // Keep UX resilient even if status refresh fails.
            }

            if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('logisticsUpdate'));
            }
        } catch (error) {
            const backendMessage = error?.response?.data?.error || error?.response?.data?.message;
            toast.error(backendMessage || 'Failed to apply optimization');
        } finally {
            setLoading(false);
        }
    };

    const renderActionBadge = (action, index) => {
        switch (action) {
            case 'SUGGEST_RESOURCE': return (
                <div className="flex flex-col gap-3">
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500 uppercase"><AlertCircle size={10} /> Optimization Needed</span>
                    <Button
                        onClick={() => handleExecute(index)}
                        variant="luxury"
                        className="w-full h-10 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20"
                    >
                        Apply Optimization
                    </Button>
                </div>
            );
            case 'BULK_OPTIMIZE': return (
                <div className="flex flex-col gap-3">
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500 uppercase"><AlertCircle size={10} /> Full Optimization Needed</span>
                    <Button
                        onClick={() => handleExecute(index)}
                        variant="luxury"
                        className="w-full h-10 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20"
                    >
                        Apply Full Optimization
                    </Button>
                </div>
            );
            case 'BUDGET_SUMMARY': return <span className="flex items-center gap-1 text-[12px] font-bold text-green-500 uppercase"><TrendingUp size={10} /> Financial Insight</span>;
            case 'READINESS_UPDATE': return <span className="flex items-center gap-1 text-[12px] font-bold text-blue-500 uppercase"><Shield size={10} /> Readiness Insight</span>;
            default: return null;
        }
    }

    return (
        <div className="app-card flex flex-col h-[600px] rounded-[2.5rem] border-white/5 bg-zinc-900/40 backdrop-blur-3xl overflow-hidden shadow-2xl relative group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

            {/* Tactical Header */}
            <div className="p-6 border-b border-white/5 bg-black/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-primary/20 flex items-center justify-center text-primary shadow-glow group-hover:scale-105 transition-transform duration-500">
                            <Bot size={24} />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-[#0C0C0E] animate-pulse shadow-glow" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.24em]">Tactical Intelligence</h3>
                        <div className="flex items-center gap-2 mt-1.5 font-mono text-[10px] text-white/80 uppercase tracking-[0.18em] font-black">
                            <span className="flex items-center gap-1"><Terminal size={8} /> OS_v2.0.4</span>
                            <span className="w-1 h-1 rounded-full bg-white/10" />
                            <span className="text-primary italic">Neural_Link_Active</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/10" />
                </div>
            </div>

            {/* Matrix/Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.03),transparent_50%)]">
                {messages.map((m, i) => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={i}
                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[85%] space-y-3`}>
                            <div className={`p-5 rounded-[1.75rem] text-[14px] font-bold leading-relaxed shadow-glow ${m.role === 'user'
                                ? 'btn-prismatic text-primary rounded-tr-sm'
                                : 'bg-white/[0.04] border border-white/5 text-white backdrop-blur-3xl rounded-tl-sm'
                                }`}>
                                {m.text}
                                {m.action && (
                                    <div className="mt-5 pt-5 border-t border-white/5">
                                        {renderActionBadge(m.action, i)}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-3 px-3">
                                <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.35em]">
                                    {m.role === 'assistant' ? 'HUB_INTEL' : 'OPS_MANAGER'}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">
                                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white/[0.03] p-5 rounded-[1.5rem] border border-white/5 rounded-tl-none flex gap-2.5">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce shadow-glow" />
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-75 shadow-glow" />
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-150 shadow-glow" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Portal */}
            <div className="p-6 bg-zinc-950/40 border-t border-white/5">
                {availableEvents.length > 0 && (
                    <div ref={eventMenuRef} className="mb-4 relative">
                        <button
                            type="button"
                            onClick={() => setIsEventMenuOpen((prev) => !prev)}
                            className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-3 px-4 text-[11px] font-black uppercase tracking-[0.16em] text-white text-left focus:outline-none focus:border-primary/30"
                        >
                            {resolvedEventId
                                ? (availableEvents.find((ev) => ev._id === resolvedEventId)?.event_name || 'Select Event Context')
                                : 'Select Event Context'}
                        </button>
                        <ChevronDown
                            size={16}
                            className={`absolute right-4 top-1/2 -translate-y-1/2 text-white/70 transition-transform ${isEventMenuOpen ? 'rotate-180' : ''}`}
                        />

                        <AnimatePresence>
                            {isEventMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                    className="absolute z-[80] mt-2 w-full rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden"
                                >
                                    <div className="max-h-64 overflow-y-auto no-scrollbar">
                                        {availableEvents.map((ev) => (
                                            <button
                                                key={ev._id}
                                                type="button"
                                                onClick={() => {
                                                    setResolvedEventId(ev._id);
                                                    setIsEventMenuOpen(false);
                                                }}
                                                className={`w-full px-5 py-3 text-left text-[11px] font-black uppercase tracking-[0.15em] transition-colors ${resolvedEventId === ev._id
                                                    ? 'bg-primary/15 text-primary'
                                                    : 'text-white hover:bg-white/[0.05]'
                                                    }`}
                                            >
                                                {ev.event_name}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                <form onSubmit={handleSend} className="flex items-center gap-3 group/form">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Enter mission parameter..."
                            className="w-full bg-white/[0.02] border border-white/5 rounded-[1.5rem] py-5 pl-14 pr-6 text-white text-[12px] font-black uppercase tracking-[0.14em] placeholder:text-white/80 focus:outline-none focus:border-primary/20 transition-all font-mono"
                        />
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/70 group-focus-within/form:text-primary transition-colors">
                            <Terminal size={18} />
                        </div>
                    </div>
                    <Button
                        type="submit"
                        disabled={loading || !input.trim()}
                        variant="prismatic"
                        className="h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center text-primary disabled:opacity-30 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-glow"
                    >
                        <Send size={18} fill="currentColor" />
                    </Button>
                </form>

                <div className="mt-5 flex gap-4 overflow-x-auto pb-2 no-scrollbar px-1">
                    {['status overview', 'security check', 'budget report'].map(suggestion => (
                        <button
                            key={suggestion}
                            type="button"
                            onClick={() => setInput(suggestion)}
                            className="whitespace-nowrap px-4 py-2 rounded-xl border border-white/5 bg-white/[0.02] text-[10px] font-black text-white/80 hover:text-primary hover:border-primary/20 transition-all uppercase tracking-[0.2em] flex items-center gap-2 group/sug"
                        >
                            <Sparkles size={10} className="text-primary/70 group-hover/sug:animate-spin" />
                            {suggestion}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AICommandCenter;
