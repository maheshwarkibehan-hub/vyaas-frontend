'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MiniModeContextType {
    isMiniMode: boolean;
    setIsMiniMode: (value: boolean) => void;
}

const MiniModeContext = createContext<MiniModeContextType>({
    isMiniMode: false,
    setIsMiniMode: () => { },
});

// Check if running as desktop app
const isDesktopApp = typeof window !== 'undefined' && (
    window.location.hostname === '127.0.0.1' ||
    window.location.port === '3000'
);

export function MiniModeProvider({ children }: { children: ReactNode }) {
    const [isMiniMode, setIsMiniMode] = useState(false);

    useEffect(() => {
        if (!isDesktopApp) return;

        // Check for mini mode from pywebview periodically
        const checkMiniMode = async () => {
            // @ts-ignore
            if (window.pywebview?.api?.get_window_state) {
                try {
                    // @ts-ignore
                    const state = await window.pywebview.api.get_window_state();
                    setIsMiniMode(state.is_mini_mode);
                } catch (e) {
                    // Silently fail
                }
            }
        };

        const interval = setInterval(checkMiniMode, 200);
        return () => clearInterval(interval);
    }, []);

    return (
        <MiniModeContext.Provider value={{ isMiniMode, setIsMiniMode }}>
            {children}
        </MiniModeContext.Provider>
    );
}

export function useMiniMode() {
    return useContext(MiniModeContext);
}
