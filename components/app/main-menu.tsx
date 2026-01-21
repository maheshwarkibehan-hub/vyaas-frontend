'use client';
'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MoreVertical, User, History, Inbox, CreditCard,
    Calendar, FileText, Snowflake, LogOut, Moon, Sun, X,
    ChevronRight, Gift, Terminal, Image as ImageIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { UserData } from '@/lib/supabase';
import { TokenBalance } from './token-balance';

interface MainMenuProps {
    user: UserData | null;
    credits: number;
    unreadCount: number;
    theme: 'dark' | 'light';
    onThemeToggle: () => void;
    snowfallActive: boolean;
    onSnowfallToggle: () => void;
    onHistoryClick: () => void;
    onInboxClick: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
    user, credits, unreadCount, theme, onThemeToggle,
    snowfallActive, onSnowfallToggle, onHistoryClick, onInboxClick
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const menuItems = [
        { icon: History, label: 'History', onClick: () => { onHistoryClick(); setIsOpen(false); } },
        { icon: Inbox, label: 'Inbox', badge: unreadCount > 0 ? unreadCount : undefined, onClick: () => { onInboxClick(); setIsOpen(false); } },
        { icon: Gift, label: 'Events', onClick: () => { router.push('/events'); setIsOpen(false); }, color: 'text-pink-400' },
        { icon: FileText, label: 'Patches', onClick: () => { router.push('/patches'); setIsOpen(false); } },
    ];

    const handleLogout = async () => {
        await auth.signOut();
        router.push('/');
    };

    const menuContent = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/80 backdrop-blur-[20px] z-[9998]"
                    />

                    {/* Menu Sheet */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-[300px] bg-[#050505] border-l border-white/10 z-[9999] p-6 flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold text-white tracking-widest uppercase">Menu</h2>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors border border-transparent hover:border-white/10">
                                <X className="w-5 h-5 text-white/60" />
                            </button>
                        </div>

                        {/* Profile Section */}
                        {user && (
                            <div className="mb-8 p-4 rounded-xl bg-[#111] border border-white/10 shadow-inner shadow-white/5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center text-lg font-bold border border-white/20">
                                        {user.full_name?.[0] || user.email?.[0] || 'U'}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-medium truncate text-white">{user.full_name || 'User'}</p>
                                        <p className="text-xs text-white/40 truncate">{user.email}</p>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="flex flex-wrap gap-2 mt-4">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-white/80">
                                        <CreditCard size={14} />
                                        <span className="font-bold text-sm">{credits}</span>
                                    </div>
                                    <TokenBalance count={user.image_tokens || 0} icon={ImageIcon} label="Image Tokens" color="blue" />
                                    <TokenBalance count={user.code_tokens || 0} icon={Terminal} label="Code Tokens" color="green" />
                                </div>
                            </div>
                        )}

                        {/* Navigation Links */}
                        <div className="space-y-2 flex-1">
                            {menuItems.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={item.onClick}
                                    className="relative w-full flex items-center justify-between p-3 rounded-xl bg-[#1a1a1a]/80 backdrop-blur-xl hover:bg-[#252525]/80 transition-all group border border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.1)] before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors text-white/80`}>
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <span className="font-medium text-white/80 group-hover:text-white">{item.label}</span>
                                    </div>
                                    {item.badge && (
                                        <span className="bg-white text-black text-xs font-bold px-2 py-0.5 rounded-full">
                                            {item.badge}
                                        </span>
                                    )}
                                    {!item.badge && <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60" />}
                                </button>
                            ))}
                        </div>

                        {/* Settings & Footer */}
                        <div className="mt-auto space-y-3 pt-6 border-t border-white/10">
                            {/* Toggles */}
                            <div className="flex gap-2">
                                <button
                                    onClick={onThemeToggle}
                                    className="relative flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1a1a1a]/80 backdrop-blur-xl hover:bg-[#252525]/80 text-white border border-white/30 transition-all group shadow-[0_0_15px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.1)] before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none"
                                >
                                    {theme === 'dark' ? <Moon className="w-4 h-4 text-white" /> : <Sun className="w-4 h-4 text-white" />}
                                    <span className="text-sm font-medium text-white">Theme</span>
                                </button>
                                <button
                                    onClick={onSnowfallToggle}
                                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${snowfallActive ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                                >
                                    <Snowflake className="w-4 h-4" />
                                    <span className="text-sm font-medium">Snow</span>
                                </button>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="relative w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1a1a1a]/80 backdrop-blur-xl hover:bg-[#252525]/80 text-white border border-white/30 transition-all font-medium shadow-[0_0_15px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.1)] before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="font-medium">Log Out</span>
                            </button>

                            <p className="text-center text-xs text-white/20 pt-2 font-mono">v2.3.0 • VYAAS AI</p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors md:hidden"
            >
                <MoreVertical className="w-6 h-6 text-white" />
            </button>
            {mounted && createPortal(menuContent, document.body)}
        </>
    );
};
