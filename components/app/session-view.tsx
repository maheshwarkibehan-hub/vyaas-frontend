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
import { Zap, Maximize2, Minimize2 } from 'lucide-react';
import { MetricsPanel } from '@/components/app/metrics-panel';
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
import { GoogleMapComponent } from '@/components/app/map-component';
import FaceOverlay from '@/components/app/face-overlay';
import { LocalCommandBridge } from '@/components/livekit/local-command-bridge';
import { HistoryPanel } from '@/components/app/history-panel';

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

  // Map State
  const [mapLocation, setMapLocation] = useState<string | null>(null);
  const [queryType, setQueryType] = useState<string>('place');

  // Camera State
  const [isCameraMaximized, setIsCameraMaximized] = useState(false);

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
    <section className="relative z-10 h-full w-full overflow-hidden bg-background p-3 md:p-6 font-mono text-sm" {...props}>
      {/* Top Header Row - Minimalist Tactile Monocrhome */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-background z-[60] flex items-center justify-between px-8 shadow-clay-light-sm dark:shadow-clay-sm">
        <div className="flex items-center gap-4">
          <div className="px-4 py-1.5 bg-secondary shadow-inner rounded-full text-foreground text-[10px] font-black tracking-widest cursor-default">
            SESSION
          </div>
          <div className="flex gap-4 text-muted-foreground text-[10px] tracking-[0.2em] uppercase font-bold">
            <span
              onClick={() => router.push('/system-console')}
              className="cursor-pointer hover:text-foreground transition-colors flex items-center gap-2"
            >
              <Terminal size={12} className="hidden md:block" />
              SYSTEM LOGS
            </span>
            <span className="hidden md:flex items-center gap-2 text-foreground">
              <div className="w-1.5 h-1.5 bg-foreground rounded-full animate-pulse shadow-clay-sm" />
              ONLINE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
          <span>SECURE</span>
        </div>
      </div>

      {/* Main Grid Layout - Tactical Layout */}
      <div
        className={cn(
          "h-full w-full pt-16 grid grid-rows-[minmax(0,1fr)] gap-6 pb-2 px-2 transition-all duration-500 ease-in-out",
          mapLocation
            ? "grid-cols-1 lg:grid-cols-[300px_1.2fr_1fr_350px]" // History, Orb, Map, Transcript
            : "grid-cols-1 lg:grid-cols-[300px_1fr_400px]" // History, Orb, Transcript
        )}
      >

        {/* LEFT PANEL - Chat History */}
        <HistoryPanel />

        {/* CENTER PANEL - AI CORE + CAMERA PIP */}
        <div className="relative rounded-[2.5rem] bg-card shadow-clay-light-lg dark:shadow-clay-lg overflow-hidden flex flex-col h-full z-10 border-none">
          
          {/* CAMERA PIP (Floating / Maximized) */}
          <div className={cn(
            "absolute z-50 transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
            isCameraMaximized ? "inset-4 md:inset-8" : "top-6 left-6 w-48 aspect-video"
          )}>
            <div className="relative w-full h-full rounded-[2rem] overflow-hidden bg-background shadow-clay-light-sm dark:shadow-clay-sm transition-all group border border-border">
              
              {/* Maximize Toggle Button */}
              {isCameraEnabled && (
                <button 
                  onClick={() => setIsCameraMaximized(!isCameraMaximized)}
                  className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-background/80 hover:bg-background backdrop-blur-md shadow-clay-sm transition-all text-foreground/70 hover:text-foreground opacity-0 group-hover:opacity-100"
                >
                  {isCameraMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              )}

              <div className="absolute top-4 left-5 flex items-center gap-2 z-10 transition-all duration-300 opacity-60 group-hover:opacity-100">
                <div className="p-1 rounded-full bg-background shadow-inner">
                  <Zap size={10} className="text-foreground" />
                </div>
                <span className="text-[10px] font-bold text-foreground tracking-widest uppercase">Visual</span>
              </div>
              
              {isCameraEnabled && (
                <div className="absolute top-5 right-14 w-2 h-2 rounded-full bg-foreground animate-[pulse_2s_infinite] z-10 shadow-clay-sm opacity-0 group-hover:opacity-100" />
              )}

              {isCameraEnabled ? (
                <div className="relative w-full h-full bg-black/50">
                  <VideoTrack
                    trackRef={cameraTrack}
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  <FaceOverlay trackRef={cameraTrack} />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Camera Off</span>
                </div>
              )}
            </div>
          </div>

          {/* BACKGROUND BACKGROUND METRICS STREAM */}
          <div className="absolute inset-0 z-0 opacity-[0.03] mix-blend-overlay pointer-events-none filter grayscale overflow-hidden flex items-center justify-center scale-150">
              <div className="w-full max-w-4xl opacity-50">
                 <MetricsPanel timeLeft={timeLeft} />
              </div>
              <div className="w-full max-w-4xl opacity-50 mt-96 ml-32">
                 <MetricsPanel timeLeft={timeLeft} />
              </div>
          </div>

          {/* Visualization Area */}
          <div className={cn(
            "flex-1 flex items-center justify-center relative w-full mb-20 origin-center transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
            mapLocation ? "translate-x-[-10%] scale-100" : "scale-[1.3]" // Enhance orb prominence
          )}>

            {isAgentVideo ? (
              <VideoTrack trackRef={agentVideoTrack} className="w-full h-full object-contain" />
            ) : (
              <ParticleOrb />
            )}
          </div>

          {/* Speaking Indicator */}
          {agentState === 'speaking' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{
                duration: 0.3,
                ease: "easeOut"
              }}
              className="absolute bottom-36 left-1/2 -translate-x-1/2 z-40"
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
                    className="w-2 h-2 bg-foreground rounded-full"
                  />
                </div>
                <span className="text-sm font-bold text-foreground">VYAAS is speaking</span>
              </div>
            </motion.div>
          )}

          {/* Floating Control Dock */}
          <div className={cn(
            "absolute bottom-8 left-1/2 -translate-x-1/2 w-auto max-w-xl z-50 transition-all duration-500",
            mapLocation && "bottom-4 scale-90 origin-bottom" // Compact mode when map is open
          )}>
            <div className={cn(
              "relative bg-card rounded-full p-3 shadow-clay-lg flex items-center gap-4 transition-all duration-300 border-none",
              agentState === 'speaking' && "shadow-inner scale-105",
              mapLocation && "p-2 gap-3"
            )}>

              {/* Mic & Cam & Screen Share Controls */}
              <div className="flex items-center gap-3">
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
                  className="h-12 w-12 rounded-full bg-secondary text-foreground shadow-clay-light-sm dark:shadow-clay-sm hover:shadow-clay-light-md dark:hover:shadow-clay-md transition-all active:shadow-inner data-[state=on]:bg-foreground data-[state=on]:text-background border-none"
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
                  className="h-12 w-12 rounded-full bg-secondary text-foreground shadow-clay-light-sm dark:shadow-clay-sm hover:shadow-clay-light-md dark:hover:shadow-clay-md transition-all active:shadow-inner data-[state=on]:bg-foreground data-[state=on]:text-background border-none"
                  showChevron={false}
                />

                {/* Screen Share */}
                <button
                  onClick={() => screenShareToggle.toggle()}
                  disabled={screenShareToggle.pending}
                  className={`relative h-12 w-12 rounded-full flex items-center justify-center transition-all ${screenShareToggle.enabled ? 'bg-foreground text-background shadow-inner' : 'bg-secondary text-foreground shadow-clay-light-sm dark:shadow-clay-sm hover:shadow-clay-light-md dark:hover:shadow-clay-md'}`}
                  title={screenShareToggle.enabled ? 'Stop Screen Share' : 'Share Screen'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {screenShareToggle.enabled && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-foreground rounded-full animate-pulse shadow-clay-sm" />
                  )}
                </button>
              </div>

              <div className="w-px h-8 bg-border border-l" />

              {/* Image Gen & Code Mode */}
              <div className="flex items-center gap-3">
                {/* Image Gen */}
                <button
                  onClick={() => handleAction(COSTS.IMAGE_GEN, () => setShowImageGen(true), 'Image Generation', 'image')}
                  className="h-12 w-12 rounded-full flex items-center justify-center bg-secondary text-foreground shadow-clay-light-sm dark:shadow-clay-sm hover:shadow-clay-light-md dark:hover:shadow-clay-md transition-all active:shadow-inner"
                  title="Image Generation"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </button>

                {/* Code Mode */}
                <button
                  onClick={() => handleAction(COSTS.CODE_MODE, () => setShowCodeMode(true), 'Code Mode', 'code')}
                  className="h-12 w-12 rounded-full flex items-center justify-center bg-secondary text-foreground shadow-clay-light-sm dark:shadow-clay-sm hover:shadow-clay-light-md dark:hover:shadow-clay-md transition-all active:shadow-inner"
                  title="Code Mode"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                </button>
              </div>

              <div className="w-px h-8 bg-border" />

              {/* End Call - Distinct Red */}
              <div className="custom-control-bar-end [&_.lk-disconnect-button]:!bg-destructive [&_.lk-disconnect-button]:!text-destructive-foreground [&_.lk-disconnect-button:hover]:!brightness-110 [&_.lk-disconnect-button]:!h-12 [&_.lk-disconnect-button]:!shadow-clay-light-sm [&_.lk-disconnect-button:active]:!shadow-inner [&_.lk-disconnect-button]:!w-auto [&_.lk-disconnect-button]:!px-6 [&_.lk-disconnect-button]:!rounded-full [&_.lk-disconnect-button]:!font-bold">
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
        <div className="flex flex-col h-full max-h-full overflow-hidden rounded-[2.5rem] bg-card border-none shadow-clay-lg">
          <div className="p-6 pb-2 shrink-0">
            <div className="flex items-center gap-2 text-foreground font-black uppercase tracking-[0.2em] text-xs">
              <div className="w-4 h-4 rounded-sm flex items-center justify-center bg-secondary shadow-inner">
                <div className="w-2 h-0.5 bg-foreground" />
              </div>
              Transcript
            </div>
          </div>

          <div className="flex-1 min-h-0 relative overflow-hidden">
            <ScrollArea className="h-full w-full px-6 py-4">
              <ChatTranscript
                messages={messages}
                className="space-y-6 pb-4" // Added padding bottom
              />
            </ScrollArea>
          </div>

          {/* Chat Input Area in Transcript Panel */}
          <div className="p-4 bg-background/50 backdrop-blur-3xl shrink-0 z-20 border-t border-border rounded-b-[2.5rem]">
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
      {/* Local Command Bridge - Receives commands from AI and forwards to Desktop Bridge */}
      <LocalCommandBridge />
    </section >
  );
};
