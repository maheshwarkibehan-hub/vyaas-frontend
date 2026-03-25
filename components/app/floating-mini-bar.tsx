'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, MonitorUp, Maximize2, X } from 'lucide-react';

// Check if running as desktop app
const isDesktopApp = typeof window !== 'undefined' && (
    window.location.hostname === '127.0.0.1' ||
    window.location.port === '3000'
);

export function FloatingMiniBar() {
    const [isMiniMode, setIsMiniMode] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    useEffect(() => {
        if (!isDesktopApp) return;

        // Check for mini mode from pywebview
        const checkMiniMode = async () => {
            // @ts-ignore
            if (window.pywebview?.api?.get_window_state) {
                try {
                    // @ts-ignore
                    const state = await window.pywebview.api.get_window_state();
                    setIsMiniMode(state.is_mini_mode);
                } catch (e) {
                    // Silently fail
                }
            }
        };

        // Check periodically for window state changes
        const interval = setInterval(checkMiniMode, 300);
        return () => clearInterval(interval);
    }, []);

    const handleExpand = async () => {
        // @ts-ignore
        if (window.pywebview?.api?.toggle_mini_mode) {
            // @ts-ignore
            await window.pywebview.api.toggle_mini_mode();
        }
    };

    // Only show in mini mode on desktop
    if (!isDesktopApp || !isMiniMode) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 flex items-center justify-center bg-gradient-to-r from-[#0a0a0a] via-[#111] to-[#0a0a0a] overflow-hidden"
            style={{
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}
        >
            {/* Animated background gradient */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-10 -left-10 w-20 h-20 bg-foreground rounded-full blur-2xl animate-pulse" />
                <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-foreground rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>

            <div className="relative flex items-center gap-2 px-4 h-full w-full">
                {/* VYAAS Logo/Title */}
                <div className="flex items-center gap-2 mr-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-secondary to-foreground flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">V</span>
                    </div>
                    <span className="text-white/90 text-xs font-bold tracking-wide">VYAAS</span>
                </div>

                {/* Divider */}
                <div className="w-px h-5 bg-white/20" />

                {/* Mic Button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-2.5 rounded-full transition-all border-none ${isMuted
                            ? 'bg-foreground text-background shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]'
                            : 'bg-card text-foreground shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5),inset_0_2px_0_rgba(255,255,255,0.05)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.6),inset_0_2px_0_rgba(255,255,255,0.1)]'
                        }`}
                    title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                >
                    {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                </motion.button>

                {/* Video Button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsVideoOn(!isVideoOn)}
                    className={`p-2.5 rounded-full transition-all border-none ${!isVideoOn
                            ? 'bg-card text-muted-foreground shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5),inset_0_2px_0_rgba(255,255,255,0.05)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.6),inset_0_2px_0_rgba(255,255,255,0.1)]'
                            : 'bg-foreground text-background shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]'
                        }`}
                    title={isVideoOn ? 'Stop Video (V)' : 'Start Video (V)'}
                >
                    {isVideoOn ? <Video size={16} /> : <VideoOff size={16} />}
                </motion.button>

                {/* Screen Share Button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsScreenSharing(!isScreenSharing)}
                    className={`p-2.5 rounded-full transition-all border-none ${isScreenSharing
                            ? 'bg-foreground text-background shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]'
                            : 'bg-card text-foreground shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5),inset_0_2px_0_rgba(255,255,255,0.05)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.6),inset_0_2px_0_rgba(255,255,255,0.1)]'
                        }`}
                    title={isScreenSharing ? 'Stop Sharing (S)' : 'Share Screen (S)'}
                >
                    <MonitorUp size={16} />
                </motion.button>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Expand Button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleExpand}
                    className="p-2.5 rounded-full bg-secondary text-foreground transition-all shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5),inset_0_2px_0_rgba(255,255,255,0.05)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.6),inset_0_2px_0_rgba(255,255,255,0.1)] border-none"
                    title="Expand Window (F11)"
                >
                    <Maximize2 size={16} />
                </motion.button>
            </div>
        </motion.div>
    );
}
