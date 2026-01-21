'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isDesktopApp, setIsDesktopApp] = useState(false);

    // Check if running as desktop app
    useEffect(() => {
        const desktopCheck = typeof window !== 'undefined' && (
            window.location.hostname === '127.0.0.1' ||
            window.location.port === '3000' ||
            navigator.userAgent.includes('Electron') ||
            // @ts-ignore - pywebview detection
            window.pywebview !== undefined
        );

        if (desktopCheck) {
            console.log('Desktop app detected - disabling PWA install prompt');
            setIsDesktopApp(true);
        }
    }, []);

    useEffect(() => {
        // Skip for desktop app
        if (isDesktopApp) return;

        const handler = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Save the event so it can be triggered later
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show our custom install prompt
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, [isDesktopApp]);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        console.log(`User response: ${outcome}`);

        // Clear the deferredPrompt
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Store dismissal in localStorage to not show again for a while
        localStorage.setItem('pwa-dismissed', Date.now().toString());
    };

    // Don't show if dismissed recently (within 7 days)
    useEffect(() => {
        const dismissed = localStorage.getItem('pwa-dismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed);
            const sevenDays = 7 * 24 * 60 * 60 * 1000;
            if (Date.now() - dismissedTime < sevenDays) {
                setShowPrompt(false);
            }
        }
    }, []);

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
            <div className="bg-[#0a0a0a] rounded-2xl p-4 shadow-2xl border border-neon-green/30 backdrop-blur-xl">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                            <img src="/vyaas-logo.png" alt="VYAAS" className="w-8 h-8 object-contain" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">Install VYAAS AI</h3>
                            <p className="text-white/60 text-sm">Get the app experience!</p>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-white/60" />
                    </button>
                </div>

                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                        <span className="text-neon-green">✓</span>
                        <span>Works offline</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                        <span className="text-neon-green">✓</span>
                        <span>Faster loading</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                        <span className="text-neon-green">✓</span>
                        <span>Home screen access</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleDismiss}
                        className="relative flex-1 px-4 py-2 bg-[#1a1a1a]/80 backdrop-blur-xl text-white hover:bg-[#252525]/80 rounded-lg font-medium transition-colors border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.1)] before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none"
                    >
                        Not Now
                    </button>
                    <button
                        onClick={handleInstall}
                        className="relative flex-1 px-4 py-2 bg-[#1a1a1a]/80 backdrop-blur-xl text-white hover:bg-[#252525]/80 rounded-lg font-bold transition-colors border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.1)] before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none"
                    >
                        Install
                    </button>
                </div>
            </div>
        </div>
    );
}
