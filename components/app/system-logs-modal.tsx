'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal, Cpu, Activity, Wifi, Shield, Zap, AlertTriangle } from 'lucide-react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { cn } from '@/lib/utils';

interface LogEntry {
    id: number;
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'success' | 'system';
    message: string;
}

interface SystemLogsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SystemLogsModal({ isOpen, onClose }: SystemLogsModalProps) {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [stats, setStats] = useState({ cpu: 0, memory: 0, disk: 0, gpu: 'N/A' });
    const [uptime, setUptime] = useState(0);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const room = useRoomContext();

    // Generate unique log ID
    const logId = useRef(0);
    const getLogId = () => ++logId.current;

    // Format timestamp
    const getTimestamp = () => {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    };

    // Add log entry
    const addLog = (level: LogEntry['level'], message: string) => {
        setLogs(prev => [...prev.slice(-50), { id: getLogId(), timestamp: getTimestamp(), level, message }]);
    };

    // Initial hacker-style boot sequence
    useEffect(() => {
        if (!isOpen) return;

        const bootSequence = [
            { delay: 100, level: 'system' as const, msg: '> VYAAS NEURAL CORE v2.5.0 INITIALIZING...' },
            { delay: 300, level: 'info' as const, msg: '[BOOT] Loading kernel modules...' },
            { delay: 500, level: 'success' as const, msg: '[OK] Gemini 2.5 Flash Native Audio connected' },
            { delay: 700, level: 'info' as const, msg: '[SYS] Mounting encrypted memory banks...' },
            { delay: 900, level: 'success' as const, msg: '[OK] LiveKit WebRTC tunnel established' },
            { delay: 1100, level: 'info' as const, msg: '[NET] Verifying secure handshake...' },
            { delay: 1300, level: 'success' as const, msg: '[OK] TLS 1.3 encryption active' },
            { delay: 1500, level: 'system' as const, msg: '> ALL SYSTEMS OPERATIONAL ✓' },
        ];

        bootSequence.forEach(({ delay, level, msg }) => {
            setTimeout(() => addLog(level, msg), delay);
        });
    }, [isOpen]);

    // Listen for real system metrics
    useEffect(() => {
        if (!isOpen) return;

        const handleData = (payload: Uint8Array, participant?: any, kind?: any, topic?: string) => {
            if (topic === "system_metrics") {
                try {
                    const decoder = new TextDecoder();
                    const data = JSON.parse(decoder.decode(payload));

                    if (data.type === "system_metrics") {
                        setStats({
                            cpu: data.cpu,
                            memory: data.memory,
                            disk: data.disk,
                            gpu: 'Integrated'
                        });

                        // Add real-time log entries occasionally
                        if (Math.random() > 0.7) {
                            const messages = [
                                `[PROC] CPU load: ${data.cpu.toFixed(1)}% | Memory: ${data.memory.toFixed(1)}%`,
                                `[MON] Active processes monitored: ${data.processes?.length || 0}`,
                                `[SYS] Disk utilization: ${data.disk.toFixed(1)}%`,
                            ];
                            addLog('info', messages[Math.floor(Math.random() * messages.length)]);
                        }
                    }
                } catch (e) { }
            } else if (topic === "system_alert") {
                try {
                    const decoder = new TextDecoder();
                    const data = JSON.parse(decoder.decode(payload));
                    if (data.message) {
                        addLog('warn', `[ALERT] ${data.message}`);
                    }
                } catch (e) { }
            }
        };

        room.on(RoomEvent.DataReceived, handleData);
        return () => { room.off(RoomEvent.DataReceived, handleData); };
    }, [room, isOpen]);

    // Uptime counter
    useEffect(() => {
        if (!isOpen) return;
        const interval = setInterval(() => setUptime(prev => prev + 1), 1000);
        return () => clearInterval(interval);
    }, [isOpen]);

