'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Snowflake, Calendar, Clock, Gift } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EventsPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 pt-24 relative overflow-hidden">
            {/* Background Elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.05]"></div>
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
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
                            Events
                        </h1>
                        <p className="text-white/40 mt-1">Participate in limited-time events and win rewards</p>
                    </div>
                </div>

                {/* Events Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Crazy Winter Event Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-900/20 to-purple-900/20 hover:border-blue-500/50 transition-all duration-300 cursor-pointer"
                        onClick={() => router.push('/events/crazy-winter')}
                    >
                        {/* Image/Banner Placeholder */}
                        <div className="h-48 bg-gradient-to-br from-blue-600/20 to-cyan-400/20 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1483664852095-d6cc6870705d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-50 group-hover:scale-105 transition-transform duration-500"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>
                            <Snowflake className="w-16 h-16 text-white/80 relative z-10 animate-pulse" />
                        </div>

                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/20 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> ACTIVE
                                </span>
                                <span className="text-xs text-white/40 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Ends Dec 31
                                </span>
                            </div>

                            <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-400 transition-colors">Crazy Winter</h3>
                            <p className="text-white/60 text-sm mb-6">
                                Spin the wheel every 5 hours to win exclusive coupons, image tokens, and code tokens!
                            </p>

                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-white/10 border border-black flex items-center justify-center text-[10px] font-bold">
                                            <Gift className="w-4 h-4 text-yellow-400" />
                                        </div>
                                    ))}
                                </div>
                                <span className="text-xs text-white/40">+2.4k participants</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Coming Soon Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/5 opacity-50 cursor-not-allowed"
                    >
                        <div className="h-48 bg-black/40 flex items-center justify-center">
                            <span className="text-4xl font-bold text-white/10">?</span>
                        </div>
                        <div className="p-6">
                            <h3 className="text-2xl font-bold mb-2 text-white/40">Mystery Event</h3>
                            <p className="text-white/20 text-sm">
                                Coming soon...
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
