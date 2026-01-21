'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Wifi, WifiOff, Mic, Video, Database, Cpu, Activity, RefreshCw, CheckCircle, XCircle, AlertCircle, Zap, Radio } from 'lucide-react';
import { useRoomContext } from '@livekit/components-react';
import { auth } from '@/lib/firebase';
import { cn } from '@/lib/utils';

interface ServiceStatus {
    name: string;
    icon: React.ReactNode;
    status: 'checking' | 'online' | 'offline' | 'warning';
    description: string;
    latency?: number;
}

interface SystemHealthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SystemHealthModal({ isOpen, onClose }: SystemHealthModalProps) {
    const [services, setServices] = useState<ServiceStatus[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);
    const room = useRoomContext();

    // Initialize all services with checking state
    const initializeServices = useCallback((): ServiceStatus[] => [
        { name: 'LiveKit WebRTC', icon: <Radio size={16} />, status: 'checking', description: 'Real-time voice connection' },
        { name: 'Gemini AI', icon: <Cpu size={16} />, status: 'checking', description: 'AI inference engine' },
        { name: 'Firebase Auth', icon: <Shield size={16} />, status: 'checking', description: 'User authentication' },
        { name: 'Network', icon: <Wifi size={16} />, status: 'checking', description: 'Internet connectivity' },
        { name: 'Audio Pipeline', icon: <Mic size={16} />, status: 'checking', description: 'Microphone access' },
        { name: 'Video Pipeline', icon: <Video size={16} />, status: 'checking', description: 'Camera access' },
        { name: 'Supabase DB', icon: <Database size={16} />, status: 'checking', description: 'Database connection' },
        { name: 'Data Channel', icon: <Activity size={16} />, status: 'checking', description: 'WebSocket messaging' },
    ], []);

    // Check all services
    const checkAllServices = useCallback(async () => {
        setIsChecking(true);
        setServices(initializeServices());

        const updateService = (name: string, status: ServiceStatus['status'], latency?: number) => {
            setServices(prev => prev.map(s =>
                s.name === name ? { ...s, status, latency } : s
            ));
        };

        // Simulate staggered checking for cool effect
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // Check LiveKit
        await delay(200);
        const liveKitStatus = room.state === 'connected' ? 'online' : room.state === 'connecting' ? 'warning' : 'offline';
        updateService('LiveKit WebRTC', liveKitStatus);

        // Check Network
        await delay(150);
        updateService('Network', navigator.onLine ? 'online' : 'offline');

        // Check Firebase Auth
        await delay(200);
        updateService('Firebase Auth', auth.currentUser ? 'online' : 'warning');

        // Check Audio Pipeline
        await delay(180);
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasAudio = devices.some(d => d.kind === 'audioinput');
            updateService('Audio Pipeline', hasAudio ? 'online' : 'warning');
        } catch {
            updateService('Audio Pipeline', 'offline');
        }

        // Check Video Pipeline
        await delay(150);
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasVideo = devices.some(d => d.kind === 'videoinput');
            updateService('Video Pipeline', hasVideo ? 'online' : 'warning');
        } catch {
            updateService('Video Pipeline', 'offline');
        }

        // Check Gemini AI (ping backend)
        await delay(250);
        try {
            const start = performance.now();
            const res = await fetch('https://vyaas-backend.onrender.com/api/health', {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            const latency = Math.round(performance.now() - start);
            updateService('Gemini AI', res.ok ? 'online' : 'warning', latency);
        } catch {
            updateService('Gemini AI', 'warning');
        }

        // Check Supabase
        await delay(200);
        try {
            const start = performance.now();
            const res = await fetch('https://bxlvvuoxfzqwkbzdmkzb.supabase.co/rest/v1/', {
                method: 'HEAD',
                signal: AbortSignal.timeout(3000)
            });
            const latency = Math.round(performance.now() - start);
            updateService('Supabase DB', res.status !== 0 ? 'online' : 'warning', latency);
        } catch {
            updateService('Supabase DB', 'warning');
        }

        // Check Data Channel (WebSocket)
        await delay(150);
        const hasDataChannel = room.state === 'connected' && room.localParticipant?.permissions?.canPublishData;
        updateService('Data Channel', hasDataChannel ? 'online' : room.state === 'connected' ? 'warning' : 'offline');

        setIsChecking(false);
        setLastChecked(new Date());
    }, [room, initializeServices]);

    // Run check when modal opens
    useEffect(() => {
        if (isOpen) {
            checkAllServices();
        }
    }, [isOpen, checkAllServices]);

