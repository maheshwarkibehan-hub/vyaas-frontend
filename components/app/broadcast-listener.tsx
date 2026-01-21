'use client';

import { useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { Megaphone } from 'lucide-react';

export function BroadcastListener() {
    useEffect(() => {
        let cleanup: (() => void) | undefined;

        const init = async () => {
            if (!auth.currentUser) return;

            const { supabase } = await import('@/lib/supabase');
            const userId = auth.currentUser.uid;

            // Listen for new notifications (which include broadcasts)
            const channel = supabase
                .channel(`user_notifications:${userId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'user_notifications',
                        filter: `user_id=eq.${userId}`
                    },
                    (payload) => {
                        const notification = payload.new as any;

                        // Show toast based on notification type
                        if (notification.type === 'info' || notification.type === 'warning') {
                            toast(notification.message, {
                                icon: <Megaphone className="w-5 h-5 text-blue-400" />,
                                duration: 8000, // Show longer for broadcasts
                                position: 'top-center',
                                style: {
                                    background: '#0F0F11',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white'
                                }
                            });
                        } else if (notification.type === 'credit_deduction') {
                            toast.error(notification.message, { duration: 5000 });
                        } else if (notification.type === 'credit_addition') {
                            toast.success(notification.message, { duration: 5000 });
                        }
                    }
                )
                .subscribe();

            // Listen for General Broadcasts (Real-time)
            const broadcastChannel = supabase.channel('admin_updates')
                .on(
                    'broadcast',
                    { event: 'general_broadcast' },
                    (payload) => {
                        console.log('General broadcast received:', payload);
                        const { title, message, targetUserId } = payload.payload;

                        // Check if broadcast is for everyone or specifically for this user
                        if (!targetUserId || targetUserId === userId) {
                            toast(message, {
                                description: title,
                                icon: <Megaphone className="w-5 h-5 text-pink-400" />,
                                duration: 10000,
                                position: 'top-center',
                                style: {
                                    background: '#0F0F11',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white'
                                }
                            });
                        }
                    }
                )
                .subscribe();

            cleanup = () => {
                supabase.removeChannel(channel);
                supabase.removeChannel(broadcastChannel);
            };
        };

        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                init();
            } else if (cleanup) {
                cleanup();
            }
        });

        return () => {
            unsubscribe();
            if (cleanup) cleanup();
        };
    }, []);

    return null;
}
