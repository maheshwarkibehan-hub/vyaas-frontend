'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
    onComplete: () => void;
    minDuration?: number;
}

const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?0123456789';
const targetText = 'VYAAS AI';

export function SplashScreen({ onComplete, minDuration = 3500 }: SplashScreenProps) {
    const [showSplash, setShowSplash] = useState(true);
    const [glitchText, setGlitchText] = useState('________');
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('INITIALIZING...');
    const [scanComplete, setScanComplete] = useState(false);

    // Glitch text animation
    useEffect(() => {
        let iteration = 0;
        const maxIterations = targetText.length * 3;

        const interval = setInterval(() => {
            setGlitchText(
                targetText
                    .split('')
                    .map((char, index) => {
                        if (index < iteration / 3) {
                            return targetText[index];
                        }
                        return glitchChars[Math.floor(Math.random() * glitchChars.length)];
                    })
                    .join('')
            );

            iteration++;
            if (iteration > maxIterations) {
                clearInterval(interval);
                setGlitchText(targetText);
            }
        }, 50);

        return () => clearInterval(interval);
    }, []);

    // Progress bar animation
    useEffect(() => {
        const statusMessages = [
            'INITIALIZING...',
            'LOADING NEURAL ENGINE...',
            'CONNECTING TO CORE...',
            'CALIBRATING SYSTEMS...',
            'SYSTEM READY'
        ];

        const interval = setInterval(() => {
            setProgress((prev) => {
                const next = prev + Math.random() * 15 + 5;
                const clamped = Math.min(next, 100);

                // Update status based on progress
                const statusIndex = Math.min(
                    Math.floor(clamped / 25),
                    statusMessages.length - 1
                );
                setStatusText(statusMessages[statusIndex]);

                return clamped;
            });
        }, 200);

        return () => clearInterval(interval);
    }, []);

    // Scan complete trigger
    useEffect(() => {
        if (progress >= 100) {
            setTimeout(() => setScanComplete(true), 300);
        }
    }, [progress]);

    // Exit animation
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSplash(false);
            setTimeout(onComplete, 500);
        }, minDuration);

        return () => clearTimeout(timer);
    }, [minDuration, onComplete]);

    return (
        <AnimatePresence>
            {showSplash && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-[#030303] overflow-hidden"
                >
                    {/* Animated background grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(74,222,128,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(74,222,128,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(circle_at_center,black_30%,transparent_70%)]" />

                    {/* Scanning lines */}
                    <motion.div
                        initial={{ y: '-100%' }}
                        animate={{ y: '100%' }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-neon-green/10 to-transparent pointer-events-none"
                    />

                    {/* Radial glow */}
                    <div className="absolute w-[600px] h-[600px] rounded-full bg-neon-green/5 blur-[100px] animate-pulse" />

                    {/* Main content */}
                    <div className="relative flex flex-col items-center z-10">
                        {/* Logo container with glow */}
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0, rotateY: -180 }}
                            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="relative mb-8"
                        >
                            {/* Outer rotating ring */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                className="absolute -inset-8 border border-neon-green/20 rounded-full"
                            />
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                                className="absolute -inset-12 border border-dashed border-white/10 rounded-full"
                            />

                            {/* Logo with pulsing glow */}
                            <div className="relative w-40 h-40 flex items-center justify-center">
                                <div className="absolute inset-0 bg-neon-green/20 rounded-full blur-2xl animate-pulse" />
                                <motion.img
                                    src="/vyaas-logo-splash.png"
                                    alt="VYAAS AI"
                                    className="w-36 h-36 object-contain relative z-10 drop-shadow-[0_0_30px_rgba(74,222,128,0.5)]"
                                    initial={{ filter: 'brightness(0)' }}
                                    animate={{ filter: 'brightness(1)' }}
                                    transition={{ duration: 1, delay: 0.3 }}
                                />
                            </div>

                            {/* Corner decorations */}
                            <div className="absolute -top-4 -left-4 w-4 h-4 border-l-2 border-t-2 border-neon-green/50" />
                            <div className="absolute -top-4 -right-4 w-4 h-4 border-r-2 border-t-2 border-neon-green/50" />
                            <div className="absolute -bottom-4 -left-4 w-4 h-4 border-l-2 border-b-2 border-neon-green/50" />
                            <div className="absolute -bottom-4 -right-4 w-4 h-4 border-r-2 border-b-2 border-neon-green/50" />
                        </motion.div>

                        {/* Glitch Text */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="text-4xl md:text-5xl font-bold text-white tracking-[0.3em] mb-2 font-mono"
                            style={{
                                textShadow: '0 0 10px rgba(74,222,128,0.5), 0 0 20px rgba(74,222,128,0.3), 0 0 30px rgba(74,222,128,0.2)'
                            }}
                        >
                            {glitchText}
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1, duration: 0.5 }}
                            className="text-neon-green/60 text-xs tracking-[0.5em] uppercase mb-8 font-mono"
                        >
                            YOUR AI ASSISTANT
                        </motion.p>

                        {/* Progress bar */}
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: '280px' }}
                            transition={{ delay: 0.8, duration: 0.3 }}
                            className="relative"
                        >
                            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-neon-green via-white to-neon-green rounded-full"
                                    style={{ width: `${progress}%` }}
                                    transition={{ duration: 0.2 }}
                                />
                            </div>

                            {/* Status text */}
                            <div className="flex justify-between items-center mt-3 text-[10px] font-mono">
                                <span className="text-neon-green/80">{statusText}</span>
                                <span className="text-white/40">{Math.floor(progress)}%</span>
                            </div>
                        </motion.div>

                        {/* Decorative elements */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2 }}
                            className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-4 text-[9px] font-mono text-white/20"
                        >
                            <span>SYS://</span>
                            <span className="w-1 h-1 bg-neon-green/50 rounded-full animate-pulse" />
                            <span>NEURAL_v2.5</span>
                            <span className="w-1 h-1 bg-white/30 rounded-full" />
                            <span>SECURE</span>
                        </motion.div>
                    </div>

                    {/* Corner HUD elements */}
                    <div className="absolute top-6 left-6 text-[9px] font-mono text-neon-green/40 space-y-1">
                        <div>{'>'} BOOT_SEQUENCE</div>
                        <div className="text-white/20">{'>'} ID: VY-2026-0001</div>
                    </div>

                    <div className="absolute top-6 right-6 text-right text-[9px] font-mono text-white/30">
                        <div>BUILD 2.5.0</div>
                        <div className="text-neon-green/50">{scanComplete ? '● ONLINE' : '○ LOADING'}</div>
                    </div>

                    <div className="absolute bottom-6 left-6 text-[9px] font-mono text-white/20">
                        © 2026 VYAAS AI SYSTEMS
                    </div>

                    <div className="absolute bottom-6 right-6 text-[9px] font-mono text-white/20">
                        ENCRYPTED CONNECTION
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
