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
                    {/* Main content */}
                    <div className="relative flex flex-col items-center z-10 w-full max-w-sm mx-auto px-6">
                        {/* Minimal Logo container (No glowing orbs or rings) */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="relative mb-12 flex items-center justify-center pt-8"
                        >
                            <img
                                src="/vyaas-logo-splash.png"
                                alt="VYAAS AI"
                                className="w-24 h-24 md:w-32 md:h-32 object-contain"
                            />
                        </motion.div>
                        {/* Glitch Text */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="text-4xl md:text-5xl font-bold text-white tracking-[0.3em] mb-2 font-mono"
                            style={{
                                textShadow: '0 0 10px rgba(255,255,255,0.5), 0 0 20px rgba(255,255,255,0.3), 0 0 30px rgba(255,255,255,0.2)'
                            }}
                        >
                            {glitchText}
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1, duration: 0.5 }}
                            className="text-foreground text-xs tracking-[0.5em] uppercase mb-8 font-mono"
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
                                    className="h-full bg-gradient-to-r from-foreground via-white to-foreground rounded-full"
                                    style={{ width: `${progress}%` }}
                                    transition={{ duration: 0.2 }}
                                />
                            </div>

                            {/* Status text */}
                            <div className="flex justify-between items-center mt-3 text-[10px] font-mono">
                                <span className="text-foreground">{statusText}</span>
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
                            <span className="w-1 h-1 bg-foreground rounded-full animate-pulse" />
                            <span>NEURAL_v2.5</span>
                            <span className="w-1 h-1 bg-white/30 rounded-full" />
                            <span>SECURE</span>
                        </motion.div>
                    </div>

                    {/* Corner HUD elements */}
                    <div className="absolute top-6 left-6 text-[9px] font-mono text-foreground space-y-1">
                        <div>{'>'} BOOT_SEQUENCE</div>
                        <div className="text-white/20">{'>'} ID: VY-2026-0001</div>
                    </div>

                    <div className="absolute top-6 right-6 text-right text-[9px] font-mono text-white/30">
                        <div>BUILD 2.5.0</div>
                        <div className="text-foreground">{scanComplete ? '● ONLINE' : '○ LOADING'}</div>
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