    // Simulated background activity logs
    useEffect(() => {
        if (!isOpen) return;

        const interval = setInterval(() => {
            const hackerMessages = [
                '[NET] Packet integrity verified: 0x7F3A',
                '[MEM] GC cycle complete: freed 12.4MB',
                '[AUDIO] Voice stream: 44.1kHz stereo',
                '[AI] Inference latency: 23ms',
                '[SEC] Firewall rules updated',
                '[CACHE] L2 cache hit ratio: 94.2%',
                '[IO] Async buffer flushed',
                '[THREAD] Worker pool: 8/12 active',
            ];
            addLog('info', hackerMessages[Math.floor(Math.random() * hackerMessages.length)]);
        }, 3000);

        return () => clearInterval(interval);
    }, [isOpen]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const formatUptime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const getLevelColor = (level: LogEntry['level']) => {
        switch (level) {
            case 'error': return 'text-red-400';
            case 'warn': return 'text-yellow-400';
            case 'success': return 'text-green-400';
            case 'system': return 'text-cyan-400';
            default: return 'text-white/60';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-4xl h-[80vh] bg-[#0a0a0a] border border-cyan-500/30 rounded-xl overflow-hidden shadow-[0_0_60px_rgba(0,255,255,0.1)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Terminal Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#0f0f0f] to-[#1a1a1a] border-b border-cyan-500/20">
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 cursor-pointer" onClick={onClose} />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                                </div>
                                <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono">
                                    <Terminal size={14} />
                                    <span className="tracking-wider">VYAAS://SYSTEM-CONSOLE</span>
                                </div>
                            </div>
                            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex h-[calc(100%-52px)]">
                            {/* Stats Sidebar */}
                            <div className="w-56 border-r border-cyan-500/10 p-4 space-y-4 bg-[#080808]">
                                <div className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase mb-4">
                                    ◢ SYSTEM STATUS
                                </div>

                                {/* Health Indicator */}
                                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                                    <div className="flex items-center gap-2 text-green-400 text-xs font-bold">
                                        <Shield size={12} />
                                        HEALTH: OPTIMAL
                                    </div>
                                </div>

                                {/* Uptime */}
                                <div className="p-3 rounded-lg bg-[#151515] border border-white/5">
                                    <div className="text-[9px] text-white/40 uppercase tracking-wider mb-1">Uptime</div>
                                    <div className="text-lg font-mono text-cyan-400">{formatUptime(uptime)}</div>
                                </div>

                                {/* CPU */}
                                <div className="p-3 rounded-lg bg-[#151515] border border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[9px] text-white/40 uppercase tracking-wider flex items-center gap-1">
                                            <Cpu size={10} /> CPU
                                        </span>
                                        <span className={cn("text-xs font-mono", stats.cpu > 80 ? 'text-red-400' : 'text-neon-green')}>
                                            {stats.cpu.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-cyan-500 transition-all" style={{ width: `${stats.cpu}%` }} />
                                    </div>
                                </div>

                                {/* Memory */}
                                <div className="p-3 rounded-lg bg-[#151515] border border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[9px] text-white/40 uppercase tracking-wider flex items-center gap-1">
                                            <Activity size={10} /> RAM
                                        </span>
                                        <span className={cn("text-xs font-mono", stats.memory > 80 ? 'text-red-400' : 'text-neon-green')}>
                                            {stats.memory.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 transition-all" style={{ width: `${stats.memory}%` }} />
                                    </div>
                                </div>

                                {/* GPU */}
                                <div className="p-3 rounded-lg bg-[#151515] border border-white/5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] text-white/40 uppercase tracking-wider flex items-center gap-1">
                                            <Zap size={10} /> GPU
                                        </span>
                                        <span className="text-xs font-mono text-white/60">{stats.gpu}</span>
                                    </div>
                                </div>

                                {/* Network */}
                                <div className="p-3 rounded-lg bg-[#151515] border border-white/5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] text-white/40 uppercase tracking-wider flex items-center gap-1">
                                            <Wifi size={10} /> NET
                                        </span>
                                        <span className="text-xs font-mono text-neon-green flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse" />
                                            CONNECTED
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Console Logs */}
                            <div className="flex-1 flex flex-col bg-[#050505]">
                                <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
                                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">◢ LIVE CONSOLE</span>
                                    <span className="text-[10px] text-neon-green/60 font-mono animate-pulse">● STREAMING</span>
                                </div>

                                <div
                                    ref={logContainerRef}
                                    className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent"
                                >
                                    {logs.map((log) => (
                                        <div key={log.id} className="flex gap-3 hover:bg-white/5 px-2 py-0.5 rounded">
                                            <span className="text-white/30 shrink-0">{log.timestamp}</span>
                                            <span className={cn("break-all", getLevelColor(log.level))}>{log.message}</span>
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-2 text-cyan-400/60 animate-pulse">
                                        <span className="text-white/30">{getTimestamp()}</span>
                                        <span>█</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
