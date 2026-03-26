/**
 * local-executor.js
 * Executes local commands on the user's PC.
 * Receives commands from the renderer process via IPC.
 */
const { exec } = require('child_process');
const { shell } = require('electron');
const log = require('electron-log/main');
const path = require('path');
const os = require('os');

// App name → executable mapping (Windows)
const APP_MAPPINGS = {
  notepad: 'notepad',
  notes: 'notepad',
  calculator: 'calc',
  calc: 'calc',
  paint: 'mspaint',
  word: 'winword',
  excel: 'excel',
  powerpoint: 'powerpnt',
  outlook: 'outlook',
  'file explorer': 'explorer',
  explorer: 'explorer',
  cmd: 'cmd',
  'command prompt': 'cmd',
  terminal: 'wt',
  powershell: 'powershell',
  'task manager': 'taskmgr',
  settings: 'ms-settings:',
  'control panel': 'control',
  spotify: 'spotify',
  discord: 'discord',
  slack: 'slack',
  teams: 'msteams',
  zoom: 'zoom',
  vscode: 'code',
  'visual studio code': 'code',
  'vs code': 'code',
  chrome: 'chrome',
  firefox: 'firefox',
  edge: 'msedge',
  brave: 'brave',
  whatsapp: 'whatsapp:',
  telegram: 'telegram',
  camera: 'microsoft.windows.camera:',
  photos: 'ms-photos:',
  calendar: 'outlookcal:',
  mail: 'outlookmail:',
  maps: 'bingmaps:',
  store: 'ms-windows-store:',
  clock: 'ms-clock:',
  weather: 'bingweather:',
};

/**
 * Execute a local command
 * @param {{ command: string, params: object }} data
 * @returns {Promise<{ success: boolean, message: string }>}
 */
async function execute(data) {
  const { command, params = {} } = data;
  log.info(`[LocalExecutor] Executing: ${command}`, params);

  try {
    switch (command) {
      case 'open_app':
        return await openApp(params.app || '');

      case 'open_maps':
        return await openMaps(params.query || '');

      case 'open_notes':
        return await openNotes(params.content || '');

      case 'send_whatsapp':
        return await sendWhatsApp(params.phone || '', params.message || '');

      case 'send_whatsapp_contact':
        return await sendWhatsAppContact(params.contact || '', params.message || '');

      case 'type_text':
        return await typeText(params.text || '');

      case 'press_key':
        return await pressKey(params.key || '');

      case 'open_url':
        return await openUrl(params.url || '');

      case 'play_youtube':
        return await playYoutube(params.query || '');

      case 'screenshot':
        return await takeScreenshot();

      case 'set_volume':
        return await setVolume(params.level ?? 50);

      case 'lock_pc':
        return await lockPc();

      case 'shutdown':
        return await shutdownPc(params.delay ?? 60);

      case 'cancel_shutdown':
        return await cancelShutdown();

      default:
        log.warn(`[LocalExecutor] Unknown command: ${command}`);
        return { success: false, message: `Unknown command: ${command}` };
    }
  } catch (err) {
    log.error(`[LocalExecutor] Error executing ${command}: ${err.message}`);
    return { success: false, message: err.message };
  }
}

// ============== COMMAND IMPLEMENTATIONS ==============

