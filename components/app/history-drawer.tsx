'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Calendar, Clock, Trash2, User as UserIcon } from 'lucide-react';
import { User } from 'firebase/auth';
import { getUserHistory, type ChatHistoryItem } from '@/lib/supabase';

interface HistoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

export function HistoryDrawer({ isOpen, onClose, user }: HistoryDrawerProps) {
    const [history, setHistory] = useState<ChatHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [selectedConversation, setSelectedConversation] = useState<ChatHistoryItem | null>(null);

    useEffect(() => {
        if (isOpen && user?.uid) {
            fetchHistory();
        }
    }, [isOpen, user]);

    const fetchHistory = async () => {
        if (!user?.uid) return;

        setLoading(true);
        setError(null);

        try {
            const data = await getUserHistory(user.uid);
            setHistory(data);
        } catch (err) {
            console.error('Error fetching history:', err);
            setError('Could not load history.');
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0F0F11] border-l border-white/10 z-[70] shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-white/60" />
                                    Chat History
                                </h2>
                                <p className="text-xs text-white/50 mt-1">
                                    Click a conversation to see full details
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-40 space-y-3">
                                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <p className="text-white/50 text-sm">Loading history...</p>
                                </div>
                            ) : error ? (
                                <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-white/60 text-center text-sm">
                                    {error}
                                </div>
                            ) : history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-60 text-white/30 space-y-4">
                                    <MessageSquare className="w-12 h-12" />
                                    <p>No conversations yet.</p>
                                </div>
                            ) : (
                                history.map((conv, idx) => {
                                    const isExpanded = expandedId === conv.id;
                                    const messagesToShow = isExpanded ? conv.messages : conv.messages.slice(0, 2);

                                    return (
                                        <div
                                            key={conv.id || idx}
                                            onClick={() => setSelectedConversation(conv)}
                                            className={`group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all duration-200 cursor-pointer`}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2 text-xs font-medium text-white/60 bg-white/5 px-2 py-1 rounded-md">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(conv.created_at)}
                                                </div>
                                                <span className="text-xs text-white/40">
                                                    {formatTime(conv.created_at)}
                                                </span>
                                            </div>

                                            <div className="space-y-3">
                                                {messagesToShow.map((msg: any, mIdx: number) => (
                                                    <div key={mIdx} className="flex gap-2 text-sm">
                                                        <span className={msg.role === 'user' ? "text-white font-bold text-xs uppercase min-w-[3rem]" : "text-white/60 font-bold text-xs uppercase min-w-[3rem]"}>
                                                            {msg.role === 'user' ? 'You' : 'AI'}
                                                        </span>
                                                        <p className="text-white/80 text-xs leading-relaxed whitespace-pre-wrap">
                                                            {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
                                                        </p>
                                                    </div>
                                                ))}
                                                {!isExpanded && conv.messages.length > 2 && (
                                                    <p className="text-xs text-white/30 italic pt-1 text-center">
                                                        + {conv.messages.length - 2} more messages... (Click to expand)
                                                    </p>
                                                )}
                                                {isExpanded && (
                                                    <p className="text-xs text-white/30 italic pt-2 text-center border-t border-white/5 mt-2">
                                                        End of conversation
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </motion.div>

                    {/* Detailed Conversation Modal */}
                    <AnimatePresence>
                        {selectedConversation && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setSelectedConversation(null)}
                                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
                                >
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full max-w-3xl bg-[#0a0a0f] border border-white/20 rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden"
                                    >
                                        {/* Header */}
                                        <div className="p-6 border-b border-white/10 bg-white/5">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg border border-white/10">
                                                        <MessageSquare size={24} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white">Conversation Details</h3>
                                                        <p className="text-sm text-white/60">{selectedConversation.messages.length} messages</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedConversation(null)}
                                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-white/60">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} />
                                                    <span>{formatDate(selectedConversation.created_at)}</span>
                                                </div>
                                                <span>•</span>
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} />
                                                    <span>{formatTime(selectedConversation.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Messages */}
                                        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
                                            {selectedConversation.messages.map((msg: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}
                                                >
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user'
                                                        ? 'bg-white text-black'
                                                        : 'bg-[#222] text-white border border-white/20'
                                                        }`}>
                                                        {msg.role === 'user' ? (
                                                            <UserIcon size={16} />
                                                        ) : (
                                                            <span className="font-bold text-xs">AI</span>
                                                        )}
                                                    </div>
                                                    <div className={`flex-1 ${msg.role === 'user' ? 'text-left' : 'text-right'}`}>
                                                        <div className={`inline-block max-w-[80%] p-4 rounded-2xl ${msg.role === 'user'
                                                            ? 'bg-white/10 border border-white/10'
                                                            : 'bg-white/5 border border-white/10'
                                                            }`}>
                                                            <p className="text-sm font-semibold mb-1 text-white/80">
                                                                {msg.role === 'user' ? 'You' : 'VYAAS AI'}
                                                            </p>
                                                            <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
                                                                {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Footer */}
                                        <div className="p-4 border-t border-white/10 bg-white/5 flex justify-between items-center">
                                            <span className="text-xs text-white/60">
                                                Conversation ID: {selectedConversation.id.slice(0, 12)}...
                                            </span>
                                            <button
                                                onClick={() => setSelectedConversation(null)}
                                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/10"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </>
            )}
        </AnimatePresence>
    );
}
