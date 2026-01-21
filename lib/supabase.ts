import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder-key') {
    if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ Supabase URL or Anon Key is missing! Check .env.local');
    }
    // During build, we don't crash, but runtime will fail if these are missing.
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// TYPES
// ============================================

export interface ChatHistoryItem {
    id: string;
    user_id: string;
    messages: Record<string, unknown>[];
    created_at: string;
}

export interface UserData {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string | null;
    last_login?: string;
    is_blocked?: boolean;
    call_count?: number;
    credits?: number;
    plan_type?: string;
    image_tokens?: number;
    code_tokens?: number;
    reward_streak?: number;
    total_rewards_claimed?: number;
    total_credits_used?: number;
    created_at?: string;
    updated_at?: string;
}

export interface UserNotification {
    id: string;
    user_id: string;
    message: string;
    type: 'credit_deduction' | 'credit_addition' | 'reward' | 'warning' | 'info';
    is_read: boolean;
    created_at: string;
}

export interface ActivityLog {
    id: string;
    user_id: string;
    action_type: string;
    details: Record<string, unknown>;
    credits_used: number;
    created_at: string;
}

// ============================================
// CHAT HISTORY FUNCTIONS
// ============================================

export const saveChatHistory = async (userId: string, messages: Record<string, unknown>[]) => {
    try {
        if (!userId || messages.length === 0) return;

        const { error } = await supabase
            .from('chat_history')
            .insert({
                user_id: userId,
                messages: messages,
            });

        if (error) throw error;
        console.log('Chat history saved to Supabase!');
    } catch (error) {
        console.error('Error saving chat history:', error);
    }
};

export const getUserHistory = async (userId: string): Promise<ChatHistoryItem[]> => {
    try {
        if (!userId) {
            console.log('getUserHistory: No userId provided');
            return [];
        }

        console.log('getUserHistory: Fetching for userId:', userId);
        const { data, error } = await supabase
            .from('chat_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error details:', error);
            throw error;
        }
        console.log('getUserHistory: Success, found', data?.length || 0, 'items');
        return data || [];
    } catch (error) {
        console.error('Error fetching history:', error);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        return [];
    }
};

// Delete single conversation
export const deleteUserHistory = async (userId: string, historyId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('chat_history')
            .delete()
            .eq('id', historyId)
            .eq('user_id', userId);

        if (error) throw error;

        // Log activity
        await logActivity(userId, 'history_delete', { history_id: historyId }, 0);

        console.log('History deleted:', historyId);
        return true;
    } catch (error) {
        console.error('Error deleting history:', error);
        return false;
    }
};

// Delete all user history
export const deleteAllUserHistory = async (userId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('chat_history')
            .delete()
            .eq('user_id', userId);

        if (error) throw error;

        // Log activity
        await logActivity(userId, 'history_delete_all', {}, 0);

        console.log('All history deleted for user:', userId);
        return true;
    } catch (error) {
        console.error('Error deleting all history:', error);
        return false;
    }
};

// ============================================
// USER MANAGEMENT FUNCTIONS
// ============================================

export const updateUserLogin = async (userId: string, email: string) => {
    try {
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (existingUser) {
            await supabase
                .from('users')
                .update({
                    last_login: new Date().toISOString(),
                    call_count: (existingUser.call_count || 0) + 1,
                })
                .eq('id', userId);
        } else {
            await supabase
                .from('users')
                .insert({
                    id: userId,
                    email: email,
                    last_login: new Date().toISOString(),
                    call_count: 1,
                    is_blocked: false,
                    credits: 10,
                    plan_type: 'free',
                    reward_streak: 0,
                    total_rewards_claimed: 0,
                    total_credits_used: 0
                });
        }

        // Log login activity
        await logActivity(userId, 'login', { email }, 0);
    } catch (error) {
        console.error('Error updating user login:', error);
    }
};

export const isUserBlocked = async (userId: string): Promise<boolean> => {
    try {
        // console.log('Checking block status for user:', userId);
        const { data, error } = await supabase
            .from('users')
            .select('is_blocked')
            .eq('id', userId)
            .single();

        if (error) {
            // Ignore "not found" error (PGRST116) as it just means user isn't in DB yet
            if (error.code !== 'PGRST116') {
                console.error('Error checking block status:', error);
            }
            return false;
        }

        const isBlocked = data?.is_blocked || false;
        // console.log('User block status:', isBlocked);
        return isBlocked;
    } catch (error) {
        console.error('Error checking block status:', error);
        return false;
    }
};

// ============================================
// CREDIT MANAGEMENT FUNCTIONS
// ============================================

