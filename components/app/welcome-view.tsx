import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useAuthUI } from '@/components/app/auth-ui-provider';
import { PricingModal } from '@/components/app/pricing-modal';
import { getUserSubscription, type PlanType } from '@/lib/subscription';
import { isUserBlocked, checkSessionStatus, clearForceLogout } from '@/lib/supabase';
import { SuspendedModal } from '@/components/app/suspended-modal';
import { DailyRewardsModal } from '@/components/app/daily-rewards-modal';
import { Crown, Zap, Sparkles, Code, Image, MessageSquare, Shield, Clock, Users, Mic, Brain, Gift, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import { InteractiveBackground } from '@/components/ui/interactive-bg';

let hasVisitedBefore = false;

// Check if running as desktop app
const isDesktopApp = typeof window !== 'undefined' && (
    window.location.hostname === '127.0.0.1' ||
    window.location.port === '3000' ||
    navigator.userAgent.includes('Electron')
);

const FeatureCard = ({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay }}
        whileHover={{ scale: 1.02, y: -5 }}
        className="relative z-10 p-8 rounded-[2rem] bg-card border-none transition-all group shadow-clay-light-sm dark:shadow-clay-sm hover:shadow-clay-light-md dark:hover:shadow-clay-md"
    >
        <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
            <Icon size={32} className="text-foreground" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-3">{title}</h3>
        <p className="text-muted-foreground leading-relaxed font-medium">{desc}</p>
    </motion.div>
);

const PlanCard = ({ name, price, features, popular, delay }: { name: string, price: string, features: string[], popular?: boolean, delay: number }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        whileHover={{ scale: 1.02, y: -5 }}
        className={`relative z-10 p-10 rounded-[2.5rem] transition-all bg-card border-none ${popular
            ? 'shadow-clay-light-lg dark:shadow-clay-lg scale-105'
            : 'shadow-clay-light-md dark:shadow-clay-md'
            }`}
    >
        {popular && (
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-foreground text-background px-6 py-2 rounded-full text-sm font-bold flex items-center gap-1 shadow-clay-light-sm dark:shadow-clay-sm">
                <Sparkles size={16} fill="currentColor" /> POPULAR
            </div>
        )}
        <h3 className="text-3xl font-extrabold text-foreground mb-4 tracking-tight">{name}</h3>
        <div className="flex items-baseline gap-2 mb-8">
            <span className="text-5xl font-black text-foreground">₹{price}</span>
            <span className="text-muted-foreground font-medium text-lg">/month</span>
        </div>
        <ul className="space-y-4 mb-8">
            {features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-muted-foreground">
                    <Zap size={20} className="text-foreground mt-1 flex-shrink-0" fill="currentColor" />
                    <span className="font-medium text-[1.1rem]">{feature}</span>
                </li>
            ))}
        </ul>
    </motion.div>
);

interface WelcomeViewProps {
    startButtonText: string;
    onStartCall: () => void;
}

