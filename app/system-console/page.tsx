'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Terminal, ArrowLeft, Cpu, Activity, Shield, Wifi, Zap, Database, Lock, Server } from 'lucide-react';

// Matrix rain character set
const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';

export default function SystemConsolePage() {
    const router = useRouter();
    const [bootPhase, setBootPhase] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [systemStats, setSystemStats] = useState({ cpu: 0, memory: 0, neural: 0 });
    const [showMatrix, setShowMatrix] = useState(true);
    const logContainerRef = useRef<HTMLDivElement>(null);

    // Boot sequence logs
    const bootSequence = [
        { delay: 200, log: '> VYAAS NEURAL CORE v2.5.0', type: 'header' },
        { delay: 400, log: '[INIT] Booting secure kernel...', type: 'info' },
        { delay: 600, log: '[CRYPTO] Loading encryption modules...', type: 'info' },
        { delay: 800, log: '[OK] AES-256-GCM initialized', type: 'success' },
        { delay: 1000, log: '[NEURAL] Activating synaptic network...', type: 'info' },
        { delay: 1200, log: '[OK] 1.2B parameters loaded', type: 'success' },
        { delay: 1400, log: '[AI] Connecting to Gemini 2.5 Flash...', type: 'info' },
        { delay: 1600, log: '[OK] Model endpoint verified', type: 'success' },
        { delay: 1800, log: '[NET] Establishing WebRTC tunnel...', type: 'info' },
        { delay: 2000, log: '[OK] LiveKit connection secured', type: 'success' },
        { delay: 2200, log: '[MEM] Mounting distributed memory banks...', type: 'info' },
        { delay: 2400, log: '[OK] Mem0 vector store online', type: 'success' },
        { delay: 2600, log: '[SYS] Running self-diagnostics...', type: 'info' },
        { delay: 2800, log: '[OK] All subsystems nominal', type: 'success' },
        { delay: 3000, log: '', type: 'blank' },
        { delay: 3200, log: '╔══════════════════════════════════════════╗', type: 'border' },
        { delay: 3400, log: '║   VYAAS NEURAL ENGINE - FULLY OPERATIONAL ║', type: 'header' },
        { delay: 3600, log: '╚══════════════════════════════════════════╝', type: 'border' },
        { delay: 3800, log: '', type: 'blank' },
        { delay: 4000, log: '> Ready. Awaiting Bhaiya\'s commands...', type: 'ready' },
    ];

    // Boot sequence animation
    useEffect(() => {
        setShowMatrix(true);

        bootSequence.forEach(({ delay, log }) => {
            setTimeout(() => {
                setLogs(prev => [...prev, log]);
            }, delay);
        });

        // Fade out matrix after boot
        setTimeout(() => setShowMatrix(false), 4500);

        // Animate system stats
        const interval = setInterval(() => {
            setSystemStats(prev => ({
                cpu: Math.min(prev.cpu + Math.random() * 15, 100),
                memory: Math.min(prev.memory + Math.random() * 12, 100),
                neural: Math.min(prev.neural + Math.random() * 18, 100),
            }));
        }, 300);

        setTimeout(() => {
            clearInterval(interval);
            setSystemStats({ cpu: 23, memory: 67, neural: 94 });
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    // Auto-scroll logs
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const getLogColor = (log: string) => {
        if (log.includes('[OK]')) return 'text-green-400';
        if (log.includes('[ERROR]')) return 'text-red-400';
        if (log.includes('[WARN]')) return 'text-yellow-400';
        if (log.startsWith('>')) return 'text-cyan-400 font-bold';
        if (log.includes('╔') || log.includes('╚') || log.includes('║')) return 'text-cyan-500';
        return 'text-white/70';
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-mono relative overflow-hidden">
            {/* Matrix Rain Background */}
            <AnimatePresence>
                {showMatrix && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
                    >
                        {Array.from({ length: 30 }).map((_, i) => (
                            <MatrixColumn key={i} delay={i * 0.1} left={`${i * 3.33}%`} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Scan Lines Effect */}
            <div className="fixed inset-0 pointer-events-none z-[5] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)]" />

            {/* Header */}
            <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-black/60 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex items-center gap-3">
                        <Terminal className="text-cyan-400" size={20} />
                        <span className="text-sm font-bold tracking-wider">VYAAS://SYSTEM-CONSOLE</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs text-green-400">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_#4ade80]" />
                        SECURE CONNECTION
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 p-6 h-[calc(100vh-72px)]">
                {/* Boot Console */}
                <div className="flex flex-col rounded-xl border border-cyan-500/20 bg-black/60 backdrop-blur-md overflow-hidden">
                    {/* Console Header */}
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-cyan-500/20 bg-gradient-to-r from-[#0a0a0a] to-[#111]">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                        </div>
                        <span className="text-[10px] text-white/50 uppercase tracking-wider ml-4">Neural Boot Sequence</span>
                    </div>

                    {/* Console Logs */}
                    <div
                        ref={logContainerRef}
                        className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-cyan-500/30"
                    >
                        {logs.map((log, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`text-sm ${getLogColor(log)}`}
                            >
                                {log || <br />}
                            </motion.div>
                        ))}
                        <motion.span
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="text-cyan-400"
                        >
                            █
                        </motion.span>
                    </div>
                </div>

                {/* Stats Sidebar */}
                <div className="flex flex-col gap-4">
                    {/* Neural Engine Status */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="p-5 rounded-xl border border-cyan-500/20 bg-black/60 backdrop-blur-md"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Cpu className="text-cyan-400" size={16} />
                            <span className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase">Neural Engine</span>
                        </div>

                        <div className="space-y-4">
                            <StatBar label="CPU LOAD" value={systemStats.cpu} color="cyan" icon={<Activity size={12} />} />
                            <StatBar label="MEMORY" value={systemStats.memory} color="purple" icon={<Database size={12} />} />
                            <StatBar label="NEURAL NET" value={systemStats.neural} color="green" icon={<Zap size={12} />} />
                        </div>
                    </motion.div>

                    {/* Security Status */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5 }}
                        className="p-5 rounded-xl border border-green-500/20 bg-black/60 backdrop-blur-md"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="text-green-400" size={16} />
                            <span className="text-[10px] text-green-400 font-bold tracking-widest uppercase">Security</span>
                        </div>

                        <div className="space-y-3 text-xs">
                            <SecurityItem label="Encryption" status="AES-256" ok />
                            <SecurityItem label="Firewall" status="ACTIVE" ok />
                            <SecurityItem label="TLS" status="1.3" ok />
                            <SecurityItem label="Auth" status="VERIFIED" ok />
                        </div>
                    </motion.div>

                    {/* Network Status */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2 }}
                        className="p-5 rounded-xl border border-white/10 bg-black/60 backdrop-blur-md"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Wifi className="text-white/60" size={16} />
                            <span className="text-[10px] text-white/60 font-bold tracking-widest uppercase">Network</span>
                        </div>

                        <div className="space-y-2 text-xs text-white/50">
                            <div className="flex justify-between">
                                <span>Latency</span>
                                <span className="text-green-400">23ms</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Protocol</span>
                                <span className="text-cyan-400">WebRTC</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Region</span>
                                <span>IN-ASIA</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

// Matrix column component
function MatrixColumn({ delay, left }: { delay: number; left: string }) {
    const [chars, setChars] = useState<string[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setChars(prev => {
                const newChar = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
                const updated = [...prev, newChar];
                if (updated.length > 25) updated.shift();
                return updated;
            });
        }, 80 + delay * 100);

        return () => clearInterval(interval);
    }, [delay]);

    return (
        <div
            className="absolute top-0 text-green-500/70 text-sm leading-tight whitespace-nowrap"
            style={{ left, animationDelay: `${delay}s` }}
        >
            {chars.map((char, idx) => (
                <div
                    key={idx}
                    style={{ opacity: idx / chars.length }}
                    className="text-center"
                >
                    {char}
                </div>
            ))}
        </div>
    );
}

// Stat bar component
function StatBar({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
    const colors: Record<string, string> = {
        cyan: 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]',
        purple: 'bg-purple-500 shadow-[0_0_10px_#a855f7]',
        green: 'bg-green-500 shadow-[0_0_10px_#22c55e]',
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/50 uppercase tracking-wider flex items-center gap-1">
                    {icon} {label}
                </span>
                <span className="text-xs font-mono text-white/80">{value.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`h-full rounded-full ${colors[color]}`}
                />
            </div>
        </div>
    );
}

// Security item component
function SecurityItem({ label, status, ok }: { label: string; status: string; ok?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Lock size={10} className={ok ? 'text-green-400' : 'text-red-400'} />
                <span className="text-white/60">{label}</span>
            </div>
            <span className={ok ? 'text-green-400' : 'text-red-400'}>{status}</span>
        </div>
    );
}
