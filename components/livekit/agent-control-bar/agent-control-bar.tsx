
'use client';

import { type HTMLAttributes, useCallback, useState } from 'react';
import { Track } from 'livekit-client';
import { useChat, useRemoteParticipants } from '@livekit/components-react';
import { ChatTextIcon, PhoneDisconnectIcon, ImageSquareIcon, CodeIcon } from '@phosphor-icons/react/dist/ssr';
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
}

export function AgentControlBar({
  controls,
  saveUserChoices = true,
  className,
  onDisconnect,
  onDeviceError,
  onChatOpenChange,
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
    window.open('https://vyaasai.lovable.app/', '_blank');
  };

  const handleCodingRedirect = () => {
    window.open('https://vyaas-code.lovable.app/', '_blank');
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
      className={cn('flex flex-col gap-4 items-center', className)}
      {...props}
    >
      {visibleControls.chat && (
        <ChatInput
          chatOpen={chatOpen}
          isAgentAvailable={isAgentAvailable}
          onSend={handleSendMessage}
        />
      )}

      <div className="flex items-center gap-3">
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
            className="h-12 w-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105"
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
            className="h-12 w-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105"
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
            className="h-12 w-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105"
          />
        )}

        {/* Toggle Transcript */}
        <Toggle
          size="icon"
          variant="secondary"
          aria-label="Toggle transcript"
          pressed={chatOpen}
          onPressedChange={handleToggleTranscript}
          className="h-12 w-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105"
        >
          <ChatTextIcon size={24} weight={chatOpen ? "fill" : "bold"} />
        </Toggle>

        {/* Separator */}
        <div className="w-px h-8 bg-white/10 mx-1" />

        {/* ✨ Image Generation Button */}
        {visibleControls.website && (
          <motion.button
            whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleWebsiteRedirect}
            className="h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20 border border-white/10"
            aria-label="Open Image Generation Website"
          >
            <ImageSquareIcon size={24} weight="fill" />
          </motion.button>
        )}

        {/* 💻 Coding Version Button */}
        {visibleControls.code && (
          <motion.button
            whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCodingRedirect}
            className="h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20 border border-white/10"
            aria-label="Open Vyaas AI Coding Version"
          >
            <CodeIcon size={24} weight="fill" />
          </motion.button>
        )}

        {/* Disconnect */}
        {visibleControls.leave && (
          <Button
            variant="destructive"
            onClick={handleDisconnect}
            disabled={!isSessionActive}
            className="h-12 px-6 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 transition-all hover:scale-105 ml-2"
          >
            <PhoneDisconnectIcon size={24} weight="bold" className="mr-2" />
            <span className="font-bold">END</span>
          </Button>
        )}
      </div>
    </div>
  );
}
