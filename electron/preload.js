/**
 * preload.js
 * Secure IPC bridge exposing limited Electron APIs to the Next.js renderer
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vyaas', {
  // Local command execution (replaces Python bridge)
  executeLocalCommand: (data) => ipcRenderer.invoke('local:execute', data),

  // Window control  
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  getPlatform: () => process.platform,

  // System
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
});
