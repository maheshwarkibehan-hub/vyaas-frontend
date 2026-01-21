"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sword, Skull, Heart, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getBossStatus, attackBoss } from '@/lib/winter-api';
import { toast } from 'sonner';

export function BossFight({ userId }: { userId: string }) {
    const [boss, setBoss] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [attacking, setAttacking] = useState(false);

    useEffect(() => {
        loadBoss();
    }, []);

    async function loadBoss() {
        const data = await getBossStatus();
        setBoss(data);
        setLoading(false);
    }

    async function handleAttack(damage: number, type: string) {
        setAttacking(true);
        try {
            const res = await attackBoss(userId, damage);
            if (res.defeated) {
                toast.success(res.message);
                loadBoss(); // Reload to see defeated state or new boss
            } else {
                setBoss((prev: any) => ({ ...prev, current_hp: res.newHp }));
                toast.success(`Dealt ${damage} damage with ${type}!`);
            }
        } catch (e) {
            toast.error("Attack failed");
        } finally {
            setAttacking(false);
        }
    }

    if (loading) return <div className="animate-pulse h-48 bg-white/5 rounded-xl" />;
    if (!boss) return <div className="text-center text-white/40">No active boss fight.</div>;

    const hpPercent = (boss.current_hp / boss.max_hp) * 100;

    return (
        <div className="bg-gradient-to-br from-red-900/40 to-black/60 border border-red-500/20 p-6 rounded-2xl backdrop-blur-md relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500/5 animate-pulse" />

            <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-red-100 flex items-center gap-2">
                        <Skull className="text-red-500" /> {boss.name}
                    </h3>
                    <div className="text-red-200 font-mono">{boss.current_hp} / {boss.max_hp} HP</div>
                </div>

                {/* HP Bar */}
                <div className="h-4 bg-black/50 rounded-full overflow-hidden mb-8 border border-white/10">
                    <motion.div
                        className="h-full bg-gradient-to-r from-red-600 to-red-400"
                        initial={{ width: '100%' }}
                        animate={{ width: `${hpPercent}%` }}
                        transition={{ type: 'spring', stiffness: 50 }}
                    />
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2">
                    <Button
                        onClick={() => handleAttack(10, 'Math')}
                        disabled={attacking}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col h-auto py-3 gap-1"
                    >
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs">Solve Math</span>
                        <span className="text-[10px] text-white/40">-10 HP</span>
                    </Button>
                    <Button
                        onClick={() => handleAttack(15, 'Image')}
                        disabled={attacking}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col h-auto py-3 gap-1"
                    >
                        <Sword className="w-4 h-4 text-blue-400" />
                        <span className="text-xs">Gen Image</span>
                        <span className="text-[10px] text-white/40">-15 HP</span>
                    </Button>
                    <Button
                        onClick={() => handleAttack(20, 'Code')}
                        disabled={attacking}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col h-auto py-3 gap-1"
                    >
                        <Sword className="w-4 h-4 text-green-400" />
                        <span className="text-xs">Gen Code</span>
                        <span className="text-[10px] text-white/40">-20 HP</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
