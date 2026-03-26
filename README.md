# Vyaas AI Frontend (Cross-Platform)

**Vyaas AI Frontend** is the user-facing application for the Vyaas AI personal desktop and mobile assistant. It is built as a highly responsive, cross-platform mono-codebase supporting the Web, Android (via Capacitor), and Windows/Desktop (via Electron).

This repository contains the Next.js React application, complex UI components, realtime WebSocket handlers, and native bridges needed to securely communicate with the LiveKit backend agent.

## 🚀 Key Features

*   **Cross-Platform Architecture:**
    *   **Web/PWA:** Runs seamlessly in the browser.
    *   **Desktop (Electron):** Packs the core AI brain alongside the frontend for a portable, native Windows/macOS experience (`VyaasAI_Brain.exe` binding).
    *   **Android (Capacitor):** Wraps the web view in native Android APIs for deep device integration.
*   **Realtime Voice/Video AI:** Deeply integrates `@livekit/components-react` to stream audio/video securely from the user's device directly to the AI agent.
*   **Authentication & State Management:**
    *   **Firebase Auth:** For secure, robust user sign-ins and identity.
    *   **Supabase Realtime:** Maintains live data synchronization for credits, active subscription plan limits, and instant push notifications (`user_notifications` and `admin_updates`).
*   **Advanced Modern UI/UX:** Built with TailwindCSS v3, Framer Motion, and Radix UI primitives. It features "Claymorphism" and modern monochrome/glass textures, interactive states (like dynamic Snowfall), and a floating navigational pill.
*   **Feature-Rich Interface:** 
    *   **Credit/Token System:** Tracks API usage, visualizes credit balances, and includes a built-in Pricing & Checkout flow.
    *   **Floating Mini Bar & Mini Mode:** A compact desktop widget-like view that runs seamlessly over other applications.
    *   **History & Inbox Drawers:** For reviewing past chat/agent logs and receiving system notifications.

## 📁 Architecture & Directory Structure

1.  ### `app/` & `components/`
    The core Next.js 14 Web UI. `components/app/app.tsx` acts as the primary layout wrapper handling deep state initialization: Firebase Auth checks, Supabase socket connections, user plan polling, and LiveKit session context injection.
    
2.  ### `electron/`
    Scripts and configurations necessary to build the desktop `.exe` package. It bundles `next:dev` or `out/` bundles with the Electron shell to run Vyaas as a standalone local application.
    
3.  ### `android/` & `capacitor.config.ts`
    Leverages Ionic Capacitor to compile this exact React application into a native `.apk`/`.aab` package, giving it permissions for the Android camera, microphone, file system, and push services.

4.  ### `lib/` & `hooks/`
    Shared utilities for connecting to Supabase (`lib/supabase.ts`), Firebase (`lib/firebase.ts`), handling local subscriptions (`lib/subscription.ts`), and global utility classes.

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local` and configure your credentials:

```properties
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
NEXT_PUBLIC_FIREBASE_API_KEY="..."
# Add your other Firebase / LiveKit specific public keys here
```

## 🛠️ Scripts & Setup

Install dependencies using `pnpm` (highly recommended):
```bash
pnpm install
```

### Web Development
To run the Next.js development server locally alongside the backend:
```bash
pnpm run dev
# Or just next.js alone:
pnpm run next:dev
```

### Desktop App (Electron) Build
```bash
# Builds the frontend and creates a Windows executable
pnpm run app:build
```

### Android Build
*(Requires Android Studio & Java SDK)*
```bash
pnpm build
npx cap sync android
npx cap open android
```
