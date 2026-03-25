import { supabase } from './supabase';
import { auth } from './firebase';

export type PlanType = 'free' | 'pro' | 'ultra';

export interface UserSubscription {
    id: string;
    email?: string;
    credits: number;
    plan_type: PlanType;
    subscription_end_date: string | null;
    image_tokens?: number;
    code_tokens?: number;
}

export interface PaymentRequest {
    id: string;
    user_id: string;
    user_email?: string;
    amount: number;
    plan_type: PlanType | null; // null if just top-up
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

export interface CreditLog {
    id: string;
    user_id: string;
    amount: number;
    reason: string;
    created_at: string;
}

export const PLANS = {
    free: { name: 'Free', price: 0, credits: 100, sessionLimit: 5 * 60 },
    pro: { name: 'Pro', price: 99, credits: 500, sessionLimit: 10 * 60 * 60 },
    ultra: { name: 'Ultra', price: 299, credits: 2000, sessionLimit: Infinity },
};

export const COSTS = {
    CHAT_MESSAGE: 2,
    IMAGE_GEN: 20,
    CODE_MODE: 20,
};

// --- Core Subscription Functions ---

export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, email, credits, plan_type, subscription_end_date, image_tokens, code_tokens')
            .eq('id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Auto-create user if missing
                if (auth.currentUser && auth.currentUser.uid === userId) {
                    const { data: newData, error: insertError } = await supabase
                        .from('users')
                        .insert([{
                            id: userId,
                            credits: 100,
                            plan_type: 'free',
                            email: auth.currentUser.email || ''
                        }])
                        .select()
                        .single();
                    return newData as UserSubscription;
                }
            }
            return { id: userId, credits: 100, plan_type: 'free', subscription_end_date: null };
        }
        return data as UserSubscription;
    } catch (e) {
        return { id: userId, credits: 100, plan_type: 'free', subscription_end_date: null };
    }
}

export async function deductCredits(userId: string, amount: number, reason: string, type?: 'image' | 'code'): Promise<boolean> {
    const sub = await getUserSubscription(userId);
    if (!sub) return false;

    // Check Tokens first
    if (type === 'image' && (sub.image_tokens || 0) > 0) {
        const { error } = await supabase
            .from('users')
            .update({ image_tokens: (sub.image_tokens || 0) - 1 })
            .eq('id', userId);

        if (!error) {
            await logCreditUsage(userId, 0, `Used Image Token: ${reason}`);
            return true;
        }
    }

    if (type === 'code' && (sub.code_tokens || 0) > 0) {
        const { error } = await supabase
            .from('users')
            .update({ code_tokens: (sub.code_tokens || 0) - 1 })
            .eq('id', userId);

        if (!error) {
            await logCreditUsage(userId, 0, `Used Code Token: ${reason}`);
            return true;
        }
    }

    // Fallback to Credits
    if (sub.credits < amount) return false;

    const { error } = await supabase
        .from('users')
        .update({ credits: sub.credits - amount })
        .eq('id', userId);

    if (!error) {
        await logCreditUsage(userId, -amount, reason);
        return true;
    }
    return false;
}

// --- Payment Request System (Admin Approval) ---

export async function createPaymentRequest(userId: string, amount: number, plan: PlanType | null): Promise<boolean> {
    try {
        console.log('Creating payment request:', { userId, amount, plan, email: auth.currentUser?.email });

        const { data, error } = await supabase
            .from('payment_requests')
            .insert([{
                user_id: userId,
                user_email: auth.currentUser?.email || '',
                amount: amount,
                plan_type: plan,
                status: 'pending'
            }])
            .select();

        if (error) {
            // Only log non-RLS errors
            if (error.code !== 'PGRST301' && error.code !== '42501') {
                console.error('Payment request error:', error);
            }
            return false;
        }

        console.log('Payment request created successfully:', data);
        return true;
    } catch (e) {
        console.error('Payment request exception:', e);
        return false;
    }
}


export async function getPendingRequests(): Promise<PaymentRequest[]> {
    const { data } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
    return data || [];
}

