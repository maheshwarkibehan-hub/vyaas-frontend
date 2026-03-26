'use client';

import { useEffect } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

declare global {
  interface Window {
    vyaas?: {
      executeLocalCommand?: (data: {
        command: string;
        params: Record<string, unknown>;
      }) => Promise<{ success: boolean; message: string }>;
      minimizeWindow?: () => Promise<void>;
      maximizeWindow?: () => Promise<void>;
      closeWindow?: () => Promise<void>;
      getAppVersion?: () => Promise<string>;
      getPlatform?: () => string;
      openExternal?: (url: string) => Promise<void>;
    };
  }
}

/**
 * Hook that listens for local_command data messages from the cloud agent
 * and forwards them to Electron main process for local execution.
 * Only active when running inside Electron.
 */
export function useLocalCommands() {
  const room = useRoomContext();

  useEffect(() => {
    // Only works in Electron
    if (!window.vyaas?.executeLocalCommand) return;

    const handleData = (
      payload: Uint8Array,
      participant?: unknown,
      kind?: unknown,
      topic?: string,
    ) => {
      if (topic !== 'local_commands') return;

      try {
        const decoder = new TextDecoder();
        const data = JSON.parse(decoder.decode(payload));

        if (data.type === 'local_command') {
          console.log('[LocalCommands] Received:', data.command, data.params);
          window.vyaas!.executeLocalCommand!(data).then((result) => {
            console.log('[LocalCommands] Result:', result);
          }).catch((err) => {
            console.error('[LocalCommands] Error:', err);
          });
        }
      } catch (err) {
        console.error('[LocalCommands] Parse error:', err);
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room]);
}
