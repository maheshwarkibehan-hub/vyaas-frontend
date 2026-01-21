'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface TokenBalanceProps {
    count: number;
    icon: LucideIcon;
    label: string;
    color: 'blue' | 'green' | 'purple';
}

export function TokenBalance({ count, icon: Icon, label, color }: TokenBalanceProps) {
    const colorStyles = {
        blue: 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white',
        green: 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white',
        purple: 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white',
    };

    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-full transition-colors cursor-default ${colorStyles[color]}`}
            title={label}
        >
            <Icon size={14} />
            <span className="font-bold text-sm">{count}</span>
        </motion.div>
    );
}
