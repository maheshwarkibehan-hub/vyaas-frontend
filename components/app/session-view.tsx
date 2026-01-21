'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { AppConfig } from '@/app-config';
import { PreConnectMessage } from '@/components/app/preconnect-message';
import { TileLayout } from '@/components/app/tile-layout';
import {
  AgentControlBar,
  type ControlBarControls,
} from '@/components/livekit/agent-control-bar/agent-control-bar';
import { useInputControls } from '@/components/livekit/agent-control-bar/hooks/use-input-controls';
import { TrackSelector } from '@/components/livekit/agent-control-bar/track-selector';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useConnectionTimeout } from '@/hooks/useConnectionTimout';
import { useDebugMode } from '@/hooks/useDebug';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/lib/responsive-utils';
import { ScrollArea } from '../livekit/scroll-area/scroll-area';
import { auth } from '@/lib/firebase';
import { MetricsPanel } from '@/components/app/metrics-panel';
import { Zap } from 'lucide-react';
import {
  useLocalParticipant,
  VideoTrack,
  useVoiceAssistant,
  useChat,
  type TrackReference
} from '@livekit/components-react';
import { useLocalTrackRef } from './tile-layout';
import { ParticleOrb } from '@/components/app/particle-orb';
import { ChatInput } from '@/components/livekit/agent-control-bar/chat-input';
import { Track } from 'livekit-client';
import { ChatTranscript } from '@/components/app/chat-transcript';
import { saveChatHistory, updateUserLogin } from '@/lib/supabase';
import { getUserSubscription, deductCredits, COSTS, type PlanType } from '@/lib/subscription';
import { PricingModal } from '@/components/app/pricing-modal';
import { CreditBalance } from '@/components/app/credit-balance';
import { toast } from 'sonner';
import { useRoomContext } from '@livekit/components-react';
import { ImageGenModal } from '@/components/app/image-gen-modal';
import { CodeModeModal } from '@/components/app/code-mode-modal';
import { SystemLogsModal } from '@/components/app/system-logs-modal';
import { SystemHealthModal } from '@/components/app/system-health-modal';
import { GoogleMapComponent } from '@/components/app/map-component';
import FaceOverlay from '@/components/app/face-overlay';

const MotionBottom = motion.create('div');

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';

interface FadeProps {
  top?: boolean;
  bottom?: boolean;
  className?: string;
}

export function Fade({ top = false, bottom = false, className }: FadeProps) {
  return (
    <div
      className={cn(
        'from-background pointer-events-none h-4 bg-linear-to-b to-transparent',
        top && 'bg-linear-to-b',
        bottom && 'bg-linear-to-t',
        className
      )}
    />
  );
}
interface SessionViewProps {
  appConfig: AppConfig;
}

