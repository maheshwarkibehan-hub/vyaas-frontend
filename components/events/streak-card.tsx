"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, CheckCircle, Lock, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStreakStatus, claimStreakReward } from '@/lib/winter-api';
import { toast } from 'sonner';

export function StreakCard({ userId }: { userId: string }) {
    const [streak, setStreak] = useState(0);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);

    useEffect(() => {
        loadStreak();
    }, [userId]);

    async function loadStreak() {
        try {
            const data = await getStreakStatus(userId);
            setStreak(data.current_streak || 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function handleClaim() {
        setClaiming(true);
        try {
            const res = await claimStreakReward(userId);
            setStreak(res.newStreak);
            toast.success(res.message);
        } catch (e) {
            toast.error("Failed to claim streak");
        } finally {
            setClaiming(false);
        }
    }

    if (loading) return <div className="animate-pulse h-32 bg-white/5 rounded-xl" />;

    return (
        <div className="bg-gradient-to-br from-orange-900/40 to-red-900/40 border border-orange-500/20 p-6 rounded-2xl backdrop-blur-md relative overflow-hidden group">
            <div className="absolute inset-0 bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors" />

            <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-orange-100 flex items-center gap-2">
                        <Flame className="text-orange-500 fill-orange-500 animate-pulse" />
                        Heat Up Combo
                    </h3>
                    <span className="text-orange-200/60 text-sm">Day {streak} / 7</span>
                </div>

                <div className="flex justify-between gap-2 mb-6">
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                        <div key={day} className={`flex-1 h-2 rounded-full transition-all ${day <= streak ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-white/10'}`} />
                    ))}
                </div>

                <div className="flex justify-between items-center">
                    <div className="text-sm text-orange-200/80">
                        Next Reward: <span className="text-white font-bold">{streak < 7 ? 'Ice Coins' : 'Premium Token'}</span>
                    </div>
                    <Button
                        onClick={handleClaim}
                        disabled={claiming}
                        className="bg-orange-600 hover:bg-orange-500 text-white border-none shadow-lg shadow-orange-900/50"
                    >
                        {claiming ? 'Claiming...' : 'Keep Streak 🔥'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
