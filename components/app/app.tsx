'use client';

import { useState, useEffect } from 'react';
import { RoomAudioRenderer, StartAudio, useConnectionState } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { cn } from '@/lib/utils';
import type { AppConfig } from '@/app-config';
import { SessionProvider } from '@/components/app/session-provider';
import { ViewController } from '@/components/app/view-controller';
import { Toaster } from '@/components/livekit/toaster';
import { AuthUIProvider, useAuthUI } from '@/components/app/auth-ui-provider';
import { AuthModal } from '@/components/app/auth-modal';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

import { HistoryDrawer } from '@/components/app/history-drawer';
import { InboxDrawer } from '@/components/app/inbox-drawer';
import { UserMenu } from '@/components/app/user-menu';
import { Clock, Bell } from 'lucide-react';
import { CreditBalance } from '@/components/app/credit-balance';
import { PricingModal } from '@/components/app/pricing-modal';
import { WhatsNewModal } from '@/components/app/whats-new-modal';
import { getUserSubscription, type PlanType } from '@/lib/subscription';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import { toast } from 'sonner';
import { MainMenu } from '@/components/app/main-menu';
import { Snowfall } from '@/components/ui/snowfall';
import { UserData } from '@/lib/supabase';
import { TokenBalance } from '@/components/app/token-balance';
import { Gift, FileText, Image as ImageIcon, Terminal } from 'lucide-react';
import { FloatingMiniBar } from '@/components/app/floating-mini-bar';
import { MiniModeProvider, useMiniMode } from '@/components/app/mini-mode-provider';

interface AppProps {
  appConfig: AppConfig;
}

export function App({ appConfig }: AppProps) {
  return (
    <SessionProvider appConfig={appConfig}>
      <AuthUIProvider>
        <MiniModeProvider>
          <AppContent />
        </MiniModeProvider>
      </AuthUIProvider>
    </SessionProvider>
  );
}

