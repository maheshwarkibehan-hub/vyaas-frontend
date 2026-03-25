'use client';

import { useState, useEffect } from 'react';

declare global {
    interface Window {
        pywebview?: {
            api: {
                expand_to_full: () => Promise<{ success: boolean }>;
                get_room_data: () => Promise<{ success: boolean; data: any }>;
                toggle_mic: () => Promise<{ success: boolean }>;
                toggle_camera: () => Promise<{ success: boolean }>;
                toggle_screen: () => Promise<{ success: boolean }>;
            };
        };
    }
}

// Mini mode content with IPC controls (Remote Control for Main Window)
export default function MiniModeContent() {
    const [hasActiveSession, setHasActiveSession] = useState(false);
    // Local state for UI feedback (Simple optimistic UI)
    const [micEnabled, setMicEnabled] = useState(true);
    const [cameraEnabled, setCameraEnabled] = useState(false);
    const [screenEnabled, setScreenEnabled] = useState(false);

    useEffect(() => {
        let pollInterval: NodeJS.Timeout;

        const checkSession = async () => {
            // First try Python API (for desktop app)
            if (window.pywebview?.api?.get_room_data) {
                try {
                    const result = await window.pywebview.api.get_room_data();
                    if (result?.success && result?.data) {
                        setHasActiveSession(true);
                        return true;
                    }
                } catch (e) {
                    console.error('Failed to get room data from Python API:', e);
                }
            }
            // Fallback to localStorage (for browser testing mockup)
            const stored = localStorage.getItem('vyaas_mini_mode_room');
            if (stored) {
                setHasActiveSession(true);
                return true;
            }

            return false;
        };

        // Initial check
        checkSession().then(found => {
            if (!found) {
                // Poll until session starts
                pollInterval = setInterval(async () => {
                    const found = await checkSession();
                    if (found) {
                        clearInterval(pollInterval);
                    }
                }, 2000);
            }
        });

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, []);

    const handleExpand = async () => {
        if (window.pywebview?.api?.expand_to_full) {
            await window.pywebview.api.expand_to_full();
        }
    };

    const handleMicToggle = async () => {
        if (window.pywebview?.api?.toggle_mic) {
            await window.pywebview.api.toggle_mic();
            setMicEnabled(!micEnabled); // Optimistic UI update
        }
    };

    const handleCameraToggle = async () => {
        if (window.pywebview?.api?.toggle_camera) {
            await window.pywebview.api.toggle_camera();
            setCameraEnabled(!cameraEnabled);
        }
    };

    const handleScreenToggle = async () => {
        if (window.pywebview?.api?.toggle_screen) {
            await window.pywebview.api.toggle_screen();
            setScreenEnabled(!screenEnabled);
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F11') {
                e.preventDefault();
                handleExpand();
            }
            if (e.key === 'm' || e.key === 'M') {
                handleMicToggle();
            }
            if (e.key === 'v' || e.key === 'V') {
                handleCameraToggle();
            }
            if (e.key === 's' || e.key === 'S') {
                handleScreenToggle();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [micEnabled, cameraEnabled, screenEnabled]); // Add deps for state closures if needed

    if (!hasActiveSession) {
        return (
            <div className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="text-center">
                    <div className="text-white/50 text-sm mb-2">No active session</div>
                    <button onClick={handleExpand} className="text-xs text-cyan-400 hover:underline">
                        Expand to start session
                    </button>
                    {!window.pywebview && <div className="text-[10px] text-white/20 mt-2">Browser Mode (UI Only)</div>}
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center overflow-hidden">

            {/* Control Bar Container - Exact styling from user */}
            <div className="relative bg-[#1a1a1a]/80 backdrop-blur-2xl border border-white/30 rounded-full p-2.5 shadow-[0_0_30px_rgba(255,255,255,0.08),0_8px_32px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] flex items-center gap-4 transition-all duration-300 hover:border-white/40 hover:bg-[#252525]/80">

                {/* Mic, Camera, Screen Share Group */}
                <div className="flex items-center gap-2">
                    {/* Mic Button */}
                    <button
                        onClick={handleMicToggle}
                        className={`h-10 w-10 rounded-full flex items-center justify-center border transition-all ${micEnabled
                                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30'
                                : 'bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30'
                            }`}
                        title={micEnabled ? 'Mute (M)' : 'Unmute (M)'}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256" className="w-5 h-5">
                            <path d="M128,180a52.06,52.06,0,0,0,52-52V64A52,52,0,0,0,76,64v64A52.06,52.06,0,0,0,128,180ZM100,64a28,28,0,0,1,56,0v64a28,28,0,0,1-56,0Zm40,155.22V240a12,12,0,0,1-24,0V219.22A92.14,92.14,0,0,1,36,128a12,12,0,0,1,24,0,68,68,0,0,0,136,0,12,12,0,0,1,24,0A92.14,92.14,0,0,1,140,219.22Z"></path>
                        </svg>
                    </button>

                    {/* Camera Button */}
                    <button
                        onClick={handleCameraToggle}
                        className={`h-10 w-10 rounded-full flex items-center justify-center border transition-all ${cameraEnabled
                                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30'
                                : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                            }`}
                        title={cameraEnabled ? 'Stop Camera (V)' : 'Start Camera (V)'}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256" className="w-5 h-5">
                            {cameraEnabled ? (
                                <path d="M249.45,69.31a12,12,0,0,0-12.51,1L212,88.43V72a20,20,0,0,0-20-20H32A20,20,0,0,0,12,72V184a20,20,0,0,0,20,20H192a20,20,0,0,0,20-20V167.57l24.94,18.12A12,12,0,0,0,256,176V80A12,12,0,0,0,249.45,69.31ZM188,180H36V76H188Zm44-27.57-20-14.54V118.11l20-14.54Z"></path>
                            ) : (
                                <path d="M249.45,69.31a12,12,0,0,0-12.51,1L212,88.43V72a20,20,0,0,0-20-20H123.88a12,12,0,0,0,0,24H188v68a12,12,0,0,0,4.46,9.33c.15.13.31.25.48.38l44,32A12,12,0,0,0,256,176V80A12,12,0,0,0,249.45,69.31ZM232,152.43l-20-14.54V118.11l20-14.54ZM56.88,31.93A12,12,0,1,0,39.12,48.07L42.69,52H32A20,20,0,0,0,12,72V184a20,20,0,0,0,20,20H180.87l18.25,20.07a12,12,0,0,0,17.76-16.14ZM36,180V76H64.51l94.55,104Z"></path>
                            )}
                        </svg>
                    </button>

                    {/* Screen Share Button */}
                    <button
                        onClick={handleScreenToggle}
                        className={`h-10 w-10 rounded-full flex items-center justify-center border transition-all ${screenEnabled
                                ? 'bg-green-500/20 border-green-500/40 text-green-400 hover:bg-green-500/30'
                                : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                            }`}
                        title={screenEnabled ? 'Stop Sharing (S)' : 'Share Screen (S)'}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                    </button>
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-white/10"></div>

                {/* Image Gen & Code Group */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => window.open('https://vyaasai.lovable.app/', '_blank')}
                        className="h-10 w-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white transition-all"
                        title="Image Generation"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                    </button>

                    <button
                        onClick={() => window.open('https://vyaas-code.lovable.app/', '_blank')}
                        className="h-10 w-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white transition-all"
                        title="Code Mode"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                        </svg>
                    </button>
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-white/10"></div>

                {/* Mini Mode & END Group */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExpand}
                        className="h-12 w-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all hover:scale-105 active:scale-95"
                        title="Expand (F11)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 256 256">
                            <path d="M216.49,56.48,177,96h19a12,12,0,0,1,0,24H148a12,12,0,0,1-12-12V60a12,12,0,0,1,24,0V79l39.51-39.52a12,12,0,0,1,17,17ZM108,136H60a12,12,0,0,0,0,24H79L39.51,199.51a12,12,0,0,0,17,17L96,177v19a12,12,0,0,0,24,0V148A12,12,0,0,0,108,136Z"></path>
                        </svg>
                    </button>

                    <button
                        onClick={handleExpand}
                        className="h-12 px-5 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 hover:border-red-500/50 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256" className="mr-1">
                            <path d="M234.39,87.29c-57.67-57.72-155.11-57.72-212.78,0-21.45,21.47-23.52,53.13-5,77a20,20,0,0,0,22.92,6.37L88.4,153.29l.45-.16A20,20,0,0,0,101,138.47l5.44-27.24a72.48,72.48,0,0,1,42.76-.09L155,138.62a20,20,0,0,0,12.14,14.49l.45.17,48.94,17.37a20,20,0,0,0,22.91-6.37C257.91,140.42,255.84,108.76,234.39,87.29Z"></path>
                        </svg>
                        <span className="font-bold text-sm">END</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
