"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openMysteryBox } from '@/lib/winter-api';
import { toast } from 'sonner';

export function MysteryBox({ userId }: { userId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reward, setReward] = useState<{ type: string, amount: number } | null>(null);

    async function handleOpen() {
        if (loading || isOpen) return;
        setLoading(true);
        try {
            const res = await openMysteryBox(userId);
            setReward({ type: res.rewardType, amount: res.amount });
            setIsOpen(true);
            toast.success(`You found ${res.amount} ${res.rewardType}!`);
        } catch (e) {
            toast.error("Failed to open box");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-gradient-to-br from-secondary/40 to-secondary/40 border border-foreground p-6 rounded-2xl backdrop-blur-md relative overflow-hidden flex flex-col items-center justify-center min-h-[200px]">
            <div className="absolute inset-0 bg-foreground" />

            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2 relative z-10">
                <Gift className="text-foreground" /> Mystery Snow Box
            </h3>

            <div className="relative z-10">
                <AnimatePresence mode="wait">
                    {!isOpen ? (
                        <motion.div
                            key="closed"
                            whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleOpen}
                            className="cursor-pointer"
                        >
                            <Gift className={`w-24 h-24 text-foreground ${loading ? 'animate-bounce' : ''}`} />
                            <div className="mt-4 text-center">
                                <Button disabled={loading} className="bg-foreground hover:bg-foreground">
                                    {loading ? 'Opening...' : 'Open Box'}
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center"
                        >
                            <Sparkles className="w-24 h-24 text-yellow-400 mx-auto animate-spin-slow" />
                            <div className="mt-4 text-2xl font-bold text-white">
                                +{reward?.amount}
                            </div>
                            <div className="text-foreground capitalize">{reward?.type.replace('_', ' ')}</div>
                            <Button
                                onClick={() => setIsOpen(false)}
                                variant="outline"
                                className="mt-4 border-white/20 text-white hover:bg-white/10"
                            >
                                Close
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
