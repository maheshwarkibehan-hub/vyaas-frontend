import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap, Crown, Shield, CreditCard, Sparkles, Star } from 'lucide-react';
import { PLANS, type PlanType, createPaymentRequest, validateDiscountCode } from '@/lib/subscription';
import { applyCoupon } from '@/lib/rewards';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPlan: PlanType;
    onSuccess: () => void;
}

export const PricingModal = ({ isOpen, onClose, currentPlan, onSuccess }: PricingModalProps) => {
    const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
    const [topUpAmount, setTopUpAmount] = useState<number>(100);
    const [discountCode, setDiscountCode] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [couponValidating, setCouponValidating] = useState(false);
    const [validatedCoupon, setValidatedCoupon] = useState<{ discount_percent: number } | null>(null);

    const topUpCost = Math.ceil(topUpAmount / 2);
    const planCost = selectedPlan ? PLANS[selectedPlan].price : 0;
    const totalCost = selectedPlan ? planCost : topUpCost;

    // Calculate discount
    let finalCost = totalCost;
    let discountApplied = false;

    if (validatedCoupon && validatedCoupon.discount_percent) {
        const discount = Math.floor((totalCost * validatedCoupon.discount_percent) / 100);
        finalCost = totalCost - discount;
        discountApplied = true;
    } else {
        // Fallback to old discount code validation
        finalCost = validateDiscountCode(discountCode, totalCost);
        discountApplied = finalCost < totalCost;
    }

    // Validate coupon when code changes
    const handleCouponChange = async (code: string) => {
        setDiscountCode(code);
        setValidatedCoupon(null);

        if (code.trim().length === 0) return;

        // Check if it's a VYAAS coupon
        if (code.toUpperCase().startsWith('VYAAS-')) {
            setCouponValidating(true);
            try {
                const result = await applyCoupon(code.toUpperCase(), auth.currentUser!.uid);
                if (result.valid) {
                    setValidatedCoupon({ discount_percent: result.discount });
                    toast.success(result.message);
                } else {
                    setValidatedCoupon(null);
                    toast.error(result.message);
                }
            } catch (error) {
                console.error('Coupon validation error:', error);
                setValidatedCoupon(null);
            } finally {
                setCouponValidating(false);
            }
        }
    };

    const handlePayment = async () => {
        if (!auth.currentUser) return;
        setIsProcessing(true);

        try {
            const success = await createPaymentRequest(
                auth.currentUser.uid,
                selectedPlan ? PLANS[selectedPlan].credits : topUpAmount,
                selectedPlan || null
            );

            if (success) {
                toast.success("Request sent! Waiting for admin approval.");
                onClose();
            } else {
                toast.error("Failed to send request. Please try again.");
            }
        } catch (error) {
            console.error("Payment error:", error);
            toast.error("Something went wrong.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    const planFeatures = {
        free: ['100 Credits/month', '5 min sessions', 'Basic AI chat', 'Image generation (5)', 'Code assistance'],
        pro: ['500 Credits/month', '10 hours sessions', 'Advanced AI', 'Image generation (25)', 'Priority support', 'Code mode'],
        ultra: ['2000 Credits/month', 'Unlimited sessions', 'Premium AI', 'Unlimited images', 'VIP support 24/7', 'All features', 'Early access']
    };

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={onClose}>
                <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-[#141414] border border-white/15 rounded-[32px] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-green/0 via-neon-green/50 to-neon-green/0" />
                    {/* Removed colored background blobs */}

                    <div className="flex-1 p-8 md:p-10 overflow-y-auto relative z-10">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-4">
                                <img src="/vyaas-logo.png" alt="VYAAS AI" className="w-12 h-12 object-contain" />
                                <div>
                                    <h2 className="text-3xl font-bold text-white tracking-tight">Upgrade Your Experience</h2>
                                    <p className="text-white/40 mt-1">Unlock full potential with premium plans</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="md:hidden p-2 hover:bg-white/10 rounded-full text-white"><X size={24} /></button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
                            {(Object.keys(PLANS) as PlanType[]).map((plan) => {
                                const isSelected = selectedPlan === plan;
                                const isCurrent = currentPlan === plan;
                                const isUltra = plan === 'ultra';

                                return (
                                    <motion.div key={plan} whileHover={{ y: -4 }} onClick={() => { setSelectedPlan(isSelected ? null : plan); setTopUpAmount(0); }} className={`relative p-6 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col h-full ${isSelected ? 'bg-[#1f1f1f] text-white border-neon-green/50 shadow-xl shadow-neon-green/10' : isCurrent ? 'bg-[#1a1a1a] border-white/20 opacity-80' : 'bg-[#181818] border-white/15 hover:border-white/30 hover:bg-[#1f1f1f]'}`}>
                                        {isUltra && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1"><Star size={10} fill="black" /> BEST VALUE</div>}
                                        <div className="mb-4">
                                            <h3 className={`text-lg font-bold capitalize flex items-center gap-2 ${isSelected ? 'text-neon-green' : 'text-white'}`}>
                                                {plan === 'ultra' && <Crown size={18} fill="currentColor" />}
                                                {PLANS[plan].name}
                                            </h3>
                                            <div className="flex items-baseline gap-1 mt-2">
                                                <span className={`text-3xl font-bold ${isSelected ? 'text-white' : 'text-white'}`}>₹{PLANS[plan].price}</span>
                                                <span className={`text-sm ${isSelected ? 'text-white/60' : 'text-white/40'}`}>/mo</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2 mb-6 flex-1">
                                            {planFeatures[plan].map((feature, idx) => (
                                                <div key={idx} className={`flex items-start gap-2 text-sm ${isSelected ? 'text-white/80' : 'text-white/70'}`}>
                                                    <Check size={14} className={`${isSelected ? 'text-neon-green' : 'text-white'} mt-0.5 flex-shrink-0`} />
                                                    <span>{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {isCurrent ? (
                                            <div className="w-full py-2 rounded-lg bg-white/10 text-center text-sm font-medium text-white/50">Current Plan</div>
                                        ) : (
                                            <div className={`w-full py-2 rounded-lg text-center text-sm font-bold ${isSelected ? 'bg-neon-green text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}>Select</div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div className="relative">
                            <div className="relative bg-[#1a1a1a] border border-white/15 rounded-2xl p-6 md:p-8">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                            <div className="p-2 rounded-lg bg-white/10 text-neon-green"><Zap size={20} fill="currentColor" /></div>
                                            Custom Top-up
                                        </h3>
                                        <p className="text-sm text-white/40 mt-1">Need more power? Add credits instantly.</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-white">₹{Math.ceil(topUpAmount / 2)}</div>
                                        <div className="text-xs text-white/40">Rate: ₹5 / 10 Credits</div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between text-sm mb-3">
                                            <span className="text-white/60">Credits Amount</span>
                                            <span className="font-bold text-white">{topUpAmount} Credits</span>
                                        </div>

                                        {/* Custom Slider */}
                                        <div className="relative py-2">
                                            <input
                                                type="range"
                                                min="100"
                                                max="5000"
                                                step="100"
                                                value={topUpAmount}
                                                onChange={(e) => { setTopUpAmount(parseInt(e.target.value)); setSelectedPlan(null); }}
                                                className="slider-custom w-full h-3 appearance-none cursor-pointer"
                                                style={{
                                                    background: `linear-gradient(to right, #1a1a1a 0%, #1a1a1a ${((topUpAmount - 100) / (5000 - 100)) * 100}%, #0a0a0a ${((topUpAmount - 100) / (5000 - 100)) * 100}%, #0a0a0a 100%)`,
                                                    borderRadius: '12px',
                                                    border: '1px solid rgba(255,255,255,0.1)'
                                                }}
                                            />
                                        </div>

                                        <div className="flex justify-between mt-2 text-xs text-white/40 font-mono">
                                            <span>100</span>
                                            <span>5000</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {[100, 500, 1000, 2000].map(amount => (
                                            <button key={amount} onClick={() => { setTopUpAmount(amount); setSelectedPlan(null); }} className={`flex-1 py-2 rounded-lg text-sm font-medium ${topUpAmount === amount && !selectedPlan ? 'bg-[#252525] text-white font-bold border border-white/30' : 'bg-[#1a1a1a] text-white/70 hover:bg-[#252525] border border-white/20'}`}>{amount}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-[380px] bg-[#1a1a1a] border-t md:border-t-0 md:border-l border-white/15 p-8 flex flex-col relative z-20">
                        <div className="flex justify-between items-center mb-8 hidden md:flex">
                            <h2 className="text-xl font-bold text-white">Order Summary</h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white"><X size={20} /></button>
                        </div>
                        <div className="flex-1">
                            <div className="bg-[#222] rounded-xl p-4 mb-6 border border-white/10 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="text-sm text-white/60 mb-1">Selected Item</div>
                                        <div className="font-bold text-lg text-white">{selectedPlan ? `${PLANS[selectedPlan].name} Plan` : `${topUpAmount} Credits Top-up`}</div>
                                    </div>
                                    <div className="p-2 bg-white/5 rounded-lg">{selectedPlan ? <Crown size={20} className="text-neon-green" /> : <Zap size={20} className="text-neon-green" />}</div>
                                </div>
                                <div className="h-px bg-white/10 my-3" />
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-white"><span className="text-white/60">Subtotal</span><span>₹{totalCost}</span></div>
                                    {discountApplied && <div className="flex justify-between text-sm text-neon-green font-medium"><span>Discount {validatedCoupon ? `(${validatedCoupon.discount_percent}%)` : ''}</span><span>-₹{totalCost - finalCost}</span></div>}
                                </div>
                            </div>
                            <div className="mb-8">
                                <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block font-bold">Promo Code</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={discountCode}
                                        onChange={(e) => handleCouponChange(e.target.value)}
                                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-neon-green/50 uppercase placeholder:normal-case transition-colors text-white placeholder-white/30"
                                        placeholder="Enter VYAAS-XXXX code"
                                    />
                                    {couponValidating ? (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : discountApplied ? (
                                        <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neon-green" />
                                    ) : (
                                        <Sparkles size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20" />
                                    )}
                                </div>
                                {discountApplied && validatedCoupon && <p className="text-xs text-neon-green mt-2 ml-1">✨ {validatedCoupon.discount_percent}% discount applied!</p>}
                                {discountApplied && !validatedCoupon && <p className="text-xs text-neon-green mt-2 ml-1">Code applied successfully!</p>}
                            </div>
                        </div>
                        <div className="mt-auto">
                            <div className="flex justify-between items-end mb-6">
                                <span className="text-white/60 mb-1">Total Amount</span>
                                <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-green to-white">₹{finalCost}</span>
                            </div>
                            <button onClick={handlePayment} disabled={isProcessing || (finalCost === 0 && !discountApplied && !selectedPlan && topUpAmount === 0)} className="relative w-full py-4 bg-[#1a1a1a]/80 backdrop-blur-xl hover:bg-[#252525]/80 text-white border border-white/30 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none">
                                {isProcessing ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></span> : <><CreditCard size={20} className="group-hover:rotate-12 transition-transform" />{finalCost === 0 && discountApplied ? 'Activate Now' : 'Proceed to Pay'}</>}
                            </button>
                            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-white/30"><Shield size={12} /><span>Secure SSL Encrypted Payment</span></div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
