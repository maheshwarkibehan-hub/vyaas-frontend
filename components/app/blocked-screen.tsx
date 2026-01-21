'use client';

import { Lock, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export function BlockedScreen() {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a0a] text-white">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-red-900/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[120px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 max-w-md w-full mx-4 p-8 rounded-2xl bg-[#111] border border-white/10 shadow-2xl text-center"
            >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <Lock className="w-10 h-10 text-red-500" />
                </div>

                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-red-400 to-purple-400 bg-clip-text text-transparent">
                    Access Restricted
                </h1>

                <p className="text-white/60 mb-8 leading-relaxed">
                    Your account has been temporarily blocked by an administrator.
                    You cannot access the platform at this time.
                </p>

                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white/40">
                        If you believe this is a mistake, please contact support.
                    </div>

                    <a
                        href="mailto:support@vyaasai.com"
                        className="relative flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#1a1a1a]/80 backdrop-blur-xl text-white font-medium hover:bg-[#252525]/80 border border-white/30 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.1)] before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none"
                    >
                        <Mail className="w-4 h-4" />
                        Contact Support
                    </a>
                </div>
            </motion.div>
        </div>
    );
}