// Remove credits from user (Admin function)
export const removeUserCredits = async (
    userId: string,
    amount: number,
    reason: string,
    adminId: string
): Promise<boolean> => {
    try {
        // Get current credits
        const { data: user } = await supabase
            .from('users')
            .select('credits')
            .eq('id', userId)
            .single();

        if (!user) return false;

        const newCredits = Math.max(0, (user.credits || 0) - amount);

        // Update credits
        await supabase
            .from('users')
            .update({ credits: newCredits })
            .eq('id', userId);

        // Log credit deduction
        await supabase
            .from('credit_logs')
            .insert({
                user_id: userId,
                amount: -amount,
                reason: reason,
                admin_id: adminId,
                action_type: 'deduction'
            });

        // Create notification for user
        await supabase
            .from('user_notifications')
            .insert({
                user_id: userId,
                message: `💸 ${amount} credits were deducted. 📉 Reason: ${reason}`,
                type: 'credit_deduction'
            });

        // Log activity
        await logActivity(userId, 'credit_deduction', { amount, reason, admin_id: adminId }, 0);

        console.log(`Removed ${amount} credits from user ${userId}`);
        return true;
    } catch (error) {
        console.error('Error removing credits:', error);
        return false;
    }
};

// Add credits to user
export const addUserCredits = async (
    userId: string,
    amount: number,
    reason: string,
    adminId?: string
): Promise<boolean> => {
    try {
        const { data: user } = await supabase
            .from('users')
            .select('credits')
            .eq('id', userId)
            .single();

        if (!user) return false;

        const newCredits = (user.credits || 0) + amount;

        await supabase
            .from('users')
            .update({ credits: newCredits })
            .eq('id', userId);

        await supabase
            .from('credit_logs')
            .insert({
                user_id: userId,
                amount: amount,
                reason: reason,
                admin_id: adminId,
                action_type: 'manual'
            });

        await supabase
            .from('user_notifications')
            .insert({
                user_id: userId,
                message: `💰 ${amount} credits were added to your account! ✨ ${reason}`,
                type: 'credit_addition'
            });

        await logActivity(userId, 'credit_addition', { amount, reason, admin_id: adminId }, 0);

        console.log(`Added ${amount} credits to user ${userId}`);
        return true;
    } catch (error) {
        console.error('Error adding credits:', error);
        return false;
    }
};

// ============================================
// NOTIFICATION FUNCTIONS
// ============================================

