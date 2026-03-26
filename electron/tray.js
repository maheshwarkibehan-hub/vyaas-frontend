/**
 * tray.js
 * Configures the system tray icon and custom context menu
 */
const { app, Menu, Tray } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log/main');

/** @type {Tray | null} */
let tray = null;

function getIconPath() {
  const candidates = [
    path.join(__dirname, '..', 'public', 'vyaas-logo.png'),
    path.join(__dirname, '..', 'public', 'logo.png'),
    path.join(__dirname, '..', 'app', 'icon.png'),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

/**
 * Setup the tray behavior
 * @param {import('electron').BrowserWindow} mainWindow 
 */
function createTray(mainWindow) {
  if (tray) return tray;

  const iconPath = getIconPath();
  if (!iconPath) {
    log.warn('[Tray] No tray icon found. Skipping tray initialization.');
    return null;
  }

  tray = new Tray(iconPath);
  tray.setToolTip('Vyaas AI');
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Vyaas',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        mainWindow.destroy();
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  return tray;
}

module.exports = {
  createTray
};
