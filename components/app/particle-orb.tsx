'use client';

import { useEffect, useRef } from 'react';
import { useVoiceAssistant } from '@livekit/components-react';

export function ParticleOrb() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { state, audioTrack } = useVoiceAssistant();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let particles: any[] = [];
        let animationFrameId: number;
        const particleCount = 600;
        const sphereRadius = 110; // Further reduced size

        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);

            particles.push({
                theta,
                phi,
                baseX: sphereRadius * Math.sin(phi) * Math.cos(theta),
                baseY: sphereRadius * Math.sin(phi) * Math.sin(theta),
                baseZ: sphereRadius * Math.cos(phi),
                size: Math.random() * 2 + 0.5,
                color: `rgba(255, 255, 255, ${Math.random() * 0.6 + 0.4})`, // Bright White
            });
        }

        let audioContext: AudioContext | null = null;
        let analyser: AnalyserNode | null = null;
        let dataArray: Uint8Array | null = null;

        const setupAudio = () => {
            if (!audioTrack || audioContext) return;

            // Try to extract the native MediaStreamTrack
            // @ts-ignore
            const track = audioTrack.publication?.track?.mediaStreamTrack || audioTrack.mediaStreamTrack;

            if (track) {
                try {
                    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    analyser = audioContext.createAnalyser();
                    const source = audioContext.createMediaStreamSource(new MediaStream([track]));
                    source.connect(analyser);
                    analyser.fftSize = 64;
                    dataArray = new Uint8Array(analyser.frequencyBinCount);
                } catch (e) {
                    console.error("Audio setup failed", e);
                }
            }
        };

        let rotation = 0;
        let idleTime = 0;

        const render = () => {
            if (audioTrack && !audioContext) setupAudio();

            let audioLevel = 0;
            if (analyser && dataArray) {
                try {
                    analyser.getByteFrequencyData(dataArray as any);
                    const sum = dataArray.reduce((a, b) => a + b, 0);
                    audioLevel = sum / dataArray.length;
                } catch (e) { /* ignore cleanup errors */ }
            }

            // Only animate strongly when audio is present
            const isSpeaking = audioLevel > 5;
            idleTime += 0.01;

            // Dynamic Rotation: Fast when speaking, slow wave when idle
            const targetSpeed = isSpeaking ? 0.03 : 0.003;
            rotation += targetSpeed;

            // Breathing effect when idle
            const breathe = isSpeaking ? 1 : (1 + Math.sin(idleTime) * 0.05);

            // Pulse effect when speaking (more responsive)
            const pulseFactor = isSpeaking ? (1 + (audioLevel / 255) * 1.2) : breathe;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            particles.forEach(p => {
                // 3D Rotation
                const x = p.baseX * Math.cos(rotation) - p.baseZ * Math.sin(rotation);
                const z = p.baseX * Math.sin(rotation) + p.baseZ * Math.cos(rotation);
                const y = p.baseY;

                // Apply Pulse & Breathe
                const finalX = x * pulseFactor;
                const finalY = y * pulseFactor;
                const finalZ = z * pulseFactor;

                // Perspective Projection
                const scale = 300 / (300 + finalZ);
                const projX = centerX + finalX * scale;
                const projY = centerY + finalY * scale;

                ctx.beginPath();
                ctx.arc(projX, projY, p.size * scale, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                // Removed shadow/glow
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            if (audioContext && audioContext.state !== 'closed') {
                try { audioContext.close(); } catch (e) { }
            }
        };
    }, [audioTrack, state]);

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <canvas
                ref={canvasRef}
                width={500}
                height={500}
                className="relative z-10 w-[400px] h-[400px]"
            />
        </div>
    );
}
