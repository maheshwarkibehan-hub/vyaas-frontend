"use client";

import { useEffect } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";

/**
 * LocalCommandBridge - Listens for local_commands from the AI agent
 * and executes them via Electron IPC (no Python bridge needed).
 */
export function LocalCommandBridge() {
    const room = useRoomContext();

    useEffect(() => {
        // Only works in Electron
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
