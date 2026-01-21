'use client';

import { useState, useEffect } from 'react';

interface DeviceInfo {
    platform: string;
    model: string;
    manufacturer: string;
    isVirtual: boolean;
    operatingSystem: string;
    osVersion: string;
}

export interface ExtendedDeviceInfo extends DeviceInfo {
    isRealmePad?: boolean;
    isLargeScreen?: boolean;
    screenCategory?: 'phone' | 'small-tablet' | 'large-tablet' | 'desktop';
}

export function useDeviceInfo() {
    const [deviceInfo, setDeviceInfo] = useState<ExtendedDeviceInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getInfo = async () => {
            try {
                // Try to dynamically import Capacitor Device
                // @ts-ignore - Capacitor may not be installed
                const { Device } = await import('@capacitor/device');
                const info = await Device.getInfo();

                // Detect Realme Pad
                const isRealmePad = info.model?.toLowerCase().includes('realme pad') || false;

                // Detect large screen based on platform
                const isLargeScreen = info.platform === 'web' ?
                    window.innerWidth >= 1200 :
                    isRealmePad;

                // Categorize screen size
                let screenCategory: 'phone' | 'small-tablet' | 'large-tablet' | 'desktop' = 'phone';
                if (info.platform === 'web') {
                    const width = window.innerWidth;
                    if (width >= 1920) screenCategory = 'desktop';
                    else if (width >= 1200) screenCategory = 'large-tablet';
                    else if (width >= 768) screenCategory = 'small-tablet';
                } else {
                    // For native apps
                    if (isRealmePad) screenCategory = 'large-tablet';
                    else if (info.platform === 'android' || info.platform === 'ios') {
                        screenCategory = 'phone'; // Default for mobile
                    }
                }

                setDeviceInfo({
                    ...info,
                    isRealmePad,
                    isLargeScreen,
                    screenCategory,
                });
            } catch (error) {
                console.error('Error getting device info:', error);
                // Fallback to web detection
                setDeviceInfo({
                    platform: 'web',
                    model: 'Unknown',
                    manufacturer: 'Unknown',
                    isVirtual: false,
                    operatingSystem: 'unknown',
                    osVersion: 'unknown',
                    isRealmePad: false,
                    isLargeScreen: typeof window !== 'undefined' ? window.innerWidth >= 1200 : false,
                    screenCategory: typeof window !== 'undefined' && window.innerWidth >= 1200 ? 'large-tablet' : 'phone',
                } as ExtendedDeviceInfo);
            } finally {
                setLoading(false);
            }
        };

        getInfo();
    }, []);

    return {
        deviceInfo,
        loading,
        // Convenience flags
        isRealmePad: deviceInfo?.isRealmePad || false,
        isLargeScreen: deviceInfo?.isLargeScreen || false,
        screenCategory: deviceInfo?.screenCategory || 'phone',
        platform: deviceInfo?.platform || 'web',
        model: deviceInfo?.model || 'Unknown',
        manufacturer: deviceInfo?.manufacturer || 'Unknown',
    };
}
