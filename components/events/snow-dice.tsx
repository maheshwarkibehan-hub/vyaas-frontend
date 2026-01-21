"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dices, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { rollDice } from '@/lib/winter-api';
import { toast } from 'sonner';

export function SnowDice({ userId }: { userId: string }) {
    const [rolling, setRolling] = useState(false);
    const [result, setResult] = useState<number | null>(null);

    async function handleRoll() {
        if (rolling) return;
        setRolling(true);
        setResult(null);

        try {
            // Simulate roll animation
            await new Promise(r => setTimeout(r, 1000));

            const res = await rollDice(userId);
            setResult(res.roll);

            if (res.isDouble) {
                toast.success(`DOUBLE ROLL! You won ${res.reward} Snowflakes!`);
            } else {
                toast.success(`You rolled a ${res.roll} and won ${res.reward} Snowflakes!`);
            }
        } catch (e) {
            toast.error("Failed to roll dice");
        } finally {
            setRolling(false);
        }
    }

    return (
        <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border border-cyan-500/20 p-6 rounded-2xl backdrop-blur-md relative overflow-hidden flex flex-col items-center justify-center min-h-[200px]">
            <div className="absolute inset-0 bg-cyan-500/5" />

            <h3 className="text-xl font-bold text-cyan-100 mb-4 flex items-center gap-2 relative z-10">
                <Dices className="text-cyan-400" /> Snow Dice Roll
            </h3>

            <div className="relative z-10 text-center">
                <motion.div
                    animate={rolling ? { rotate: 360, scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.5, repeat: rolling ? Infinity : 0 }}
                    className="mb-6 inline-block"
                >
                    {result ? (
                        <div className="w-16 h-16 bg-white text-cyan-900 rounded-xl flex items-center justify-center text-4xl font-bold shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                            {result}
                        </div>
                    ) : (
                        <Dices className="w-16 h-16 text-cyan-300 opacity-80" />
                    )}
                </motion.div>

                <div>
                    <Button
                        onClick={handleRoll}
                        disabled={rolling}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/50"
                    >
                        {rolling ? 'Rolling...' : 'Roll Dice (12h)'}
                    </Button>
                </div>
                <p className="text-xs text-cyan-200/40 mt-2">Win Snowflakes based on roll!</p>
            </div>
        </div>
    );
}
