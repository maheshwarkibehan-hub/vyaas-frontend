
'use client';

import { type HTMLAttributes, useCallback, useState } from 'react';
import { Track } from 'livekit-client';
import { useChat, useRemoteParticipants } from '@livekit/components-react';
import { ChatTextIcon, PhoneDisconnectIcon, ImageSquareIcon, CodeIcon, ArrowsInSimple } from '@phosphor-icons/react/dist/ssr';
import { useSession } from '@/components/app/session-provider';
import { TrackToggle } from '@/components/livekit/agent-control-bar/track-toggle';
import { Button } from '@/components/livekit/button';
import { Toggle } from '@/components/livekit/toggle';
import { cn } from '@/lib/utils';
import { ChatInput } from './chat-input';
import { UseInputControlsProps, useInputControls } from './hooks/use-input-controls';
import { usePublishPermissions } from './hooks/use-publish-permissions';
import { TrackSelector } from './track-selector';
import { motion } from 'framer-motion';

export interface ControlBarControls {
  leave?: boolean;
  camera?: boolean;
  microphone?: boolean;
  screenShare?: boolean;
  chat?: boolean;
  website?: boolean; // for image gen button
  code?: boolean; // for coding version button
}

export interface AgentControlBarProps extends UseInputControlsProps {
  controls?: ControlBarControls;
  onDisconnect?: () => void;
  onChatOpenChange?: (open: boolean) => void;
  onDeviceError?: (error: { source: Track.Source; error: Error }) => void;
  onWebsiteClick?: () => void;
  onCodeClick?: () => void;
}

