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
                        className="fixed inset-0 bg-background/80 backdrop-blur-3xl z-[9998]"
                    />

                    {/* Menu Sheet */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-[300px] bg-card z-[9999] p-6 flex flex-col shadow-clay-lg"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase">Menu</h2>
                            <button onClick={() => setIsOpen(false)} className="p-2 bg-secondary rounded-full shadow-clay-light-sm dark:shadow-clay-sm transition-all active:shadow-inner">
                                <X className="w-5 h-5 text-foreground" />
                            </button>
                        </div>

                        {/* Profile Section */}
                        {user && (
                            <div className="mb-8 p-5 rounded-3xl bg-background shadow-inner">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-foreground text-background flex items-center justify-center text-xl font-black shadow-clay-light-sm dark:shadow-clay-sm">
                                        {user.full_name?.[0] || user.email?.[0] || 'U'}
                                    </div>
                                    <div className="overflow-hidden flex-1">
                                        <p className="font-bold truncate text-foreground text-lg">{user.full_name || 'User'}</p>
                                        <p className="text-sm text-muted-foreground font-medium truncate">{user.email}</p>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="flex flex-wrap gap-2 mt-4">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-secondary shadow-clay-light-sm dark:shadow-clay-sm rounded-full text-foreground">
                                        <CreditCard size={16} />
                                        <span className="font-bold text-sm">{credits}</span>
                                    </div>
                                    <TokenBalance count={user.image_tokens || 0} icon={ImageIcon} label="Image tokens" color="gray" />
                                    <TokenBalance count={user.code_tokens || 0} icon={Terminal} label="Code tokens" color="gray" />
                                </div>
                            </div>
                        )}

                        {/* Navigation Links */}
                        <div className="space-y-2 flex-1">
                            {menuItems.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={item.onClick}
                                    className="w-full flex items-center justify-between p-4 mb-3 rounded-2xl bg-card transition-all group shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5),inset_0_2px_0_rgba(255,255,255,0.05)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.6),inset_0_2px_0_rgba(255,255,255,0.1)] active:translate-y-1 border-none"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 rounded-xl bg-secondary shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] text-foreground">
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <span className="font-bold text-foreground text-lg">{item.label}</span>
                                    </div>
                                    {item.badge && (
                                        <span className="bg-foreground text-background text-xs font-bold px-2.5 py-1 rounded-full shadow-clay-light-sm dark:shadow-clay-sm">
                                            {item.badge}
                                        </span>
                                    )}
                                    {!item.badge && <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />}
                                </button>
                            ))}
                        </div>

                        {/* Settings & Footer */}
                        <div className="mt-auto space-y-3 pt-6 border-t border-border">
                            {/* Toggles */}
                            <div className="flex gap-3">
                                <button
                                    onClick={onThemeToggle}
                                    className="relative flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl bg-card text-foreground transition-all group shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5),inset_0_2px_0_rgba(255,255,255,0.05)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.6),inset_0_2px_0_rgba(255,255,255,0.1)] active:translate-y-1 border-none"
                                >
                                    {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                    <span className="text-base font-bold">Theme</span>
                                </button>
                                <button
                                    onClick={onSnowfallToggle}
                                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl transition-all shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5),inset_0_2px_0_rgba(255,255,255,0.05)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.6),inset_0_2px_0_rgba(255,255,255,0.1)] active:translate-y-1 border-none ${snowfallActive ? 'bg-foreground text-background' : 'bg-card text-foreground'}`}
                                >
                                    <Snowflake className="w-5 h-5" />
                                    <span className="text-base font-bold">Snow</span>
                                </button>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="relative w-full flex items-center justify-center gap-3 p-4 mt-3 rounded-2xl bg-card text-foreground transition-all font-bold shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5),inset_0_2px_0_rgba(255,255,255,0.05)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.6),inset_0_2px_0_rgba(255,255,255,0.1)] active:translate-y-1 border-none"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="text-lg">Log Out</span>
                            </button>

                            <p className="text-center text-sm text-muted-foreground font-bold pt-4">v2.3.0 • VYAAS AI</p>
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
                className="p-2 rounded-full hover:bg-secondary/50 transition-colors md:hidden"
            >
                <MoreVertical className="w-6 h-6 text-foreground" />
            </button>
            {mounted && createPortal(menuContent, document.body)}
        </>
    );
};
