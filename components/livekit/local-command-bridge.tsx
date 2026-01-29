"use client";

import { useDataChannel } from "@livekit/components-react";
import { useCallback, useEffect } from "react";

const BRIDGE_URL = "http://localhost:18790";
const BRIDGE_SECRET = "vyaas_local_bridge_2025";

interface LocalCommand {
    type: "local_command";
    command: string;
    params: Record<string, unknown>;
}

/**
 * LocalCommandBridge - Listens for local_commands from the AI agent
 * and executes them via the Desktop Bridge HTTP API.
 * 
 * This component runs in the frontend (desktop app) and bridges
 * cloud AI commands to local execution.
 */
export function LocalCommandBridge() {
    // Listen for data channel messages
    const { message } = useDataChannel("local_commands", (msg) => {
        // Data received on "local_commands" topic
        try {
            const decoder = new TextDecoder();
            const text = decoder.decode(msg.payload);
            const data = JSON.parse(text) as LocalCommand;

            if (data.type === "local_command") {
                executeLocalCommand(data.command, data.params);
            }
        } catch (error) {
            console.error("[LocalCommandBridge] Error parsing message:", error);
        }
    });

    // Execute command via local bridge
    const executeLocalCommand = useCallback(async (command: string, params: Record<string, unknown>) => {
        console.log(`[LocalCommandBridge] Executing: ${command}`, params);

        try {
            const response = await fetch(`${BRIDGE_URL}/command`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    secret: BRIDGE_SECRET,
                    command,
                    params,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`[LocalCommandBridge] Success:`, result);
            } else {
                console.error(`[LocalCommandBridge] Bridge error:`, response.status);
            }
        } catch (error) {
            console.error(`[LocalCommandBridge] Failed to connect to bridge:`, error);
            // Bridge might not be running - this is expected if user hasn't started it
        }
    }, []);

    // Check bridge health on mount
    useEffect(() => {
        const checkBridge = async () => {
            try {
                const response = await fetch(`${BRIDGE_URL}/health`);
                if (response.ok) {
                    console.log("[LocalCommandBridge] ✅ Desktop Bridge connected");
                }
            } catch {
                console.log("[LocalCommandBridge] ⚠️ Desktop Bridge not running");
            }
        };

        checkBridge();
    }, []);

    // This component is invisible - it just listens
    return null;
}
