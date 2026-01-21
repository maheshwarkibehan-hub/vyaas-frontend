'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Mail, Phone, X } from 'lucide-react';

interface SuspendedModalProps {
    isOpen: boolean;
    onClose?: () => void; // Optional, suspended users can't close
    canClose?: boolean; // If true, shows close button
}

export const SuspendedModal = ({ isOpen, onClose, canClose = false }: SuspendedModalProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    onClick={canClose ? onClose : undefined}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 50 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative max-w-md w-full"
                    >
                        {/* 3D Liquid Glass Container */}
                        <div className="relative bg-[#0a0a0a] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">
                            {/* Animated Background Blobs */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        x: [0, 50, 0],
                                        y: [0, 30, 0],
                                    }}
                                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                                    className="absolute -top-20 -left-20 w-40 h-40 bg-white/5 rounded-full blur-3xl"
                                />
                                <motion.div
                                    animate={{
                                        scale: [1, 1.3, 1],
                                        x: [0, -30, 0],
                                        y: [0, 50, 0],
                                    }}
                                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                                    className="absolute -bottom-20 -right-20 w-40 h-40 bg-white/5 rounded-full blur-3xl"
                                />
                            </div>

                            {/* Close Button (if allowed) */}
                            {canClose && onClose && (
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
                                >
                                    <X size={20} className="text-white/60" />
                                </button>
                            )}

                            {/* Content */}
                            <div className="relative z-10">
                                {/* Icon */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                    className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#111] border border-white/10 flex items-center justify-center shadow-lg shadow-white/5"
                                >
                                    <ShieldAlert size={40} className="text-white" />
                                </motion.div>

                                {/* Title */}
                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-3xl font-bold text-center mb-4 text-white"
                                >
                                    Account Suspended
                                </motion.h2>

                                {/* Message */}
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-white/80 text-center mb-8 leading-relaxed"
                                >
                                    Your account has been temporarily suspended by the administrator.
                                    Please contact support for more information.
                                </motion.p>

                                {/* Contact Options */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="space-y-3"
                                >
                                    <div className="flex items-center gap-3 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                                        <div className="w-10 h-10 rounded-lg bg-[#222] border border-white/10 flex items-center justify-center">
                                            <Mail size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-white/50">Email Support</div>
                                            <div className="text-sm font-medium text-white">support@vyaas.ai</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                                        <div className="w-10 h-10 rounded-lg bg-[#222] border border-white/10 flex items-center justify-center">
                                            <Phone size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-white/50">Phone Support</div>
                                            <div className="text-sm font-medium text-white">+91 XXXXX-XXXXX</div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Footer Note */}
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="text-xs text-white/40 text-center mt-6"
                                >
                                    This action was taken to ensure platform security and compliance.
                                </motion.p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