export const WelcomeView = ({
    startButtonText,
    onStartCall,
    ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { openAuthModal } = useAuthUI();
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [checkingBlock, setCheckingBlock] = useState(false);
    const [showPricing, setShowPricing] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<PlanType>('free');
    const [credits, setCredits] = useState(0);
    const [showDailyRewards, setShowDailyRewards] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [mounted, setMounted] = useState(false);
    const [initialRender] = useState(!hasVisitedBefore);

    useEffect(() => {
        setMounted(true);
        hasVisitedBefore = true;
    }, []);

    // Apply zoom level to body for desktop app
    useEffect(() => {
        if (mounted && isDesktopApp && typeof document !== 'undefined') {
            document.body.style.zoom = `${zoomLevel}%`;
        }
    }, [zoomLevel, mounted]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setIsAuthenticated(true);

                // Check if user is blocked
                const blocked = await isUserBlocked(user.uid);
                setIsBlocked(blocked);

                // Check if session is valid (Force Logout Check)
                const isSessionValid = await checkSessionStatus(user.uid, user.metadata.lastSignInTime);
                if (!isSessionValid) {
                    // Clear force logout record so user can login again
                    await clearForceLogout(user.uid);
                    await signOut(auth);
                    toast.error('Your session has been invalidated by an admin.');
                    return;
                }

                const sub = await getUserSubscription(user.uid);
                if (sub) {
                    setCurrentPlan(sub.plan_type as PlanType);
                    setCredits(sub.credits);
                }
            } else {
                setIsAuthenticated(false);
                setIsBlocked(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleGetStarted = async () => {
        if (!isAuthenticated) {
            openAuthModal();
            return;
        }

        // Check if user is blocked before starting session
        if (auth.currentUser) {
            setCheckingBlock(true);
            try {
                const blocked = await isUserBlocked(auth.currentUser.uid);
                if (blocked) {
                    setIsBlocked(true);
                    return;
                }
            } catch (e) {
                console.error('Block check failed:', e);
            } finally {
                setCheckingBlock(false);
            }
        }

        onStartCall();
    };

    const features = [
        { icon: Mic, title: "Voice AI Assistant", desc: "Natural voice conversations with advanced AI powered by Google Gemini" },
        { icon: Brain, title: "Smart Responses", desc: "Context-aware AI that understands and remembers your conversations" },
        { icon: Image, title: "Image Generation", desc: "Create stunning images from text descriptions using AI" },
        { icon: Code, title: "Code Assistance", desc: "Get help with coding, debugging, and technical questions" },
        { icon: MessageSquare, title: "Real-time Chat", desc: "Instant text-based conversations with AI assistant" },
        { icon: Shield, title: "Secure & Private", desc: "Your data is encrypted and protected with enterprise-grade security" },
    ];

    const plans = [
        { name: "Free", price: "0", features: ["100 Credits/month", "5 min sessions", "Basic AI chat", "5 Images", "Community support"] },
        { name: "Pro", price: "199", features: ["500 Credits/month", "10 hour sessions", "Advanced AI", "25 Images", "Priority support", "Code mode"], popular: true },
        { name: "Ultra", price: "499", features: ["2000 Credits/month", "Unlimited sessions", "Premium AI", "Unlimited images", "VIP support 24/7", "All features", "Early access"] },
    ];

    return (
        <div ref={ref} className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
            <InteractiveBackground />

            {/* Hero Section - Mobile Optimized */}
            <section className="relative min-h-screen flex items-center justify-center px-4 py-16 pt-24">
                <div className="max-w-6xl mx-auto text-center w-full">
                    <motion.div
                        initial={initialRender ? { opacity: 0, y: 30 } : false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mb-6 md:mb-8"
                    >
                        {/* Powered By Badge - Claymorphic instead of Glassmorphic */}
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-card shadow-clay-sm border border-white/10 mb-6 md:mb-8 font-mono">
                            <Sparkles size={16} className="text-foreground animate-pulse" />
                            <span className="text-xs md:text-sm font-bold tracking-widest uppercase text-muted-foreground">Powered by Google Gemini AI</span>
                        </div>

                        {/* Logo for Mobile/Desktop wrapped in 3D Claymorphic Circle */}
                        <motion.div
                            initial={initialRender ? { scale: 0.8, opacity: 0 } : false}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="mb-8 md:mb-12 flex justify-center"
                        >
                            <div className="w-28 h-28 md:w-40 md:h-40 bg-card rounded-full flex items-center justify-center shadow-clay-lg border border-white/5 relative group">
                                <div className="absolute inset-0 rounded-full border border-white/10 shadow-[inset_0_4px_10px_rgba(255,255,255,0.1)] pointer-events-none"></div>
                                <img
                                    src="/vyaas-logo.png"
                                    alt="VYAAS AI"
                                    className="w-16 h-16 md:w-24 md:h-24 object-contain filter grayscale drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                        </motion.div>

                        {/* Title */}
                        <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black mb-4 md:mb-8 text-foreground tracking-tighter leading-none">
                            VYAAS AI
                        </h1>

                        {/* Subtitle */}
                        <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-muted-foreground mb-4 md:mb-6 font-semibold tracking-tight">
                            Your Intelligent AI Assistant
                        </p>

                        {/* Description - Shorter on mobile */}
                        <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground/70 max-w-lg md:max-w-3xl mx-auto mb-10 md:mb-16 px-4 font-medium">
                            Voice, chat & image generation - all in one platform
                        </p>
                    </motion.div>

                    {/* CTA Buttons - Mobile Optimized */}
                    <motion.div
                        initial={initialRender ? { opacity: 0, y: 20 } : false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex flex-col gap-4 justify-center items-center px-4"
                    >
                        {/* Main Action Buttons */}
                        <div className="flex flex-col w-full max-w-md md:max-w-none md:flex-row gap-4 md:gap-6 md:justify-center">
                            <motion.button
                                onClick={handleGetStarted}
                                disabled={checkingBlock}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98, translateY: 4 }}
                                className="relative z-10 w-full md:w-auto px-10 py-5 bg-foreground text-background font-black text-xl rounded-full shadow-[0_8px_24px_-4px_rgba(255,255,255,0.1),inset_0_2px_0_rgba(255,255,255,0.8)] border-b-[4px] border-[#999999] active:border-b-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {checkingBlock ? (
                                    <div className="flex items-center gap-3 justify-center">
                                        <div className="w-6 h-6 border-4 border-background border-t-transparent rounded-full animate-spin" />
                                        Checking...
                                    </div>
                                ) : (
                                    <span className="flex items-center justify-center gap-3">
                                        🎙️ {startButtonText}
                                    </span>
                                )}
                            </motion.button>

                            {isAuthenticated && (
                                <motion.button
                                    onClick={() => setShowDailyRewards(true)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98, translateY: 4 }}
                                    className="relative z-10 w-full md:w-auto px-10 py-5 bg-card text-foreground font-bold text-xl rounded-full shadow-[0_8px_24px_-4px_rgba(0,0,0,0.6),inset_0_2px_0_rgba(255,255,255,0.1)] border-b-[4px] border-[#0a0a0c] active:border-b-0 transition-all flex items-center gap-3 justify-center"
                                >
                                    <Gift size={24} className="text-foreground" />
                                    <span>Daily Reward</span>
                                </motion.button>
                            )}
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 w-full max-w-md md:max-w-none md:justify-center mt-2">
                            {/* Secondary Button */}
                            <button
                                onClick={() => setShowPricing(true)}
                                className="relative z-10 w-full md:w-auto px-8 py-4 bg-card text-foreground font-bold text-lg rounded-full shadow-[0_8px_24px_-4px_rgba(0,0,0,0.6),inset_0_2px_0_rgba(255,255,255,0.1)] border-b-[4px] border-[#0a0a0c] active:border-b-0 transition-all flex items-center gap-3 justify-center"
                            >
                                <Crown size={20} className="text-muted-foreground" />
                                <span>View Plans</span>
                            </button>

                            {/* Fullscreen Button */}
                            <button
                                onClick={() => {
                                    if (!document.fullscreenElement) {
                                        document.documentElement.requestFullscreen().catch(err => {
                                            toast.error('Fullscreen not supported');
                                        });
                                    } else {
                                        document.exitFullscreen();
                                    }
                                }}
                                className="relative z-10 w-full md:w-auto px-8 py-4 bg-secondary text-secondary-foreground font-bold text-lg rounded-full shadow-clay-light-sm dark:shadow-clay-sm transition-all hover:scale-105 active:scale-95 active:shadow-inner flex items-center gap-2 justify-center"
                            >
                                <Maximize2 size={20} />
                                <span>Fullscreen</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="relative z-10 py-24 px-6 bg-background">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-20"
                    >
                        <h2 className="text-5xl md:text-6xl font-black mb-6 text-foreground tracking-tighter">
                            Powerful Features
                        </h2>
                        <p className="text-2xl text-muted-foreground font-medium">Everything you need in one AI platform</p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: idx * 0.1 }}
                                whileHover={{ scale: 1.02, y: -5 }}
                                className="p-6 rounded-3xl bg-card border-none transition-all group shadow-[0_8px_24px_-4px_rgba(0,0,0,0.6),inset_0_2px_0_rgba(255,255,255,0.05)] hover:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.8),inset_0_2px_0_rgba(255,255,255,0.1)]"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                                    <feature.icon size={28} className="text-foreground" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed font-medium">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="relative z-10 py-24 px-6 bg-background">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-20"
                    >
                        <h2 className="text-5xl md:text-6xl font-black mb-6 text-foreground tracking-tighter">
                            Choose Your Plan
                        </h2>
                        <p className="text-2xl text-muted-foreground font-medium">Flexible pricing for everyone</p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {plans.map((plan, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.15 }}
                                whileHover={{ scale: 1.05 }}
                                className={`relative p-8 rounded-[2.5rem] transition-all border-none ${plan.popular
                                    ? 'bg-secondary text-secondary-foreground shadow-[0_12px_40px_-4px_rgba(0,0,0,0.8),inset_0_2px_0_rgba(255,255,255,0.15)] scale-105'
                                    : 'bg-card text-foreground shadow-[0_8px_24px_-4px_rgba(0,0,0,0.6),inset_0_2px_0_rgba(255,255,255,0.05)]'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-foreground text-background px-6 py-2 rounded-full text-sm font-bold flex items-center gap-1 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                                        <Sparkles size={16} fill="currentColor" /> POPULAR
                                    </div>
                                )}
                                <h3 className="text-3xl font-extrabold mb-4 tracking-tight">{plan.name}</h3>
                                <div className="flex items-baseline gap-2 mb-8">
                                    <span className="text-5xl font-black">₹{plan.price}</span>
                                    <span className="text-muted-foreground font-medium text-lg">/month</span>
                                </div>
                                <ul className="space-y-4 mb-4">
                                    {plan.features.map((feature, fIdx) => (
                                        <li key={fIdx} className="flex items-start gap-3 text-muted-foreground">
                                            <Zap size={20} className="text-foreground mt-1 flex-shrink-0" fill="currentColor" />
                                            <span className="font-medium text-[1.1rem]">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="text-center mt-16"
                    >
                        <motion.button
                            onClick={() => setShowPricing(true)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98, translateY: 4 }}
                            className="relative z-10 px-12 py-5 bg-foreground text-background font-black text-xl rounded-full shadow-[0_8px_24px_-4px_rgba(255,255,255,0.1),inset_0_2px_0_rgba(255,255,255,0.8)] border-b-[4px] border-[#999999] active:border-b-0 transition-all"
                        >
                            Get Started Now
                        </motion.button>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="relative z-10 py-24 px-6 bg-background">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { icon: Users, value: "10K+", label: "Active Users" },
                            { icon: MessageSquare, value: "1M+", label: "Conversations" },
                            { icon: Image, value: "500K+", label: "Images Created" },
                            { icon: Clock, value: "24/7", label: "Availability" },
                        ].map((stat, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                className="text-center p-8 rounded-[2rem] shadow-clay-light-sm dark:shadow-clay-sm bg-card hover:shadow-clay-light-md dark:hover:shadow-clay-md transition-all"
                            >
                                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-secondary flex items-center justify-center shadow-inner">
                                    <stat.icon size={40} className="text-foreground" />
                                </div>
                                <div className="text-4xl font-black text-foreground mb-3 tracking-tighter">
                                    {stat.value}
                                </div>
                                <div className="text-muted-foreground font-bold text-lg">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-16 px-6 bg-card safe-area-bottom mobile-bottom-safe shadow-clay-light-sm dark:shadow-[0_-4px_10px_rgba(0,0,0,0.5)]">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="text-center md:text-left flex items-center gap-6">
                            <img
                                src="/vyaas-logo.png"
                                alt="VYAAS AI Logo"
                                className="w-16 h-16 object-contain filter grayscale drop-shadow-md"
                            />
                            <div>
                                <h3 className="text-3xl font-black text-foreground mb-2 tracking-tighter">
                                    VYAAS AI
                                </h3>
                                <p className="text-muted-foreground font-medium text-lg">Your Intelligent AI Assistant</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center md:items-end gap-3">
                            <p className="text-muted-foreground font-bold">© 2026 Maheshwar. All rights reserved.</p>
                            <p className="text-muted-foreground/60 text-base font-medium">Powered by Google Gemini & LiveKit</p>
                        </div>
                    </div>

                    {/* Zoom Control - Desktop Only */}
                    {mounted && isDesktopApp && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 pt-6 border-t border-white/10 flex items-center justify-center gap-4"
                        >
                            <span className="text-white/40 text-sm">Screen Zoom:</span>
                            <div className="flex items-center gap-3 bg-white/5 rounded-full px-4 py-2 border border-white/10">
                                <button
                                    onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                                    className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                                    title="Zoom Out"
                                >
                                    <ZoomOut size={18} className="text-white/70" />
                                </button>
                                <input
                                    type="range"
                                    min="50"
                                    max="150"
                                    step="5"
                                    value={zoomLevel}
                                    onChange={(e) => setZoomLevel(Number(e.target.value))}
                                    className="w-24 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
                                />
                                <span className="text-white/60 text-sm font-mono min-w-[3ch]">{zoomLevel}%</span>
                                <button
                                    onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
                                    className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                                    title="Zoom In"
                                >
                                    <ZoomIn size={18} className="text-white/70" />
                                </button>
                            </div>
                            <button
                                onClick={() => setZoomLevel(100)}
                                className="text-xs text-white/40 hover:text-white/70 transition-colors"
                            >
                                Reset
                            </button>
                        </motion.div>
                    )}
                </div>
            </footer>

            {/* Pricing Modal */}
            <PricingModal
                isOpen={showPricing}
                onClose={() => setShowPricing(false)}
                currentPlan={currentPlan}
                onSuccess={async () => {
                    if (auth.currentUser) {
                        const sub = await getUserSubscription(auth.currentUser.uid);
                        if (sub) {
                            setCurrentPlan(sub.plan_type as PlanType);
                            setCredits(sub.credits);
                        }
                    }
                }}
            />

            {/* Suspended Modal */}
            <SuspendedModal isOpen={isBlocked} />

            {/* Daily Rewards Modal */}
            <DailyRewardsModal
                isOpen={showDailyRewards}
                onClose={() => setShowDailyRewards(false)}
            />
        </div>
    );
};