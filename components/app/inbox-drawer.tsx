import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Check, Trash2, MailOpen, Mail, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface InboxDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    userId?: string;
    onNotificationChange?: () => void;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
}

export const InboxDrawer = ({ isOpen, onClose, userId, onNotificationChange }: InboxDrawerProps) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

    useEffect(() => {
        if (userId) {
            fetchNotifications();

            // Real-time subscription
            const channel = supabase
                .channel('public:user_notifications')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'user_notifications',
                    filter: `user_id=eq.${userId}`
                }, (payload) => {
                    console.log('Notification real-time event:', payload.eventType, payload);
                    if (payload.eventType === 'INSERT') {
                        setNotifications(prev => [payload.new as Notification, ...prev]);
                        toast.info('New message in Inbox!');
                        onNotificationChange?.(); // Update unread count
                    } else if (payload.eventType === 'UPDATE') {
                        setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new as Notification : n));
                        onNotificationChange?.(); // Update unread count
                    } else if (payload.eventType === 'DELETE') {
                        setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
                        onNotificationChange?.(); // Update unread count
                    }
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [userId]);

    // Refresh notifications when drawer opens
    useEffect(() => {
        if (isOpen && userId) {
            fetchNotifications();
        }
    }, [isOpen, userId]);

    const fetchNotifications = async () => {
        if (!userId) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('user_notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (data) setNotifications(data);
        setLoading(false);
    };

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        await supabase.from('user_notifications').update({ is_read: true }).eq('id', id);
        onNotificationChange?.();
    };

    const markAllRead = async () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        if (userId) {
            await supabase.from('user_notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
            onNotificationChange?.();
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.filter(n => n.id !== id));

            const { error } = await supabase.from('user_notifications').delete().eq('id', id);

            if (error) {
                console.error('Error deleting notification:', error);
                // Revert optimistic update on error
                await fetchNotifications();
                toast.error('Failed to delete notification');
                return;
            }

            // Update unread count
            onNotificationChange?.();
            toast.success('Notification deleted');
        } catch (error) {
            console.error('Delete notification exception:', error);
            await fetchNotifications();
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }).format(date);
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
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0a0a0f] border-l border-white/10 shadow-2xl z-[70] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#050505]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                                    <Bell className="text-white/80" size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Inbox</h2>
                                    <p className="text-sm text-white/40">Your notifications & updates</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <span className="text-sm text-white/60">
                                {notifications.filter(n => !n.is_read).length} unread
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={fetchNotifications}
                                    className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                                    title="Refresh"
                                >
                                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                </button>
                                <button
                                    onClick={markAllRead}
                                    className="relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-[#1a1a1a]/80 backdrop-blur-xl text-white hover:bg-[#252525]/80 rounded-lg transition-colors border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.1)] before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none"
                                >
                                    <Check size={14} /> Mark all read
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-white/40">
                                    <Bell size={48} className="mb-4 opacity-20" />
                                    <p>No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <motion.div
                                        key={notification.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`relative p-4 rounded-xl border transition-all group ${notification.is_read
                                            ? 'bg-white/5 border-white/5 text-white/60'
                                            : 'bg-[#151515] border-white/20 text-white shadow-inner shadow-white/5'
                                            }`}
                                        onClick={() => {
                                            setSelectedNotification(notification);
                                            if (!notification.is_read) markAsRead(notification.id);
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className={`font-semibold ${!notification.is_read ? 'text-white' : 'text-white/60'}`}>
                                                {notification.title}
                                            </h3>
                                            <span className="text-xs text-white/40 whitespace-nowrap ml-2">
                                                {formatDate(notification.created_at)}
                                            </span>
                                        </div>

                                        <p className="text-sm leading-relaxed opacity-90 mb-3">
                                            {notification.message}
                                        </p>

                                        <div className="flex justify-between items-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-xs px-2 py-1 rounded bg-white/10 uppercase tracking-wider">
                                                {notification.type}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(notification.id);
                                                }}
                                                className="p-1.5 hover:bg-white/10 text-white/40 hover:text-white rounded transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        {!notification.is_read && (
                                            <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]" />
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>

                    {/* Detailed Notification Modal */}
                    <AnimatePresence>
                        {selectedNotification && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setSelectedNotification(null)}
                                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
                                >
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full max-w-2xl bg-[#0a0a0f] border border-white/20 rounded-2xl shadow-2xl z-[90] max-h-[80vh] overflow-hidden"
                                    >
                                        {/* Header */}
                                        <div className="p-6 border-b border-white/10 bg-[#111]">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg border border-white/10">
                                                        <span className="font-bold text-lg">
                                                            {selectedNotification.type === 'success' ? '✅' :
                                                                selectedNotification.type === 'error' ? '❌' :
                                                                    selectedNotification.type === 'info' ? '📢' : '📧'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white">{selectedNotification.title}</h3>
                                                        <p className="text-sm text-white/60">From: VYAAS AI Admin</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedNotification(null)}
                                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-white/60">
                                                <span>To: You</span>
                                                <span>•</span>
                                                <span>{new Date(selectedNotification.created_at).toLocaleString('en-US', {
                                                    weekday: 'short',
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}</span>
                                            </div>
                                        </div>

                                        {/* Body */}
                                        <div className="p-6 overflow-y-auto max-h-[50vh]">
                                            <div className="prose prose-invert max-w-none">
                                                <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
                                                    {selectedNotification.message}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="p-4 border-t border-white/10 bg-white/5 flex justify-between items-center">
                                            <span className="text-xs px-3 py-1.5 rounded-full bg-white/10 uppercase tracking-wider text-white/60">
                                                {selectedNotification.type}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    deleteNotification(selectedNotification.id);
                                                    setSelectedNotification(null);
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/10"
                                            >
                                                <Trash2 size={16} />
                                                Delete
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
};
