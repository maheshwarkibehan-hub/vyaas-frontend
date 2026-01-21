'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { checkSessionStatus, clearForceLogout, isUserBlocked } from '@/lib/supabase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { BlockedScreen } from './blocked-screen';

export function SessionGuard() {
    const router = useRouter();
    const [isBlocked, setIsBlocked] = useState(false);

    useEffect(() => {
        let cleanupSubscriptions: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Initial check
                await validateSession(user.uid, user.metadata.lastSignInTime);

                // Setup Real-time Subscriptions (Broadcasts)
                const { supabase } = await import('@/lib/supabase');

                const channel = supabase.channel('admin_updates')
                    .on(
                        'broadcast',
                        { event: 'user_status_change' },
                        (payload) => {
                            console.log('Received block status update:', payload);
                            if (payload.payload.userId === user.uid) {
                                setIsBlocked(payload.payload.is_blocked);
                                if (payload.payload.is_blocked) {
                                    toast.error('Your account has been blocked.');
                                } else {
                                    toast.success('Your account has been unblocked.');
                                }
                            }
                        }
                    )
                    .on(
                        'broadcast',
                        { event: 'force_logout' },
                        (payload) => {
                            console.log('Received force logout:', payload);
                            if (payload.payload.userId === user.uid) {
                                handleLogout('Your session has been invalidated by an admin.');
                            }
                        }
                    )
                    .subscribe();

                cleanupSubscriptions = () => {
                    supabase.removeChannel(channel);
                };
            } else {
                if (cleanupSubscriptions) cleanupSubscriptions();
            }
        });

        return () => {
            unsubscribeAuth();
            if (cleanupSubscriptions) cleanupSubscriptions();
        };
    }, []);

    const validateSession = async (userId: string, lastSignInTime?: string) => {
        try {
            // Check if session is valid (force logout)
            const isValid = await checkSessionStatus(userId, lastSignInTime);
            if (!isValid) {
                console.log('[SessionGuard] Session invalid - clearing force logout and signing out');
                await clearForceLogout(userId);
                await handleLogout('Your session has been invalidated by an admin.');
                return;
            }

            // Check if user is blocked
            const blocked = await isUserBlocked(userId);
            setIsBlocked(blocked);

        } catch (error) {
            console.error('Session validation error:', error);
        }
    };

    const handleLogout = async (message: string) => {
        await signOut(auth);
        toast.error(message, { duration: 10000 });
        router.push('/');
    };

    if (isBlocked) {
        return <BlockedScreen />;
    }

    return null;
}