export function AgentControlBar({
  controls,
  saveUserChoices = true,
  className,
  onDisconnect,
  onDeviceError,
  onChatOpenChange,
  onWebsiteClick,
  onCodeClick,
  ...props
}: AgentControlBarProps & HTMLAttributes<HTMLDivElement>) {
  const { send } = useChat();
  const participants = useRemoteParticipants();
  const [chatOpen, setChatOpen] = useState(false);
  const publishPermissions = usePublishPermissions();
  const { isSessionActive, endSession } = useSession();

  const {
    micTrackRef,
    cameraToggle,
    microphoneToggle,
    screenShareToggle,
    handleAudioDeviceChange,
    handleVideoDeviceChange,
    handleMicrophoneDeviceSelectError,
    handleCameraDeviceSelectError,
  } = useInputControls({ onDeviceError, saveUserChoices });

  // Expose controls for Mini Mode IPC
  useCallback(() => {
    // @ts-ignore
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.vyaasParams = window.vyaasParams || {};
      // @ts-ignore
      window.vyaasParams.toggleMic = () => microphoneToggle.toggle();
      // @ts-ignore
      window.vyaasParams.toggleCamera = () => cameraToggle.toggle();
      // @ts-ignore
      window.vyaasParams.toggleScreen = () => screenShareToggle.toggle();
    }
  }, [microphoneToggle, cameraToggle, screenShareToggle])();

  const handleSendMessage = async (message: string) => {
    await send(message);
  };

  const handleToggleTranscript = useCallback(
    (open: boolean) => {
      setChatOpen(open);
      onChatOpenChange?.(open);
    },
    [onChatOpenChange, setChatOpen]
  );

  const handleDisconnect = useCallback(async () => {
    endSession();
    onDisconnect?.();
  }, [endSession, onDisconnect]);

  const handleWebsiteRedirect = () => {
    if (onWebsiteClick) {
      onWebsiteClick();
    } else {
      window.open('https://vyaasai.lovable.app/', '_blank');
    }
  };

  const handleCodingRedirect = () => {
    if (onCodeClick) {
      onCodeClick();
    } else {
      window.open('https://vyaas-code.lovable.app/', '_blank');
    }
  };

  const visibleControls = {
    leave: controls?.leave ?? true,
    microphone: controls?.microphone ?? publishPermissions.microphone,
    screenShare: controls?.screenShare ?? publishPermissions.screenShare,
    camera: controls?.camera ?? publishPermissions.camera,
    chat: controls?.chat ?? publishPermissions.data,
    website: controls?.website ?? true,
    code: controls?.code ?? true,
  };

  const isAgentAvailable = participants.some((p) => p.isAgent);

  return (
    <div
      aria-label="Voice assistant controls"
      className={cn('flex flex-col gap-3 md:gap-4 items-center w-full px-1 md:px-0', className)}
      {...props}
    >
      {visibleControls.chat && (
        <ChatInput
          chatOpen={chatOpen}
          isAgentAvailable={isAgentAvailable}
          onSend={handleSendMessage}
        />
      )}

      {/* Control Buttons - Mobile Optimized */}
      <div className="flex items-center gap-3 md:gap-3 flex-wrap justify-center">
        {/* Toggle Microphone */}
        {visibleControls.microphone && (
          <TrackSelector
            kind="audioinput"
            aria-label="Toggle microphone"
            source={Track.Source.Microphone}
            pressed={microphoneToggle.enabled}
            disabled={microphoneToggle.pending}
            audioTrackRef={micTrackRef}
            onPressedChange={microphoneToggle.toggle}
            onMediaDeviceError={handleMicrophoneDeviceSelectError}
            onActiveDeviceChange={handleAudioDeviceChange}
            className="h-12 w-12 md:h-12 md:w-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all hover:scale-105 active:scale-95"
          />
        )}

        {/* Toggle Camera */}
        {visibleControls.camera && (
          <TrackSelector
            kind="videoinput"
            aria-label="Toggle camera"
            source={Track.Source.Camera}
            pressed={cameraToggle.enabled}
            pending={cameraToggle.pending}
            disabled={cameraToggle.pending}
            onPressedChange={cameraToggle.toggle}
            onMediaDeviceError={handleCameraDeviceSelectError}
            onActiveDeviceChange={handleVideoDeviceChange}
            className="h-12 w-12 md:h-12 md:w-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all hover:scale-105 active:scale-95"
          />
        )}

        {/* Toggle Screen Share */}
        {visibleControls.screenShare && (
          <TrackToggle
            size="icon"
            variant="secondary"
            aria-label="Toggle screen share"
            source={Track.Source.ScreenShare}
            pressed={screenShareToggle.enabled}
            disabled={screenShareToggle.pending}
            onPressedChange={screenShareToggle.toggle}
            className="h-12 w-12 md:h-12 md:w-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all hover:scale-105 active:scale-95"
          />
        )}

        {/* Toggle Transcript */}
        {visibleControls.chat && (
          <Toggle
            size="icon"
            variant="secondary"
            aria-label="Toggle transcript"
            pressed={chatOpen}
            onPressedChange={handleToggleTranscript}
            className="h-12 w-12 md:h-12 md:w-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all hover:scale-105 active:scale-95"
          >
            <ChatTextIcon size={22} weight={chatOpen ? "fill" : "bold"} />
          </Toggle>
        )}

        {/* Separator */}
        <div className="w-px h-8 bg-white/20 mx-1" />

        {/* ✨ Image Generation Button */}
        {visibleControls.website && (
          <motion.button
            whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)' }}
            whileTap={{ scale: 0.9 }}
            onClick={handleWebsiteRedirect}
            className="h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 border border-white/20"
            aria-label="Open Image Generation Website"
          >
            <ImageSquareIcon size={22} weight="fill" />
          </motion.button>
        )}

        {/* 💻 Coding Version Button */}
        {visibleControls.code && (
          <motion.button
            whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCodingRedirect}
            className="h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30 border border-white/20"
            aria-label="Open Vyaas AI Coding Version"
          >
            <CodeIcon size={22} weight="fill" />
          </motion.button>
        )}


        {/* 🖥️ Mini Mode Button - Desktop Only */}
        {typeof window !== 'undefined' && (window.location.hostname === '127.0.0.1' || window.location.port === '3000') && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              // @ts-ignore
              if (window.pywebview?.api?.toggle_mini_mode) {
                // @ts-ignore
                await window.pywebview.api.toggle_mini_mode();
              }
            }}
            className="h-12 w-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all hover:scale-105 active:scale-95"
            aria-label="Toggle Mini Mode (F11)"
            title="Mini Mode (F11)"
          >
            <ArrowsInSimple size={22} weight="bold" />
          </motion.button>
        )}

        {/* Disconnect */}
        {visibleControls.leave && (
          <Button
            variant="destructive"
            onClick={handleDisconnect}
            disabled={!isSessionActive}
            className="h-12 px-5 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 hover:border-red-500/50 transition-all hover:scale-105 active:scale-95 ml-1"
          >
            <PhoneDisconnectIcon size={20} className="mr-2" weight="bold" />
            <span className="font-bold text-sm">END</span>
          </Button>
        )}
      </div>
    </div>
  );
}
