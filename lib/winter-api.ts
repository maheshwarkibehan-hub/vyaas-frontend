import { supabase } from '@/lib/supabase';

// --- 3. Heat Up Combo (Streak) ---
export async function getStreakStatus(userId: string) {
    const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore not found
    return data || { current_streak: 0, last_login_date: null };
}

export async function claimStreakReward(userId: string) {
    // Logic would be more complex in a real backend (checking dates), 
    // but for now we'll simulate a claim and increment.
    const { data: current } = await getStreakStatus(userId);
    const newStreak = (current.current_streak || 0) + 1;

    const { error } = await supabase
        .from('user_streaks')
        .upsert({
            user_id: userId,
            current_streak: newStreak,
            last_login_date: new Date().toISOString()
        });

    if (error) throw error;

    // Grant Reward based on streak
    let rewardMessage = `Streak Day ${newStreak}!`;
    if (newStreak === 1) await grantReward(userId, 'ice_coins', 50);
    if (newStreak === 3) await grantReward(userId, 'ice_coins', 100);
    if (newStreak === 7) await grantReward(userId, 'winter_tokens', 5);

    return { success: true, newStreak, message: rewardMessage };
}

// --- 4. Mystery Snow Box ---
export async function openMysteryBox(userId: string) {
    const random = Math.random();
    let rewardType = 'snowflakes';
    let amount = 50;

    if (random > 0.99) { rewardType = 'winter_tokens'; amount = 10; } // 1% Ultra Rare
    else if (random > 0.8) { rewardType = 'ice_coins'; amount = 100; } // 20% Rare
    else if (random > 0.5) { rewardType = 'snowflakes'; amount = 200; } // 30% Uncommon

    await grantReward(userId, rewardType, amount);
    return { rewardType, amount };
}

// --- 5. Blizzard Boss Fight ---
export async function getBossStatus() {
    const { data, error } = await supabase
        .from('boss_fights')
        .select('*')
        .eq('status', 'active')
        .single();
    if (error) return null;
    return data;
}

export async function attackBoss(userId: string, damage: number) {
    const boss = await getBossStatus();
    if (!boss) return { error: 'No active boss' };

    const newHp = Math.max(0, boss.current_hp - damage);

    // Update Boss HP
    await supabase.from('boss_fights').update({ current_hp: newHp }).eq('id', boss.id);

    // Log Damage for User
    await supabase.rpc('increment_boss_damage', { user_id_param: userId, damage_amount: damage });

    if (newHp === 0) {
        // Boss Defeated Logic (Simulated)
        await supabase.from('boss_fights').update({ status: 'defeated' }).eq('id', boss.id);
        return { defeated: true, message: 'Boss Defeated! Rewards sent.' };
    }

    return { defeated: false, newHp };
}

// --- 10. Winter Market ---
export async function getMarketItems() {
    const { data } = await supabase.from('market_items').select('*').eq('is_active', true);
    return data || [];
}

export async function purchaseItem(userId: string, itemId: string, costType: string, costAmount: number) {
    // 1. Check Balance
    const { data: user } = await supabase.from('users').select(costType).eq('id', userId).single();
    const userData = user as unknown as Record<string, number> | null;
    if (!userData || userData[costType] < costAmount) throw new Error('Insufficient funds');

    // 2. Deduct Cost
    await supabase.rpc('deduct_balance', {
        user_id_param: userId,
        column_name: costType,
        amount: costAmount
    });

    // 3. Add to Inventory
    const { error } = await supabase.from('user_inventory').insert({ user_id: userId, item_id: itemId });
    if (error) throw error;

    return { success: true };
}

// --- 11. Snow Dice Roll ---
export async function rollDice(userId: string) {
    const roll = Math.floor(Math.random() * 6) + 1;
    let reward = roll * 10; // 10 Snowflakes per dot

    // Double Roll Chance (10%)
    const isDouble = Math.random() > 0.9;
    if (isDouble) reward *= 2;

    await grantReward(userId, 'snowflakes', reward);

    // Update last roll time
    await supabase.from('users').update({ last_dice_roll: new Date().toISOString() }).eq('id', userId);

    return { roll, reward, isDouble };
}

// --- Helper: Grant Reward ---
async function grantReward(userId: string, type: string, amount: number) {
    // Using RPC would be safer, but for now direct update or simple increment logic
    // We assume an RPC 'increment_balance' exists or we do a fetch-update (less safe but works for MVP)
    /* 
       Ideally: await supabase.rpc('increment_balance', { user_id: userId, field: type, amount: amount });
    */
    // Fallback to fetch-update for now if RPC missing, but RPC is better.
    // Let's assume we use a simple RPC call that we'll add to SQL if needed, 
    // or just use the standard update for this demo.

    const { data: user } = await supabase.from('users').select(type).eq('id', userId).single();
    if (user) {
        const userData = user as unknown as Record<string, number>;
        await supabase.from('users').update({ [type]: (userData[type] || 0) + amount }).eq('id', userId);
    }
}
