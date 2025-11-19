import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuthUI } from '@/components/app/auth-ui-provider';

// --- Helper Components ---

// Feature Card with Hover Effect
const FeatureCard = ({ icon, title, desc, delay }: { icon: string, title: string, desc: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
    className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:border-purple-500/30 transition-colors"
  >
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-white/60 leading-relaxed">{desc}</p>
  </motion.div>
);

// --- Main Welcome View ---

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
}

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { openAuthModal } = useAuthUI();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        if (!isAuthenticated) {
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 4000);
        }
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });
    return () => unsubscribe();
  }, [isAuthenticated]);

  const handleStartCall = () => {
    if (isAuthenticated) {
      onStartCall();
    } else {
      openAuthModal();
    }
  };

  return (
    <div ref={ref} className="min-h-screen bg-transparent text-white overflow-x-hidden selection:bg-purple-500/30">

      {/* Background Ambient Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s' }}></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-8 inline-block"
        >
          <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-purple-300 backdrop-blur-md">
            ✨ Introducing Vyaas AI Cloud
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl md:text-8xl font-bold tracking-tight mb-8"
        >
          Your Intelligent <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            AI Companion
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Experience the next generation of AI conversations. Instant answers,
          personalized tutoring, and seamless voice interactions—all in one beautiful interface.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={handleStartCall}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-purple-500/25 transition-all hover:scale-105"
          >
            {startButtonText}
          </button>
          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-semibold text-lg backdrop-blur-md transition-all"
          >
            Learn More
          </button>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-32 px-6 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl font-bold mb-4">Why Vyaas AI?</h2>
            <p className="text-white/60">Built for productivity, designed for you.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="⚡"
              title="Lightning Fast"
              desc="Get instant responses with our optimized AI engine. No more waiting for answers."
              delay={0.1}
            />
            <FeatureCard
              icon="🔒"
              title="Secure & Private"
              desc="Your conversations are encrypted and private. We prioritize your data security."
              delay={0.2}
            />
            <FeatureCard
              icon="🧠"
              title="Smart Context"
              desc="Vyaas remembers previous interactions to provide more relevant and personalized help."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-white/5 bg-black/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-white/40 text-sm">
            &copy; {new Date().getFullYear()} Vyaas AI. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-white/60">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: 50 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 right-8 z-50 p-4 rounded-xl bg-green-500/20 border border-green-500/50 text-green-200 backdrop-blur-md shadow-xl"
          >
            🎉 Successfully logged in!
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};