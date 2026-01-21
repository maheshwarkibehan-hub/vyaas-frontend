'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { Shield, Users, Clock, Ban, CheckCircle, MessageSquare, X, Sun, Moon, DollarSign, Check, Minus, Plus, Activity, Trash2, LogOut, Send, Megaphone, RefreshCcw } from 'lucide-react';
import { getAllUsers, toggleUserBlock, getAdminUserHistory, removeUserCredits, addUserCredits, getUserActivityLogs, adminDeleteHistory, deleteAllUserHistory, forceLogoutUser, type UserData, type ChatHistoryItem, type ActivityLog } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getPendingRequests, approvePaymentRequest, rejectPaymentRequest, getCreditLogs, PLANS, type PaymentRequest, type CreditLog } from '@/lib/subscription';
import { toast } from 'sonner';

const ADMIN_EMAIL = 'maheshwarkibehan@gmail.com';

export default function AdminDashboard() {
    const router = useRouter();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [userHistory, setUserHistory] = useState<ChatHistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
    const [selectedUserLogs, setSelectedUserLogs] = useState<CreditLog[] | null>(null);
    const [selectedUserActivity, setSelectedUserActivity] = useState<ActivityLog[] | null>(null);

    // Broadcast State
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [broadcastTarget, setBroadcastTarget] = useState<'all' | string>('all');
    const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.classList.toggle('light', savedTheme === 'light');
        }
    }, []);

    const handleThemeChange = (newTheme: 'dark' | 'light') => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('light', newTheme === 'light');
    };

    const fetchData = useCallback(async () => {
        const fetchedUsers = await getAllUsers();
        setUsers(fetchedUsers);
        const requests = await getPendingRequests();
        setPaymentRequests(requests);
        setLoading(false);
    }, []);

    useEffect(() => {
        const checkAdmin = () => {
            if (!auth.currentUser || auth.currentUser.email !== ADMIN_EMAIL) {
                router.push('/');
                return;
            }
            fetchData();
        };
        const unsubscribe = auth.onAuthStateChanged(checkAdmin);
        return () => unsubscribe();
    }, [router, fetchData]);

    // Real-time subscriptions
    useEffect(() => {
        let cleanup: (() => void) | undefined;
        let interval: NodeJS.Timeout | undefined;

        const init = async () => {
            if (!auth.currentUser || auth.currentUser.email !== ADMIN_EMAIL) return;

            const { supabase } = await import('@/lib/supabase');

            const paymentRequestsChannel = supabase
                .channel('admin_payment_requests')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_requests' }, (payload) => {
                    console.log('Payment request change:', payload);
                    // Optimistically handle insert/delete if possible, but fetching is safer for full sync
                    // For now, we'll just refetch to be safe, but we can optimize later
                    fetchData();
                    if (payload.eventType === 'INSERT') toast.info('New payment request!');
                }).subscribe();

            const usersChannel = supabase
                .channel('admin_users')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
                    console.log('User change:', payload);
                    // Handle specific user updates without full refetch if possible
                    if (payload.eventType === 'UPDATE') {
                        setUsers(prev => prev.map(u => u.id === payload.new.id ? { ...u, ...payload.new } : u));
                    } else {
                        fetchData();
                    }
                }).subscribe();

            cleanup = () => {
                supabase.removeChannel(paymentRequestsChannel);
                supabase.removeChannel(usersChannel);
            };

            // Fallback: Poll every 5 seconds
            interval = setInterval(() => {
                fetchData();
            }, 5000);
        };

        const unsubscribe = auth.onAuthStateChanged(() => {
            init();
        });

        // Initial check if already logged in
        if (auth.currentUser) {
            init();
        }

        return () => {
            unsubscribe();
            if (cleanup) cleanup();
            if (interval) clearInterval(interval);
        };
    }, [fetchData]);

    const handleToggleBlock = async (userId: string, currentStatus: boolean) => {
        // Optimistic Update
        const originalUsers = [...users];
        setUsers(users.map(u => u.id === userId ? { ...u, is_blocked: !currentStatus } : u));

        try {
            const action = currentStatus ? 'unblock' : 'block';
            await toggleUserBlock(userId, !currentStatus);

            // Send Broadcast Signal
            const { supabase } = await import('@/lib/supabase');
            await supabase.channel('admin_updates').send({
                type: 'broadcast',
                event: 'user_status_change',
                payload: { userId, is_blocked: !currentStatus }
            });

            toast.success(`User ${action}ed successfully!`);
        } catch (err) {
            // Revert on error
            setUsers(originalUsers);
            const error = err as Error;
            toast.error(`Failed to update block status: ${error?.message}`);
        }
    };

    const handleForceLogout = async (userId: string) => {
        try {
            const success = await forceLogoutUser(userId, auth.currentUser!.uid);
            if (success) {
                // Send Broadcast Signal
                const { supabase } = await import('@/lib/supabase');
                await supabase.channel('admin_updates').send({
                    type: 'broadcast',
                    event: 'force_logout',
                    payload: { userId }
                });
                toast.success('User force logged out successfully!');
            } else {
                toast.error('Failed to force logout user');
            }
        } catch {
            toast.error('Error force logging out user');
        }
    };

    const handleRemoveCredits = async (userId: string) => {
        const amount = prompt('How many credits to remove?');
        if (!amount || isNaN(Number(amount))) return;
        const reason = prompt('Reason for credit deduction:') || 'Admin deduction';
        const numAmount = Number(amount);

        // Optimistic Update
        const originalUsers = [...users];
        setUsers(users.map(u => u.id === userId ? { ...u, credits: Math.max(0, (u.credits || 0) - numAmount) } : u));

        try {
            const success = await removeUserCredits(userId, numAmount, reason, auth.currentUser!.uid);
            if (success) {
                // Send Broadcast Signal
                const { supabase } = await import('@/lib/supabase');
                await supabase.channel('admin_updates').send({
                    type: 'broadcast',
                    event: 'credit_update',
                    payload: { userId, amount: -numAmount, reason }
                });
                toast.success(`Removed ${amount} credits successfully!`);
            } else {
                setUsers(originalUsers); // Revert
                toast.error('Failed to remove credits');
            }
        } catch (err) {
            setUsers(originalUsers); // Revert
            const error = err as Error;
            toast.error(`Error: ${error?.message || 'Unknown error'}`);
        }
    };

    const handleAddCredits = async (userId: string) => {
        const amount = prompt('How many credits to add?');
        if (!amount || isNaN(Number(amount))) return;
        const reason = prompt('Reason for credit addition:') || 'Admin bonus';
        const numAmount = Number(amount);

        // Optimistic Update
        const originalUsers = [...users];
        setUsers(users.map(u => u.id === userId ? { ...u, credits: (u.credits || 0) + numAmount } : u));

        try {
            const success = await addUserCredits(userId, numAmount, reason, auth.currentUser!.uid);
            if (success) {
                // Send Broadcast Signal
                const { supabase } = await import('@/lib/supabase');
                await supabase.channel('admin_updates').send({
                    type: 'broadcast',
                    event: 'credit_update',
                    payload: { userId, amount: numAmount, reason }
                });
                toast.success(`Added ${amount} credits successfully!`);
            } else {
                setUsers(originalUsers); // Revert
                toast.error('Failed to add credits');
            }
        } catch (error: any) {
            setUsers(originalUsers); // Revert
            toast.error(`Error: ${error?.message || 'Unknown error'}`);
        }
    };

    const handleViewActivity = async (userId: string) => {
        try {
            const logs = await getUserActivityLogs(userId, 50);
            setSelectedUserActivity(logs);
        } catch {
            toast.error('Failed to load activity logs');
        }
    };

    const handleDeleteHistory = async (userId: string, historyId: string) => {
        if (!confirm('Are you sure you want to delete this conversation?')) return;

        try {
            const success = await adminDeleteHistory(userId, historyId, auth.currentUser!.uid);
            if (success) {
                toast.success('History deleted successfully!');
                if (selectedUser) {
                    const history = await getAdminUserHistory(selectedUser.id);
                    setUserHistory(history);
                }
            } else {
                toast.error('Failed to delete history');
            }
        } catch {
            toast.error('Error deleting history');
        }
    };

    const handleDeleteAllHistory = async (userId: string) => {
        if (!confirm('Are you sure you want to delete ALL conversations for this user? This cannot be undone!')) return;

        try {
            const success = await deleteAllUserHistory(userId);
            if (success) {
                toast.success('All history deleted successfully!');
                setUserHistory([]);
            } else {
                toast.error('Failed to delete history');
            }
        } catch (error) {
            toast.error('Error deleting all history');
        }
    };

    const viewUserHistory = async (user: UserData) => {
        setSelectedUser(user);
        setHistoryLoading(true);
        const history = await getAdminUserHistory(user.id);
        setUserHistory(history);
        setHistoryLoading(false);
    };

    const handleApproveRequest = async (id: string) => {
        // Optimistic Update
        const originalRequests = [...paymentRequests];
        setPaymentRequests(prev => prev.filter(req => req.id !== id));

        const success = await approvePaymentRequest(id);
        if (success) {
            toast.success("Payment Approved!");
            // fetchData(); // Real-time listener will handle this, or we can fetch to be sure
        } else {
            setPaymentRequests(originalRequests); // Revert
            toast.error("Approval Failed");
        }
    };

    const handleRejectRequest = async (id: string) => {
        // Optimistic Update
        const originalRequests = [...paymentRequests];
        setPaymentRequests(prev => prev.filter(req => req.id !== id));

        const success = await rejectPaymentRequest(id);
        if (success) {
            toast.success("Request Rejected");
            // fetchData();
        } else {
            setPaymentRequests(originalRequests); // Revert
        }
    };

    const viewCreditLogs = async (userId: string) => {
        const logs = await getCreditLogs(userId);
        setSelectedUserLogs(logs);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const handleBroadcast = async () => {
        if (!broadcastTitle || !broadcastMessage) {
            toast.error("Title and Message are required");
            return;
        }
        setIsSendingBroadcast(true);
        try {
            // Send Broadcast Signal directly via Supabase
            const { supabase } = await import('@/lib/supabase');
            await supabase.channel('admin_updates').send({
                type: 'broadcast',
                event: 'general_broadcast',
                payload: {
                    title: broadcastTitle,
                    message: broadcastMessage,
                    targetUserId: broadcastTarget === 'all' ? null : broadcastTarget
                }
            });

            // Also call API for persistence (optional, but good for history)
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
            await fetch(`${backendUrl}/api/admin/broadcast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: broadcastTitle,
                    message: broadcastMessage,
                    targetUserId: broadcastTarget === 'all' ? null : broadcastTarget,
                    type: 'info',
                    adminEmail: 'maheshwarkibehan@gmail.com'
                })
            });

            toast.success(`Broadcast sent successfully!`);
            setBroadcastTitle('');
            setBroadcastMessage('');
            setIsBroadcastModalOpen(false);
        } catch {
            toast.error("Error sending broadcast");
        } finally {
            setIsSendingBroadcast(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8 text-purple-400" />
                        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => router.push('/admin/analytics')}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 hover:border-green-500/50 transition-all flex items-center gap-2 text-green-400"
                        >
                            <Activity className="w-4 h-4" />
                            View Analytics
                        </button>
                        <button
                            onClick={() => setIsBroadcastModalOpen(true)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 hover:border-pink-500/50 transition-all flex items-center gap-2 text-pink-400"
                        >
                            <Megaphone className="w-4 h-4" />
                            Broadcast
                        </button>
                        <button onClick={() => handleThemeChange('dark')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${theme === 'dark' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'}`}>
                            <Moon className="w-4 h-4" /><span className="text-sm font-medium">Dark</span>
                        </button>
                        <button onClick={() => handleThemeChange('light')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${theme === 'light' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'}`}>
                            <Sun className="w-4 h-4" /><span className="text-sm font-medium">Light</span>
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-2 text-white/60"
                        >
                            <LogOut className="w-4 h-4" />
                            Exit
                        </button>
                    </div>
                </div>
                <p className="text-white/50">Manage users and monitor system activity</p>
            </div>

            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2"><Users className="w-6 h-6 text-blue-400" /><h3 className="text-lg font-semibold">Total Users</h3></div>
                    <p className="text-3xl font-bold">{users.length}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2"><CheckCircle className="w-6 h-6 text-green-400" /><h3 className="text-lg font-semibold">Active Users</h3></div>
                    <p className="text-3xl font-bold">{users.filter(u => !u.is_blocked).length}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2"><Ban className="w-6 h-6 text-red-400" /><h3 className="text-lg font-semibold">Blocked Users</h3></div>
                    <p className="text-3xl font-bold">{users.filter(u => u.is_blocked).length}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2"><DollarSign className="w-6 h-6 text-yellow-400" /><h3 className="text-lg font-semibold">Pending Requests</h3></div>
                    <p className="text-3xl font-bold">{paymentRequests.length}</p>
                </div>
            </div>

            {/* Payment Requests */}
            {paymentRequests.length > 0 && (
                <div className="max-w-7xl mx-auto mb-8 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-white/10"><h2 className="text-2xl font-bold">Pending Payment Requests</h2></div>
                    <div className="p-6 space-y-4">
                        {paymentRequests.map(req => (
                            <div key={req.id} className="bg-white/5 border border-white/10 p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-bold text-lg">
                                            ₹{req.plan_type && PLANS[req.plan_type as keyof typeof PLANS] ? PLANS[req.plan_type as keyof typeof PLANS].price : req.amount / 2}
                                        </span>
                                        <span className="text-white/50 text-sm">for</span>
                                        <span className="text-yellow-400 font-mono">{req.amount} Credits</span>
                                        {req.plan_type && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full uppercase">{req.plan_type}</span>}
                                    </div>
                                    <div className="text-sm text-white/40">User: {req.user_email || req.user_id} • {new Date(req.created_at).toLocaleString()}</div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => handleRejectRequest(req.id)} className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">Reject</button>
                                    <button onClick={() => handleApproveRequest(req.id)} className="px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg font-bold transition-colors flex items-center gap-2"><Check size={16} /> Approve</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className="max-w-7xl mx-auto bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-white/10"><h2 className="text-2xl font-bold">All Users</h2></div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Credits</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Plan</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Last Login</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Call Count</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-t border-white/5 hover:bg-white/5">
                                    <td className="px-6 py-4">{user.email}</td>
                                    <td className="px-6 py-4"><span className="font-mono text-yellow-400">{user.credits || 0}</span></td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs uppercase">{user.plan_type || 'free'}</span></td>
                                    <td className="px-6 py-4 text-sm text-white/70"><div className="flex items-center gap-2"><Clock className="w-4 h-4" />{user.last_login ? formatDate(user.last_login) : 'Never'}</div></td>
                                    <td className="px-6 py-4">{user.call_count}</td>
                                    <td className="px-6 py-4">
                                        {user.is_blocked ? (
                                            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">Blocked</span>
                                        ) : (
                                            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">Active</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2 flex-wrap">
                                            <button onClick={() => viewUserHistory(user)} className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm transition-colors flex items-center gap-1"><MessageSquare className="w-3 h-3" />History</button>
                                            <button onClick={() => viewCreditLogs(user.id)} className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg text-sm transition-colors flex items-center gap-1"><Clock className="w-3 h-3" />Logs</button>
                                            <button onClick={() => handleAddCredits(user.id)} className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm transition-colors flex items-center gap-1"><Plus className="w-3 h-3" />Add</button>
                                            <button onClick={() => handleRemoveCredits(user.id)} className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-sm transition-colors flex items-center gap-1"><Minus className="w-3 h-3" />Remove</button>
                                            <button onClick={() => handleToggleBlock(user.id, user.is_blocked || false)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${user.is_blocked ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'}`}>
                                                {user.is_blocked ? <><CheckCircle className="w-3 h-3" /> Unblock</> : <><Ban className="w-3 h-3" /> Block</>}
                                            </button>
                                            <button onClick={() => handleForceLogout(user.id)} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors flex items-center gap-1"><LogOut className="w-3 h-3" />Logout</button>
                                            <button onClick={() => handleViewActivity(user.id)} className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm transition-colors flex items-center gap-1"><Activity className="w-3 h-3" />Activity</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Credit Logs Modal */}
            {selectedUserLogs && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedUserLogs(null)}>
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-[#0F0F11] border border-white/10 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-2xl font-bold">Credit Transaction History</h3>
                            <button onClick={() => setSelectedUserLogs(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-3">
                            {selectedUserLogs.map(log => (
                                <div key={log.id} className="flex justify-between items-center bg-white/5 p-4 rounded-lg border border-white/5">
                                    <div>
                                        <div className={`font-bold ${log.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>{log.amount > 0 ? '+' : ''}{log.amount} Credits</div>
                                        <div className="text-sm text-white/60">{log.reason}</div>
                                    </div>
                                    <div className="text-xs text-white/30">{new Date(log.created_at).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Activity Logs Modal */}
            {selectedUserActivity && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedUserActivity(null)}>
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-[#0F0F11] border border-white/10 rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-2xl font-bold">User Activity Logs</h3>
                            <button onClick={() => setSelectedUserActivity(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-3">
                            {selectedUserActivity.map(log => (
                                <div key={log.id} className="bg-white/5 p-4 rounded-lg border border-white/5">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs uppercase font-medium">{log.action_type}</span>
                                        <span className="text-xs text-white/30">{new Date(log.created_at).toLocaleString()}</span>
                                    </div>
                                    {log.details && <div className="text-sm text-white/60 mt-2">{JSON.stringify(log.details, null, 2)}</div>}
                                    {log.credits_used > 0 && <div className="text-sm text-yellow-400 mt-2">Credits used: {log.credits_used}</div>}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* History Modal */}
            {selectedUser && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-[#0F0F11] border border-white/10 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold">Chat History</h3>
                                <p className="text-white/50 text-sm mt-1">{selectedUser.email}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleDeleteAllHistory(selectedUser.id)} className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors flex items-center gap-1"><Trash2 className="w-4 h-4" />Delete All</button>
                                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {historyLoading ? (
                                <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
                            ) : userHistory.length === 0 ? (
                                <div className="text-center text-white/30 py-20"><MessageSquare className="w-16 h-16 mx-auto mb-4" /><p>No chat history found</p></div>
                            ) : (
                                userHistory.map((conv) => (
                                    <div key={conv.id} className="bg-white/5 border border-white/10 rounded-xl p-6 relative group">
                                        <button onClick={() => handleDeleteHistory(selectedUser.id, conv.id)} className="absolute top-4 right-4 p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                                        <div className="text-sm text-white/50 mb-4">{formatDate(conv.created_at)}</div>
                                        <div className="space-y-3">
                                            {conv.messages.map((msg: Record<string, unknown>, idx: number) => (
                                                <div key={idx} className="flex gap-3">
                                                    <span className={`font-bold text-xs uppercase min-w-[3rem] ${msg.role === 'user' ? 'text-blue-400' : 'text-green-400'}`}>{msg.role === 'user' ? 'User' : 'AI'}</span>
                                                    <p className="text-white/80 text-sm leading-relaxed">{typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Broadcast Modal */}
            {isBroadcastModalOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsBroadcastModalOpen(false)}>
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-[#0F0F11] border border-white/10 rounded-xl max-w-2xl w-full flex flex-col shadow-2xl shadow-pink-500/10">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-pink-500/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-500/20 rounded-lg">
                                    <Megaphone className="w-5 h-5 text-pink-400" />
                                </div>
                                <h3 className="text-xl font-bold">Compose Broadcast</h3>
                            </div>
                            <button onClick={() => setIsBroadcastModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">Target Audience</label>
                                <select
                                    value={broadcastTarget}
                                    onChange={(e) => setBroadcastTarget(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500/50"
                                >
                                    <option value="all">All Users ({users.length})</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.email}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={broadcastTitle}
                                    onChange={(e) => setBroadcastTitle(e.target.value)}
                                    placeholder="e.g. Important Update"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">Message</label>
                                <textarea
                                    value={broadcastMessage}
                                    onChange={(e) => setBroadcastMessage(e.target.value)}
                                    placeholder="Write your message here..."
                                    rows={5}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500/50 resize-none"
                                />
                            </div>

                            <button
                                onClick={handleBroadcast}
                                disabled={isSendingBroadcast}
                                className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 rounded-xl font-bold text-lg shadow-lg shadow-pink-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSendingBroadcast ? (
                                    <>
                                        <RefreshCcw className="animate-spin" /> Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send size={20} /> Send Broadcast
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Footer */}
            <div className="mt-auto pt-6 border-t border-white/10 text-center">
                <p className="text-white/40 text-sm">© 2025 Maheshwar. All rights reserved.</p>
            </div>
        </div>
    );
}
