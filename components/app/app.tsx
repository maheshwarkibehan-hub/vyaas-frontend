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
import { TitleBar } from '@/components/electron/TitleBar';
import { useElectron } from '@/hooks/useElectron';

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
  const { isElectron } = useElectron();
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
      <TitleBar />
      {/* Navbar - Floating Clay Pill */}
      <nav
        className={cn(
          "fixed left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-7xl bg-card border border-white/5 rounded-[2rem] shadow-clay-sm transition-all duration-700 ease-in-out safe-top will-change-transform",
          isElectron ? "top-14" : "top-4",
          // Slide up when connected to room OR when splash screen is showing
          (showSplash || roomState === 'connected') ? "-translate-y-[calc(100%+2rem)] opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        )}
      >
        <div className="px-4 sm:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img
                src="/vyaas-logo.png"
                alt="VYAAS AI"
                className="w-8 h-8 rounded-lg object-contain filter grayscale"
              />
              <span className="text-base md:text-xl font-black text-foreground tracking-tighter uppercase font-sans">
                VYAAS AI
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 md:gap-3">
              {isAuthenticated ? (
                <>
                  {/* Desktop Navigation */}
                  <div className="hidden md:flex items-center gap-2 overflow-x-auto scrollbar-hide">
                    <button
                      onClick={() => setIsHistoryOpen(true)}
                      className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-foreground bg-[#242429] rounded-full shadow-clay-sm hover:bg-[#2b2b30] active:translate-y-0.5 transition-all border-none"
                    >
                      <Clock className="w-4 h-4" />
                      <span>History</span>
                    </button>

                    <button
                      onClick={() => setIsInboxOpen(true)}
                      className="relative flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-foreground bg-[#242429] rounded-full shadow-clay-sm hover:bg-[#2b2b30] active:translate-y-0.5 transition-all border-none"
                    >
                      <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'animate-[wiggle_1s_ease-in-out_infinite]' : ''}`} />
                      <span>Inbox</span>
                    </button>

                    <button
                      onClick={() => router.push('/events')}
                      className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-foreground bg-[#242429] rounded-full shadow-clay-sm hover:bg-[#2b2b30] active:translate-y-0.5 transition-all border-none"
                    >
                      <Gift className="w-4 h-4" />
                      <span>Events</span>
                    </button>

                    <div className="h-4 w-px bg-white/5 mx-1"></div>

                    <CreditBalance credits={credits} onClick={() => setShowPricing(true)} />
                    
                    {user?.email === 'maheshwarkibehan@gmail.com' && (
                      <button
                        onClick={() => router.push('/admin')}
                        className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-black bg-white rounded-full shadow-clay-sm hover:bg-white/90 active:translate-y-0.5 transition-all border-none"
                      >
                        Admin
                      </button>
                    )}
                  </div>

                  {/* User Menu */}
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
                  className="px-6 py-2.5 text-sm font-black text-background bg-foreground rounded-full shadow-[0_4px_12px_-2px_rgba(255,255,255,0.2),inset_0_2px_0_rgba(255,255,255,0.8)] hover:shadow-[0_8px_24px_-4px_rgba(255,255,255,0.3),inset_0_2px_0_rgba(255,255,255,1)] active:translate-y-1 hover:bg-[#e0e0e0] transition-all duration-200 uppercase tracking-wide border-none"
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
          "h-full w-full bg-background relative overflow-auto flex flex-col transition-all duration-700 ease-in-out",
          // Remove top padding when connected (navbar hidden)
          roomState === ConnectionState.Connected
            ? (isElectron ? "pt-10" : "pt-0")
            : (isElectron ? "pt-24 md:pt-28" : "pt-16 md:pt-20")
        )}
      >
        {/* Subtle Ambient Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-foreground/[0.03] rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-foreground/[0.04] rounded-full blur-[120px]"></div>
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
