'use client';

import React from 'react';
import { useElectron } from '@/hooks/useElectron';
import { useConnectionState } from '@livekit/components-react';
import { Minus, Square, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/components/app/session-provider';

export function TitleBar() {
  const { isElectron, vyaasData } = useElectron();
  const connectionState = useConnectionState();
  const { isSessionActive } = useSession();

  // If not running in Electron, don't render the TitleBar
  if (!isElectron || !vyaasData) return null;

  const handleMinimize = () => vyaasData.minimizeWindow();
  const handleMaximize = () => vyaasData.maximizeWindow();
  const handleClose = () => vyaasData.closeWindow();

  const getStatusDot = () => {
    if (!isSessionActive) return 'bg-zinc-500/70';
    if (connectionState === 'connected') return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.7)]';
    if (connectionState === 'connecting' || connectionState === 'reconnecting') {
      return 'bg-yellow-500 animate-pulse';
    }
    return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]';
  };

  const statusText = !isSessionActive
    ? 'Idle'
    : connectionState === 'connected'
      ? 'Connected'
      : connectionState === 'connecting' || connectionState === 'reconnecting'
        ? 'Connecting...'
        : 'Disconnected';

  return (
    <div 
      className="fixed top-0 left-0 right-0 h-10 bg-background/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between z-[9999] select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left side - App Info */}
      <div className="flex items-center gap-3 px-4">
        <img src="/vyaas-logo.png" alt="Logo" className="w-5 h-5 rounded-sm grayscale" />
        <span className="text-xs font-bold uppercase tracking-wider text-foreground">
          Vyaas AI
        </span>
      </div>

      {/* Center - Connection Status */}
      <div 
        className="flex items-center gap-3 rounded-full border border-white/10 bg-card/80 px-4 py-1.5 shadow-clay-light-sm dark:shadow-clay-sm"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <div className={cn("h-2.5 w-2.5 rounded-full transition-all duration-300", getStatusDot())} />
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {statusText}
        </span>
      </div>

      {/* Right side - Window Controls */}
      <div 
        className="flex items-center h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button 
          onClick={handleMinimize}
          className="h-full px-4 hover:bg-white/10 active:bg-white/20 transition-colors text-muted-foreground hover:text-foreground"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button 
          onClick={handleMaximize}
          className="h-full px-4 hover:bg-white/10 active:bg-white/20 transition-colors text-muted-foreground hover:text-foreground"
        >
          <Square className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={handleClose}
          className="h-full px-4 hover:bg-red-500 active:bg-red-600 transition-colors text-muted-foreground hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
