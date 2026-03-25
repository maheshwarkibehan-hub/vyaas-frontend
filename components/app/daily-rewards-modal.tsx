'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Zap, Ticket, X, Sparkles, TrendingUp } from 'lucide-react';
import confetti from 'canvas-confetti';
import { claimDailyReward, canClaimDailyReward, type DailyReward } from '@/lib/rewards';
import { auth } from '@/lib/firebase';

interface DailyRewardsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRewardClaimed?: (reward: DailyReward) => void;
}

export const DailyRewardsModal = ({ isOpen, onClose, onRewardClaimed }: DailyRewardsModalProps) => {
    const [claiming, setClaiming] = useState(false);
    const [reward, setReward] = useState<DailyReward | null>(null);
    const [canClaim, setCanClaim] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (isOpen && auth.currentUser) {
            checkEligibility();
        }
    }, [isOpen]);

    const checkEligibility = async () => {
        if (!auth.currentUser) return;
        setChecking(true);
        const eligible = await canClaimDailyReward(auth.currentUser.uid);
        setCanClaim(eligible);
        setChecking(false);
    };

    const handleClaim = async () => {
        if (!auth.currentUser || !canClaim) return;

        setClaiming(true);
        const claimedReward = await claimDailyReward(auth.currentUser.uid);

        if (claimedReward) {
            setReward(claimedReward);
            setCanClaim(false);

            // Trigger confetti
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#ffffff', '#e5e5e5', '#a3a3a3', '#525252', '#262626']
            });

            // More confetti after delay
            setTimeout(() => {
                confetti({
                    particleCount: 50,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#ffffff', '#e5e5e5', '#a3a3a3', '#525252']
                });
                confetti({
                    particleCount: 50,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#ffffff', '#e5e5e5', '#a3a3a3', '#525252']
                });
            }, 250);

            if (onRewardClaimed) {
                onRewardClaimed(claimedReward);
            }
        }

        setClaiming(false);
    };

    const handleClose = () => {
        setReward(null);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, rotateY: -90 }}
                        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                        exit={{ scale: 0.8, opacity: 0, rotateY: 90 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative max-w-lg w-full"
                        style={{ perspective: '1000px' }}
                    >
                        {/* 3D Liquid Glass Container */}
                        <div className="relative bg-[#0a0a0a] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">
                            {/* Animated Background Blobs */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        x: [0, 50, 0],
                                        y: [0, 30, 0],
                                        rotate: [0, 180, 360]
                                    }}
                                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                                    className="absolute -top-20 -left-20 w-40 h-40 bg-white/5 rounded-full blur-3xl"
                                />
                                <motion.div
                                    animate={{
                                        scale: [1, 1.3, 1],
                                        x: [0, -30, 0],
                                        y: [0, 50, 0],
                                        rotate: [360, 180, 0]
                                    }}
                                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                                    className="absolute -bottom-20 -right-20 w-40 h-40 bg-white/5 rounded-full blur-3xl"
                                />
                                <motion.div
                                    animate={{
                                        scale: [1, 1.1, 1],
                                        x: [0, 20, 0],
                                        y: [0, -20, 0],
                                    }}
                                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                                    className="absolute top-1/2 left-1/2 w-32 h-32 bg-white/5 rounded-full blur-3xl"
                                />
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
                            >
                                <X size={20} className="text-white/60" />
                            </button>

                            {/* Content */}
                            <div className="relative z-10">
                                {checking ? (
                                    <div className="text-center py-12">
                                        <div className="w-12 h-12 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin mb-4" />
                                        <p className="text-white/60">Checking eligibility...</p>
                                    </div>
                                ) : reward ? (
                                    // Reward Claimed View
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                                    >
                                        {/* Success Icon */}
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                            className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-[#111] border border-white/20 flex items-center justify-center shadow-lg shadow-white/5"
                                        >
                                            <Sparkles size={48} className="text-white" />
                                        </motion.div>

                                        <h2 className="text-3xl font-bold text-center mb-4 text-white">
                                            Reward Claimed!
                                        </h2>

                                        {/* Reward Display */}
                                        <div className="bg-[#151515] backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6">
                                            {reward.reward_type === 'credits' ? (
                                                <div className="text-center">
                                                    <Zap size={40} className="text-white mx-auto mb-3" fill="currentColor" />
                                                    <div className="text-5xl font-bold text-white mb-2">
                                                        +{reward.reward_value}
                                                    </div>
                                                    <div className="text-white/80">Credits Added!</div>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <Ticket size={40} className="text-white mx-auto mb-3" />
                                                    <div className="text-2xl font-bold text-white mb-2">
                                                        {reward.reward_value}% OFF
                                                    </div>
                                                    <div className="text-sm text-white/60 mb-3">Coupon Code:</div>
                                                    <div className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg font-mono text-lg text-white">
                                                        {reward.coupon_code}
                                                    </div>
                                                    <div className="text-xs text-white/40 mt-2">Valid for 30 days</div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Streak Info */}
                                        <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                                            <TrendingUp size={20} className="text-white" />
                                            <span className="text-white/80">Day {reward.streak_day} Streak!</span>
                                        </div>

                                        <button
                                            onClick={handleClose}
                                            className="relative w-full px-6 py-3 bg-[#1a1a1a]/80 backdrop-blur-xl hover:bg-[#252525]/80 text-white rounded-xl font-bold border border-white/30 transition-all hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.1)] before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none"
                                        >
                                            Awesome!
                                        </button>
                                    </motion.div>
                                ) : canClaim ? (
                                    // Claim View
                                    <>
                                        {/* Gift Icon */}
                                        <motion.div
                                            animate={{
                                                rotate: [0, -10, 10, -10, 0],
                                                scale: [1, 1.1, 1]
                                            }}
                                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                            className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-[#111] border border-white/20 flex items-center justify-center shadow-lg shadow-white/5"
                                        >
                                            <Gift size={48} className="text-white" />
                                        </motion.div>

                                        <h2 className="text-3xl font-bold text-center mb-4 text-white">
                                            Daily Reward
                                        </h2>

                                        <p className="text-white/80 text-center mb-8 leading-relaxed">
                                            Claim your daily reward! You might get credits or a special discount coupon.
                                        </p>

                                        {/* Reward Options Preview */}
                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="p-4 bg-[#151515] backdrop-blur-sm border border-white/10 rounded-xl text-center">
                                                <Zap size={32} className="text-white mx-auto mb-2" fill="currentColor" />
                                                <div className="text-sm text-white/80">10-50 Credits</div>
                                            </div>
                                            <div className="p-4 bg-[#151515] backdrop-blur-sm border border-white/10 rounded-xl text-center">
                                                <Ticket size={32} className="text-white mx-auto mb-2" />
                                                <div className="text-sm text-white/80">10-30% OFF</div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleClaim}
                                            disabled={claiming}
                                            className="relative w-full px-6 py-4 bg-[#1a1a1a]/80 backdrop-blur-xl hover:bg-[#252525]/80 text-white rounded-xl font-bold text-lg border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none"
                                        >
                                            {claiming ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                                    Claiming...
                                                </>
                                            ) : (
                                                <>
                                                    <Gift size={20} />
                                                    Claim Reward
                                                </>
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    // Already Claimed View
                                    <>
                                        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-[#111] border border-white/10 flex items-center justify-center shadow-lg">
                                            <Gift size={48} className="text-white/50" />
                                        </div>

                                        <h2 className="text-2xl font-bold text-center mb-4 text-white/80">
                                            Come Back Tomorrow!
                                        </h2>

                                        <p className="text-white/60 text-center mb-8 leading-relaxed">
                                            You&apos;ve already claimed your reward today. Check back in 24 hours for your next reward!
                                        </p>

                                        <button
                                            onClick={handleClose}
                                            className="relative w-full px-6 py-3 bg-[#1a1a1a]/80 backdrop-blur-xl hover:bg-[#252525]/80 border border-white/30 rounded-xl font-bold transition-all text-white shadow-[0_0_15px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.1)] before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none"
                                        >
                                            Got it!
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
