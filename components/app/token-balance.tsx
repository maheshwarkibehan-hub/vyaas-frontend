'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface TokenBalanceProps {
    count: number;
    icon: LucideIcon;
    label: string;
    color: 'blue' | 'green' | 'purple' | 'gray';
}

export function TokenBalance({ count, icon: Icon, label, color }: TokenBalanceProps) {
    const colorStyles = {
        blue: 'bg-secondary text-secondary-foreground shadow-clay-light-sm dark:shadow-clay-sm border-none hover:shadow-clay-light-md dark:hover:shadow-clay-md',
        green: 'bg-secondary text-secondary-foreground shadow-clay-light-sm dark:shadow-clay-sm border-none hover:shadow-clay-light-md dark:hover:shadow-clay-md',
        purple: 'bg-secondary text-secondary-foreground shadow-clay-light-sm dark:shadow-clay-sm border-none hover:shadow-clay-light-md dark:hover:shadow-clay-md',
        gray: 'bg-secondary text-secondary-foreground shadow-clay-light-sm dark:shadow-clay-sm border-none hover:shadow-clay-light-md dark:hover:shadow-clay-md',
    };

    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all cursor-default ${colorStyles[color]}`}
            title={label}
        >
            <Icon size={14} />
            <span className="font-bold text-sm">{count}</span>
        </motion.div>
    );
}
