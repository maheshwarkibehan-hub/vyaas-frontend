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
import { Crown, Zap, Sparkles, Code, Image, MessageSquare, Shield, Clock, Users, Mic, Brain, Rocket, Gift, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';

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
        className="p-6 rounded-2xl bg-[#1a1a1a] border border-white/15 hover:border-white/30 transition-all group shadow-sm hover:shadow-md"
    >
        <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
            <Icon size={28} className="text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-white/60 leading-relaxed font-light">{desc}</p>
    </motion.div>
);

const PlanCard = ({ name, price, features, popular, delay }: { name: string, price: string, features: string[], popular?: boolean, delay: number }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        whileHover={{ scale: 1.02 }}
        className={`relative p-8 rounded-3xl backdrop-blur-md transition-all ${popular
            ? 'bg-[#1f1f1f] border border-white/30 shadow-xl shadow-white/5'
            : 'bg-[#141414] border border-white/10 hover:border-white/20'
            }`}
    >
        {popular && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg border border-white/10">
                <Sparkles size={14} fill="currentColor" /> POPULAR
            </div>
        )}
        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">{name}</h3>
        <div className="flex items-baseline gap-2 mb-6">
            <span className="text-4xl font-bold text-white">₹{price}</span>
            <span className="text-white/40 font-light">/month</span>
        </div>
        <ul className="space-y-3 mb-6">
            {features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-white/70">
                    <Zap size={16} className="text-white mt-1 flex-shrink-0" fill="currentColor" />
                    <span className="font-light">{feature}</span>
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

    // Apply zoom level to body for desktop app
    useEffect(() => {
        if (isDesktopApp && typeof document !== 'undefined') {
            document.body.style.zoom = `${zoomLevel}%`;
        }
    }, [zoomLevel]);

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
        <div ref={ref} className="min-h-screen bg-[#0d0d0d] text-white relative">
            {/* Background Effects - Subtle Monochrome */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-green/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Hero Section - Mobile Optimized */}
            <section className="relative min-h-screen flex items-center justify-center px-4 py-16 pt-24">
                <div className="max-w-6xl mx-auto text-center w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mb-6 md:mb-8"
                    >
                        {/* Powered By Badge */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-4 md:mb-6">
                            <Sparkles size={14} className="text-neon-green" />
                            <span className="text-xs md:text-sm font-medium text-white/80">Powered by Google Gemini AI</span>
                        </div>

                        {/* Logo for Mobile */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="mb-4 md:mb-6"
                        >
                            <img
                                src="/vyaas-logo.png"
                                alt="VYAAS AI"
                                className="w-20 h-20 md:w-28 md:h-28 mx-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                            />
                        </motion.div>

                        {/* Title */}
                        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-3 md:mb-6 text-white tracking-tighter leading-tight">
                            VYAAS AI
                        </h1>

                        {/* Subtitle */}
                        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/60 mb-2 md:mb-4 font-light tracking-wide">
                            Your Intelligent AI Assistant
                        </p>

                        {/* Description - Shorter on mobile */}
                        <p className="text-sm sm:text-base md:text-lg text-white/40 max-w-lg md:max-w-2xl mx-auto mb-8 md:mb-12 px-2">
                            Voice, chat & image generation - all in one platform
                        </p>
                    </motion.div>

                    {/* CTA Buttons - Mobile Optimized */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex flex-col gap-3 justify-center items-center px-2"
                    >
                        {/* Main Action Buttons */}
                        <div className="flex flex-col w-full max-w-xs md:max-w-none md:flex-row gap-3 md:gap-4 md:justify-center">
                            <motion.button
                                onClick={handleGetStarted}
                                disabled={checkingBlock}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="relative w-full md:w-auto px-8 py-4 bg-[#1a1a1a]/80 backdrop-blur-xl hover:bg-[#252525]/80 rounded-2xl text-white font-bold text-lg border border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/10 before:to-transparent before:pointer-events-none"
                            >
                                {checkingBlock ? (
                                    <div className="flex items-center gap-2 justify-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Checking...
                                    </div>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        🎙️ {startButtonText}
                                    </span>
                                )}
                            </motion.button>

                            {isAuthenticated && (
                                <motion.button
                                    onClick={() => setShowDailyRewards(true)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="relative w-full md:w-auto px-8 py-4 bg-[#1a1a1a]/80 backdrop-blur-xl hover:bg-[#252525]/80 border border-white/30 rounded-2xl text-white font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all flex items-center gap-2 justify-center before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none"
                                >
                                    <Gift size={22} className="text-neon-green" />
                                    <span>Daily Reward</span>
                                </motion.button>
                            )}
                        </div>

                        {/* Secondary Button */}
                        <button
                            onClick={() => setShowPricing(true)}
                            className="relative w-full max-w-xs md:max-w-none md:w-auto px-8 py-3 md:py-4 bg-[#1a1a1a]/80 backdrop-blur-xl hover:bg-[#252525]/80 border border-white/30 rounded-xl font-medium text-base md:text-lg text-white hover:text-white transition-all hover:scale-105 active:scale-95 flex items-center gap-2 justify-center shadow-[0_0_15px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.1)] before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none"
                        >
                            <Crown size={18} />
                            <span>View Plans</span>
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="relative py-20 px-6 bg-[#111]/80 border-t border-white/10">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white tracking-tight">
                            Powerful Features
                        </h2>
                        <p className="text-xl text-white/40">Everything you need in one AI platform</p>
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
                                className="p-6 rounded-2xl bg-[#1a1a1a] border border-white/15 hover:border-white/30 transition-all group shadow-inner shadow-white/5"
                            >
                                <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
                                    <feature.icon size={28} className="text-white/80" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                                <p className="text-white/40 leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="relative py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white tracking-tight">
                            Choose Your Plan
                        </h2>
                        <p className="text-xl text-white/40">Flexible pricing for everyone</p>
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
                                className={`relative p-8 rounded-3xl transition-all ${plan.popular
                                    ? 'bg-[#151515] border border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.05)]'
                                    : 'bg-[#0a0a0a] border border-white/10 hover:border-white/20'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
                                        <Sparkles size={14} /> POPULAR
                                    </div>
                                )}
                                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-2 mb-6">
                                    <span className="text-4xl font-bold text-white">₹{plan.price}</span>
                                    <span className="text-white/40">/month</span>
                                </div>
                                <ul className="space-y-3 mb-6">
                                    {plan.features.map((feature, fIdx) => (
                                        <li key={fIdx} className="flex items-start gap-2 text-white/60">
                                            <Zap size={16} className="text-white mt-1 flex-shrink-0" fill="currentColor" />
                                            <span>{feature}</span>
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
                        className="text-center mt-12"
                    >
                        <button
                            onClick={() => setShowPricing(true)}
                            className="relative px-8 py-4 bg-[#1a1a1a]/80 backdrop-blur-xl hover:bg-[#252525]/80 text-white rounded-xl font-bold text-lg border border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:scale-105 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none"
                        >
                            Get Started Now
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="relative py-20 px-6 border-t border-white/5 bg-[#0a0a0a]/50">
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
                                className="text-center p-4 rounded-2xl hover:bg-white/5 transition-colors"
                            >
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#111] border border-white/10 flex items-center justify-center">
                                    <stat.icon size={32} className="text-white/80" />
                                </div>
                                <div className="text-3xl font-bold text-white mb-2 tracking-tight">
                                    {stat.value}
                                </div>
                                <div className="text-white/40 font-medium">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative py-12 px-6 border-t border-white/10 bg-black safe-area-bottom mobile-bottom-safe">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-center md:text-left flex items-center gap-4">
                            <img
                                src="/vyaas-logo.png"
                                alt="VYAAS AI Logo"
                                className="w-14 h-14 object-contain"
                            />
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1 tracking-tight">
                                    VYAAS AI
                                </h3>
                                <p className="text-white/40">Your Intelligent AI Assistant</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center md:items-end gap-2">
                            <p className="text-white/40">© 2025 Maheshwar. All rights reserved.</p>
                            <p className="text-white/20 text-sm">Powered by Google Gemini & LiveKit</p>
                        </div>
                    </div>

                    {/* Zoom Control - Desktop Only */}
                    {isDesktopApp && (
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