function AppContent() {
  const { isAuthModalOpen, openAuthModal, closeAuthModal } = useAuthUI();
  const { isMiniMode } = useMiniMode();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [credits, setCredits] = useState(0);
  const [planType, setPlanType] = useState<PlanType>('free');
  const [imageTokens, setImageTokens] = useState(0);
  const [codeTokens, setCodeTokens] = useState(0);
  const [showPricing, setShowPricing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [snowfallActive, setSnowfallActive] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const roomState = useConnectionState();

  // Listen to auth state changes globally
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      setUser(user);
      if (user) {
        getUserSubscription(user.uid).then(sub => {
          if (sub) {
            setCredits(sub.credits);
            setPlanType(sub.plan_type as PlanType);
            setImageTokens(sub.image_tokens || 0);
            setCodeTokens(sub.code_tokens || 0);
          }
        });
        // Fetch unread notifications count
        fetchUnreadCount(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time subscriptions for user data
  useEffect(() => {
    if (!user?.uid) return;

    const setupRealtime = async () => {
      const { supabase } = await import('@/lib/supabase');

      // Subscribe to user's own record for credit updates
      const userChannel = supabase
        .channel(`user_${user.uid}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${user.uid}`
          },
          (payload) => {
            console.log('User data updated:', payload);
            const newData = payload.new as { credits?: number; plan_type?: string };
            if (newData.credits !== undefined) {
              setCredits(newData.credits);
              toast.success(`Credits updated! You now have ${newData.credits} credits`, {
                duration: 3000,
              });
            }
            if (newData.plan_type) {
              setPlanType(newData.plan_type as PlanType);
            }
          }
        )
        .subscribe();

      // Subscribe to notifications for this user
      const notificationsChannel = supabase
        .channel(`notifications_${user.uid}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_notifications',
            filter: `user_id=eq.${user.uid}`
          },
          (payload) => {
            console.log('New notification:', payload);
            fetchUnreadCount(user.uid);
            const notification = payload.new as { message?: string };
            if (notification.message) {
              toast.info(notification.message, {
                duration: 5000,
              });
            }
          }
        )
        .subscribe();

      // Listen for Broadcast Credit Updates (Bypassing RLS)
      const broadcastChannel = supabase.channel('admin_updates')
        .on(
          'broadcast',
          { event: 'credit_update' },
          (payload) => {
            console.log('Credit update broadcast:', payload);
            if (payload.payload.userId === user.uid) {
              const amount = payload.payload.amount;
              setCredits(prev => prev + amount);
              if (amount > 0) {
                toast.success(`Received ${amount} credits! ${payload.payload.reason || ''}`);
              } else {
                toast.error(`Deducted ${Math.abs(amount)} credits. ${payload.payload.reason || ''}`);
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(userChannel);
        supabase.removeChannel(notificationsChannel);
        supabase.removeChannel(broadcastChannel);
      };
    };

    const cleanup = setupRealtime();

    // Fallback: Poll every 5 seconds to ensure data is fresh
    const interval = setInterval(() => {
      if (user?.uid) {
        getUserSubscription(user.uid).then(sub => {
          if (sub) {
            setCredits(prev => {
              if (prev !== sub.credits) {
                toast.success(`Credits updated: ${sub.credits}`);
                return sub.credits;
              }
              return prev;
            });
            setPlanType(sub.plan_type as PlanType);
          }
        });
        fetchUnreadCount(user.uid);
      }
    }, 5000);

    return () => {
      cleanup.then(fn => fn?.());
      clearInterval(interval);
    };
  }, [user?.uid]);

  const fetchUnreadCount = async (userId: string) => {
    const { supabase } = await import('@/lib/supabase');
    const { count } = await supabase
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    setUnreadCount(count || 0);
  };

  // Load theme from localStorage
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

  return (
    <>
      {/* Navbar - Mobile Optimized */}
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10 transition-all duration-700 ease-in-out safe-top will-change-transform",
          // Slide up when connected to room OR when splash screen is showing
          (showSplash || roomState === 'connected') ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-20">
            {/* Logo - Larger on mobile */}
            <div className="flex items-center gap-2">
              <img
                src="/vyaas-logo.png"
                alt="VYAAS AI"
                className="w-9 h-9 md:w-10 md:h-10 rounded-xl object-contain"
              />
              <span className="text-lg md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
                VYAAS AI
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              {isAuthenticated ? (
                <>
                  {/* Desktop Navigation - Scrollable */}
                  <div className="hidden md:flex items-center gap-2 overflow-x-auto overflow-y-visible scrollbar-hide max-w-[calc(100vw-450px)]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <button
                      onClick={() => setIsHistoryOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
                      title="History"
                    >
                      <Clock className="w-5 h-5" />
                      <span>History</span>
                    </button>

                    <button
                      onClick={() => setIsInboxOpen(true)}
                      className="relative flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
                      title="Inbox"
                    >
                      <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-[wiggle_1s_ease-in-out_infinite]' : ''}`} />
                      <span>Inbox</span>
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                      )}
                    </button>

                    <button
                      onClick={() => router.push('/events')}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-pink-400 hover:bg-pink-500/10 rounded-full transition-all cursor-pointer"
                    >
                      <Gift className="w-5 h-5" />
                      <span>Events</span>
                    </button>

                    <button
                      onClick={() => router.push('/patches')}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
                    >
                      <FileText className="w-5 h-5" />
                      <span>Patches</span>
                    </button>

                    <div className="h-6 w-px bg-white/10 mx-1"></div>

                    <CreditBalance credits={credits} onClick={() => setShowPricing(true)} />
                    <TokenBalance count={imageTokens} icon={ImageIcon} label="Image Tokens" color="blue" />
                    <TokenBalance count={codeTokens} icon={Terminal} label="Code Tokens" color="green" />

                    {user?.email === 'maheshwarkibehan@gmail.com' && (
                      <button
                        onClick={() => router.push('/admin')}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-full transition-all duration-200 cursor-pointer"
                      >
                        Dashboard
                      </button>
                    )}
                  </div>

                  {/* User Menu - Outside scrollable container for proper dropdown */}
                  <div className="hidden md:block">
                    <UserMenu
                      user={user}
                      theme={theme}
                      onThemeChange={handleThemeChange}
                      onHistoryClick={() => setIsHistoryOpen(true)}
                      onInboxClick={() => setIsInboxOpen(true)}
                      unreadCount={unreadCount}
                    />
                  </div>

                  {/* Mobile Menu (Three Dots) */}
                  <MainMenu
                    user={{
                      id: user?.uid || '',
                      email: user?.email || '',
                      full_name: user?.displayName || 'User',
                      avatar_url: user?.photoURL || null,
                      credits,
                      image_tokens: imageTokens,
                      code_tokens: codeTokens,
                      plan_type: planType,
                      is_blocked: false,
                      created_at: '',
                      updated_at: ''
                    }}
                    credits={credits}
                    unreadCount={unreadCount}
                    theme={theme}
                    onThemeToggle={() => handleThemeChange(theme === 'dark' ? 'light' : 'dark')}
                    snowfallActive={snowfallActive}
                    onSnowfallToggle={() => setSnowfallActive(!snowfallActive)}
                    onHistoryClick={() => setIsHistoryOpen(true)}
                    onInboxClick={() => setIsInboxOpen(true)}
                  />
                </>
              ) : (
                <button
                  onClick={openAuthModal}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-full shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 active:scale-95 transition-all duration-200"
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <Snowfall active={snowfallActive} />

      {/* Main Content */}
      <main
        className={cn(
          "h-full w-full bg-[#0a0a0a] relative overflow-auto flex flex-col transition-all duration-700 ease-in-out",
          // Remove top padding when connected (navbar hidden)
          roomState === ConnectionState.Connected ? "pt-0" : "pt-16 md:pt-20"
        )}
      >
        {/* Subtle Ambient Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10 flex-1 min-h-0">
          <ViewController showSplash={showSplash} onSplashComplete={() => setShowSplash(false)} />
        </div>
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        onLoginSuccess={closeAuthModal}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        user={user}
      />

      <InboxDrawer
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        userId={user?.uid}
        onNotificationChange={() => user && fetchUnreadCount(user.uid)}
      />

      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        currentPlan={planType}
        onSuccess={async () => {
          if (user) {
            const sub = await getUserSubscription(user.uid);
            if (sub) {
              setCredits(sub.credits);
              setPlanType(sub.plan_type as PlanType);
            }
          }
        }}
      />

      <WhatsNewModal />

      <StartAudio label="Start Audio" />
      <RoomAudioRenderer />
      <Toaster />
      <InstallPrompt />
      <FloatingMiniBar />
    </>
  );
}
