import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

export const Button = ({ className, children, isLoading, variant = 'luxury', ...props }) => {
    const variants = {
        luxury: 'btn-luxury', // Champagne Gold Border
        prismatic: 'btn-prismatic text-primary', // High-contrast Edge + Shimmer
        matte: 'btn-matte',   // Matte Black/Gold for Mobile
        'ghost-luxury': 'btn-ghost-luxury', // Obsidian + Gold Border
        ghost: 'bg-transparent hover:bg-white/5 border border-transparent hover:border-primary/20 text-copy',
        danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02, translateY: -1 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "relative flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
                variants[variant] || variants.luxury,
                className
            )}
            disabled={isLoading}
            {...props}
        >
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"
                    />
                ) : (
                    <motion.span
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex items-center gap-2"
                    >
                        {children}
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    );
};

export const Input = ({ label, className, error, id, icon: Icon, required, type, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    return (
        <div className="space-y-2 w-full group">
            {label && (
                <label htmlFor={id} className="text-[14px] uppercase tracking-[0.2em] font-bold text-muted ml-1 group-focus-within:text-gradient-primary transition-all duration-300">
                    {label}{required && <span className="text-red-500 ml-1 text-xs leading-none">*</span>}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors">
                        <Icon size={18} />
                    </div>
                )}
                <input
                    id={id}
                    required={required}
                    type={isPassword ? (showPassword ? 'text' : 'password') : type}
                    className={cn(
                        "input-luxury",
                        Icon && "pl-14",
                        isPassword && "pr-14",
                        error && "border-red-500/50 focus:border-red-500/50",
                        className
                    )}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors focus:outline-none"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
            {error && <p className="text-[11px] uppercase tracking-wider text-red-500 ml-1 font-bold">{error}</p>}
        </div>
    );
};

export const Card = ({ className, children, animate = true, ...props }) => {
    const Component = animate ? motion.div : 'div';
    return (
        <Component
            initial={animate ? { opacity: 0, y: 20 } : undefined}
            whileInView={animate ? { opacity: 1, y: 0 } : undefined}
            viewport={{ once: true }}
            className={cn("luxury-card p-8", className)}
            {...props}
        >
            {children}
        </Component>
    );
};

export const Badge = ({ children, variant = 'default', className }) => {
    const variants = {
        default: 'bg-white/5 text-muted border-white/10',
        success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        danger: 'bg-red-500/10 text-red-500 border-red-500/20',
        primary: 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]'
    };

    return (
        <span className={cn(
            "px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.25em] border transition-all h-fit inline-flex items-center",
            variants[variant],
            className
        )}>
            {children}
        </span>
    );
};

export const Tooltip = ({ children, text }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const wrapperRef = useRef(null);

    const updateCoords = () => {
        if (wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            setCoords({
                x: rect.left + rect.width / 2,
                y: rect.top   // fixed position, no scrollY needed for fixed elements
            });
        }
    };

    const handleMouseEnter = () => {
        updateCoords();
        setIsVisible(true);
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    const tooltip = (
        <AnimatePresence mode="wait">
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.92 }}
                    transition={{ duration: 0.15 }}
                    style={{
                        position: 'fixed',
                        left: coords.x,
                        top: coords.y - 8,
                        transform: 'translate(-50%, -100%)',
                        zIndex: 99999
                    }}
                    className="whitespace-nowrap px-4 py-2 rounded-xl bg-zinc-950 border border-primary/20 shadow-[0_10px_30px_rgba(0,0,0,0.9)] pointer-events-none backdrop-blur-xl"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{text}</span>
                    </div>
                    {/* Arrow pointing down */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-[-5px] w-2 h-2 bg-zinc-950 border-r border-b border-primary/20 rotate-45" />
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div ref={wrapperRef} className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {children}
            {createPortal(tooltip, document.body)}
        </div>
    );
};
