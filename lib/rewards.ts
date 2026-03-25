import { supabase } from './supabase';

// ============================================
// DAILY REWARDS SYSTEM
// ============================================

export interface DailyReward {
    id: string;
    user_id: string;
    reward_type: 'credits' | 'coupon';
    reward_value: number;
    coupon_code?: string;
    claimed_at: string;
    streak_day: number;
}

export interface Coupon {
    id: string;
    code: string;
    discount_percent: number;
    is_used: boolean;
    user_id?: string;
    created_at: string;
    used_at?: string;
    expires_at?: string;
}

// Generate random coupon code: VYAAS-XXXX
export const generateCouponCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'VYAAS-';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// Check if user can claim daily reward (24h cooldown)
export const canClaimDailyReward = async (userId: string): Promise<boolean> => {
    try {
        const { data: user } = await supabase
            .from('users')
            .select('last_reward_claim')
            .eq('id', userId)
            .single();

        if (!user || !user.last_reward_claim) return true;

        const lastClaim = new Date(user.last_reward_claim);
        const now = new Date();
        const hoursSinceLastClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);

        return hoursSinceLastClaim >= 24;
    } catch (error) {
        console.error('Error checking reward eligibility:', error);
        return false;
    }
};

// Generate and claim daily reward
export const claimDailyReward = async (userId: string): Promise<DailyReward | null> => {
    try {
        // Check if can claim
        const canClaim = await canClaimDailyReward(userId);
        if (!canClaim) {
            console.log('User cannot claim reward yet (24h cooldown)');
            return null;
        }

        // Get current streak
        const { data: user } = await supabase
            .from('users')
            .select('reward_streak, last_reward_claim, total_rewards_claimed')
            .eq('id', userId)
            .single() as { data: { reward_streak: number | null; last_reward_claim: string | null; total_rewards_claimed: number | null } | null; error: unknown };

        let streak = 1;
        if (user?.last_reward_claim) {
            const lastClaim = new Date(user.last_reward_claim);
            const now = new Date();
            const hoursSinceLastClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);

            // If claimed within 48 hours, continue streak
            if (hoursSinceLastClaim < 48) {
                streak = (user.reward_streak || 0) + 1;
            }
        }

        // Random reward: 70% credits, 30% coupon
        const isCredits = Math.random() < 0.7;
        let reward: DailyReward;

        if (isCredits) {
            // Credits: 10-50 based on streak
            const baseCredits = 10;
            const bonusCredits = Math.min(streak * 2, 40); // Max 40 bonus
            const credits = baseCredits + bonusCredits + Math.floor(Math.random() * 10);

            // Add credits to user
            const { data: currentUser } = await supabase
                .from('users')
                .select('credits')
                .eq('id', userId)
                .single();

            await supabase
                .from('users')
                .update({
                    credits: (currentUser?.credits || 0) + credits,
                    last_reward_claim: new Date().toISOString(),
                    reward_streak: streak,
                    total_rewards_claimed: (user?.total_rewards_claimed || 0) + 1
                })
                .eq('id', userId);

            // Log credit addition
            await supabase
                .from('credit_logs')
                .insert({
                    user_id: userId,
                    amount: credits,
                    reason: `Daily reward - Day ${streak}`,
                    action_type: 'reward'
                });

            // Create reward record
            const { data: rewardData } = await supabase
                .from('daily_rewards')
                .insert({
                    user_id: userId,
                    reward_type: 'credits',
                    reward_value: credits,
                    streak_day: streak
                })
                .select()
                .single();

            reward = rewardData!;
        } else {
            // Coupon: 10-30% discount
            const discount = 10 + Math.floor(Math.random() * 21); // 10-30%
            const couponCode = generateCouponCode();

            // Create coupon
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30); // 30 days validity

            await supabase
                .from('coupons')
                .insert({
                    code: couponCode,
                    discount_percent: discount,
                    user_id: userId,
                    expires_at: expiresAt.toISOString()
                });

            // Update user
            await supabase
                .from('users')
                .update({
                    last_reward_claim: new Date().toISOString(),
                    reward_streak: streak,
                    total_rewards_claimed: (user?.total_rewards_claimed || 0) + 1
                })
                .eq('id', userId);

            // Create reward record
            const { data: rewardData } = await supabase
                .from('daily_rewards')
                .insert({
                    user_id: userId,
                    reward_type: 'coupon',
                    reward_value: discount,
                    coupon_code: couponCode,
                    streak_day: streak
                })
                .select()
                .single();

            reward = rewardData!;
        }

        // Log activity
        await supabase
            .from('activity_logs')
            .insert({
                user_id: userId,
                action_type: 'reward_claim',
                details: { reward_type: reward.reward_type, value: reward.reward_value, streak: streak }
            });

        console.log('Daily reward claimed:', reward);
        return reward;
    } catch (error) {
        console.error('Error claiming daily reward:', error);
        return null;
    }
};

// Get user's reward history
export const getUserRewardHistory = async (userId: string): Promise<DailyReward[]> => {
    try {
        const { data, error } = await supabase
            .from('daily_rewards')
            .select('*')
            .eq('user_id', userId)
            .order('claimed_at', { ascending: false })
            .limit(30);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching reward history:', error);
        return [];
    }
};

// Validate and apply coupon
export const applyCoupon = async (code: string, userId: string): Promise<{ valid: boolean; discount: number; message: string }> => {
    try {
        const { data: coupon, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code.toUpperCase())
            .single();

        if (error || !coupon) {
            return { valid: false, discount: 0, message: 'Invalid coupon code' };
        }

        if (coupon.is_used) {
            return { valid: false, discount: 0, message: 'Coupon already used' };
        }

        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
            return { valid: false, discount: 0, message: 'Coupon expired' };
        }

        // Mark coupon as used
        await supabase
            .from('coupons')
            .update({
                is_used: true,
                used_at: new Date().toISOString()
            })
            .eq('id', coupon.id);

        // Log activity
        await supabase
            .from('activity_logs')
            .insert({
                user_id: userId,
                action_type: 'coupon_use',
                details: { code: code, discount: coupon.discount_percent }
            });

        return { valid: true, discount: coupon.discount_percent, message: `${coupon.discount_percent}% discount applied!` };
    } catch (error) {
        console.error('Error applying coupon:', error);
        return { valid: false, discount: 0, message: 'Error applying coupon' };
    }
};

// Get user's coupons
export const getUserCoupons = async (userId: string): Promise<Coupon[]> => {
    try {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('user_id', userId)
            .eq('is_used', false)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Filter out expired coupons
        const validCoupons = (data || []).filter(coupon => {
            if (!coupon.expires_at) return true;
            return new Date(coupon.expires_at) > new Date();
        });

        return validCoupons;
    } catch (error) {
        console.error('Error fetching user coupons:', error);
        return [];
    }
};
