import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Custom hook for admin real-time updates
 * Subscribes to payment_requests and users table changes
 */
export function useAdminRealtime(
    isAdmin: boolean,
    onDataChange: () => void
) {
    useEffect(() => {
        if (!isAdmin) return;

        const setupRealtime = async () => {
            const { supabase } = await import('@/lib/supabase');

            // Subscribe to payment_requests changes
            const paymentRequestsChannel = supabase
                .channel('admin_payment_requests')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'payment_requests'
                    },
                    (payload) => {
                        console.log('Payment request changed:', payload);
                        onDataChange();

                        if (payload.eventType === 'INSERT') {
                            toast.info('New payment request received!', {
                                duration: 5000,
                            });
                        }
                    }
                )
                .subscribe();

            // Subscribe to users table changes
            const usersChannel = supabase
                .channel('admin_users')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'users'
                    },
                    (payload) => {
                        console.log('User updated:', payload);
                        onDataChange();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(paymentRequestsChannel);
                supabase.removeChannel(usersChannel);
            };
        };

        const cleanup = setupRealtime();
        return () => {
            cleanup.then(fn => fn?.());
        };
    }, [isAdmin, onDataChange]);
}
