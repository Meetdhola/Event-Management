import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const Button = ({ className, children, isLoading, variant = 'luxury', ...props }) => {
    const variants = {
        luxury: 'btn-luxury', // Champagne Gold Border
        prismatic: 'btn-prismatic text-primary', // High-contrast Edge + Shimmer
        matte: 'btn-matte',   // Matte Black/Gold for Mobile
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

export const Input = ({ label, className, error, id, icon: Icon, ...props }) => {
    return (
        <div className="space-y-2 w-full group">
            {label && (
                <label htmlFor={id} className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted ml-1 group-focus-within:text-primary transition-colors">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors">
                        <Icon size={16} />
                    </div>
                )}
                <input
                    id={id}
                    className={cn(
                        "input-luxury",
                        Icon && "pl-12",
                        error && "border-red-500/50 focus:border-red-500/50",
                        className
                    )}
                    {...props}
                />
            </div>
            {error && <p className="text-[10px] uppercase tracking-wider text-red-500 ml-1 font-bold">{error}</p>}
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
            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.25em] border transition-all h-fit inline-flex items-center",
            variants[variant],
            className
        )}>
            {children}
        </span>
    );
};
