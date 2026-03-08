import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
    Globe,
    Award,
    Star,
    ArrowRight,
    Camera,
    Music,
    Users,
    Mail,
    Shield,
    Zap,
    Search,
    Menu as MenuIcon,
    X,
    Clock
} from 'lucide-react';
import { Button, Card, Badge } from '../components/ui/Components';

const StatItem = ({ label, value, delay }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ delay, duration: 1, type: "spring" }}
        viewport={{ once: true }}
        className="text-center group"
    >
        <p className="text-4xl md:text-6xl font-black text-white group-hover:text-primary mb-3 tracking-tighter transition-colors duration-500">{value}</p>
        <div className="flex flex-col items-center">
            <div className="w-4 h-[1px] bg-primary/20 mb-2 group-hover:w-8 transition-all" />
            <p className="text-[10px] uppercase tracking-[0.4em] font-black text-white/30 group-hover:text-white transition-colors">{label}</p>
        </div>
    </motion.div>
);

const CaseStudyCard = ({ image, title, category, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        viewport={{ once: true }}
        className="group relative h-[500px] md:h-[700px] overflow-hidden rounded-[3rem] bg-zinc-900"
    >
        <img
            src={image}
            alt={title}
            className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-105 opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0E] via-transparent to-transparent opacity-90 transition-opacity" />
        <div className="absolute bottom-12 left-12 right-12 z-20">
            <div className="flex items-center gap-3 mb-6">
                <span className="px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-[9px] uppercase font-black tracking-[0.3em] text-primary">0{delay * 10 || 1} • {category}</span>
            </div>
            <h3 className="text-4xl md:text-5xl font-serif text-white mb-8 italic tracking-tighter leading-[0.85]">{title}</h3>
            <button className="flex items-center gap-3 text-[10px] uppercase font-black tracking-[0.5em] text-white/40 group-hover:text-white transition-all py-2 border-b border-white/5 hover:border-primary">
                View Protocol <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
            </button>
        </div>
    </motion.div>
);

