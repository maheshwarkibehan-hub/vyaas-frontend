'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, GitCommit, Tag, Calendar, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const PATCHES = [
    {
        version: 'v2.4',
        date: 'December 5, 2025',
        title: 'Mobile UI Overhaul',
        description: 'Complete redesign of mobile experience with improved touch targets, better spacing, and Android navigation bar support.',
        changes: [
            'Improved Mobile Responsive Design',
            'Larger Touch Targets (48px buttons)',
            'Android Navigation Bar Safe Area Fix',
            'Better Control Bar for Phones',
            'Optimized Hero Section for Mobile',
            'Improved Font Sizes & Spacing',
            'Better Navbar with Backdrop Blur',
            'Logo Animation on Welcome Screen',
            'Darker Control Bar Background'
        ]
    },
    {
        version: 'v2.3',
        date: 'November 24, 2025',
        title: 'PWA & Mobile Experience',
        description: 'Major update focusing on mobile responsiveness and Progressive Web App capabilities.',
        changes: [
            'Added PWA support (Installable on Android/iOS)',
            'Redesigned Mobile UI & Navigation',
            'Added "What\'s New" Modal & Page',
            'Implemented Real-time Updates for Admin & User',
            'Added "Three Dots" Consolidated Menu',
            'Added Global Snowfall Effect (Bonus)',
            'Added Crazy Winter Event (Bonus)'
        ]
    },
    {
        version: 'v2.2',
        date: 'November 22, 2025',
        title: 'Admin Dashboard & Realtime',
        description: 'Introduction of the Admin Dashboard and real-time data synchronization.',
        changes: [
            'Admin Dashboard for User Management',
            'Payment Request Handling',
            'Real-time Credit Updates',
            'User Blocking & Force Logout'
        ]
    },
    {
        version: 'v2.1',
        date: 'November 20, 2025',
        title: 'LiveKit Integration',
        description: 'Integrated LiveKit for real-time voice and video AI interactions.',
        changes: [
            'LiveKit Voice Agent Integration',
            'Multimodal Vision Capabilities',
            'Enhanced Audio Visualizer',
            'Session Recording & History'
        ]
    },
    {
        version: 'v2.0',
        date: 'November 15, 2025',
        title: 'VYAAS AI Reborn',
        description: 'Complete overhaul of the UI/UX with a new "Nebula" design language.',
        changes: [
            'New "Nebula" Design System',
            'Glassmorphism UI Components',
            'Improved Authentication Flow',
            'Subscription Plans (Free, Pro, Ultra)'
        ]
    },
    {
        version: 'v1.0',
        date: 'October 1, 2025',
        title: 'Initial Release',
        description: 'First public release of VYAAS AI.',
        changes: [
            'Basic Chat Interface',
            'Gemini API Integration',
            'User Authentication',
            'Basic Credit System'
        ]
    }
];

export default function PatchesPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 pt-24 relative overflow-hidden">
            {/* Background Elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.05]"></div>
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-12">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                            Patch Notes
                        </h1>
                        <p className="text-white/40 mt-1">Version history and changelogs</p>
                    </div>
                </div>

                {/* Timeline */}
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                    {PATCHES.map((patch, index) => (
                        <motion.div
                            key={patch.version}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                        >
                            {/* Icon */}
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#0a0a0a] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                <GitCommit className="w-5 h-5 text-purple-400" />
                            </div>

                            {/* Content Card */}
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 shadow-lg backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-purple-400" />
                                        <span className="font-bold text-lg text-purple-400">{patch.version}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-white/40">
                                        <Calendar className="w-3 h-3" />
                                        <span>{patch.date}</span>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold mb-2">{patch.title}</h3>
                                <p className="text-white/60 text-sm mb-4 leading-relaxed">
                                    {patch.description}
                                </p>

                                <ul className="space-y-2">
                                    {patch.changes.map((change, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                                            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                                            <span>{change}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
