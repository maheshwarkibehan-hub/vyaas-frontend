'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Snowflake, Brain } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { SpinWheel } from '@/components/events/spin-wheel';
import { Snowfall } from '@/components/ui/snowfall';
import { StreakCard } from '@/components/events/streak-card';
import { MysteryBox } from '@/components/events/mystery-box';
import { BossFight } from '@/components/events/boss-fight';
import { WinterMarket } from '@/components/events/winter-market';
import { SnowDice } from '@/components/events/snow-dice';
import { QuizModal } from '@/components/events/quiz-modal';
import { Button } from '@/components/ui/button';

export default function CrazyWinterPage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [showQuiz, setShowQuiz] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                router.push('/'); // Redirect if not logged in
            }
        });
        return () => unsubscribe();
    }, [router]);

    return (
        <div className="min-h-screen bg-[#0b1026] text-white relative overflow-hidden pb-20">
            {/* Always active snowfall for this page */}
            <Snowfall active={true} />

            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0b1026] to-[#0b1026]"></div>
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-900/10 to-transparent"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-8 pt-24">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-sm"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent flex items-center gap-3">
                                Crazy Winter <Snowflake className="w-8 h-8 text-blue-300 animate-spin-slow" />
                            </h1>
                            <p className="text-blue-200/60 mt-2">Complete events, earn rewards, and defeat the Yeti!</p>
                        </div>
                    </div>

                    <Button
                        onClick={() => setShowQuiz(true)}
                        className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg shadow-purple-900/50 animate-pulse"
                    >
                        <Brain className="w-4 h-4 mr-2" /> Brain Freeze Quiz
                    </Button>
                </div>

                {userId ? (
                    <div className="space-y-8">
                        {/* Row 1: Streak & Mystery Box */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <StreakCard userId={userId} />
                            <MysteryBox userId={userId} />
                        </div>

                        {/* Row 2: Boss Fight (Full Width) */}
                        <BossFight userId={userId} />

                        {/* Row 3: Spin Wheel (Center Highlight) */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-2xl shadow-blue-900/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Snowflake className="w-64 h-64 text-white" />
                            </div>
                            <div className="text-center mb-8 relative z-10">
                                <h2 className="text-2xl font-bold text-blue-100">Daily Lucky Spin</h2>
                                <p className="text-sm text-blue-200/40">Spin to win Tokens & Coupons!</p>
                            </div>
                            <SpinWheel userId={userId} />
                        </div>

                        {/* Row 4: Dice & Market */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1">
                                <SnowDice userId={userId} />
                            </div>
                            <div className="md:col-span-2">
                                <WinterMarket userId={userId} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-80 flex items-center justify-center text-white/40">
                        Loading Event Data...
                    </div>
                )}
            </div>

            {/* Quiz Modal */}
            {userId && (
                <QuizModal
                    userId={userId}
                    isOpen={showQuiz}
                    onClose={() => setShowQuiz(false)}
                />
            )}
        </div>
    );
}

