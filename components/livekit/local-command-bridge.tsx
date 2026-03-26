"use client";

import { useEffect, useRef } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent, ConnectionState } from "livekit-client";

/**
 * LocalCommandBridge - Listens for local_commands from the AI agent
 * and executes them via Electron IPC. Also auto-starts screen share
 * in Electron so the AI agent can see the user's screen.
 */
export function LocalCommandBridge() {
    const room = useRoomContext();
    const screenShareStarted = useRef(false);

    // Auto-start screen share in Electron after room connects
    useEffect(() => {
        if (typeof window === "undefined" || !window.vyaas) return;
        if (screenShareStarted.current) return;

        const tryAutoScreenShare = () => {
            // Wait for vyaasParams.toggleScreen to be available
            if (window.vyaasParams?.toggleScreen) {
                console.log("[LocalCommandBridge] Auto-starting screen share for AI vision");
                screenShareStarted.current = true;
                setTimeout(() => {
                    window.vyaasParams?.toggleScreen?.();
                }, 3000); // Wait 3s after room connect for UI to settle
            } else {
                // Retry after a short delay
                setTimeout(tryAutoScreenShare, 1000);
            }
        };

        if (room.state === ConnectionState.Connected) {
            tryAutoScreenShare();
        } else {
            const onConnect = () => {
                tryAutoScreenShare();
            };
            room.on(RoomEvent.Connected, onConnect);
            return () => { room.off(RoomEvent.Connected, onConnect); };
        }
    }, [room]);

    // Listen for local commands from AI agent
    useEffect(() => {
        if (typeof window === "undefined" || !window.vyaas?.executeLocalCommand) return;

        const handleData = (
            payload: Uint8Array,
            participant?: unknown,
            kind?: unknown,
            topic?: string,
        ) => {
            if (topic !== "local_commands") return;

            try {
                const data = JSON.parse(new TextDecoder().decode(payload));

                if (data.type === "local_command") {
                    // Handle screen share toggle commands locally (not via Electron IPC)
                    if (data.command === "start_screen_share") {
                        console.log("[LocalCommandBridge] AI requested: START screen share");
                        if (window.vyaasParams?.toggleScreen) {
                            window.vyaasParams.toggleScreen();
                        }
                        return;
                    }
                    if (data.command === "stop_screen_share") {
                        console.log("[LocalCommandBridge] AI requested: STOP screen share");
                        if (window.vyaasParams?.toggleScreen) {
                            window.vyaasParams.toggleScreen();
                        }
                        return;
                    }

                    console.log(`[LocalCommandBridge] Executing: ${data.command}`, data.params);
                    window.vyaas!.executeLocalCommand!(data).then((result: any) => {
                        console.log("[LocalCommandBridge] Result:", result);
                    }).catch((err: any) => {
                        console.error("[LocalCommandBridge] Error:", err);
                    });
                }
            } catch (error) {
                console.error("[LocalCommandBridge] Error parsing message:", error);
            }
        };

        room.on(RoomEvent.DataReceived, handleData);
        return () => {
            room.off(RoomEvent.DataReceived, handleData);
        };
    }, [room]);

    // Invisible component - just listens
    return null;
}