export async function approvePaymentRequest(requestId: string): Promise<boolean> {
    try {
        // 1. Get request details
        const { data: req } = await supabase.from('payment_requests').select('*').eq('id', requestId).single();
        if (!req) return false;

        // 2. Update User (Add credits / Change Plan)
        const sub = await getUserSubscription(req.user_id);
        const newCredits = (sub?.credits || 0) + req.amount;

        const updateData: { credits: number; plan_type?: PlanType } = { credits: newCredits };
        if (req.plan_type) updateData.plan_type = req.plan_type;

        const { error: userError } = await supabase.from('users').update(updateData).eq('id', req.user_id);
        if (userError) return false;

        // 3. Log Credit Transaction
        await logCreditUsage(req.user_id, req.amount, `Payment Approved: ${req.plan_type || 'Credits Top-up'}`);

        // 4. Record Analytics Transaction
        // Import recordTransaction dynamically to avoid circular dependency issues
        const { recordTransaction } = await import('./supabase');
        await recordTransaction({
            user_id: req.user_id,
            amount: req.plan_type === 'ultra' ? 299 : req.plan_type === 'pro' ? 99 : req.amount / 2,
            currency: 'INR',
            plan_type: req.plan_type || 'credit_pack',
            status: 'completed',
            payment_method: 'manual_approval',
            transaction_id: req.id
        });

        // 5. Mark Request as Approved
        await supabase.from('payment_requests').update({ status: 'approved' }).eq('id', requestId);

        // 5.5. Create Notification
        const { data: notifData, error: notifError } = await supabase.from('user_notifications').insert([{
            user_id: req.user_id,
            title: '✅ Payment Approved!',
            message: `🎉 Your payment request for ${req.amount} credits${req.plan_type ? ` (${req.plan_type.toUpperCase()} Plan)` : ''} has been approved! 💰 Credits have been added to your account.`,
            type: 'success',
            is_read: false
        }]).select();

        if (notifError) {
            console.error('Error creating approval notification:', notifError);
        } else {
            console.log('Payment approval notification created:', notifData);
        }

        // 6. Send Email with Invoice
        const planDetails = req.plan_type ? PLANS[req.plan_type as PlanType] : null;
        const baseAmount = planDetails ? planDetails.price : (req.amount / 2);
        const tax = Math.round(baseAmount * 0.18); // 18% GST
        const total = baseAmount + tax;

        const invoiceData = {
            invoiceNumber: `INV-${Date.now()}`,
            date: new Date().toLocaleDateString('en-IN'),
            customerName: req.user_email?.split('@')[0] || 'Customer',
            customerEmail: req.user_email || '',
            planName: planDetails ? planDetails.name : 'Credit Top-up',
            credits: req.amount,
            amount: baseAmount,
            discount: 0,
            tax: tax,
            total: total,
        };

        // Send email via API route
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
        fetch(`${backendUrl}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'approval',
                email: req.user_email,
                data: invoiceData
            })
        }).catch(err => console.error('Email send failed:', err));

        return true;
    } catch (e) {
        console.error('Approve error:', e);
        return false;
    }
}

export async function rejectPaymentRequest(requestId: string): Promise<boolean> {
    try {
        // 1. Get request details
        const { data: req } = await supabase.from('payment_requests').select('*').eq('id', requestId).single();
        if (!req) return false;

        // 2. Mark Request Rejected
        const { error } = await supabase.from('payment_requests').update({ status: 'rejected' }).eq('id', requestId);
        if (error) return false;

        // 3. Create Notification
        const { data: notifData, error: notifError } = await supabase.from('user_notifications').insert([{
            user_id: req.user_id,
            title: '❌ Payment Rejected',
            message: `⚠️ Your payment request for ${req.amount} credits${req.plan_type ? ` (${req.plan_type.toUpperCase()} Plan)` : ''} has been rejected. 📉 Please contact support for more information.`,
            type: 'error',
            is_read: false
        }]).select();

        if (notifError) {
            console.error('Error creating rejection notification:', notifError);
        } else {
            console.log('Payment rejection notification created:', notifData);
        }

        // 4. Send Rejection Email
        const planDetails = req.plan_type ? PLANS[req.plan_type as PlanType] : null;
        const baseAmount = planDetails ? planDetails.price : (req.amount / 2);

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
        fetch(`${backendUrl}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'rejection',
                email: req.user_email,
                data: {
                    customerName: req.user_email?.split('@')[0] || 'Customer',
                    amount: baseAmount,
                    reason: 'Please contact support for details.'
                }
            })
        }).catch(err => console.error('Email send failed:', err));

        return true;
    } catch (e) {
        console.error('Reject error:', e);
        return false;
    }
}

// Get user notifications
export async function getUserNotifications(userId: string) {
    const { data } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
    return data || [];
}

// Mark notification as read
export async function markNotificationRead(notificationId: string) {
    await supabase.from('user_notifications').update({ is_read: true }).eq('id', notificationId);
}

// --- Admin Tools ---

export async function manualAddCredits(userId: string, amount: number): Promise<boolean> {
    const sub = await getUserSubscription(userId);
    if (!sub) return false;

    const { error } = await supabase
        .from('users')
        .update({ credits: sub.credits + amount })
        .eq('id', userId);

    if (!error) {
        await logCreditUsage(userId, amount, 'Admin Manual Top-up');

        // Record Analytics Transaction
        const { recordTransaction } = await import('./supabase');
        await recordTransaction({
            user_id: userId,
            amount: amount / 2, // Assuming 1 credit = 0.5 INR for manual add
            currency: 'INR',
            plan_type: 'credit_pack',
            status: 'completed',
            payment_method: 'manual_admin',
            transaction_id: `manual_${Date.now()}`
        });

        return true;
    }
    return false;
}

export async function getCreditLogs(userId: string): Promise<CreditLog[]> {
    const { data } = await supabase
        .from('credit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    return data || [];
}

async function logCreditUsage(userId: string, amount: number, reason: string) {
    await supabase.from('credit_logs').insert([{ user_id: userId, amount, reason }]);
}

export function validateDiscountCode(code: string, amount: number): number {
    const normalizedCode = code.toUpperCase().trim();
    if (normalizedCode === 'VYAAS100') return 0;
    if (normalizedCode === 'VYAAS50') return Math.floor(amount * 0.5);
    if (normalizedCode === 'VYAAS25') return Math.floor(amount * 0.75);
    return amount;
}
