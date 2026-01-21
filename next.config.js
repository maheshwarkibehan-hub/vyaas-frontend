const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
    buildExcludes: [/middleware-manifest\\.json$/],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    devIndicators: false,

    // For Android/Capacitor: 'export'
    // For Electron/Docker: 'standalone' (Bundles server for API routes)
    // output: 'standalone', // DISABLED: Windows symlink errors on OneDrive
    output: 'export', // Static export for Android/Electron compatibility

    // Disable image optimization for static export
    images: {
        unoptimized: true,
    },

    // Skip type checking during build (for faster builds)
    typescript: {
        ignoreBuildErrors: true,
    },

    // Skip ESLint during build (for faster builds)
    eslint: {
        ignoreDuringBuilds: true,
    },

    // Compiler optimizations
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },

    // Modularize imports for tree-shaking
    modularizeImports: {
        'lucide-react': {
            transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
        },
    },

    // Headers for PWA
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                ]
            }
        ];
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                crypto: false,
            };
        }
        return config;
    },
};

module.exports = nextConfig;

