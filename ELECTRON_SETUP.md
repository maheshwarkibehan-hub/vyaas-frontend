# Vyaas AI — Electron Setup & Instructions

Your brand new, modern **Vyaas AI** Electron desktop app has been successfully generated inside your current frontend codebase!

## 🚀 Setup & Testing

### 1. Install Dependencies
You need to install the newly added dependencies (`electron`, `electron-builder`, `electron-store`, `electron-updater`, `wait-on`):
```bash
pnpm install
```

### 2. Run Development Mode
To test the Electron app locally with your Next.js hot-reloading dev server:
```bash
pnpm run electron:dev
```
*   This automatically builds the Next.js server on `localhost:3000`.
*   It waits for the port to be ready using `wait-on`.
*   Then it starts the `electron` wrapper.
*   The Title Bar should detect it's within Electron and render natively, and it will spawn your local python script bridging in the background!

### 3. Build For Production (Windows `.exe`)
When you're ready to share or install the app natively on Windows:
```bash
pnpm run app:build
```
This runs: `next build && next export && electron-builder build --win`. It bundles your Python script `vyaas_desktop_bridge.py` alongside your `dist_electron` build to ensure zero dependency requirements for the final `.exe` user.

## 📁 What We Handled For You:

1.  **Bridged Lifecycle (`electron/bridge-manager.js`)**: It launches `vyaas_desktop_bridge.py` via `python` or `python3` (depending on OS). It intercepts STDOUT/ERR for debugging inside `%APPDATA%/agent-starter-react/logs/vyaas_bridge.log` and automatically restarts on failures. It kills Python cleanly when the user quits.
2.  **Frameless UX (`preload.js` + `TitleBar.tsx`)**: The window is entirely frameless (`frame: false`). We injected the custom `TitleBar` to allow dragging the window, maximizing/minimizing, and also visually indicating if the bridge is **running (green)**, **restarting (yellow)**, or **dead (red)**.
3.  **Background Operation (`tray.js` + `main.js`)**: Closing the window now minimizes it to the **System Tray**. Right-clicking the tray icon lets you force-restart the bridge or properly quit.
4.  **Security**: We utilized Context Isolation. Node APIs remain tightly locked away from the renderer. Links are intercepted, ensuring arbitrary anchor elements strictly open safely in the system's default browser (Chrome/Edge) using `shell.openExternal`.
5.  **Single Instance**: Added a lock ensuring users can't mistakenly open multiple overlapping agents.

Enjoy your new seamless desktop experience!
