'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Smartphone, Layout, Menu, Zap } from 'lucide-react';

const CURRENT_VERSION = '2.1.0';
const VERSION_KEY = 'vyaas_last_seen_version';

interface WhatsNewModalProps {
    onClose?: () => void;
}

export function WhatsNewModal({ onClose }: WhatsNewModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Skip for desktop app (running on localhost:3000 via Pywebview)
        const isDesktopApp = typeof window !== 'undefined' && (
            window.location.hostname === '127.0.0.1' ||
            window.location.port === '3000' ||
            navigator.userAgent.includes('Electron') ||
            // @ts-ignore - pywebview detection
            window.pywebview !== undefined
        );

        if (isDesktopApp) {
            console.log('Desktop app detected - skipping What\'s New modal');
            return;
        }

        // Check if user has seen this version
        const lastSeenVersion = localStorage.getItem(VERSION_KEY);
        if (lastSeenVersion !== CURRENT_VERSION) {
            setIsOpen(true);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
        setIsOpen(false);
        onClose?.();
    };

    const handleExplore = () => {
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
        window.open('/whats-new', '_blank');
        setIsOpen(false);
        onClose?.();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', duration: 0.5 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="relative w-full max-w-lg bg-gradient-to-br from-[#1a1a1c] to-[#0a0a0c] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                            {/* Close Button */}
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all z-10"
                            >
                                <X className="w-5 h-5 text-white/80" />
                            </button>

                            {/* Header with Animation */}
                            <div className="relative p-8 pb-6 overflow-hidden">
                                {/* Animated Background */}
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20" />
                                <motion.div
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        rotate: [0, 180, 360],
                                    }}
                                    transition={{
                                        duration: 20,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                    className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl"
                                />

                                {/* Content */}
                                <div className="relative z-10">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: 'spring' }}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-4"
                                    >
                                        <Sparkles className="w-4 h-4 text-yellow-400" />
                                        <span className="text-sm font-bold text-white">Version {CURRENT_VERSION}</span>
                                    </motion.div>

                                    <h2 className="text-3xl font-bold text-white mb-2">
                                        New Version of VYAAS! 🎉
                                    </h2>
                                    <p className="text-white/60 text-sm">
                                        Discover exciting new features and improvements
                                    </p>
                                </div>
                            </div>

                            {/* Features List */}
                            <div className="px-8 py-6 space-y-4">
                                <FeatureItem
                                    icon={<Smartphone className="w-5 h-5" />}
                                    title="PWA Support"
                                    description="Install VYAAS as an app on your phone!"
                                    delay={0.1}
                                />
                                <FeatureItem
                                    icon={<Layout className="w-5 h-5" />}
                                    title="Mobile Responsive UI"
                                    description="Perfectly optimized for all screen sizes"
                                    delay={0.2}
                                />
                                <FeatureItem
                                    icon={<Menu className="w-5 h-5" />}
                                    title="Improved Navigation"
                                    description="History & Inbox now in user menu"
                                    delay={0.3}
                                />
                                <FeatureItem
                                    icon={<Zap className="w-5 h-5" />}
                                    title="Performance Boost"
                                    description="Faster loading and smoother animations"
                                    delay={0.4}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="p-8 pt-4 flex gap-3">
                                <button
                                    onClick={handleClose}
                                    className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-medium transition-all"
                                >
                                    Maybe Later
                                </button>
                                <button
                                    onClick={handleExplore}
                                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold shadow-lg shadow-purple-500/50 transition-all hover:scale-105"
                                >
                                    Explore What&apos;s New
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

interface FeatureItemProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    delay: number;
}

function FeatureItem({ icon, title, description, delay }: FeatureItemProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay }}
            className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group"
        >
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-300 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <div className="flex-1">
                <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
                <p className="text-white/60 text-xs">{description}</p>
            </div>
        </motion.div>
    );
}
