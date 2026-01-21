"use client";

import { useState, useEffect } from 'react';
import { ShoppingBag, Coins, Snowflake, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMarketItems, purchaseItem } from '@/lib/winter-api';
import { toast } from 'sonner';

export function WinterMarket({ userId }: { userId: string }) {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);

    useEffect(() => {
        loadItems();
    }, []);

    async function loadItems() {
        const data = await getMarketItems();
        setItems(data);
        setLoading(false);
    }

    async function handlePurchase(item: any) {
        setPurchasing(item.id);
        try {
            await purchaseItem(userId, item.id, item.cost_type, item.cost_amount);
            toast.success(`Purchased ${item.name}!`);
        } catch (e: any) {
            toast.error(e.message || "Purchase failed");
        } finally {
            setPurchasing(null);
        }
    }

    if (loading) return <div className="animate-pulse h-64 bg-white/5 rounded-xl" />;

    return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <ShoppingBag className="text-blue-300" /> Winter Market
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                    <div key={item.id} className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between group hover:border-blue-500/30 transition-colors">
                        <div>
                            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 mb-3 flex items-center justify-center">
                                {item.cost_type === 'snowflakes' ? <Snowflake className="text-blue-300" /> : <Coins className="text-yellow-400" />}
                            </div>
                            <h4 className="font-bold text-white">{item.name}</h4>
                            <p className="text-xs text-white/40 mt-1">{item.description}</p>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm font-mono text-blue-200 flex items-center gap-1">
                                {item.cost_amount}
                                <span className="text-[10px] uppercase opacity-60">{item.cost_type.replace('_', ' ')}</span>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => handlePurchase(item)}
                                disabled={!!purchasing}
                                className="bg-white/10 hover:bg-white/20 text-white border-none h-8"
                            >
                                {purchasing === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Buy'}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
