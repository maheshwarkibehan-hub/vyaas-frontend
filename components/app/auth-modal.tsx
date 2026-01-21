'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, googleProvider } from '@/lib/firebase';
import {
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { Button } from '@/components/livekit/button';

const GlassInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
    <div className="relative group mb-4">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl opacity-30 group-hover:opacity-70 blur transition duration-500"></div>
        <input className={`relative w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 backdrop-blur-xl transition-all duration-300 ${className}`} ref={ref} {...props} />
    </div>
));
GlassInput.displayName = 'GlassInput';

// Check if running as desktop app
const isDesktopApp = typeof window !== 'undefined' && (
    window.location.hostname === '127.0.0.1' ||
    window.location.port === '3000' ||
    navigator.userAgent.includes('Electron') ||
    // @ts-ignore
    window.pywebview !== undefined
);

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: () => void;
}

export const AuthModal = ({ isOpen, onClose, onLoginSuccess }: AuthModalProps) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [infoMessage, setInfoMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setError('');
        setInfoMessage('');
    }, [isOpen, isSignUp, isForgotPassword]);

    // Handle redirect result for desktop app
    useEffect(() => {
        if (isDesktopApp) {
            getRedirectResult(auth).then((result) => {
                if (result?.user) {
                    console.log('Login successful via redirect');
                    onLoginSuccess();
                }
            }).catch((error) => {
                console.error('Redirect error:', error);
                setError(error.message);
            });
        }
    }, [onLoginSuccess]);

    const handleGoogleLogin = async () => {
        setError('');
        setIsLoading(true);
        try {
            if (isDesktopApp) {
                // Use redirect for desktop app (popups blocked)
                await signInWithRedirect(auth, googleProvider);
                // Page will redirect, no need to call onLoginSuccess here
            } else {
                // Use popup for web
                await signInWithPopup(auth, googleProvider);
                onLoginSuccess();
            }
        } catch (err) {
            const error = err as Error;
            console.error("Google Login Error:", error);
            setError(error.message || "Failed to login with Google.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setInfoMessage('');
        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setInfoMessage("Password reset email sent! Check your inbox.");
            setTimeout(() => {
                setIsForgotPassword(false);
                setEmail('');
            }, 3000);
        } catch (err) {
            const error = err as Error;
            console.error("Reset Error:", error);
            let msg = "Failed to send reset email.";
            if ('code' in error) {
                if ((error as { code?: string }).code === 'auth/user-not-found') msg = "No account found with this email.";
                if ((error as { code?: string }).code === 'auth/invalid-email') msg = "Invalid email address.";
            }
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setInfoMessage('');
        setIsLoading(true);
        try {
            if (isSignUp) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await sendEmailVerification(userCredential.user);
                setInfoMessage("Verification email sent! Please check your inbox.");
                setIsSignUp(false);
            } else {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                if (userCredential.user.emailVerified) {
                    onLoginSuccess();
                } else {
                    setError("Please verify your email first.");
                    await sendEmailVerification(userCredential.user);
                    setInfoMessage("Verification email resent.");
                }
            }
        } catch (err) {
            const error = err as Error;
            console.error("Auth Error:", error);
            let msg = "Authentication failed.";
            if ('code' in error) {
                if ((error as { code?: string }).code === 'auth/email-already-in-use') msg = "Email already in use.";
                if ((error as { code?: string }).code === 'auth/weak-password') msg = "Password too weak.";
                if ((error as { code?: string }).code === 'auth/invalid-credential') msg = "Invalid credentials.";
            }
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                    <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative w-full max-w-md p-8 rounded-3xl overflow-hidden border border-white/20 shadow-2xl" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)', backdropFilter: 'blur(20px)' }}>
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl pointer-events-none"></div>
                        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-10">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-bold text-white text-center mb-2">{isForgotPassword ? 'Reset Password' : (isSignUp ? 'Create Account' : 'Welcome Back')}</h2>
                            <p className="text-white/60 text-center mb-8">{isForgotPassword ? 'Enter your email to reset password' : (isSignUp ? 'Join the future of AI assistance' : 'Sign in to continue')}</p>
                            {!isForgotPassword && (
                                <>
                                    {/* Google login - Web only (doesn't work in desktop embedded browser) */}
                                    {!isDesktopApp ? (
                                        <>
                                            <button onClick={handleGoogleLogin} disabled={isLoading} className="relative w-full flex items-center justify-center gap-3 bg-[#1a1a1a]/80 backdrop-blur-xl hover:bg-[#252525]/80 text-white font-bold py-3 px-4 rounded-xl border border-white/30 transition-all duration-200 mb-6 shadow-[0_0_15px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.1)] before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none">
                                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                </svg>
                                                Continue with Google
                                            </button>
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="h-px bg-white/10 flex-1"></div>
                                                <span className="text-white/40 text-sm">or</span>
                                                <div className="h-px bg-white/10 flex-1"></div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="mb-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                            <p className="text-blue-400 text-xs text-center">
                                                🖥️ Desktop App: Please use Email/Password to login
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                            <form onSubmit={isForgotPassword ? handleForgotPassword : handleEmailAuth} className="space-y-4">
                                <GlassInput type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
                                {!isForgotPassword && <GlassInput type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} minLength={6} />}
                                {!isForgotPassword && !isSignUp && (
                                    <div className="text-right">
                                        <button type="button" onClick={() => setIsForgotPassword(true)} className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Forgot Password?</button>
                                    </div>
                                )}
                                {error && <div className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded-lg">{error}</div>}
                                {infoMessage && <div className="text-blue-400 text-sm text-center bg-blue-500/10 p-2 rounded-lg">{infoMessage}</div>}
                                <Button type="submit" className="relative w-full py-6 text-lg font-bold bg-[#1a1a1a]/80 backdrop-blur-xl hover:bg-[#252525]/80 text-white rounded-xl border border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-300 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none" disabled={isLoading}>
                                    {isLoading ? 'Processing...' : (isForgotPassword ? 'Send Reset Link' : (isSignUp ? 'Create Account' : 'Sign In'))}
                                </Button>
                            </form>
                            <div className="mt-6 text-center">
                                {isForgotPassword ? (
                                    <p className="text-white/60 text-sm">Remember your password? <button onClick={() => setIsForgotPassword(false)} className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">Sign In</button></p>
                                ) : (
                                    <p className="text-white/60 text-sm">{isSignUp ? 'Already have an account?' : "Don't have an account?"} <button onClick={() => setIsSignUp(!isSignUp)} className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">{isSignUp ? 'Sign In' : 'Sign Up'}</button></p>
                                )}
                            </div>
                            <div className="mt-6 text-center">
                                <p className="text-white/30 text-xs">© 2025 Maheshwar. All rights reserved.</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