const Home = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#0C0C0E] text-white font-sans selection:bg-primary selection:text-background flex flex-col overflow-x-hidden">

            {/* Unique Floating Navbar */}
            <div className="fixed top-8 left-0 w-full z-[100] px-6 pointer-events-none">
                <motion.nav
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="max-w-4xl mx-auto h-16 bg-white/[0.01] backdrop-blur-md md:bg-zinc-900/60 md:backdrop-blur-3xl rounded-[2rem] md:border md:border-white/5 md:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between px-8 pointer-events-auto relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    <div className="flex items-center gap-2 relative z-10">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-glow animate-pulse" />
                        <span className="text-xs font-serif tracking-[0.3em] font-black italic">ELITE</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 relative z-10">
                        {['Exhibitions', 'Weddings', 'Concierge'].map((item) => (
                            <a key={item} href="#" className="text-[10px] uppercase tracking-[0.4em] font-black text-white/30 hover:text-white transition-all">
                                {item}
                            </a>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 relative z-10 md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-3 bg-white/5 border border-white/10 rounded-xl text-primary/60 hover:text-primary transition-all active:scale-95"
                        >
                            <MenuIcon size={20} />
                        </button>
                    </div>

                    <div className="flex items-center gap-6 relative z-10 hidden md:flex">
                        <Link to="/login" className="text-[10px] uppercase tracking-[0.4em] font-black text-white/40 hover:text-primary transition-all hidden sm:block">Login</Link>
                        <Link to="/register" className="h-10 px-6 btn-prismatic text-primary rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 italic">
                            signup
                        </Link>
                    </div>
                </motion.nav>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-3xl flex flex-col p-10"
                    >
                        <div className="flex items-center justify-between mb-20">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-glow animate-pulse" />
                                <span className="text-xs font-serif tracking-[0.3em] font-black italic">ELITE</span>
                            </div>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-rose-500 transition-all active:scale-95"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-10">
                            {['Exhibitions', 'Weddings', 'Concierge'].map((item) => (
                                <a
                                    key={item}
                                    href="#"
                                    className="text-4xl font-serif italic text-white/30 hover:text-primary transition-all tracking-tighter"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {item}
                                </a>
                            ))}
                        </div>

                        <div className="mt-auto flex flex-col gap-6">
                            <div className="grid grid-cols-2 gap-4">
                                <Link
                                    to="/login"
                                    className="h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center text-[10px] font-black uppercase tracking-[0.5em] text-white/40 hover:text-white transition-all"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="h-20 bg-primary text-background rounded-3xl flex items-center justify-center text-[10px] font-black uppercase tracking-[0.5em] italic shadow-glow"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    signup
                                </Link>
                            </div>
                            <p className="text-[8px] text-white/10 font-black uppercase tracking-[1em] text-center mt-4">Authorized Registry Node</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-32 pb-20">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-[10%] left-[-20%] w-[1000px] h-[1000px] bg-primary/5 rounded-full blur-[200px] animate-pulse" />
                        <div className="absolute bottom-[10%] right-[-20%] w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px]" />
                    </div>

                    <div className="relative z-10 max-w-7xl w-full">
                        <motion.div
                            initial={{ opacity: 0, y: 60 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-2xl bg-white/[0.02] border border-white/5 mb-12">
                                <Clock size={12} className="text-primary/60" />
                                <p className="text-[9px] text-white/40 tracking-[0.6em] font-black uppercase">Established MMXII • Global Footprint</p>
                            </div>

                            <h1 className="text-5xl sm:text-7xl md:text-9xl font-serif mb-12 font-medium tracking-tighter leading-[0.8] text-white">
                                The Master <br className="hidden sm:block" />
                                <span className="italic relative">
                                    Architects.
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '100%' }}
                                        transition={{ delay: 1.5, duration: 2.5 }}
                                        className="absolute -bottom-4 left-0 h-[1px] bg-primary/20"
                                    />
                                </span>
                            </h1>

                            <p className="text-white/30 text-base md:text-lg max-w-2xl mx-auto mb-16 font-medium leading-relaxed tracking-[0.1em] lowercase py-6 border-x border-white/5 px-8">
                                Engineering the world's most prestigious summits, ultra-luxury weddings, and elite corporate experiences for a distinguished global audience.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                                <Link to="/register" className="w-full sm:w-auto">
                                    <Button variant="prismatic" className="w-full sm:w-auto px-16 h-20 text-[11px] tracking-[0.5em] italic rounded-[2rem] shadow-elite">
                                        Initiate Mandate
                                    </Button>
                                </Link>
                                <Link to="/login" className="px-10 h-20 flex items-center justify-center text-[10px] uppercase font-black tracking-[0.6em] text-white/30 hover:text-white transition-all border border-white/5 rounded-[2rem] hover:bg-white/[0.02]">
                                    Browse Archive
                                </Link>
                            </div>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2, duration: 2 }}
                        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-20"
                    >
                        <div className="w-[1px] h-16 bg-gradient-to-t from-primary to-transparent" />
                        <span className="text-[8px] uppercase tracking-[1em] font-black">Scroll</span>
                    </motion.div>
                </section>

                {/* Grid Overlay */}
                <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '60px 60px' }} />

                {/* Intelligence Metrics */}
                <section className="py-40 border-y border-white/5 relative bg-zinc-950">
                    <div className="luxury-container grid grid-cols-2 lg:grid-cols-4 gap-16 relative z-10">
                        <StatItem value="500+" label="Global Deployments" delay={0.1} />
                        <StatItem value="1M+" label="Total Attendees" delay={0.2} />
                        <StatItem value="42" label="Global Territories" delay={0.3} />
                        <StatItem value="Elite" label="Service Grade" delay={0.4} />
                    </div>
                </section>

                {/* Masterworks Portfolio */}
                <section className="py-56 luxury-container relative">
                    <div className="max-w-4xl mb-32">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-[1px] bg-primary/40" />
                            <p className="text-[10px] uppercase tracking-[0.6em] font-black text-primary">Masterworks Portfolio</p>
                        </div>
                        <h2 className="text-6xl md:text-9xl font-serif leading-[0.8] text-white tracking-tighter italic mb-12">Architecture of <br /> Grandeur.</h2>
                        <p className="text-white/20 max-w-xl font-medium text-lg md:text-xl leading-relaxed tracking-wide lowercase">
                            Each deployment is a bespoke masterpiece, meticulously architected to define the zenith of event excellence.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20">
                        <CaseStudyCard
                            image="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop"
                            title="Royal Monaco Residency"
                            category="Diplomatic High-Scale"
                            delay={0.1}
                        />
                        <CaseStudyCard
                            image="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop"
                            title="Parisian Haute Summit"
                            category="Couture Industry"
                            delay={0.2}
                        />
                        <CaseStudyCard
                            image="https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=2070&auto=format&fit=crop"
                            title="The Vatican Forum"
                            category="Global Leadership"
                            delay={0.3}
                        />
                        <CaseStudyCard
                            image="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2074&auto=format&fit=crop"
                            title="Kyoto Zen Nuptials"
                            category="Elite Ceremonies"
                            delay={0.4}
                        />
                    </div>
                </section>

                {/* Testimony */}
                <section className="py-56 border-y border-white/5 relative overflow-hidden bg-zinc-950">
                    <div className="absolute inset-0 bg-primary/[0.02] blur-[150px]" />
                    <div className="luxury-container text-center relative z-10 px-8">
                        <motion.div
                            whileInView={{ opacity: 1, scale: 1 }}
                            initial={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 1.5 }}
                        >
                            <Shield className="mx-auto text-primary/20 mb-20" size={60} />
                            <h2 className="text-3xl sm:text-5xl md:text-7xl font-serif italic max-w-6xl mx-auto leading-tight mb-24 text-white tracking-widest">
                                "The level of precision and luxury provided was beyond anything we've experienced globally. Truly the zenith of event design."
                            </h2>
                            <div className="flex flex-col items-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-glow mb-4" />
                                <p className="text-xs font-black tracking-[0.5em] uppercase text-white mb-2 italic">Marcello Armani</p>
                                <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.3em]">Global Brand Principal</p>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Final Call */}
                <section className="py-64 px-4 sm:px-0 luxury-container">
                    <div className="bg-[#0C0C0E] border border-white/5 p-12 sm:p-20 md:p-32 text-center rounded-[4rem] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        <div className="relative z-10">
                            <h2 className="text-5xl sm:text-7xl md:text-9xl font-serif mb-12 leading-[0.85] text-white tracking-tighter">Enter the <br className="hidden sm:block" /><span className="italic">Incomparable.</span></h2>
                            <p className="text-white/20 text-base md:text-xl max-w-xl mx-auto mb-20 font-bold leading-relaxed tracking-widest lowercase">
                                Request a private consultation on your next extraordinary event venture.
                            </p>
                            <Link to="/register">
                                <Button variant="prismatic" className="px-20 h-24 text-[12px] tracking-[0.4em] italic rounded-[2.5rem] shadow-elite">
                                    Initiate Deployment
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* Unique Footer */}
            <footer className="py-40 bg-[#0C0C0E] border-t border-white/5 relative">
                <div className="luxury-container">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 mb-40">
                        <div>
                            <div className="flex items-center gap-3 mb-10">
                                <span className="text-3xl font-serif tracking-[0.2em] font-black italic">ELITE</span>
                            </div>
                            <p className="text-white/20 font-medium max-w-md text-lg md:text-xl leading-relaxed tracking-wide lowercase italic">
                                Setting the global standard for luxury event architecture across four continents since 2012.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-16">
                            <div>
                                <p className="text-[10px] text-primary/60 mb-10 font-black uppercase tracking-[0.5em]">Network Nodes</p>
                                <ul className="space-y-6 text-[10px] text-white/40 font-black tracking-widest uppercase">
                                    <li className="hover:text-white transition-colors cursor-pointer">London</li>
                                    <li className="hover:text-white transition-colors cursor-pointer">Dubai</li>
                                    <li className="hover:text-white transition-colors cursor-pointer">New York</li>
                                    <li className="hover:text-white transition-colors cursor-pointer">Singapore</li>
                                </ul>
                            </div>
                            <div>
                                <p className="text-[10px] text-primary/60 mb-10 font-black uppercase tracking-[0.5em]">Social Hub</p>
                                <ul className="space-y-6 text-[10px] text-white/40 font-black tracking-widest uppercase">
                                    <li className="hover:text-white transition-colors cursor-pointer">Instagram</li>
                                    <li className="hover:text-white transition-colors cursor-pointer">LinkedIn</li>
                                    <li className="hover:text-white transition-colors cursor-pointer">Dispatch</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center pt-20 border-t border-white/5 gap-10 opacity-30">
                        <p className="text-[8px] text-white tracking-[1em] uppercase font-black">© ELITE GLOBAL INFRASTRUCTURE.</p>
                        <div className="flex gap-12">
                            <span className="text-[8px] tracking-[0.5em] font-black uppercase">Established MMXII</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
