'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, DollarSign, TrendingUp, Calendar, CreditCard, Activity } from 'lucide-react';
import { getAnalyticsSummary, getRecentTransactions, AnalyticsSummary, Transaction } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AnalyticsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<AnalyticsSummary>({
        totalRevenue: 0,
        monthlyRevenue: 0,
        dailyRevenue: 0,
        totalTransactions: 0
    });
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const [summaryData, transactionsData] = await Promise.all([
                getAnalyticsSummary(),
                getRecentTransactions(20)
            ]);
            setSummary(summaryData);
            setTransactions(transactionsData);
        } catch (error) {
            console.error('Error loading analytics:', error);
            toast.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans selection:bg-purple-500/30">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/admin')}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                            Analytics & Earnings
                        </h1>
                        <p className="text-white/60 mt-1">Track revenue and transaction history</p>
                    </div>
                </div>
                <button
                    onClick={loadAnalytics}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-2"
                >
                    <Activity className="w-4 h-4" />
                    Refresh Data
                </button>
            </div>

            <div className="max-w-7xl mx-auto space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <SummaryCard
                        title="Total Revenue"
                        value={formatCurrency(summary.totalRevenue)}
                        icon={<DollarSign className="w-6 h-6 text-green-400" />}
                        color="from-green-500/20 to-emerald-500/5"
                    />
                    <SummaryCard
                        title="Monthly Revenue"
                        value={formatCurrency(summary.monthlyRevenue)}
                        icon={<Calendar className="w-6 h-6 text-blue-400" />}
                        color="from-blue-500/20 to-cyan-500/5"
                    />
                    <SummaryCard
                        title="Daily Revenue"
                        value={formatCurrency(summary.dailyRevenue)}
                        icon={<TrendingUp className="w-6 h-6 text-purple-400" />}
                        color="from-purple-500/20 to-pink-500/5"
                    />
                    <SummaryCard
                        title="Total Transactions"
                        value={summary.totalTransactions.toString()}
                        icon={<CreditCard className="w-6 h-6 text-orange-400" />}
                        color="from-orange-500/20 to-red-500/5"
                    />
                </div>

                {/* Recent Transactions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden"
                >
                    <div className="p-6 border-b border-white/10 flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Recent Transactions</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-white/5">
                                    <th className="px-6 py-4 text-left text-sm font-medium text-white/60">User</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-white/60">Plan</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-white/60">Amount</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-white/60">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-white/60">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-white/40">
                                            Loading transactions...
                                        </td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-white/40">
                                            No transactions found
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold">
                                                        {((t as Transaction & { users?: { email?: string } }).users?.email?.[0]?.toUpperCase()) || 'U'}
                                                    </div>
                                                    <span className="text-sm text-white/80">{((t as Transaction & { users?: { email?: string } }).users?.email) || 'Unknown User'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/10 capitalize">
                                                    {t.plan_type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-green-400">
                                                {formatCurrency(t.amount)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${t.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                                                    t.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' :
                                                        'bg-red-500/20 text-red-400 border border-red-500/20'
                                                    }`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-white/40">
                                                {formatDate(t.created_at)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function SummaryCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-3xl bg-gradient-to-br ${color} border border-white/10 backdrop-blur-xl`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md">
                    {icon}
                </div>
                <span className="px-2 py-1 rounded-lg bg-white/10 text-xs text-white/60 font-medium">
                    +0% vs last month
                </span>
            </div>
            <h3 className="text-white/60 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        </motion.div>
    );
}