export const SessionView = ({
  appConfig,
  ...props
}: React.ComponentProps<'section'> & SessionViewProps) => {
  useConnectionTimeout(200_000);
  useDebugMode({ enabled: IN_DEVELOPMENT });
  const router = useRouter();

  const messages = useChatMessages();
  const [chatOpen, setChatOpen] = useState(true);
  const { isMobile, isTablet, isLandscape, isLargeTablet } = useResponsive();

  // Subscription State
  const [credits, setCredits] = useState(0);
  const [planType, setPlanType] = useState<PlanType>('free');
  const [imageTokens, setImageTokens] = useState(0);
  const [codeTokens, setCodeTokens] = useState(0);
  const [showPricing, setShowPricing] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Modal States
  const [showImageGen, setShowImageGen] = useState(false);
  const [showCodeMode, setShowCodeMode] = useState(false);
  const [showSystemLogs, setShowSystemLogs] = useState(false);
  const [showHealthCheck, setShowHealthCheck] = useState(false);

  // Map State
  const [mapLocation, setMapLocation] = useState<string | null>(null);
  const [queryType, setQueryType] = useState<string>('place');

  const room = useRoomContext();
  const {
    state: agentState,
    audioTrack: agentAudioTrack,
    videoTrack: agentVideoTrack,
  } = useVoiceAssistant();
  const { send } = useChat();

  const cameraTrack = useLocalTrackRef(Track.Source.Camera);

  // Input Controls for Mic/Cam
  const {
    micTrackRef,
    cameraToggle,
    microphoneToggle,
    screenShareToggle,
    handleAudioDeviceChange,
    handleVideoDeviceChange,
    handleMicrophoneDeviceSelectError,
    handleCameraDeviceSelectError,
  } = useInputControls({ saveUserChoices: true });

  // Fetch Subscription
  const fetchSub = async () => {
    if (auth.currentUser) {
      const sub = await getUserSubscription(auth.currentUser.uid);
      if (sub) {
        setCredits(sub.credits);
        setPlanType(sub.plan_type);
        setImageTokens(sub.image_tokens || 0);
        setCodeTokens(sub.code_tokens || 0);

        // Set Timer for Free Plan
        if (sub.plan_type === 'free') {
          setTimeLeft(5 * 60); // 5 minutes
        } else if (sub.plan_type === 'pro') {
          setTimeLeft(10 * 60 * 60); // 10 hours
        } else {
          setTimeLeft(null); // Unlimited
        }
      }
    }
  };



  // Listen for Map Events
  useEffect(() => {
    if (!room) return;

    const handleData = (payload: Uint8Array, participant?: any, kind?: any, topic?: string) => {
      if (topic === 'map_events') {
        const strData = new TextDecoder().decode(payload);
        try {
          const data = JSON.parse(strData);
          if (data.type === 'show_map' && data.location) {
            setMapLocation(data.location);
            setQueryType(data.query_type || 'place');
            toast.success(`Opening map for ${data.location}`);
          }
        } catch (e) {
          console.error("Failed to parse map event", e);
        }
      }
    };

    room.on('dataReceived', handleData);
    return () => {
      room.off('dataReceived', handleData);
    };
  }, [room]);

  useEffect(() => {
    fetchSub();
    const trackLogin = async () => {
      if (auth.currentUser) {
        await updateUserLogin(auth.currentUser.uid, auth.currentUser.email || '');
      }
    };
    trackLogin();
  }, []);

  // Timer Logic
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev !== null && prev <= 1) {
          clearInterval(timer);
          room.disconnect();
          toast.error("Session time limit reached! Please upgrade.");
          setShowPricing(true);
          return 0;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, room]);


  // Auto-open chat when messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setChatOpen(true);
    }
  }, [messages.length]);

  // Action Handlers
  const handleAction = async (cost: number, action: () => void, reason: string, type?: 'image' | 'code') => {
    if (!auth.currentUser) return;
    let canProceed = false;
    if (type === 'image' && imageTokens > 0) canProceed = true;
    else if (type === 'code' && codeTokens > 0) canProceed = true;
    else if (credits >= cost) canProceed = true;
    if (!canProceed) {
      toast.error(`Not enough credits or tokens! Need ${cost} credits.`);
      setShowPricing(true);
      return;
    }
    const success = await deductCredits(auth.currentUser.uid, cost, reason, type);
    if (success) {
      if (type === 'image' && imageTokens > 0) setImageTokens(prev => prev - 1);
      else if (type === 'code' && codeTokens > 0) setCodeTokens(prev => prev - 1);
      else setCredits(prev => prev - cost);
      action();
    } else {
      toast.error("Transaction failed. Please try again.");
      setShowPricing(true);
    }
  };

  // Simplified Controls for Center Panel
  const controls: ControlBarControls = {
    leave: true,
    microphone: true, // Keep essential controls but can hide labels via CSS or props
    chat: false, // We render custom chat input
    camera: true,
    screenShare: false,
  };

  const isCameraEnabled = cameraTrack && !cameraTrack.publication.isMuted;
  const isAgentVideo = !!agentVideoTrack;

  return (
    <section className="relative z-10 h-full w-full overflow-hidden bg-[#050505] p-2 md:p-4 font-mono text-sm" {...props}>
      {/* Top Header Row - Dashboard Style */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-black/60 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 z-[60]">
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/90 text-[10px] font-bold tracking-widest hover:bg-white/10 transition-colors cursor-default">
            DASHBOARD
          </div>
          <div className="flex gap-4 text-white/30 text-[10px] tracking-[0.2em] uppercase">
            <span
              onClick={() => router.push('/system-console')}
              className="cursor-pointer hover:text-cyan-400 transition-colors flex items-center gap-2 hover:scale-105"
            >
              <Terminal size={12} className="hidden md:block" />
              VYAAS AI SYSTEM
            </span>
            <button
              onClick={() => setShowHealthCheck(true)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all hover:scale-105 group"
              title="System Health Check"
            >
              <div className="w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse shadow-[0_0_6px_#4ade80] group-hover:shadow-[0_0_10px_#4ade80]" />
              <span className="text-[9px] font-bold tracking-wider">HEALTH</span>
            </button>
            <span className="hidden md:inline text-neon-green/50">● ONLINE</span>
          </div>
        </div>

        {/* Simple Status Indicators */}
        <div className="flex items-center gap-6 text-[10px] font-mono text-white/40">
          <span className="flex items-center gap-2"><div className="w-1 h-1 bg-neon-green rounded-full animate-pulse shadow-[0_0_8px_#4ade80]" /> SYSTEM READY</span>
          <span className="text-white/20">|</span>
          <span className="tracking-widest">NET: SECURE</span>
        </div>
      </div>

      {/* Main Grid Layout - Dynamic Columns based on Map State */}
      <div
        className={cn(
          "h-full w-full pt-10 grid grid-rows-[minmax(0,1fr)] gap-4 pb-2 transition-all duration-500 ease-in-out",
          mapLocation
            ? "grid-cols-1 lg:grid-cols-[250px_1.2fr_1fr_350px]" // Compressed Left, Orb(1.2), Map(1), Right
            : "grid-cols-1 lg:grid-cols-[300px_1fr_400px]" // Standard Layout
        )}
      >

        {/* LEFT PANEL: VISUAL INPUT + METRICS */}
        <div className="flex flex-col gap-4 overflow-hidden h-full">
          {/* Visual Input (User Camera) */}
          <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-inner shadow-white/5 group shrink-0">
            <div className="absolute top-3 left-4 flex items-center gap-2 z-10 transition-all duration-300 opacity-60 group-hover:opacity-100">
              <div className="p-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-sm">
                <Zap size={10} className="text-neon-green" />
              </div>
              <span className="text-[10px] font-bold text-white tracking-widest uppercase">Visual Input</span>
            </div>
            <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-red-500 animate-[pulse_2s_infinite] z-10" />

            {isCameraEnabled ? (
              <div className="relative w-full h-full">
                <VideoTrack
                  trackRef={cameraTrack}
                  className="w-full h-full object-cover scale-x-[-1]" // Mirror
                />
                <FaceOverlay trackRef={cameraTrack} />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                    <span className="text-lg opacity-50">📷</span>
                  </div>
                  <span className="text-lg opacity-50">NO SIGNAL</span>
                </div>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
          </div>

          {/* Metrics Panel - New Place for CPU/Time */}
          <div className="flex-1 min-h-0">
            <MetricsPanel timeLeft={timeLeft} />
          </div>
        </div>


        {/* CENTER PANEL - AI CORE + CHAT INPUT */}
        <div className="relative rounded-[2rem] border border-white/20 bg-[#1a1a1a]/80 backdrop-blur-xl shadow-[0_0_30px_rgba(255,255,255,0.03),0_0_20px_-10px_rgba(0,255,157,0.03),inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden flex flex-col h-full before:absolute before:inset-0 before:rounded-[2rem] before:bg-gradient-to-b before:from-white/3 before:to-transparent before:pointer-events-none before:z-[1]">
          {/* Header */}
          {/* Header */}
          {/* AI Core System text removed */}

          {/* Visualization Area - Moves to left when map is open */}
          <div className={cn(
            "flex-1 flex items-center justify-center relative w-full mb-20 origin-center transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
            mapLocation ? "translate-x-[-15%] scale-90" : "scale-110" // Move orb aside
          )}>

            {isAgentVideo ? (
              <VideoTrack trackRef={agentVideoTrack} className="w-full h-full object-contain" />
            ) : (
              // New 3D Particle Orb
              <ParticleOrb />
            )}
          </div>

          {/* Speaking Indicator - Centered Below Orb */}
          {agentState === 'speaking' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{
                duration: 0.3,
                ease: "easeOut"
              }}
              className="absolute bottom-40 left-[40.35%] -translate-x-1/2 z-40"
            >
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                    className="w-1.5 h-1.5 bg-white rounded-full"
                  />
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                    className="w-1.5 h-1.5 bg-white rounded-full"
                  />
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.8 }}
                    className="w-1.5 h-1.5 bg-white rounded-full"
                  />
                </div>
                <span className="text-sm font-medium text-white/90">VYAAS is speaking</span>
              </div>
            </motion.div>
          )}

          {/* Floating Control Dock */}
          <div className={cn(
            "absolute bottom-8 left-1/2 -translate-x-1/2 w-auto max-w-xl z-50 transition-all duration-500",
            mapLocation && "bottom-4 scale-90 origin-bottom" // Compact mode when map is open
          )}>
            <div className={cn(
              "relative bg-[#1a1a1a]/80 backdrop-blur-2xl border border-white/30 rounded-full p-2.5 shadow-[0_0_30px_rgba(255,255,255,0.08),0_8px_32px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] flex items-center gap-4 transition-all duration-300 hover:border-white/40 hover:bg-[#252525]/80 hover:shadow-[0_0_40px_rgba(255,255,255,0.12),0_12px_40px_-4px_rgba(0,255,157,0.15)] before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none",
              // active glow when speaking
              agentState === 'speaking' && "border-white/40 bg-[#252525]/80 shadow-[0_0_40px_rgba(255,255,255,0.12),0_12px_40px_-4px_rgba(0,255,157,0.15)]",
              // Compact padding when map is active
              mapLocation && "p-2 gap-3"
            )}>

              {/* Mic & Cam & Screen Share Controls */}
              <div className="flex items-center gap-2">
                {/* Microphone */}
                <TrackSelector
                  kind="audioinput"
                  source={Track.Source.Microphone}
                  pressed={microphoneToggle.enabled}
                  disabled={microphoneToggle.pending}
                  audioTrackRef={micTrackRef}
                  onPressedChange={microphoneToggle.toggle}
                  onMediaDeviceError={handleMicrophoneDeviceSelectError}
                  onActiveDeviceChange={handleAudioDeviceChange}
                  className="h-10 w-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white transition-all data-[state=on]:bg-white/20 data-[state=on]:text-neon-green"
                  showChevron={false}
                />

                {/* Camera */}
                <TrackSelector
                  kind="videoinput"
                  source={Track.Source.Camera}
                  pressed={cameraToggle.enabled}
                  pending={cameraToggle.pending}
                  disabled={cameraToggle.pending}
                  onPressedChange={cameraToggle.toggle}
                  onMediaDeviceError={handleCameraDeviceSelectError}
                  onActiveDeviceChange={handleVideoDeviceChange}
                  className="h-10 w-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white transition-all data-[state=on]:bg-white/20 data-[state=on]:text-neon-green"
                  showChevron={false}
                />

                {/* Screen Share */}
                <button
                  onClick={() => screenShareToggle.toggle()}
                  disabled={screenShareToggle.pending}
                  className={`relative h-10 w-10 rounded-full flex items-center justify-center transition-all border ${screenShareToggle.enabled ? 'bg-neon-green/20 border-neon-green/50 text-neon-green shadow-[0_0_15px_rgba(74,222,128,0.3)]' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white'}`}
                  title={screenShareToggle.enabled ? 'Stop Screen Share' : 'Share Screen'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {screenShareToggle.enabled && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-neon-green rounded-full animate-pulse shadow-[0_0_8px_#4ade80]" />
                  )}
                </button>
              </div>

              <div className="w-px h-6 bg-white/10" />

              {/* Image Gen & Code Mode */}
              <div className="flex items-center gap-2">
                {/* Image Gen */}
                <button
                  onClick={() => handleAction(COSTS.IMAGE_GEN, () => setShowImageGen(true), 'Image Generation', 'image')}
                  className="h-10 w-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white transition-all"
                  title="Image Generation"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </button>

                {/* Code Mode */}
                <button
                  onClick={() => handleAction(COSTS.CODE_MODE, () => setShowCodeMode(true), 'Code Mode', 'code')}
                  className="h-10 w-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white transition-all"
                  title="Code Mode"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                </button>
              </div>

              <div className="w-px h-6 bg-white/10" />

              {/* End Call - Distinct Red */}
              <div className="custom-control-bar-end [&_.lk-disconnect-button]:!bg-red-500/10 [&_.lk-disconnect-button]:!border-red-500/20 [&_.lk-disconnect-button]:!text-red-500 [&_.lk-disconnect-button:hover]:!bg-red-500/20 [&_.lk-disconnect-button]:!h-10 [&_.lk-disconnect-button]:!w-auto [&_.lk-disconnect-button]:!px-4 [&_.lk-disconnect-button]:!rounded-full">
                <AgentControlBar
                  controls={{ chat: false, microphone: false, camera: false, screenShare: false, leave: true, website: false, code: false }}
                  className="w-auto"
                  onDisconnect={() => {
                    if (auth.currentUser && messages.length > 0) {
                      const formattedMessages = messages.map(msg => ({
                        role: msg.from?.isLocal ? 'user' : 'assistant',
                        content: msg.message
                      }));
                      saveChatHistory(auth.currentUser.uid, formattedMessages);
                    }
                  }}
                />
              </div>

            </div>
          </div>
        </div>
        {/* End of Center Panel */}


        {/* MAP PANEL - Only visible when mapLocation is set */}
        <AnimatePresence mode="wait">
          {mapLocation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative h-full overflow-hidden rounded-[2rem]"
            >
              <GoogleMapComponent
                location={mapLocation}
                queryType={queryType}
                onClose={() => setMapLocation(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {/* RIGHT PANEL - TRANSCRIPT */}
        <div className="flex flex-col h-full max-h-full overflow-hidden rounded-3xl bg-[#0a0a0a] border border-white/10 backdrop-blur-md shadow-inner shadow-white/5">
          <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-white font-bold uppercase tracking-widest text-xs">
              <div className="w-4 h-4 border border-neon-green/50 rounded-sm flex items-center justify-center">
                <div className="w-2 h-0.5 bg-neon-green" />
              </div>
              Transcript
            </div>
          </div>

          <div className="flex-1 min-h-0 relative overflow-hidden">
            <ScrollArea className="h-full w-full px-4 py-4">
              <ChatTranscript
                messages={messages}
                className="space-y-6 pb-4" // Added padding bottom
              />
            </ScrollArea>
          </div>

          {/* Chat Input Area in Transcript Panel */}
          <div className="p-3 border-t border-white/5 bg-black/40 backdrop-blur-md shrink-0 z-20">
            <ChatInput
              chatOpen={true}
              isAgentAvailable={true}
              onSend={(msg) => {
                if (room.state === 'connected') {
                  send(msg);
                } else {
                  toast.error("Connection lost. Please refresh the page.");
                }
              }}
            />
          </div>
        </div>

      </div>


      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        currentPlan={planType}
        onSuccess={fetchSub}
      />
      <ImageGenModal
        isOpen={showImageGen}
        onClose={() => setShowImageGen(false)}
      />
      <CodeModeModal
        isOpen={showCodeMode}
        onClose={() => setShowCodeMode(false)}
      />
      <SystemLogsModal
        isOpen={showSystemLogs}
        onClose={() => setShowSystemLogs(false)}
      />
      <SystemHealthModal
        isOpen={showHealthCheck}
        onClose={() => setShowHealthCheck(false)}
      />
    </section >
  );
};
