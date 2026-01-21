'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Prevent SSR for this component
const MiniModeContent = dynamic(() => import('@/components/app/mini-mode-content'), {
    ssr: false,
    loading: () => (
        <div className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="text-white/50 text-sm">Loading...</div>
        </div>
    ),
});

export default function MiniModePage() {
    return <MiniModeContent />;
}
