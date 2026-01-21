import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, X, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GoogleMapComponentProps {
    location: string | null;
    onClose: () => void;
    className?: string;
    queryType?: string;
}

export function GoogleMapComponent({ location, onClose, className, queryType = 'place' }: GoogleMapComponentProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [activeLocation, setActiveLocation] = useState<string | null>(null);

    useEffect(() => {
        if (location) {
            setActiveLocation(location);
            setIsLoading(true);
        }
    }, [location]);

    if (!activeLocation) return null;

    // Construct generic embed URL based on query type
    let mapSrc = "";
    const zoomLevel = queryType === 'directions' ? 11 : 15; // Deeper zoom for places
    const mapType = (queryType === 'view' || queryType === 'directions') ? 'h' : 'm'; // h = Hybrid (Satellite + Labels), m = Map

    if (queryType === 'directions') {
        // For directions, we use the directions mode (requires origin/dest, but basic search works too if properly formatted)
        // Since we only have one location string, we keep using search mode but with satellite view
        mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(activeLocation)}&t=${mapType}&z=${zoomLevel}&ie=UTF8&iwloc=&output=embed`;
    } else {
        mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(activeLocation)}&t=${mapType}&z=${zoomLevel}&ie=UTF8&iwloc=&output=embed`;
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={cn(
                "relative w-full h-full rounded-[2rem] overflow-hidden border border-white/20 bg-[#1a1a1a]/80 backdrop-blur-xl shadow-[0_0_30px_rgba(255,255,255,0.03)]",
                className
            )}
        >
            {/* Header Bar */}
            <div className="absolute top-0 left-0 right-0 h-14 bg-black/40 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 z-20">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                        <MapPin size={16} />
                    </div>
                    <span className="text-sm font-bold text-white tracking-wide uppercase">{activeLocation}</span>
                </div>

                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Loading State */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 flex items-center justify-center bg-[#1a1a1a]"
                    >
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                            <span className="text-xs text-white/40 tracking-widest uppercase">Locating...</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Map Iframe */}
            <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={mapSrc}
                onLoad={() => setIsLoading(false)}
                className="w-full h-full opacity-90 grayscale-[20%] contrast-[1.1] hover:grayscale-0 transition-all duration-700 invert-[0.9] hue-rotate-180"
                // Note: The invert/hue-rotate filter is a CSS hack to make the standard white map look "dark mode". 
                // It's not perfect but fits the theme without an API key.
                style={{ border: 0 }}
                allowFullScreen
            />

            {/* Overlay to re-tint the inverted map to match app theme better */}
            <div className="absolute inset-0 bg-blue-900/10 pointer-events-none mix-blend-overlay z-[5]" />

        </motion.div>
    );
}
