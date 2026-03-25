import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';

export const InteractiveBackground = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [dimensions, setDimensions] = useState({ w: 1920, h: 1080 });
    const containerRef = useRef<HTMLDivElement>(null);

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setDimensions({ w: window.innerWidth, h: window.innerHeight });
        setIsMobile(window.innerWidth < 768);

        const handleMouseMove = (e: MouseEvent) => {
            if (window.innerWidth >= 768) {
                setMousePosition({ x: e.clientX, y: e.clientY });
            }
        };

        const handleResize = () => {
            setDimensions({ w: window.innerWidth, h: window.innerHeight });
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Primary cursor-follow springs
    const springConfig = { damping: 20, stiffness: 120 };
    const trailingConfig = { damping: 35, stiffness: 30 };
    const slowTrailConfig = { damping: 50, stiffness: 15 };

    const x = useSpring(mousePosition.x, springConfig);
    const y = useSpring(mousePosition.y, springConfig);

    // Trailing aura (slower follow)
    const trailX = useSpring(mousePosition.x, trailingConfig);
    const trailY = useSpring(mousePosition.y, trailingConfig);

    // Deep trailing aura (even slower)
    const deepX = useSpring(mousePosition.x, slowTrailConfig);
    const deepY = useSpring(mousePosition.y, slowTrailConfig);

    // Normalize mouse position for parallax (0 to 1)
    const normX = mousePosition.x / dimensions.w;
    const normY = mousePosition.y / dimensions.h;

    return (
        <div ref={containerRef} className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#050507]">
            
            {/* Base ambient gradient - subtle warm/cool zones */}
            <div className="absolute inset-0">
                <div 
                    className="absolute w-[140%] h-[140%] -left-[20%] -top-[20%] transition-transform duration-[3000ms] ease-out"
                    style={{
                        background: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.015) 0%, transparent 60%)',
                        transform: `translate(${(normX - 0.5) * 20}px, ${(normY - 0.5) * 15}px)`,
                    }}
                />
                <div 
                    className="absolute w-[140%] h-[140%] -right-[20%] -bottom-[20%] transition-transform duration-[3000ms] ease-out"
                    style={{
                        background: 'radial-gradient(ellipse at 70% 80%, rgba(255,255,255,0.02) 0%, transparent 60%)',
                        transform: `translate(${(0.5 - normX) * 20}px, ${(0.5 - normY) * 15}px)`,
                    }}
                />
            </div>

            {/* Grid lines - subtle parallax response */}
            <div 
                className="absolute inset-0 transition-transform duration-[2000ms] ease-out opacity-[0.03]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
                    `,
                    backgroundSize: '80px 80px',
                    transform: `translate(${(normX - 0.5) * -8}px, ${(normY - 0.5) * -8}px)`,
                }}
            />

            {/* Deep trailing glow - largest, slowest (Disabled on Mobile) */}
            {!isMobile && (
                <motion.div
                    className="absolute w-[1200px] h-[1200px] rounded-full"
                    style={{
                        x: deepX,
                        y: deepY,
                        translateX: '-50%',
                        translateY: '-50%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 55%)',
                        willChange: 'transform',
                    }}
                />
            )}

            {/* Trailing aura - medium speed (Disabled on Mobile) */}
            {!isMobile && (
                <motion.div
                    className="absolute w-[900px] h-[900px] rounded-full"
                    style={{
                        x: trailX,
                        y: trailY,
                        translateX: '-50%',
                        translateY: '-50%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 55%)',
                        willChange: 'transform',
                    }}
                />
            )}

            {/* Primary spotlight - fast follow */}
            {!isMobile && (
                <motion.div
                    className="absolute w-[600px] h-[600px] rounded-full"
                    style={{
                        x,
                        y,
                        translateX: '-50%',
                        translateY: '-50%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 30%, transparent 60%)',
                        willChange: 'transform',
                    }}
                />
            )}

            {/* Inner bright core (Lightweight for Mobile/Desktop) */}
            <motion.div
                className="absolute w-[200px] h-[200px] rounded-full"
                style={{
                    x: isMobile ? dimensions.w / 2 : x,
                    y: isMobile ? dimensions.h / 2 : y,
                    translateX: '-50%',
                    translateY: '-50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
                    willChange: 'transform',
                }}
            />

            {/* Floating ambient orbs - parallax reactive */}
            <div 
                className="absolute w-[300px] h-[300px] rounded-full opacity-[0.04] transition-transform duration-[4000ms] ease-out"
                style={{
                    top: '15%',
                    left: '10%',
                    background: 'radial-gradient(circle, white 0%, transparent 70%)',
                    transform: `translate(${(normX - 0.5) * 30}px, ${(normY - 0.5) * 20}px)`,
                }}
            />
            <div 
                className="absolute w-[200px] h-[200px] rounded-full opacity-[0.03] transition-transform duration-[4500ms] ease-out"
                style={{
                    top: '60%',
                    right: '8%',
                    background: 'radial-gradient(circle, white 0%, transparent 70%)',
                    transform: `translate(${(0.5 - normX) * 25}px, ${(0.5 - normY) * 20}px)`,
                }}
            />
            <div 
                className="absolute w-[250px] h-[250px] rounded-full opacity-[0.025] transition-transform duration-[5000ms] ease-out"
                style={{
                    bottom: '20%',
                    left: '40%',
                    background: 'radial-gradient(circle, white 0%, transparent 70%)',
                    transform: `translate(${(normX - 0.5) * -20}px, ${(normY - 0.5) * 15}px)`,
                }}
            />

            {/* Breathing pulse overlay */}
            <motion.div 
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0"
                style={{
                    background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.01) 0%, transparent 50%)',
                }}
            />

            {/* Vignette overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#050507_120%)] pointer-events-none z-20" />
        </div>
    );
};
