import { supabase } from './supabase';

export interface SpinResult {
    canSpin: boolean;
    nextSpinTime?: Date;
    reward?: string;
    error?: string;
}

export const REWARDS = [
    { id: 'coupon_40', label: '40% OFF', type: 'coupon', value: 40, color: '#3b82f6', probability: 0.3 },
    { id: 'coupon_60', label: '60% OFF', type: 'coupon', value: 60, color: '#8b5cf6', probability: 0.2 },
    { id: 'coupon_75', label: '75% OFF', type: 'coupon', value: 75, color: '#ec4899', probability: 0.15 },
    { id: 'coupon_80', label: '80% OFF', type: 'coupon', value: 80, color: '#f43f5e', probability: 0.1 },
    { id: 'coupon_90', label: '90% OFF', type: 'coupon', value: 90, color: '#ef4444', probability: 0.05 },
    { id: 'coupon_98', label: '98% OFF', type: 'coupon', value: 98, color: '#eab308', probability: 0.01 },
    { id: 'image_token', label: 'Image Token', type: 'token', value: 1, color: '#10b981', probability: 0.1 },
    { id: 'code_token', label: 'Code Token', type: 'token', value: 1, color: '#06b6d4', probability: 0.09 },
];

export async function checkSpinStatus(userId: string): Promise<SpinResult> {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('last_spin_time')
            .eq('id', userId)
            .single();

        if (error) {
            // If user not found (PGRST116), it means they haven't spun yet (or record doesn't exist)
            // We allow them to spin, which will create/update the record later
            if (error.code === 'PGRST116') {
                return { canSpin: true };
            }
            throw error;
        }

        if (!data.last_spin_time) {
            return { canSpin: true };
        }

        const lastSpin = new Date(data.last_spin_time);
        const now = new Date();
        const diffHours = (now.getTime() - lastSpin.getTime()) / (1000 * 60 * 60);

        if (diffHours >= 5) {
            return { canSpin: true };
        } else {
            const nextSpin = new Date(lastSpin.getTime() + 5 * 60 * 60 * 1000);
            return { canSpin: false, nextSpinTime: nextSpin };
        }
    } catch (error) {
        console.error('Error checking spin status:', error);
        // Default to allowing spin if check fails (better UX than blocking)
        // But for safety, we might want to return false. 
        // However, given the "not found" issue, returning true is safer for new users.
        return { canSpin: true };
    }
}

export async function processSpin(userId: string): Promise<{ success: boolean; reward: typeof REWARDS[0]; error?: string }> {
    // Double check cooldown
    const status = await checkSpinStatus(userId);
    if (!status.canSpin) {
        return { success: false, reward: REWARDS[0], error: 'Cooldown active' };
    }

    // Determine Reward based on probability
    const rand = Math.random();
    let cumulativeProbability = 0;
    let selectedReward = REWARDS[0];

    for (const reward of REWARDS) {
        cumulativeProbability += reward.probability;
        if (rand <= cumulativeProbability) {
            selectedReward = reward;
            break;
        }
    }

    try {
        // Update DB
        const updates: any = {
            last_spin_time: new Date().toISOString()
        };

        if (selectedReward.type === 'token') {
            // Fetch current tokens first to increment
            const { data: userData } = await supabase.from('users').select('image_tokens, code_tokens').eq('id', userId).single();
            if (selectedReward.id === 'image_token') {
                updates.image_tokens = (userData?.image_tokens || 0) + 1;
            } else {
                updates.code_tokens = (userData?.code_tokens || 0) + 1;
            }
        } else if (selectedReward.type === 'coupon') {
            // For coupons, we might want to store them in a 'user_coupons' table or just notify admin/user
            // For now, we'll just log it as a notification
            await supabase.from('user_notifications').insert({
                user_id: userId,
                title: '🎉 You won a coupon!',
                message: `Congratulations! You won a ${selectedReward.label} coupon. Use code WINTER${selectedReward.value} at checkout.`,
                type: 'success'
            });
        }

        const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId);

        if (error) throw error;

        return { success: true, reward: selectedReward };

    } catch (error) {
        console.error('Error processing spin:', error);
        return { success: false, reward: REWARDS[0], error: 'Transaction failed' };
    }
}
