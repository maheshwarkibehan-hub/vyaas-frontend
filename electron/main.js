/**
 * main.js
 * Entry point for Vyaas AI Electron Application
 */
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const log = require('electron-log/main');
const localExecutor = require('./local-executor');
const { createTray } = require('./tray');
const fs = require('fs');

// Make sure logging is initialized
log.initialize();
log.info('Vyaas AI Application Starting...');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

/** @type {BrowserWindow | null} */
let mainWindow = null;

function getWindowIconPath() {
  const candidates = [
    path.join(__dirname, '..', 'public', 'vyaas-logo.ico'),
    path.join(__dirname, '..', 'public', 'vyaas-logo.png'),
    path.join(__dirname, '..', 'app', 'icon.png'),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 650,
    frame: false, // Frameless window
    transparent: process.platform === 'darwin', // MacOS vibrancy support
    vibrancy: process.platform === 'darwin' ? 'under-window' : undefined,
    visualEffectState: 'active',
    icon: getWindowIconPath(),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    show: false, // Don't show until ready
  });

  // Load the Next.js app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    // Open the DevTools only in dev
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'out', 'index.html'));
  }

  // Splash screen logic
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle close to minimize to tray
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });

  // Create the tray
  try {
    createTray(mainWindow);
  } catch (error) {
    log.error(`[Tray] Failed to initialize tray: ${error.message}`);
  }

  // Securely intercept external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

// Single instance lock event
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized() || !mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  // Local command execution IPC
  ipcMain.handle('local:execute', async (event, data) => {
    return await localExecutor.execute(data);
  });

  // Window controls  
  ipcMain.handle('window:minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });
  ipcMain.handle('window:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });
  ipcMain.handle('window:close', () => {
    if (mainWindow) mainWindow.hide();
  });
  
  ipcMain.handle('app:version', () => app.getVersion());
  
  ipcMain.handle('shell:openExternal', (event, url) => {
    if (url.startsWith('http') || url.startsWith('mailto')) {
      shell.openExternal(url);
    }
  });

  // Create UI Window
  createWindow();

  // Setup auto-updater if packaged
  if (!isDev) {
    setTimeout(() => {
      const { autoUpdater } = require('electron-updater');
      autoUpdater.checkForUpdatesAndNotify();
    }, 3000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  log.info('Vyaas AI Application Quitting...');
});
