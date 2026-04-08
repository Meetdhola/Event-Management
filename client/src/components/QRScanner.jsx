import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Zap, Shield, Activity, CheckCircle2, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Components';

const QRScanner = ({ onScan, onClose }) => {
    const [scanState, setScanState] = useState('initializing'); // initializing, scanning, processing, success, error, manual_entry
    const [hardwareError, setHardwareError] = useState(null);
    const [scanResult, setScanResult] = useState(null);
    const [manualCode, setManualCode] = useState('');
    const scannerRef = useRef(null);

    // Provide a continuous camera feed
    const initializeScanner = useCallback(async () => {
        setScanState('initializing');
        setHardwareError(null);
        try {
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode("reader");
            }
            
            // Clean up if already running
            if (scannerRef.current.isScanning) {
                await scannerRef.current.stop();
            }

            const config = {
                fps: 20, // Increased for tactical smoothness
                qrbox: (viewfinderWidth, viewfinderHeight) => {
                    const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.75;
                    return { width: size, height: size };
                },
                aspectRatio: 1.0,
                experimentalFeatures: {
                    useBarCodeDetectorIfSupported: true // Native hardware acceleration
                }
            };

            await scannerRef.current.start(
                { facingMode: "environment" },
                config,
                async (decodedText) => {
                    // --- STRIC SCAN LOCK ---
                    // Immediately lock the callback to prevent recursive triggers in 1 second
                    const currentState = scannerRef.current?.getState();
                    if (currentState !== 2) return; // 2 is scanning state in html5-qrcode

                    // Force pause the video stream immediately to visibly stop scanning
                    try {
                        await scannerRef.current.pause(true);
                    } catch (e) {
                        console.warn("Could not pause scanner", e);
                    }
                    
                    // Transmit to processing handler
                    handleCodeCheck(decodedText);
                },
                (errorMessage) => {
                    // Silent during scan
                }
            );
            setScanState('scanning');
        } catch (err) {
            console.error("Camera start error:", err);
            setHardwareError("CAM_ERROR: UNAUTHORIZED OR MISSING PERIPHERAL");
            setScanState('error');
        }
    }, [onScan]);

    useEffect(() => {
        initializeScanner();

        return () => {
            if (scannerRef.current) {
                if (scannerRef.current.isScanning) {
                    scannerRef.current.stop().then(() => {
                        scannerRef.current.clear();
                    }).catch(err => console.error("Failed to stop scanner", err));
                } else {
                    scannerRef.current.clear();
                }
            }
        };
    }, []);

    const handleCodeCheck = async (code) => {
        setScanState('processing');
        const res = await onScan(code);
        if (res?.success) {
            setScanResult(res);
            setScanState('success');
        } else {
            setScanResult({ error: res?.error || "Verification Failed" });
            setScanState('error');
        }
    };

    const handleResume = async () => {
        setScanResult(null);
        setManualCode('');
        
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                scannerRef.current.resume();
            } catch (e) {
                console.warn("Could not resume scanner video", e);
            }
        }
        setScanState('scanning');
    };

    const handleManualSubmit = () => {
        if (!manualCode) return;
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                scannerRef.current.pause(true);
            } catch (e) {
                console.warn("Could not pause scanner", e);
            }
        }
        handleCodeCheck(manualCode);
    };

    const isCameraActive = scanState === 'scanning' || scanState === 'processing' || scanState === 'manual_entry' || scanState === 'success' || (scanState === 'error' && !hardwareError);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-md relative z-10 sm:p-0"
            >
                <div className="app-card overflow-hidden border-primary/20 bg-zinc-950/60 shadow-[0_0_80px_rgba(0,0,0,0.6)] backdrop-blur-xl">
                    {/* Header */}
                    <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/60">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.7)]' : 'bg-red-500'}`} />
                            <div className="flex flex-col">
                                <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-[0.4em]">Tactical Scanner</span>
                                <span className="text-[8px] md:text-[9px] font-black text-white/70 uppercase tracking-[0.2em] mt-0.5" >Unit_Scan_Active</span>
                            </div>
                        </div>
                        <Button
                            onClick={onClose}
                            variant="ghost-luxury"
                            className="w-8 h-8 md:w-10 md:h-10 rounded-xl p-0 flex items-center justify-center text-white/70 hover:text-white border border-white/10 group"
                        >
                            <X size={18} className="group-hover:rotate-90 transition-transform" />
                        </Button>
                    </div>

                    {/* Camera Viewport */}
                    <div className="relative aspect-square bg-black group/viewport overflow-hidden">
                        <div id="reader" className="w-full h-full grayscale-0 group-hover/viewport:grayscale-0 transition-all duration-1000" />

                        {/* Overlays */}
                        <AnimatePresence>
                            {scanState === 'scanning' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    <motion.div
                                        animate={{ top: ['5%', '95%', '5%'], opacity: [0.2, 0.8, 0.2], scaleX: [0.95, 1, 0.95] }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute left-4 right-4 h-[2px] bg-primary shadow-[0_0_30px_rgba(212,175,55,0.8),0_0_60px_rgba(212,175,55,0.4)] z-20"
                                    />
                                    <div className="w-64 h-64 border border-white/5 rounded-[2.5rem] flex items-center justify-center backdrop-blur-[1px]"></div>
                                    <div className="absolute bottom-8 flex gap-4 w-full px-6">
                                        <div className="flex-1 flex gap-2 items-center justify-center px-4 py-2 rounded-full bg-black/40 border border-white/5 backdrop-blur-md">
                                            <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                                            <span className="text-[11px] font-black text-white/80 uppercase tracking-widest">Ready for Scan</span>
                                        </div>
                                        <Button 
                                            variant="ghost-luxury"
                                            onClick={() => setScanState('manual_entry')}
                                            className="pointer-events-auto h-10 px-6 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap"
                                        >
                                            Manual Entry
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {scanState === 'processing' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center z-30">
                                    <div className="relative">
                                        <div className="h-16 w-16 rounded-full border-2 border-primary/10 border-t-primary animate-spin" />
                                        <div className="absolute inset-0 h-16 w-16 rounded-full border border-white/5 animate-pulse" />
                                    </div>
                                    <span className="text-[11px] font-black text-white/90 uppercase tracking-[0.5em] mt-6 animate-pulse">VERIFYING TICKET...</span>
                                </motion.div>
                            )}

                            {scanState === 'success' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-emerald-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 z-30">
                                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 border border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.3)] mb-6">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">{scanResult?.attendee}</h3>
                                    <p className="text-[11px] font-black text-emerald-400/60 uppercase tracking-[0.3em] mb-8">Access Granted • Ticket #{scanResult?.ticketId}</p>
                                    <Button onClick={handleResume} variant="luxury" className="w-full h-12 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                                        Scan Next
                                    </Button>
                                </motion.div>
                            )}

                            {scanState === 'error' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 z-30">
                                    <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.2)] mb-6">
                                        <Camera size={40} />
                                    </div>
                                    <div className="space-y-3 mb-8 text-center w-full">
                                        <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.3em]">{hardwareError ? 'Camera Error' : 'Check Failed'}</p>
                                        <p className="text-[11px] font-medium text-white/80 uppercase tracking-widest leading-relaxed">
                                            {hardwareError || scanResult?.error}
                                        </p>
                                    </div>
                                    <Button onClick={hardwareError ? initializeScanner : handleResume} variant="ghost-luxury" className="w-full h-12 rounded-2xl font-black uppercase text-[11px] tracking-[0.4em]">
                                        {hardwareError ? 'Restart Camera' : 'Try Again'}
                                    </Button>
                                </motion.div>
                            )}

                            {scanState === 'manual_entry' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 z-30">
                                    <div className="w-full space-y-4">
                                        <div className="relative group">
                                            <QrCode className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/70 group-focus-within:text-primary transition-colors" size={18} />
                                            <input
                                                type="text"
                                                placeholder="ENTER TICKET ID..."
                                                value={manualCode}
                                                onChange={(e) => setManualCode(e.target.value.toLowerCase())}
                                                onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-4 text-xs font-black uppercase tracking-[0.2em] text-white placeholder:text-white/80 focus:outline-none focus:border-primary/40 transition-all font-mono"
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <Button onClick={handleResume} variant="ghost-luxury" className="flex-1 h-12 rounded-xl text-white font-black uppercase text-[11px] tracking-[0.2em]">
                                                Back to QR
                                            </Button>
                                            <Button onClick={handleManualSubmit} disabled={!manualCode} variant="luxury" className="flex-1 h-12 rounded-xl text-black font-black uppercase text-[11px] tracking-[0.2em] shadow-glow disabled:opacity-50">
                                                Verify ID
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {scanState === 'initializing' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-zinc-950 z-20">
                                    <div className="relative">
                                        <div className="h-16 w-16 rounded-full border-2 border-primary/10 border-t-primary animate-spin" />
                                        <div className="absolute inset-0 h-16 w-16 rounded-full border border-white/5 animate-pulse" />
                                    </div>
                                    <span className="text-[11px] font-black text-white/70 uppercase tracking-[0.5em] animate-pulse">Starting Camera...</span>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer / Controls */}
                    <div className="p-4 md:p-8 bg-zinc-900/40 space-y-4 md:space-y-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <div className="flex items-center gap-4 md:gap-6 justify-center py-1">
                            <Shield size={14} className="text-primary/70" />
                            <div className="h-1 w-1 rounded-full bg-white/10" />
                            <Zap size={14} className="text-primary/70" />
                            <div className="h-1 w-1 rounded-full bg-white/10" />
                            <Activity size={14} className="text-primary/70" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-white/90 uppercase tracking-[0.5em] text-center italic">
                                Mission: Check-In
                            </p>
                            <p className="text-[9px] font-medium text-white/50 uppercase tracking-[0.2em] text-center">
                                Terminal secure
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default QRScanner;
