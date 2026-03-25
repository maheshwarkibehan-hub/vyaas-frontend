'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Sun, Moon, User, Clock, Bell } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut, User as FirebaseUser } from 'firebase/auth';

interface UserMenuProps {
    user: FirebaseUser | null;
    theme: 'dark' | 'light';
    onThemeChange: (theme: 'dark' | 'light') => void;
    onHistoryClick?: () => void;
    onInboxClick?: () => void;
    unreadCount?: number;
}

export function UserMenu({ user, theme, onThemeChange, onHistoryClick, onInboxClick, unreadCount = 0 }: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setIsOpen(false);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const getInitials = (email: string) => {
        return email.charAt(0).toUpperCase();
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* User Avatar Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/10 transition-all"
            >
                <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center font-bold text-sm shadow-lg border border-white/20">
                    {getInitials(user?.email || 'U')}
                </div>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-64 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100]"
                    >
                        {/* User Info */}
                        <div className="p-4 border-b border-white/10 bg-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center font-bold text-lg shadow-lg">
                                    {getInitials(user?.email || 'U')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-semibold text-sm truncate">
                                        {user?.displayName || 'User'}
                                    </p>
                                    <p className="text-white/50 text-xs truncate">
                                        {user?.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="p-2 border-b border-white/10">
                            <button
                                onClick={() => {
                                    onHistoryClick?.();
                                    setIsOpen(false);
                                }}
                                className="relative w-full flex items-center gap-3 px-3 py-2.5 bg-[#1a1a1a]/80 backdrop-blur-xl text-white hover:bg-[#252525]/80 rounded-lg transition-all group border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.1)] before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none"
                            >
                                <Clock className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium">History</span>
                            </button>
                            <button
                                onClick={() => {
                                    onInboxClick?.();
                                    setIsOpen(false);
                                }}
                                className="relative w-full flex items-center gap-3 px-3 py-2.5 bg-[#1a1a1a]/80 backdrop-blur-xl text-white hover:bg-[#252525]/80 rounded-lg transition-all group border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.1)] before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none"
                            >
                                <Bell className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium">Inbox</span>
                                {unreadCount > 0 && (
                                    <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Theme Selector */}
                        <div className="p-3 border-b border-white/10">
                            <p className="text-white/50 text-xs font-semibold mb-2 px-1">Theme</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onThemeChange('dark')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all ${theme === 'dark'
                                        ? 'bg-[#252525] text-white border border-white/30'
                                        : 'bg-[#1a1a1a] text-white/70 hover:bg-[#252525] border border-white/20'
                                        }`}
                                >
                                    <Moon className="w-4 h-4" />
                                    <span className="text-sm font-medium">Dark</span>
                                </button>
                                <button
                                    onClick={() => onThemeChange('light')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all ${theme === 'light'
                                        ? 'bg-[#252525] text-white border border-white/30'
                                        : 'bg-[#1a1a1a] text-white/70 hover:bg-[#252525] border border-white/20'
                                        }`}
                                >
                                    <Sun className="w-4 h-4" />
                                    <span className="text-sm font-medium">Light</span>
                                </button>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <div className="p-2">
                            <button
                                onClick={handleLogout}
                                className="relative w-full flex items-center gap-3 px-3 py-2.5 bg-[#1a1a1a]/80 backdrop-blur-xl text-white hover:bg-[#252525]/80 rounded-lg transition-all group border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.1)] before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none"
                            >
                                <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium">Logout</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
