'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { REWARDS, checkSpinStatus, processSpin, SpinResult } from '@/lib/events';
import { Loader2, Lock, Gift, X } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface SpinWheelProps {
    userId: string;
}

export const SpinWheel: React.FC<SpinWheelProps> = ({ userId }) => {
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [status, setStatus] = useState<SpinResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [showReward, setShowReward] = useState(false);
    const [wonReward, setWonReward] = useState<typeof REWARDS[0] | null>(null);
    const wheelRef = useRef<HTMLDivElement>(null);

    // Sound Effects (Placeholders)
    const spinSound = useRef<HTMLAudioElement | null>(null);
    const winSound = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        spinSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3'); // Ticking sound
        winSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'); // Win sound

        checkStatus();
        const interval = setInterval(checkStatus, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [userId]);

    const checkStatus = async () => {
        const result = await checkSpinStatus(userId);
        setStatus(result);
        setLoading(false);
    };

    const handleSpin = async () => {
        if (!status?.canSpin || spinning) return;

        setSpinning(true);

        // Play spin sound loop
        if (spinSound.current) {
            spinSound.current.loop = true;
            spinSound.current.play().catch(() => { });
        }

        // Start initial fast rotation animation (visual only)
        const spinDuration = 4000; // 4 seconds total spin
        const initialRotation = rotation + 1440 + Math.random() * 360; // At least 4 full spins
        setRotation(initialRotation);

        // Process result in background
        const result = await processSpin(userId);

        if (!result.success) {
            toast.error(result.error || 'Spin failed');
            setSpinning(false);
            if (spinSound.current) {
                spinSound.current.pause();
                spinSound.current.currentTime = 0;
            }
            return;
        }

        // Calculate final rotation to land on the reward
        // We need to find the index of the reward
        const rewardIndex = REWARDS.findIndex(r => r.id === result.reward.id);
        const segmentAngle = 360 / REWARDS.length;
        // Adjust rotation to land on the center of the segment
        // Note: 0 degrees is usually at 3 o'clock or 12 o'clock depending on CSS.
        // Assuming 0 is top (12 o'clock), and segments are distributed clockwise.
        // We need to calculate the specific angle for this segment.
        // Let's add a few more full rotations to the current visual rotation target
        // and land on the specific angle.

        // For simplicity in this CSS implementation:
        // We will just let it spin for a fixed time and then snap/animate to the result?
        // No, that looks fake.
        // Better: We know the result. We calculate the exact rotation needed.

        // Let's re-calculate rotation.
        // Current rotation is `rotation`.
        // We want to add e.g. 5 full spins (1800 deg) + angle to target.
        // Target angle: 
        // If index 0 is at 0-45deg. Center is 22.5deg.
        // We want the pointer (at top) to point to this segment.
        // So the wheel needs to rotate such that this segment is at the top.
        // Angle = 360 - (index * segmentAngle + segmentAngle/2)

        const targetAngle = 360 - (rewardIndex * segmentAngle + segmentAngle / 2);
        const finalRotation = rotation + 1800 + targetAngle - (rotation % 360);

        setRotation(finalRotation);

        // Wait for animation to finish
        setTimeout(() => {
            setSpinning(false);
            if (spinSound.current) {
                spinSound.current.pause();
                spinSound.current.currentTime = 0;
            }
            if (winSound.current) {
                winSound.current.play().catch(() => { });
            }

            setWonReward(result.reward);
            setShowReward(true);
            checkStatus(); // Update cooldown

            // Confetti
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });

        }, spinDuration);
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-white/50" /></div>;
    }

    return (
        <div className="relative flex flex-col items-center justify-center py-12">
            {/* Wheel Container */}
            <div className="relative w-80 h-80 md:w-96 md:h-96">
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20 w-8 h-10">
                    <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-white drop-shadow-lg"></div>
                </div>

                {/* The Wheel */}
                <div
                    className="w-full h-full rounded-full border-4 border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)] overflow-hidden relative transition-transform duration-[4000ms] cubic-bezier(0.2, 0.8, 0.2, 1)"
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
                    {REWARDS.map((reward, index) => {
                        const angle = 360 / REWARDS.length;
                        const rotate = index * angle;
                        return (
                            <div
                                key={reward.id}
                                className="absolute top-0 left-1/2 w-1/2 h-full -translate-x-1/2 origin-center"
                                style={{
                                    transform: `rotate(${rotate}deg)`,
                                    clipPath: 'polygon(0 0, 100% 0, 50% 50%)' // Creates a triangle segment
                                    // Actually clip-path on a container is tricky for pie slices.
                                    // Better approach: Conic gradient or skewed divs.
                                    // Let's use skewed divs for simplicity if segments are equal.
                                    // 8 segments = 45deg each.
                                    // Skew approach: rotate(index * 45deg) skewY(-45deg)?
                                }}
                            >
                                {/* Segment Content */}
                                <div
                                    className="w-full h-full absolute top-0 left-0"
                                    style={{
                                        backgroundColor: reward.color,
                                        transform: `rotate(${angle / 2}deg) skewY(-${90 - angle}deg)`, // Math for pie slice
                                        // This is getting complex for inline styles.
                                        // Let's use a simpler Conic Gradient background for the wheel and overlay text?
                                        // Or just use the color directly if we can.
                                    }}
                                ></div>

                                {/* Text Label - Positioned carefully */}
                                <div
                                    className="absolute top-8 left-1/2 -translate-x-1/2 text-white font-bold text-xs md:text-sm whitespace-nowrap"
                                    style={{ transform: `rotate(${angle / 2}deg)` }} // Rotate text to match segment
                                >
                                    {reward.label}
                                </div>
                            </div>
                        );
                    })}

                    {/* Better Wheel Implementation using Conic Gradient for background and absolute positioned labels */}
                    <div className="absolute inset-0 rounded-full" style={{
                        background: `conic-gradient(${REWARDS.map((r, i) => `${r.color} ${i * (100 / REWARDS.length)}% ${(i + 1) * (100 / REWARDS.length)}%`).join(', ')})`
                    }}></div>

                    {/* Labels Overlay */}
                    {REWARDS.map((reward, index) => {
                        const angle = 360 / REWARDS.length;
                        const rotate = index * angle + angle / 2; // Center of segment
                        return (
                            <div
                                key={reward.id}
                                className="absolute top-0 left-1/2 w-full h-full -translate-x-1/2 origin-center pointer-events-none"
                                style={{ transform: `rotate(${rotate}deg)` }}
                            >
                                <div className="mt-8 flex flex-col items-center">
                                    <span className="text-white font-bold text-xs drop-shadow-md rotate-180" style={{ writingMode: 'vertical-rl' }}>
                                        {reward.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Center Cap */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center z-10 border-4 border-purple-500">
                    <Gift className="w-8 h-8 text-purple-600" />
                </div>
            </div>

            {/* Spin Button / Status */}
            <div className="mt-12 text-center">
                {!status?.canSpin ? (
                    <div className="flex flex-col items-center gap-2">
                        <button
                            disabled
                            className="px-8 py-3 rounded-full bg-white/10 text-white/50 font-bold flex items-center gap-2 cursor-not-allowed"
                        >
                            <Lock className="w-4 h-4" />
                            Cooldown Active
                        </button>
                        {status?.nextSpinTime && (
                            <p className="text-sm text-white/40">
                                Next spin available at {status.nextSpinTime.toLocaleTimeString()}
                            </p>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={handleSpin}
                        disabled={spinning}
                        className={`
                            px-12 py-4 rounded-full font-bold text-lg shadow-lg transition-all transform hover:scale-105 active:scale-95
                            ${spinning
                                ? 'bg-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:shadow-orange-500/50'
                            }
                        `}
                    >
                        {spinning ? 'Spinning...' : 'SPIN NOW!'}
                    </button>
                )}
            </div>

            {/* Reward Modal */}
            <AnimatePresence>
                {showReward && wonReward && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowReward(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            className="relative bg-[#1a1a1a] border border-white/10 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl"
                        >
                            <button
                                onClick={() => setShowReward(false)}
                                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-white/60" />
                            </button>

                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <Gift className="w-10 h-10 text-white" />
                            </div>

                            <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
                            <p className="text-white/60 mb-6">You won:</p>

                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-8">
                                <span className="text-xl font-bold" style={{ color: wonReward.color }}>
                                    {wonReward.label}
                                </span>
                            </div>

                            <button
                                onClick={() => setShowReward(false)}
                                className="w-full py-3 rounded-xl bg-white text-black font-bold hover:bg-white/90 transition-colors"
                            >
                                Claim Reward
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
