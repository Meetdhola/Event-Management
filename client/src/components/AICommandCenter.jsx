import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Bot,
    Send,
    Sparkles,
    Terminal,
    Zap,
    AlertCircle,
    TrendingUp,
    Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Button } from './ui/Components';

const AICommandCenter = ({ eventId }) => {
    const [messages, setMessages] = useState([
        { role: 'assistant', text: "Systems online. I'm your AI Logistics Assistant. How can I optimize your event today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            const res = await axios.post('/ai/command', { command: userMsg, eventId });
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: res.data.message,
                action: res.data.action,
                data: res.data.data
            }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', text: "Error processing command. Please try again." }]);
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
                eventId
            });
            toast.success(res.data.message);
            setMessages(prev => [...prev, { role: 'assistant', text: `Optimization applied successfully: ${res.data.message}` }]);
            if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('logisticsUpdate'));
            }
        } catch (error) {
            toast.error('Failed to apply optimization');
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
            case 'BUDGET_SUMMARY': return <span className="flex items-center gap-1 text-[11px] font-bold text-green-500 uppercase"><TrendingUp size={10} /> Financial Insight</span>;
            case 'READINESS_UPDATE': return <span className="flex items-center gap-1 text-[11px] font-bold text-blue-500 uppercase"><Shield size={10} /> Security Verified</span>;
            default: return null;
        }
    }

    return (
        <div className="app-card flex flex-col h-[650px] rounded-[3rem] border-white/5 bg-zinc-900/30 backdrop-blur-3xl overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative group border">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.05),transparent_70%)] pointer-events-none" />

            {/* Tactical Header */}
            <div className="p-8 border-b border-white/5 bg-black/40 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <motion.div 
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            className="w-14 h-14 rounded-2xl bg-zinc-900 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_30px_rgba(212,175,55,0.2)] group-hover:shadow-[0_0_50px_rgba(212,175,55,0.4)] transition-all duration-500"
                        >
                            <Bot size={28} />
                        </motion.div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-[#0C0C0E] animate-pulse shadow-glow" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.4em] leading-none mb-2">Tactical Intelligence</h3>
                        <div className="flex items-center gap-3 font-mono text-[10px] text-white/60 uppercase tracking-widest font-black">
                            <span className="flex items-center gap-1.5"><Terminal size={10} className="text-primary/70" /> HUB_OS_v2.1</span>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="text-primary italic animate-pulse">Neural_Link_Active</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary/30 animate-ping" />
                    <div className="w-2 h-2 rounded-full bg-primary/10" />
                </div>
            </div>

            {/* Matrix/Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar relative z-10">
                {messages.map((m, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        key={i}
                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[80%] space-y-4`}>
                            <div className={`p-6 rounded-[2rem] text-[14px] font-medium leading-relaxed shadow-2xl relative group/msg ${m.role === 'user'
                                ? 'bg-gradient-to-br from-primary/20 to-primary/5 text-primary-foreground border border-primary/20 rounded-tr-sm'
                                : 'bg-white/[0.03] border border-white/10 text-white/90 backdrop-blur-3xl rounded-tl-sm'
                                }`}>
                                <div className="relative z-10">{m.text}</div>
                                {m.action && (
                                    <div className="mt-6 pt-6 border-t border-white/10 relative z-10">
                                        {renderActionBadge(m.action, i)}
                                    </div>
                                )}
                                <div className={`absolute inset-0 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[2rem] ${m.role === 'user' ? 'bg-primary/5' : 'bg-white/[0.02]'}`} />
                            </div>
                            <div className={`flex items-center gap-3 px-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.6em]">
                                    {m.role === 'assistant' ? 'HUB_INTEL' : 'COMMAND_AUTH'}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest font-mono">
                                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white/[0.04] p-6 rounded-[1.75rem] border border-white/10 rounded-tl-none flex gap-3 shadow-xl">
                            <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-primary rounded-full shadow-glow" />
                            <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-primary rounded-full shadow-glow" />
                            <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-primary rounded-full shadow-glow" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Portal */}
            <div className="p-8 bg-black/40 border-t border-white/5 relative z-10">
                <form onSubmit={handleSend} className="relative group/form">
                    <div className="absolute inset-0 bg-primary/5 rounded-[2rem] blur-xl opacity-0 group-focus-within/form:opacity-100 transition-opacity duration-700" />
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="IDENTIFY MISSION PARAMETERS..."
                        className="w-full bg-white/[0.03] border border-white/10 rounded-[2rem] py-6 pl-16 pr-20 text-white text-[10px] font-black uppercase tracking-[0.3em] placeholder:text-white/40 focus:outline-none focus:border-primary/40 focus:bg-white/[0.05] transition-all font-mono relative z-10"
                    />
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within/form:text-primary transition-colors z-20">
                        <Terminal size={22} />
                    </div>
                    <Button
                        type="submit"
                        disabled={loading || !input.trim()}
                        variant="prismatic"
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-14 w-14 rounded-2xl flex items-center justify-center text-primary disabled:opacity-20 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(212,175,55,0.3)] z-20"
                    >
                        <Send size={20} fill="currentColor" />
                    </Button>
                </form>

                <div className="mt-8 flex gap-5 overflow-x-auto pb-3 no-scrollbar px-2">
                    {['Tactical Overview', 'Personnel Deployments', 'Financial Audit', 'Logistics Gap Analysis'].map(suggestion => (
                        <button
                            key={suggestion}
                            type="button"
                            onClick={() => setInput(suggestion)}
                            className="whitespace-nowrap px-6 py-3 rounded-2xl border border-white/10 bg-white/[0.02] text-[10px] font-black text-white/50 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all uppercase tracking-[0.4em] flex items-center gap-3 group/sug relative overflow-hidden"
                        >
                            <Sparkles size={12} className="text-primary/50 group-hover/sug:animate-pulse" />
                            {suggestion}
                            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary scale-x-0 group-hover/sug:scale-x-100 transition-transform origin-left" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AICommandCenter;
