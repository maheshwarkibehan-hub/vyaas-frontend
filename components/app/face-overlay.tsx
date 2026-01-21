"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRoomContext } from "@livekit/components-react";
import type { TrackReferenceOrPlaceholder } from "@livekit/components-react";
import { toast } from "sonner";
import { FaceLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";

interface FaceOverlayProps {
    trackRef: TrackReferenceOrPlaceholder;
}

// Emotion derivation from blendshapes
const deriveEmotion = (blendshapes: { categoryName: string; score: number }[]): string => {
    const scores: Record<string, number> = {};
    blendshapes.forEach(b => scores[b.categoryName] = b.score);

    // Calculate composite emotion scores
    const happyScore = (scores.mouthSmileLeft || 0) + (scores.mouthSmileRight || 0);
    const sadScore = (scores.mouthFrownLeft || 0) + (scores.mouthFrownRight || 0) + (scores.browDownLeft || 0);
    const surpriseScore = (scores.browOuterUpLeft || 0) + (scores.browOuterUpRight || 0) + (scores.jawOpen || 0);
    const angryScore = (scores.browDownLeft || 0) + (scores.browDownRight || 0) + (scores.mouthUpperUpLeft || 0) * 0.5;

    // Determine dominant emotion
    const emotions = { happy: happyScore, sad: sadScore, surprised: surpriseScore, angry: angryScore };
    const sorted = Object.entries(emotions).sort((a, b) => b[1] - a[1]);

    if (sorted[0][1] > 0.4) return sorted[0][0];
    return "neutral";
};

export default function FaceOverlay({ trackRef }: FaceOverlayProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const landmarkerRef = useRef<FaceLandmarker | null>(null);
    const animationRef = useRef<number>(0);

    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [detectedEmotion, setDetectedEmotion] = useState<string>("neutral");
    const room = useRoomContext();

    // Initialize MediaPipe FaceLandmarker
    useEffect(() => {
        const initLandmarker = async () => {
            try {
                const filesetResolver = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
                );
                landmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: "/models/face_landmarker.task",
                        delegate: "GPU"
                    },
                    outputFaceBlendshapes: true,
                    outputFacialTransformationMatrixes: true,
                    runningMode: "VIDEO",
                    numFaces: 1
                });
                console.log("✅ MediaPipe FaceLandmarker Loaded!");
                setModelsLoaded(true);
            } catch (e) {
                console.error("❌ Failed to load FaceLandmarker:", e);
                toast.error("Failed to load Face AI. Check console.");
            }
        };
        initLandmarker();

        return () => {
            landmarkerRef.current?.close();
        };
    }, []);

    // Bind LiveKit video stream
    useEffect(() => {
        if (trackRef.publication?.track?.mediaStreamTrack && videoRef.current) {
            const stream = new MediaStream([trackRef.publication.track.mediaStreamTrack]);
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
                videoRef.current?.play().catch(e => console.error("Play error:", e));
            };
        }
    }, [trackRef]);

    // Send face event to backend
    const sendFaceEvent = useCallback((identity: string, emotion: string) => {
        if (room.localParticipant) {
            const payload = JSON.stringify({ type: 'face_event', identity, emotion });
            room.localParticipant.publishData(new TextEncoder().encode(payload), { topic: 'face_event' });
        }
    }, [room]);

    // Main detection loop
    useEffect(() => {
        if (!modelsLoaded || !videoRef.current || !canvasRef.current || !landmarkerRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const drawingUtils = new DrawingUtils(ctx);
        let lastEventTime = 0;

        const detectFace = async () => {
            if (video.readyState < 3) {
                animationRef.current = requestAnimationFrame(detectFace);
                return;
            }

            // Match canvas size to video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            try {
                const startTimeMs = performance.now();
                const results = landmarkerRef.current!.detectForVideo(video, startTimeMs);

                if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                    // Draw the face mesh (Connectors - looks high-tech!)
                    for (const landmarks of results.faceLandmarks) {
                        // Face Mesh Tesselation - Cool sci-fi look
                        drawingUtils.drawConnectors(
                            landmarks,
                            FaceLandmarker.FACE_LANDMARKS_TESSELATION,
                            { color: "#00ffcc30", lineWidth: 0.5 }
                        );
                        // Face Contours - Main outline
                        drawingUtils.drawConnectors(
                            landmarks,
                            FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
                            { color: "#00ffcc", lineWidth: 1.5 }
                        );
                        // Lips
                        drawingUtils.drawConnectors(
                            landmarks,
                            FaceLandmarker.FACE_LANDMARKS_LIPS,
                            { color: "#ff00cc", lineWidth: 1 }
                        );
                        // Eyes
                        drawingUtils.drawConnectors(
                            landmarks,
                            FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
                            { color: "#00ccff", lineWidth: 1 }
                        );
                        drawingUtils.drawConnectors(
                            landmarks,
                            FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
                            { color: "#00ccff", lineWidth: 1 }
                        );
                        // Eyebrows
                        drawingUtils.drawConnectors(
                            landmarks,
                            FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
                            { color: "#ffcc00", lineWidth: 1 }
                        );
                        drawingUtils.drawConnectors(
                            landmarks,
                            FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
                            { color: "#ffcc00", lineWidth: 1 }
                        );
                    }

                    // Process Blendshapes for Emotion
                    if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
                        const emotion = deriveEmotion(results.faceBlendshapes[0].categories);
                        setDetectedEmotion(emotion);

                        // Draw Emotion Label
                        ctx.fillStyle = "#fff";
                        ctx.font = "bold 18px 'Courier New', monospace";
                        ctx.shadowColor = "black";
                        ctx.shadowBlur = 4;
                        ctx.fillText(`EMOTION: ${emotion.toUpperCase()}`, 15, 30);
                        ctx.shadowBlur = 0;

                        // Send event (throttled)
                        const now = performance.now();
                        if (now - lastEventTime > 5000) { // Every 5 seconds max
                            lastEventTime = now;
                            sendFaceEvent("Bhaiya", emotion); // TODO: Identity logic
                        }
                    }
                }
            } catch (err) {
                // console.error("Detection error:", err);
            }

            animationRef.current = requestAnimationFrame(detectFace);
        };

        detectFace();

        return () => {
            cancelAnimationFrame(animationRef.current);
        };
    }, [modelsLoaded, sendFaceEvent, trackRef]);

    return (
        <div className="absolute inset-0 z-20 pointer-events-none">
            {/* Hidden video for MediaPipe processing */}
            <video ref={videoRef} autoPlay muted playsInline className="hidden" />

            {/* Overlay Canvas for Drawing */}
            <canvas
                ref={canvasRef}
                className="w-full h-full scale-x-[-1]"
            />

            {/* Status Indicator */}
            {modelsLoaded && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] text-green-300 font-mono uppercase tracking-wider">AI VISION ACTIVE</span>
                </div>
            )}
        </div>
    );
}
