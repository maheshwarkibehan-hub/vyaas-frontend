const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;
const isDev = !app.isPackaged;

// Paths
const backendExe = isDev
    ? path.join(__dirname, '../../Backend/dist/VyaasAI_Brain.exe')
    : path.join(process.resourcesPath, 'backend/VyaasAI_Brain.exe');

// Static files location (Next.js 'out' folder)
const staticDir = isDev
    ? path.join(__dirname, '../out')
    : path.join(__dirname, '..', 'out');

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        title: "Vyaas AI",
        icon: path.join(__dirname, '../public/vyaas-logo.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        autoHideMenuBar: true,
        show: false
    });

    // 1. Start Backend (The Brain)
    console.log("Starting Vyaas Brain...", backendExe);
    try {
        if (require('fs').existsSync(backendExe)) {
            backendProcess = spawn(backendExe, [], {
                cwd: path.dirname(backendExe),
                stdio: 'ignore'
            });
        } else {
            console.error("Backend EXE not found at:", backendExe);
        }
    } catch (e) {
        console.error("Failed to start backend:", e);
    }

    // 2. Load Static HTML (No Server Needed)
    const indexPath = path.join(staticDir, 'index.html');
    console.log("Loading static UI from:", indexPath);

    mainWindow.loadFile(indexPath);

    mainWindow.on('ready-to-show', () => mainWindow.show());

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// App Lifecycle
app.on('ready', createWindow);

app.on('window-all-closed', () => {
    // Kill child processes
    if (backendProcess) backendProcess.kill();

    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    if (backendProcess) backendProcess.kill();
});
