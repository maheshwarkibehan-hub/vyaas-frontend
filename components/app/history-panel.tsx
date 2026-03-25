'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, User as UserIcon, MoreVertical } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { getUserHistory, type ChatHistoryItem } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export function HistoryPanel() {
    const [history, setHistory] = useState<ChatHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState<ChatHistoryItem | null>(null);
    
    // We can get user directly from firebase auth since this is mounted in session view
    const [user, setUser] = useState(auth.currentUser);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((u) => {
            setUser(u);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (user?.uid) {
            fetchHistory();
        }
    }, [user]);

    const fetchHistory = async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            const data = await getUserHistory(user.uid);
            setHistory(data);
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setLoading(false);
        }
    };

    // Extract a title from the first user message
    const getChatTitle = (conv: ChatHistoryItem) => {
        const firstUserMsg = conv.messages.find(m => m.role === 'user');
        if (!firstUserMsg) return "New Conversation";
        const content = typeof firstUserMsg.content === 'string' ? firstUserMsg.content : "Media Conversation";
        return content.length > 35 ? content.slice(0, 35) + '...' : content;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            <div className="hidden lg:flex flex-col h-full w-full bg-[#1c1c1cd9] backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-white/5 z-10 relative shadow-2xl">
                {/* Header */}
                <div className="px-6 pt-7 pb-4 shrink-0">
                    <h2 className="text-[#ececec] text-[20px] font-semibold tracking-tight">Chats</h2>
                </div>

                {/* Chat list */}
                <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-1 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-6 text-white/30 text-sm">
                            <p>No chats yet.</p>
                        </div>
                    ) : (
                        history.map((conv, idx) => {
                            return (
                                <div
                                    key={conv.id || idx}
                                    onClick={() => setSelectedConversation(conv)}
                                    className="group w-full flex items-center justify-between px-3 py-[10px] rounded-xl cursor-pointer hover:bg-[#2f2f2f] transition-colors"
                                >
                                    <span className="truncate pr-4 text-[#cecece] text-[15px] font-medium font-sans group-hover:text-white transition-colors">
                                        {getChatTitle(conv)}
                                    </span>
                                    <div className="p-1.5 hover:bg-white/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreVertical size={16} className="text-[#a0a0a0]" />
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Detailed Conversation Modal - Kept minimal and clean */}
            <AnimatePresence>
                {selectedConversation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 lg:p-12"
                        onClick={() => setSelectedConversation(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.98, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.98, opacity: 0, y: 10 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#1c1c1c] w-full max-w-4xl h-full max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/10"
                        >
                            <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-base font-semibold text-white/90">
                                        {getChatTitle(selectedConversation)}
                                    </h3>
                                    <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-md">
                                        {formatDate(selectedConversation.created_at)}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSelectedConversation(null)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                                {selectedConversation.messages.map((msg: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className={cn("flex gap-4 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto")}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                            msg.role === 'user' ? "bg-white text-black" : "bg-[#2f2f2f] text-white"
                                        )}>
                                            {msg.role === 'user' ? <UserIcon size={14} /> : <span className="text-[10px] font-black">AI</span>}
                                        </div>
                                        <div className={cn(
                                            "p-4 rounded-2xl shadow-sm text-[15px] leading-relaxed",
                                            msg.role === 'user' 
                                                ? "bg-[#2f2f2f] text-white rounded-tr-sm" 
                                                : "bg-[#1c1c1c] text-white/90 rounded-tl-sm border border-white/5"
                                        )}>
                                            <p className="whitespace-pre-wrap font-sans">
                                                {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
