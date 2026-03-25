import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Room, RoomEvent, TokenSource } from 'livekit-client';
import { AppConfig } from '@/app-config';
import { toastAlert } from '@/components/livekit/alert-toast';
import { auth } from '@/lib/firebase';

export function useRoom(appConfig: AppConfig) {
  const aborted = useRef(false);
  const room = useMemo(() => new Room(), []);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const chatIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    function onDisconnected() {
      setIsSessionActive(false);
    }

    function onMediaDevicesError(error: Error) {
      toastAlert({
        title: 'Encountered an error with your media devices',
        description: `${error.name}: ${error.message}`,
      });
    }

    room.on(RoomEvent.Disconnected, onDisconnected);
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);

    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
    };
  }, [room]);

  useEffect(() => {
    return () => {
      aborted.current = true;
      room.disconnect();
    };
  }, [room]);

  const tokenSource = useMemo(
    () =>
      TokenSource.custom(async () => {
        const url = new URL(
          process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? '/api/connection-details',
          window.location.origin
        );

        try {
          // Get current user from Firebase Auth
          const user = auth.currentUser;

          const res = await fetch(url.toString(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Sandbox-Id': appConfig.sandboxId ?? '',
            },
            body: JSON.stringify({
              username: user?.email, // Send email as username
              chatId: chatIdRef.current, // Pass chatId if user wants to resume
              room_config: appConfig.agentName
                ? {
                  agents: [{ agent_name: appConfig.agentName }],
                }
                : undefined,
            }),
          });
          return await res.json();
        } catch (error) {
          console.error('Error fetching connection details:', error);
          const err = error as Error;
          // Removed debug alert - errors will be shown via toast notifications
          throw new Error(`Error fetching connection details! ${err.message}`);
        }
      }),
    [appConfig]
  );

  const connectToRoom = useCallback(() => {
    const { isPreConnectBufferEnabled } = appConfig;
    Promise.all([
      room.localParticipant.setMicrophoneEnabled(true, undefined, {
        preConnectBuffer: isPreConnectBufferEnabled,
      }).catch((e) => {
        console.warn("Failed to enable microphone early: ", e);
      }),
      tokenSource
        .fetch({ agentName: appConfig.agentName })
        .then((connectionDetails) => {
          // Store connection details for mini mode via Python API
          localStorage.setItem('vyaas_mini_mode_room', JSON.stringify({
            serverUrl: connectionDetails.serverUrl,
            token: connectionDetails.participantToken
          }));
          // Also try Python API for desktop app
          // @ts-ignore
          if (window.pywebview?.api?.set_room_data) {
            // @ts-ignore
            window.pywebview.api.set_room_data(
              connectionDetails.serverUrl,
              connectionDetails.participantToken
            );
          }
          return room.connect(connectionDetails.serverUrl, connectionDetails.participantToken, {
            autoSubscribe: true,
          });
        }),
    ]).catch((error) => {
      if (aborted.current) {
        return;
      }
      toastAlert({
        title: 'There was an error connecting to the agent',
        description: `${error.name}: ${error.message}`,
      });
    });
  }, [room, appConfig, tokenSource]);

  const startSession = useCallback((chatId?: string) => {
    // Set the specific chat ID this session should resume
    chatIdRef.current = chatId;
    setIsSessionActive(true);

    if (room.state === 'disconnected') {
      connectToRoom();
    } else {
      // Already connected — disconnect first, then reconnect with new chatId
      room.disconnect().then(() => {
        connectToRoom();
      });
    }
  }, [room, connectToRoom]);

  const endSession = useCallback(() => {
    setIsSessionActive(false);
    // Clear mini mode room data
    localStorage.removeItem('vyaas_mini_mode_room');
    // Also clear via Python API for desktop app
    // @ts-ignore
    if (window.pywebview?.api?.clear_room_data) {
      // @ts-ignore
      window.pywebview.api.clear_room_data();
    }
  }, []);

  return { room, isSessionActive, startSession, endSession };
}
