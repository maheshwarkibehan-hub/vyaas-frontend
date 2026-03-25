
"use client";
import { usePorcupine } from "@picovoice/porcupine-react";
import { BuiltInKeyword } from "@picovoice/porcupine-web";
import { useEffect, useState } from "react";

// User must provide this in .env.local
const ACCESS_KEY = process.env.NEXT_PUBLIC_PORCUPINE_ACCESS_KEY;

interface WakeWordListenerProps {
    onWake: () => void;
}

export function WakeWordListener({ onWake }: WakeWordListenerProps) {
    const [hasError, setHasError] = useState(false);

    const {
        keywordDetection,
        isLoaded,
        isListening,
        error,
        init,
        start,
        stop,
    } = usePorcupine();

    useEffect(() => {
        if (!ACCESS_KEY) {
            console.warn("Porcupine Access Key missing. Wake word disabled.");
            return;
        }

        try {
            init(
                ACCESS_KEY,
                BuiltInKeyword.Jarvis,
                { label: "Jarvis" }
            );
        } catch (e) {
            console.error("Failed to init Porcupine:", e);
            setHasError(true);
        }
    }, []);

    useEffect(() => {
        if (error) {
            console.error("Porcupine Error:", error);
            setHasError(true);
        }
    }, [error]);

    useEffect(() => {
        if (isLoaded && !isListening && !hasError) {
            start().catch(e => console.error("Failed to start listening:", e));
        }
    }, [isLoaded, isListening, hasError]);

    useEffect(() => {
        if (keywordDetection !== null && keywordDetection.label === "Jarvis") {
            console.log("Wake Word Detected: Jarvis");
            onWake();
        }
    }, [keywordDetection]);

    return null;
}