    // Listen for network changes
    useEffect(() => {
        const handleOnline = () => setServices(prev => prev.map(s =>
            s.name === 'Network' ? { ...s, status: 'online' } : s
        ));
        const handleOffline = () => setServices(prev => prev.map(s =>
            s.name === 'Network' ? { ...s, status: 'offline' } : s
        ));

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const getStatusIcon = (status: ServiceStatus['status']) => {
        switch (status) {
            case 'online': return <CheckCircle size={14} className="text-neon-green" />;
            case 'offline': return <XCircle size={14} className="text-red-500" />;
            case 'warning': return <AlertCircle size={14} className="text-yellow-500" />;
            default: return <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />;
        }
    };

    const getStatusColor = (status: ServiceStatus['status']) => {
        switch (status) {
            case 'online': return 'border-neon-green/30 bg-neon-green/5';
            case 'offline': return 'border-red-500/30 bg-red-500/5';
            case 'warning': return 'border-yellow-500/30 bg-yellow-500/5';
            default: return 'border-cyan-500/30 bg-cyan-500/5';
        }
    };

    const onlineCount = services.filter(s => s.status === 'online').length;
    const totalCount = services.length;
    const healthPercentage = totalCount > 0 ? Math.round((onlineCount / totalCount) * 100) : 0;

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
                        className="relative w-full max-w-lg bg-[#0a0a0a] border border-cyan-500/30 rounded-xl overflow-hidden shadow-[0_0_60px_rgba(0,255,255,0.1)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#0f0f0f] to-[#1a1a1a] border-b border-cyan-500/20">
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 cursor-pointer" onClick={onClose} />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <div className={cn(
                                        "w-3 h-3 rounded-full",
                                        isChecking ? "bg-yellow-500 animate-pulse" : healthPercentage === 100 ? "bg-green-500" : "bg-yellow-500"
                                    )} />
                                </div>
                                <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono">
                                    <Zap size={14} />
                                    <span className="tracking-wider">VYAAS://SYSTEM-HEALTH</span>
                                </div>
                            </div>
                            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Health Score */}
                        <div className="p-4 border-b border-white/5 bg-[#080808]">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase">
                                    ◢ SYSTEM HEALTH SCORE
                                </div>
                                <button
                                    onClick={checkAllServices}
                                    disabled={isChecking}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all",
                                        "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20",
                                        isChecking && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <RefreshCw size={12} className={isChecking ? "animate-spin" : ""} />
                                    {isChecking ? "SCANNING..." : "RECHECK ALL"}
                                </button>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "text-4xl font-bold font-mono",
                                    healthPercentage === 100 ? "text-neon-green" : healthPercentage >= 75 ? "text-yellow-400" : "text-red-400"
                                )}>
                                    {isChecking ? "--" : `${healthPercentage}%`}
                                </div>
                                <div className="flex-1">
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            className={cn(
                                                "h-full rounded-full",
                                                healthPercentage === 100 ? "bg-neon-green" : healthPercentage >= 75 ? "bg-yellow-400" : "bg-red-400"
                                            )}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${healthPercentage}%` }}
                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                        />
                                    </div>
                                    <div className="text-[10px] text-white/40 mt-1">
                                        {onlineCount}/{totalCount} services operational
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Services List */}
                        <div className="p-4 space-y-2 max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent">
                            {services.map((service, index) => (
                                <motion.div
                                    key={service.name}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-lg border transition-all",
                                        getStatusColor(service.status)
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-1.5 rounded-md",
                                            service.status === 'online' ? "text-neon-green bg-neon-green/10" :
                                                service.status === 'offline' ? "text-red-400 bg-red-500/10" :
                                                    service.status === 'warning' ? "text-yellow-400 bg-yellow-500/10" :
                                                        "text-cyan-400 bg-cyan-500/10"
                                        )}>
                                            {service.icon}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white">{service.name}</div>
                                            <div className="text-[10px] text-white/40">{service.description}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {service.latency && service.status === 'online' && (
                                            <span className="text-[10px] text-white/30 font-mono">{service.latency}ms</span>
                                        )}
                                        {getStatusIcon(service.status)}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t border-white/5 bg-[#080808] flex items-center justify-between">
                            <div className="text-[10px] text-white/30 font-mono">
                                {lastChecked ? `Last checked: ${lastChecked.toLocaleTimeString()}` : 'Never checked'}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-cyan-400/60 font-mono">
                                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                                LIVE MONITORING
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
