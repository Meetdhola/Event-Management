import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, MessageSquare, Bot, Sparkles, AlertCircle, RefreshCcw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, Input, Badge } from './ui/Components';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const AttendeeAiAssistant = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([
        {
            _id: 'welcome',
            sender: 'ai',
            content: `Greeting, ${user?.name || 'Attendee'}. I am Aura Intelligence, your tactical event concierge. How can I assist your mission today?`,
            created_at: new Date().toISOString()
        }
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const scrollRef = useRef();

    // Since the Python RAG server is running locally on Port 5005, we must use localhost
    const PYTHON_API_URL = import.meta.env.DEV
        ? 'http://localhost:5005/api/chat'
        : 'http://localhost:5005/api/chat'; // Replace with a hosted Python server URL when you deploy the RAG App

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const scrollToBottom = () => {
        setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const content = newMessage.trim();
        if (!content || isTyping) return;

        // Add user message
        const userMsg = {
            _id: Date.now().toString(),
            sender: 'me',
            content,
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMsg]);
        setNewMessage('');
        setIsTyping(true);

        try {
            const res = await axios.post(PYTHON_API_URL, {
                question: content
            });

            const aiResponse = {
                _id: (Date.now() + 1).toString(),
                sender: 'ai',
                content: res.data.answer || "I'm sorry, I couldn't retrieve that information.",
                created_at: new Date().toISOString()
            };

            setMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            console.error('AI Assistant Error:', error);
            const errorMsg = {
                _id: (Date.now() + 1).toString(),
                sender: 'ai',
                content: "System Offline: Unable to establish neural link with Aura Intelligence. Please ensure the tactical backend is operational.",
                created_at: new Date().toISOString(),
                isError: true
            };
            setMessages(prev => [...prev, errorMsg]);
            toast.error('AI Connection Failed');
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <>
            {/* Tactical Floating Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-[100] w-16 h-16 rounded-full shadow-[0_0_40px_rgba(212,175,55,0.3)] bg-surface text-primary border border-white/10 flex items-center justify-center font-black transition-all hover:border-primary/50 group"
                    >
                        <Bot size={28} className="group-hover:animate-pulse" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-zinc-900 shadow-glow animate-pulse" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chatbot Popover */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-6 sm:bottom-32 sm:right-10 z-[100] w-[calc(100vw-3rem)] sm:w-[450px] h-[600px] max-h-[80vh] flex flex-col"
                    >
                        <div className="h-full flex flex-col min-h-0 relative z-10">
                            {/* Main Glass Panel */}
                            <div className="flex-1 flex flex-col rounded-[2rem] border border-white/5 bg-surface/20 backdrop-blur-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden min-h-0">

                                {/* AI Header */}
                                <div className="h-20 px-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/40">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary shadow-[0_0_20px_rgba(212,175,55,0.1)] relative">
                                            <Bot size={20} />
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900 shadow-glow animate-pulse" />
                                        </div>
                                        <div>
                                            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] leading-none mb-1.5 flex items-center gap-2">
                                                Aura
                                                <Sparkles size={10} className="text-primary animate-pulse" />
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] text-primary/60 font-black uppercase tracking-widest">Neural Link</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                {/* Messages Scroll Zone */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.02),transparent_60%)]">
                    <AnimatePresence initial={false}>
                        {messages.map((msg) => {
                            const isMe = msg.sender === 'me';
                            return (
                                <motion.div
                                    key={msg._id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-1.5`}>
                                        <div className={`p-4 md:p-5 rounded-[1.25rem] text-[13px] font-medium leading-relaxed shadow-[0_10px_30px_rgba(0,0,0,0.2)] ${isMe
                                            ? 'bg-primary text-background rounded-br-sm font-black'
                                            : msg.isError
                                                ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-bl-sm italic'
                                                : 'bg-white/[0.04] border border-white/5 text-white/90 backdrop-blur-3xl rounded-bl-sm'
                                            }`}>
                                            {msg.content}
                                        </div>
                                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest px-2">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex justify-start"
                        >
                            <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
                                <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                                <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                            </div>
                        </motion.div>
                    )}
                    <div ref={scrollRef} />
                </div>

                {/* Tactical Input Area */}
                <div className="p-6 border-t border-white/5 bg-black/20 backdrop-blur-3xl">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-4 max-w-4xl mx-auto w-full">
                        <div className="flex-1 relative group">
                            <input
                                type="text"
                                placeholder="Query Aura Intelligence..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="w-full bg-white/[0.02] border border-white/10 rounded-[1.5rem] py-4 px-6 text-[13px] font-bold text-white focus:outline-none focus:border-primary/30 transition-all placeholder:text-white/30 focus:bg-white/[0.04] shadow-inner"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest hidden sm:block">Aura Terminal V2.0</span>
                            </div>
                        </div>
                        <Button
                            type="submit"
                            disabled={!newMessage.trim() || isTyping}
                            variant="luxury"
                            className="h-14 w-14 rounded-[1.25rem] flex items-center justify-center text-background disabled:opacity-20 transition-all hover:scale-110 active:scale-95 shadow-glow p-0"
                        >
                            <Send size={18} />
                        </Button>
                    </form>
                    <p className="text-center text-[8px] font-black text-white/20 uppercase tracking-[0.5em] mt-4 italic">
                        Responses are restricted contextually.
                    </p>
                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AttendeeAiAssistant;
