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
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 uppercase"><AlertCircle size={10} /> Optimization Needed</span>
                    <button
                        onClick={() => handleExecute(index)}
                        className="w-full py-2 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-amber-500/20"
                    >
                        Apply Optimization
                    </button>
                </div>
            );
            case 'BUDGET_SUMMARY': return <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 uppercase"><TrendingUp size={10} /> Financial Insight</span>;
            case 'READINESS_UPDATE': return <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500 uppercase"><Shield size={10} /> Security Verified</span>;
            default: return null;
        }
    }

    return (
        <div className="glass-panel flex flex-col h-[600px] rounded-3xl border border-white/10 bg-black/40 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                            <Bot size={22} />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-black animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white tracking-wide uppercase">Tactical AI</h3>
                        <p className="text-[10px] text-gray-400 font-mono tracking-tighter">OS_v2.0 // NEURAL_LINK_ACTIVE</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-white/10" />
                    <div className="w-2 h-2 rounded-full bg-white/10" />
                </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                {messages.map((m, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={i}
                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[85%] space-y-2`}>
                            <div className={`p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user'
                                ? 'bg-primary/20 text-white border border-primary/30 rounded-tr-none'
                                : 'bg-white/5 text-gray-200 border border-white/10 rounded-tl-none'
                                }`}>
                                {m.text}
                                {m.action && (
                                    <div className="mt-3 pt-3 border-t border-white/5">
                                        {renderActionBadge(m.action, i)}
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-gray-600 font-mono px-2">
                                {m.role === 'assistant' ? 'HUB_AI' : 'MANAGER_01'} // {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </motion.div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 rounded-tl-none flex gap-2">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-75" />
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-150" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white/5 border-t border-white/5">
                <div className="relative group">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a strategic command..."
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-16 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-mono"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 group-focus-within:text-primary transition-colors">
                        <Terminal size={18} />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:grayscale"
                    >
                        <Send size={18} />
                    </button>
                </div>
                <div className="mt-3 flex gap-4 overflow-x-auto pb-1 no-scrollbar">
                    {['status overview', 'security check', 'budget report'].map(suggestion => (
                        <button
                            key={suggestion}
                            type="button"
                            onClick={() => setInput(suggestion)}
                            className="whitespace-nowrap px-3 py-1 rounded-full border border-white/5 bg-white/5 text-[10px] font-bold text-gray-500 hover:text-primary hover:border-primary/30 transition-all uppercase tracking-tighter"
                        >
                            <Sparkles size={10} className="inline mr-1" />
                            {suggestion}
                        </button>
                    ))}
                </div>
            </form>
        </div>
    );
};

export default AICommandCenter;
