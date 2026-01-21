'use client';

import { Sparkles, Smartphone, Layout, Menu, Zap, Shield, Code, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WhatsNewPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] to-[#1a0a2e] text-white">
            {/* Header */}
            <header className="relative overflow-hidden">
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
                    className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl"
                />

                <div className="relative max-w-6xl mx-auto px-4 py-20 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-6"
                    >
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                        <span className="font-bold">Version 2.3</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400"
                    >
                        What&apos;s New in VYAAS AI
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-white/60 max-w-2xl mx-auto"
                    >
                        Discover the latest features and improvements that make VYAAS AI better than ever
                    </motion.p>
                </div>
            </header>

            {/* Features */}
            <div className="max-w-6xl mx-auto px-4 py-16 space-y-16">
                {/* PWA Feature */}
                <FeatureSection
                    icon={<Smartphone className="w-8 h-8" />}
                    title="Progressive Web App"
                    description="Install VYAAS AI as a native app on any device"
                    features={[
                        "Install on home screen like a native app",
                        "Works offline with service worker caching",
                        "Fast loading with intelligent resource caching",
                        "Beautiful app icons and splash screen",
                        "Full-screen mode without browser UI",
                        "Push notifications ready"
                    ]}
                    gradient="from-purple-600 to-blue-600"
                />

                {/* Mobile UI */}
                <FeatureSection
                    icon={<Layout className="w-8 h-8" />}
                    title="Mobile-First Design"
                    description="Perfectly optimized for all screen sizes"
                    features={[
                        "Responsive header (64px mobile → 80px desktop)",
                        "Compact control buttons (40px → 48px)",
                        "Adaptive text sizes (base → lg → xl)",
                        "Icon-only buttons on small screens",
                        "Touch-friendly 40px minimum tap targets",
                        "Flexible layouts that wrap beautifully"
                    ]}
                    gradient="from-pink-600 to-purple-600"
                />

                {/* User Menu */}
                <FeatureSection
                    icon={<Menu className="w-8 h-8" />}
                    title="Enhanced Navigation"
                    description="Cleaner interface with improved accessibility"
                    features={[
                        "History & Inbox in user dropdown menu",
                        "Notification badges for unread items",
                        "Quick access to all features",
                        "More screen space for content",
                        "Smooth animations and transitions",
                        "Better mobile experience"
                    ]}
                    gradient="from-blue-600 to-cyan-600"
                />

                {/* Performance */}
                <FeatureSection
                    icon={<Zap className="w-8 h-8" />}
                    title="Performance Boost"
                    description="Faster and smoother than ever"
                    features={[
                        "Optimized bundle size with tree shaking",
                        "Lazy loading for better initial load",
                        "Reduced JavaScript execution time",
                        "Improved animation performance",
                        "Better caching strategies",
                        "Faster page transitions"
                    ]}
                    gradient="from-yellow-600 to-orange-600"
                />

                {/* Code Quality */}
                <FeatureSection
                    icon={<Code className="w-8 h-8" />}
                    title="Code Quality"
                    description="Clean, maintainable, and type-safe"
                    features={[
                        "Fixed all TypeScript any types",
                        "Resolved ESLint warnings",
                        "Proper Firebase type imports",
                        "Custom PWA event interfaces",
                        "Clean production builds",
                        "Better developer experience"
                    ]}
                    gradient="from-green-600 to-emerald-600"
                />
            </div>

            {/* Footer */}
            <footer className="max-w-6xl mx-auto px-4 py-16 text-center border-t border-white/10">
                <p className="text-white/60 mb-4">Built with ❤️ by Maheshwar</p>
                <p className="text-white/40">© 2025 VYAAS AI. All rights reserved.</p>
            </footer>
        </div>
    );
}

interface FeatureSectionProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    features: string[];
    gradient: string;
}

function FeatureSection({ icon, title, description, features, gradient }: FeatureSectionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative group"
        >
            <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
                style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}
            />

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 md:p-12 hover:border-white/20 transition-all">
                <div className="flex items-start gap-6 mb-8">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}>
                        {icon}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-3xl md:text-4xl font-bold mb-3">{title}</h2>
                        <p className="text-lg text-white/60">{description}</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                        >
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-white/80">{feature}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
