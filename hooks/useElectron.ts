'use client';

import { useEffect, useState } from 'react';

export interface VyaasElectronAPI {
  executeLocalCommand: (data: {
    command: string;
    params: Record<string, unknown>;
  }) => Promise<{ success: boolean; message: string }>;

  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  
  getAppVersion: () => Promise<string>;
  getPlatform: () => string;
  openExternal: (url: string) => Promise<void>;
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    vyaas?: VyaasElectronAPI;
  }
}

/**
 * Hook to interact with Electron's IPC securely via preload.js (window.vyaas)
 * Returns `isElectron: false` if running in standard browser/web
 */
export function useElectron() {
  const [isElectron, setIsElectron] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.vyaas) {
      setIsElectron(true);
    }
  }, []);

  return {
    isElectron,
    vyaasData: typeof window !== 'undefined' ? window.vyaas : undefined,
  };
}
