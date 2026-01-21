import { useState, useEffect } from 'react';

export const BREAKPOINTS = {
    mobile: 480,      // Phones (under 480px)
    tablet: 768,      // Tablets (480-768px)
    desktop: 1024,    // Desktop (768-1024px)
    wide: 1920,       // Wide screens (1024+)
} as const;

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'wide';
export type Orientation = 'portrait' | 'landscape';

// Realme Pad specs: 10.4-inch, 2000x1200
const REALME_PAD_WIDTH = 2000;
const REALME_PAD_HEIGHT = 1200;
const LARGE_TABLET_MIN_WIDTH = 1200; // 10"+ tablets

export function useDeviceType(): DeviceType {
    const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

    useEffect(() => {
        const updateDeviceType = () => {
            const width = window.innerWidth;
            if (width < BREAKPOINTS.mobile) {
                setDeviceType('mobile');
            } else if (width < BREAKPOINTS.tablet) {
                setDeviceType('tablet');
            } else if (width < BREAKPOINTS.desktop) {
                setDeviceType('desktop');
            } else {
                setDeviceType('wide');
            }
        };

        updateDeviceType();
        window.addEventListener('resize', updateDeviceType);
        return () => window.removeEventListener('resize', updateDeviceType);
    }, []);

    return deviceType;
}

export function useOrientation(): Orientation {
    const [orientation, setOrientation] = useState<Orientation>('portrait');

    useEffect(() => {
        const updateOrientation = () => {
            setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
        };

        updateOrientation();
        window.addEventListener('resize', updateOrientation);
        return () => window.removeEventListener('resize', updateOrientation);
    }, []);

    return orientation;
}

export function useIsMobile(): boolean {
    const deviceType = useDeviceType();
    return deviceType === 'mobile';
}

export function useIsTablet(): boolean {
    const deviceType = useDeviceType();
    return deviceType === 'tablet';
}

export function useIsRealmePad(): boolean {
    const [isRealmePad, setIsRealmePad] = useState(false);

    useEffect(() => {
        const checkRealmePad = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            // Check for Realme Pad resolution (landscape or portrait)
            const isRealme = (width === REALME_PAD_WIDTH && height === REALME_PAD_HEIGHT) ||
                (width === REALME_PAD_HEIGHT && height === REALME_PAD_WIDTH);
            setIsRealmePad(isRealme);
        };

        checkRealmePad();
        window.addEventListener('resize', checkRealmePad);
        return () => window.removeEventListener('resize', checkRealmePad);
    }, []);

    return isRealmePad;
}

export function useIsLargeTablet(): boolean {
    const [isLargeTablet, setIsLargeTablet] = useState(false);

    useEffect(() => {
        const checkLargeTablet = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const maxDimension = Math.max(width, height);
            setIsLargeTablet(maxDimension >= LARGE_TABLET_MIN_WIDTH);
        };

        checkLargeTablet();
        window.addEventListener('resize', checkLargeTablet);
        return () => window.removeEventListener('resize', checkLargeTablet);
    }, []);

    return isLargeTablet;
}

export function useResponsive() {
    const deviceType = useDeviceType();
    const orientation = useOrientation();
    const isRealmePad = useIsRealmePad();
    const isLargeTablet = useIsLargeTablet();

    return {
        deviceType,
        orientation,
        isMobile: deviceType === 'mobile',
        isTablet: deviceType === 'tablet',
        isDesktop: deviceType === 'desktop' || deviceType === 'wide',
        isPortrait: orientation === 'portrait',
        isLandscape: orientation === 'landscape',
        isRealmePad,
        isLargeTablet,
    };
}
