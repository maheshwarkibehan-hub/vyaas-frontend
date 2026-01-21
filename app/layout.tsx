import { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import localFont from 'next/font/local';
import { SessionGuard } from '@/components/app/session-guard';
import { BroadcastListener } from '@/components/app/broadcast-listener';
import { ApplyThemeScript, ThemeToggle } from '@/components/app/theme-toggle';
import { cn, getAppConfig, getStyles } from '@/lib/utils';
import '@/styles/globals.css';
import './light-theme.css';
import './safe-area.css';

export const metadata: Metadata = {
  title: 'VYAAS AI - Your Intelligent AI Assistant',
  description: 'Experience the future of AI interaction with voice, chat, and image generation - all in one powerful platform',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
});

const commitMono = localFont({
  display: 'swap',
  variable: '--font-commit-mono',
  src: [
    {
      path: '../fonts/CommitMono-400-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/CommitMono-700-Regular.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/CommitMono-400-Italic.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../fonts/CommitMono-700-Italic.otf',
      weight: '700',
      style: 'italic',
    },
  ],
});

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const appConfig = await getAppConfig();
  const { pageTitle, pageDescription } = appConfig;
  const styles = getStyles(appConfig);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        outfit.variable,
        commitMono.variable,
        'scroll-smooth font-sans antialiased h-full w-full'
      )}
    >
      <head>
        {styles && <style>{styles}</style>}
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <ApplyThemeScript />

        {/* PWA Meta Tags */}
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7e22ce" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="VYAAS AI" />
        <link rel="apple-touch-icon" href="/vyaas-logo.png" />
      </head>
      <body className="h-full w-full overflow-hidden bg-background">
        <script dangerouslySetInnerHTML={{
          __html: `
          (function() {
            function adjustZoom() {
              var isPortrait = window.innerHeight > window.innerWidth;
              var viewport = document.querySelector('meta[name="viewport"]');
              if (viewport) {
                if (isPortrait) {
                  viewport.setAttribute('content', 'width=device-width, initial-scale=0.65, maximum-scale=5, user-scalable=yes');
                } else {
                  viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes');
                }
              }
            }
            adjustZoom();
            window.addEventListener('resize', adjustZoom);
            window.addEventListener('orientationchange', adjustZoom);
          })();
        `}} />
        <SessionGuard />
        <BroadcastListener />
        {children}
        <div className="group fixed bottom-0 left-1/2 z-50 mb-2 -translate-x-1/2">
          <ThemeToggle className="translate-y-20 transition-transform delay-150 duration-300 group-hover:translate-y-0" />
        </div>
      </body>
    </html>
  );
}
