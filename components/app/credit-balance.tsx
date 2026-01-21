'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface CreditBalanceProps {
    credits: number;
    onClick: () => void;
}

export function CreditBalance({ credits, onClick }: CreditBalanceProps) {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full text-yellow-400 hover:bg-yellow-500/30 transition-colors"
        >
            <Zap size={14} fill="currentColor" />
            <span className="font-bold text-sm">{credits}</span>
        </motion.button>
    );
}