export const getUserNotifications = async (userId: string): Promise<UserNotification[]> => {
    try {
        const { data, error } = await supabase
            .from('user_notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
};

export const getUnreadNotifications = async (userId: string): Promise<UserNotification[]> => {
    try {
        const { data, error } = await supabase
            .from('user_notifications')
            .select('*')
            .eq('user_id', userId)
            .eq('is_read', false)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching unread notifications:', error);
        return [];
    }
};

export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('user_notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('user_notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
    }
};

// ============================================
// ACTIVITY LOGGING FUNCTIONS
// ============================================

export const logActivity = async (
    userId: string,
    actionType: string,
    details: Record<string, unknown> = {},
    creditsUsed: number = 0
): Promise<void> => {
    try {
        await supabase
            .from('activity_logs')
            .insert({
                user_id: userId,
                action_type: actionType,
                details: details,
                credits_used: creditsUsed
            });
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

export const getUserActivityLogs = async (
    userId: string,
    limit: number = 50,
    offset: number = 0
): Promise<ActivityLog[]> => {
    try {
        const { data, error } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        return [];
    }
};

export const getActivityLogsByType = async (
    userId: string,
    actionType: string
): Promise<ActivityLog[]> => {
    try {
        const { data, error } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('user_id', userId)
            .eq('action_type', actionType)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching activity logs by type:', error);
        return [];
    }
};

// ============================================
// ADMIN FUNCTIONS
// ============================================

export const getAllUsers = async (): Promise<UserData[]> => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('last_login', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
};

export const toggleUserBlock = async (userId: string, isBlocked: boolean) => {
    try {
        console.log(`Attempting to ${isBlocked ? 'block' : 'unblock'} user:`, userId);

        const { data, error } = await supabase
            .from('users')
            .update({ is_blocked: isBlocked })
            .eq('id', userId)
            .select();

        if (error) {
            console.error('Supabase error details:', error);
            throw error;
        }

        console.log('User block status updated successfully:', data);
        return { success: true, data };
    } catch (error) {
        console.error('Error toggling block status:', error);
        throw error;
    }
};

export const getAdminUserHistory = async (userId: string): Promise<ChatHistoryItem[]> => {
    return getUserHistory(userId);
};

// Admin delete history
export const adminDeleteHistory = async (
    userId: string,
    historyId: string,
    adminId: string
): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('chat_history')
            .delete()
            .eq('id', historyId)
            .eq('user_id', userId);

        if (error) throw error;

        // Log admin action
        await logActivity(userId, 'admin_history_delete', { history_id: historyId, admin_id: adminId }, 0);

        console.log('Admin deleted history:', historyId);
        return true;
    } catch (error) {
        console.error('Error admin deleting history:', error);
        return false;
    }
};

// Force logout user
export const forceLogoutUser = async (userId: string, adminId: string): Promise<boolean> => {
    try {
        // Record the force logout event
        // We use user_sessions table to store the invalidation timestamp
        const { error } = await supabase
            .from('user_sessions')
            .insert({
                user_id: userId,
                session_token: `force_logout_${Date.now()}`, // Unique token for the event
                is_active: false,
                invalidated_by: adminId
            });

        if (error) throw error;

        await logActivity(userId, 'force_logout', { admin_id: adminId }, 0);
        console.log('User force logged out:', userId);
        return true;
    } catch (error) {
        console.error('Error force logging out user:', error);
        return false;
    }
};

// Check if session is valid
export const checkSessionStatus = async (userId: string, lastSignInTime?: string): Promise<boolean> => {
    try {
        if (!lastSignInTime) return true; // Cannot validate without sign-in time

        // Get the latest force logout timestamp
        const { data, error } = await supabase
            .from('user_sessions')
            .select('invalidated_at')
            .eq('user_id', userId)
            .eq('is_active', false)
            .order('invalidated_at', { ascending: false })
            .limit(1);

        if (error) {
            // Silently fail - table might be empty or not exist yet
            return true; // Fail open to avoid blocking valid users on error
        }

        if (data && data.length > 0) {
            const latestInvalidation = new Date(data[0].invalidated_at).getTime();
            const signInTime = new Date(lastSignInTime).getTime();

            // If the latest force logout happened AFTER the user signed in, the session is invalid
            if (latestInvalidation > signInTime) {
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error('Error in checkSessionStatus:', error);
        return true;
    }
};

// Clear force logout record after user has been logged out
export const clearForceLogout = async (userId: string): Promise<boolean> => {
    try {
        // Delete all force logout records for this user
        const { error } = await supabase
            .from('user_sessions')
            .delete()
            .eq('user_id', userId)
            .eq('is_active', false);

        if (error) throw error;

        console.log('Force logout records cleared for user:', userId);
        return true;
    } catch (error) {
        console.error('Error clearing force logout:', error);
        return false;
    }
};

// ============================================
// ANALYTICS FUNCTIONS
// ============================================

export interface Transaction {
    id: string;
    user_id: string;
    amount: number;
    currency: string;
    plan_type: string;
    status: string;
    created_at: string;
    payment_method?: string;
    transaction_id?: string;
}

export interface AnalyticsSummary {
    totalRevenue: number;
    monthlyRevenue: number;
    dailyRevenue: number;
    totalTransactions: number;
}

export const getAnalyticsSummary = async (): Promise<AnalyticsSummary> => {
    try {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

        // Fetch all completed transactions
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('amount, created_at')
            .eq('status', 'completed');

        if (error) throw error;

        let totalRevenue = 0;
        let monthlyRevenue = 0;
        let dailyRevenue = 0;

        if (Array.isArray(transactions)) {

            transactions.forEach((t) => {
                const amount = Number(t.amount) || 0;
                totalRevenue += amount;

                if (t.created_at >= firstDayOfMonth) {
                    monthlyRevenue += amount;
                }

                if (t.created_at >= startOfDay) {
                    dailyRevenue += amount;
                }
            });
        }

        return {
            totalRevenue,
            monthlyRevenue,
            dailyRevenue,
            totalTransactions: transactions?.length || 0
        };
    } catch (error) {
        console.error('Error fetching analytics summary:', error);
        return { totalRevenue: 0, monthlyRevenue: 0, dailyRevenue: 0, totalTransactions: 0 };
    }
};

export const getRecentTransactions = async (limit: number = 10): Promise<Transaction[]> => {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select('*, users(email)') // Join with users to get email
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching recent transactions:', error);
        return [];
    }
};

export const recordTransaction = async (transaction: Partial<Transaction>): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('transactions')
            .insert(transaction);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error recording transaction:', error);
        return false;
    }
};