function runCmd(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { shell: true }, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

async function openApp(appName) {
  const appLower = appName.toLowerCase().trim();
  const cmd = APP_MAPPINGS[appLower] || appName;

  log.info(`[LocalExecutor] Opening: ${appName} -> ${cmd}`);

  // URI schemes (whatsapp:, ms-settings:, etc.)
  if (cmd.endsWith(':') || cmd.includes('://')) {
    await shell.openExternal(cmd);
  } else {
    exec(`start "" "${cmd}"`, { shell: true });
  }

  return { success: true, message: `Opened ${appName}` };
}

async function openMaps(query) {
  const url = query
    ? `https://www.google.com/maps/search/${encodeURIComponent(query)}`
    : 'https://www.google.com/maps';
  await shell.openExternal(url);
  return { success: true, message: `Opened Maps${query ? ': ' + query : ''}` };
}

async function openNotes(content) {
  exec('notepad', { shell: true });

  if (content) {
    // Wait for Notepad to open, then paste via PowerShell
    await new Promise((r) => setTimeout(r, 1500));
    const escaped = content.replace(/'/g, "''");
    const ps = `
      Add-Type -AssemblyName System.Windows.Forms
      [System.Windows.Forms.Clipboard]::SetText('${escaped}')
      Start-Sleep -Milliseconds 300
      [System.Windows.Forms.SendKeys]::SendWait('^v')
    `;
    exec(`powershell -Command "${ps.replace(/\n/g, '; ')}"`, { shell: true });
  }

  return { success: true, message: 'Opened Notepad' + (content ? ' with content' : '') };
}

async function sendWhatsApp(phone, message) {
  const cleanPhone = phone.replace(/\D/g, '');
  const uri = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  await shell.openExternal(uri);
  return { success: true, message: `WhatsApp sent to ${phone}` };
}

async function sendWhatsAppContact(contact, message) {
  // Open WhatsApp and search for contact via PowerShell automation
  await shell.openExternal('whatsapp:');
  await new Promise((r) => setTimeout(r, 5000));

  const ps = `
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait('{ESCAPE}')
    Start-Sleep -Milliseconds 200
    [System.Windows.Forms.SendKeys]::SendWait('^f')
    Start-Sleep -Milliseconds 500
    [System.Windows.Forms.Clipboard]::SetText('${contact.replace(/'/g, "''")}')
    [System.Windows.Forms.SendKeys]::SendWait('^v')
    Start-Sleep -Milliseconds 1000
    [System.Windows.Forms.SendKeys]::SendWait('{DOWN}{ENTER}')
    Start-Sleep -Milliseconds 1000
    [System.Windows.Forms.Clipboard]::SetText('${message.replace(/'/g, "''")}')
    [System.Windows.Forms.SendKeys]::SendWait('^v')
    Start-Sleep -Milliseconds 200
    [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
  `;
  exec(`powershell -Command "${ps.replace(/\n/g, '; ')}"`, { shell: true });

  return { success: true, message: `WhatsApp sent to ${contact}` };
}

async function typeText(text) {
  const escaped = text.replace(/'/g, "''");
  const ps = `
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.Clipboard]::SetText('${escaped}')
    Start-Sleep -Milliseconds 100
    [System.Windows.Forms.SendKeys]::SendWait('^v')
  `;
  exec(`powershell -Command "${ps.replace(/\n/g, '; ')}"`, { shell: true });
  return { success: true, message: 'Text typed' };
}

async function pressKey(key) {
  // Map common key names to SendKeys format
  const keyMap = {
    enter: '{ENTER}',
    tab: '{TAB}',
    escape: '{ESC}',
    backspace: '{BS}',
    delete: '{DEL}',
    up: '{UP}',
    down: '{DOWN}',
    left: '{LEFT}',
    right: '{RIGHT}',
    space: ' ',
    f1: '{F1}', f2: '{F2}', f3: '{F3}', f4: '{F4}',
    f5: '{F5}', f6: '{F6}', f7: '{F7}', f8: '{F8}',
    f9: '{F9}', f10: '{F10}', f11: '{F11}', f12: '{F12}',
  };

  let sendKeysStr;
  if (key.includes('+')) {
    // Handle combos like ctrl+s, alt+f4
    const parts = key.toLowerCase().split('+');
    let prefix = '';
    let mainKey = '';
    for (const p of parts) {
      if (p === 'ctrl') prefix += '^';
      else if (p === 'alt') prefix += '%';
      else if (p === 'shift') prefix += '+';
      else mainKey = keyMap[p] || p;
    }
    sendKeysStr = prefix + mainKey;
  } else {
    sendKeysStr = keyMap[key.toLowerCase()] || key;
  }

  const ps = `
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait('${sendKeysStr}')
  `;
  exec(`powershell -Command "${ps.replace(/\n/g, '; ')}"`, { shell: true });
  return { success: true, message: `Pressed ${key}` };
}

async function openUrl(url) {
  await shell.openExternal(url);
  return { success: true, message: `Opened ${url}` };
}

async function playYoutube(query) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  await shell.openExternal(url);
  return { success: true, message: `YouTube: ${query}` };
}

async function takeScreenshot() {
  const pictures = path.join(os.homedir(), 'Pictures');
  const now = new Date();
  const filename = `screenshot_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}.png`;
  const filepath = path.join(pictures, filename);

  const ps = `
    Add-Type -AssemblyName System.Windows.Forms
    $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
    $bitmap.Save("${filepath.replace(/\\/g, '\\\\')}")
  `;
  await runCmd(`powershell -Command "${ps.replace(/\n/g, '; ')}"`);
  return { success: true, message: `Screenshot saved: ${filepath}` };
}

async function setVolume(level) {
  level = Math.max(0, Math.min(100, level));
  const ps = `
    $obj = New-Object -ComObject WScript.Shell
    1..50 | ForEach-Object { $obj.SendKeys([char]174) }
    1..${Math.floor(level / 2)} | ForEach-Object { $obj.SendKeys([char]175) }
  `;
  exec(`powershell -Command "${ps.replace(/\n/g, '; ')}"`, { shell: true });
  return { success: true, message: `Volume set to ${level}%` };
}

async function lockPc() {
  exec('rundll32.exe user32.dll,LockWorkStation');
  return { success: true, message: 'PC locked' };
}

async function shutdownPc(delay) {
  exec(`shutdown /s /t ${delay}`);
  return { success: true, message: `Shutdown in ${delay}s` };
}

async function cancelShutdown() {
  exec('shutdown /a');
  return { success: true, message: 'Shutdown cancelled' };
}

module.exports = { execute };
