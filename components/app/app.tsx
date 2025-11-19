'use client';

import { useState, useEffect } from 'react';
import { RoomAudioRenderer, StartAudio } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { SessionProvider } from '@/components/app/session-provider';
import { ViewController } from '@/components/app/view-controller';
import { Toaster } from '@/components/livekit/toaster';
import { AuthUIProvider, useAuthUI } from '@/components/app/auth-ui-provider';
import { AuthModal } from '@/components/app/auth-modal';
import { auth } from '@/lib/firebase';

interface AppProps {
  appConfig: AppConfig;
}

export function App({ appConfig }: AppProps) {
  return (
    <SessionProvider appConfig={appConfig}>
      <AuthUIProvider>
        <AppContent />
      </AuthUIProvider>
    </SessionProvider>
  );
}

function AppContent() {
  const { isAuthModalOpen, openAuthModal, closeAuthModal } = useAuthUI();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Listen to auth state changes globally
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-lg border-b border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <span className="text-white font-bold text-xl">V</span>
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
                VYAAS AI
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {!isAuthenticated && (
                <button
                  onClick={openAuthModal}
                  className="px-6 py-2.5 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
                >
                  Login
                </button>
              )}
              <button
                onClick={isAuthenticated ? undefined : openAuthModal}
                className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-full shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all duration-200"
              >
                {isAuthenticated ? 'Dashboard' : 'Get Started'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="min-h-screen bg-[#0a0a0a] pt-20 relative overflow-hidden">
        {/* Subtle Ambient Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10">
          <ViewController />
        </div>
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        onLoginSuccess={closeAuthModal}
      />

      <StartAudio label="Start Audio" />
      <RoomAudioRenderer />
      <Toaster />
    </>
  );
}
