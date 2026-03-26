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

      case 'restart_pc':
        return await restartPc(params.delay ?? 60);

      case 'cancel_shutdown':
        return await cancelShutdown();

      case 'clipboard_read':
        return await clipboardRead();

      case 'get_active_window':
        return await getActiveWindow();

      case 'kill_process':
        return await killProcess(params.name || '');

      case 'list_processes':
        return await listProcesses();

      case 'set_brightness':
        return await setBrightness(params.level ?? 50);

      case 'toggle_wifi':
        return await toggleWifi(params.enable ?? true);

      case 'clean_temp':
        return await cleanTemp();

      case 'open_file':
        return await openFile(params.path || '');

      case 'open_folder':
        return await openFolder(params.path || '');

      case 'search_files':
        return await searchFiles(params.query || '', params.directory || '');

      case 'get_system_stats':
        return await getSystemStats();

      // === VISUAL INTELLIGENCE ===
      case 'screen_capture':
        return await screenCapture();

      case 'get_browser_tabs':
        return await getBrowserTabs();

      // === MOUSE CONTROL ===
      case 'mouse_click':
        return await mouseClick(params.x ?? 0, params.y ?? 0, params.button || 'left');

      case 'mouse_move':
        return await mouseMove(params.x ?? 0, params.y ?? 0);

      // === MULTI-STEP AUTOMATION ===
      case 'run_automation':
        return await runAutomation(params.steps || []);

      // === MEDIA CONTROL ===
      case 'spotify_control':
        return await spotifyControl(params.action || 'playpause');

      case 'media_control':
        return await mediaControl(params.action || 'playpause');

      // === SYSTEM TOGGLES ===
      case 'toggle_bluetooth':
        return await toggleBluetooth(params.enable ?? true);

      case 'toggle_dnd':
        return await toggleDnd(params.enable ?? true);

      // === RAG / FILE INTELLIGENCE ===
      case 'read_file_content':
        return await readFileContent(params.path || '', params.max_chars ?? 5000);

      case 'set_wallpaper':
        return await setWallpaper(params.path || '');

      case 'check_updates':
        return await checkUpdates();

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
    exec(cmd, { shell: true, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

async function openApp(appName) {
  const appLower = appName.toLowerCase().trim();
  const cmd = APP_MAPPINGS[appLower] || appName;

  log.info(`[LocalExecutor] Opening: ${appName} -> ${cmd}`);

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
  const keyMap = {
    enter: '{ENTER}', tab: '{TAB}', escape: '{ESC}',
    backspace: '{BS}', delete: '{DEL}',
    up: '{UP}', down: '{DOWN}', left: '{LEFT}', right: '{RIGHT}',
    space: ' ',
    f1: '{F1}', f2: '{F2}', f3: '{F3}', f4: '{F4}',
    f5: '{F5}', f6: '{F6}', f7: '{F7}', f8: '{F8}',
    f9: '{F9}', f10: '{F10}', f11: '{F11}', f12: '{F12}',
  };

  let sendKeysStr;
  if (key.includes('+')) {
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

async function restartPc(delay) {
  exec(`shutdown /r /t ${delay}`);
  return { success: true, message: `Restart in ${delay}s` };
}

async function cancelShutdown() {
  exec('shutdown /a');
  return { success: true, message: 'Shutdown cancelled' };
}

// ============== NEW ADVANCED COMMANDS ==============

async function clipboardRead() {
  const ps = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::GetText()`;
  const text = await runCmd(`powershell -Command "${ps}"`);
  return { success: true, message: text.trim() || '(clipboard empty)' };
}

async function getActiveWindow() {
  const ps = `
    Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    using System.Text;
    public class WinAPI {
      [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
      [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
      [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
    }
"@
    $h = [WinAPI]::GetForegroundWindow()
    $sb = New-Object Text.StringBuilder 256
    [WinAPI]::GetWindowText($h, $sb, 256)
    $pid = 0; [WinAPI]::GetWindowThreadProcessId($h, [ref]$pid)
    $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
    "$($sb.ToString())|$($proc.ProcessName)|$pid"
  `;
  const result = await runCmd(`powershell -Command "${ps.replace(/\n/g, '; ')}"`);
  const [title, procName, pid] = result.trim().split('|');
  return { success: true, message: JSON.stringify({ title, process: procName, pid }) };
}

async function killProcess(name) {
  const cleanName = name.replace(/[^a-zA-Z0-9._-]/g, '');
  await runCmd(`taskkill /IM "${cleanName}" /F`);
  return { success: true, message: `Killed ${name}` };
}

async function listProcesses() {
  const ps = `Get-Process | Sort-Object -Property WS -Descending | Select-Object -First 15 Name,Id,@{N='MemMB';E={[math]::Round($_.WS/1MB,1)}} | ConvertTo-Json`;
  const result = await runCmd(`powershell -Command "${ps}"`);
  return { success: true, message: result.trim() };
}

async function setBrightness(level) {
  level = Math.max(0, Math.min(100, level));
  const ps = `(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1,${level})`;
  await runCmd(`powershell -Command "${ps}"`);
  return { success: true, message: `Brightness set to ${level}%` };
}

async function toggleWifi(enable) {
  const action = enable ? 'enable' : 'disable';
  await runCmd(`netsh interface set interface "Wi-Fi" ${action}`);
  return { success: true, message: `Wi-Fi ${action}d` };
}

async function cleanTemp() {
  const ps = `
    $before = (Get-ChildItem $env:TEMP -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    Remove-Item "$env:TEMP\\*" -Recurse -Force -ErrorAction SilentlyContinue
    $after = (Get-ChildItem $env:TEMP -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $freed = [math]::Round(($before - $after)/1MB, 1)
    "Cleaned $freed MB"
  `;
  const result = await runCmd(`powershell -Command "${ps.replace(/\n/g, '; ')}"`);
  return { success: true, message: result.trim() };
}

async function openFile(filePath) {
  await shell.openPath(filePath);
  return { success: true, message: `Opened ${filePath}` };
}

async function openFolder(folderPath) {
  const target = folderPath || os.homedir();
  await shell.openPath(target);
  return { success: true, message: `Opened ${target}` };
}

async function searchFiles(query, directory) {
  const dir = directory || os.homedir();
  const ps = `Get-ChildItem -Path "${dir}" -Filter "*${query}*" -Recurse -ErrorAction SilentlyContinue -Depth 3 | Select-Object -First 10 FullName,Length,LastWriteTime | ConvertTo-Json`;
  const result = await runCmd(`powershell -Command "${ps}"`);
  return { success: true, message: result.trim() || 'No files found' };
}

async function getSystemStats() {
  const ps = `
    $cpu = (Get-WmiObject Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average
    $mem = Get-WmiObject Win32_OperatingSystem
    $usedGB = [math]::Round(($mem.TotalVisibleMemorySize - $mem.FreePhysicalMemory)/1MB, 1)
    $totalGB = [math]::Round($mem.TotalVisibleMemorySize/1MB, 1)
    $disk = Get-WmiObject Win32_LogicalDisk -Filter "DeviceID='C:'"
    $diskFreeGB = [math]::Round($disk.FreeSpace/1GB, 1)
    $diskTotalGB = [math]::Round($disk.Size/1GB, 1)
    $battery = Get-WmiObject Win32_Battery -ErrorAction SilentlyContinue
    $battPct = if($battery){$battery.EstimatedChargeRemaining}else{'N/A'}
    @{CPU="$cpu%";RAM="$usedGB/$totalGB GB";Disk="$diskFreeGB/$diskTotalGB GB free";Battery="$battPct%"} | ConvertTo-Json
  `;
  const result = await runCmd(`powershell -Command "${ps.replace(/\n/g, '; ')}"`);
  return { success: true, message: result.trim() };
}

module.exports = { execute };

// ============== VISUAL INTELLIGENCE ==============

async function screenCapture() {
  const pictures = path.join(os.homedir(), 'Pictures');
  const now = new Date();
  const filename = `screen_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}.png`;
  const filepath = path.join(pictures, filename);

  // Take screenshot and also return base64 for AI analysis
  const ps = `
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
    $bitmap.Save("${filepath.replace(/\\/g, '\\\\')}")
    $ms = New-Object System.IO.MemoryStream
    $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    [Convert]::ToBase64String($ms.ToArray())
    $ms.Dispose(); $bitmap.Dispose(); $graphics.Dispose()
  `;
  const base64 = await runCmd(`powershell -Command "${ps.replace(/\n/g, '; ')}"`);
  return { success: true, message: `Screenshot saved: ${filepath}`, data: base64.trim().substring(0, 50000) };
}

async function getBrowserTabs() {
  // Get active Chrome tab title and URL via accessibility
  const ps = `
    $chrome = Get-Process chrome -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowTitle -ne ""}
    if($chrome) {
      $chrome | Select-Object -First 3 MainWindowTitle | ForEach-Object { $_.MainWindowTitle }
    } else {
      $edge = Get-Process msedge -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowTitle -ne ""}
      if($edge) { $edge | Select-Object -First 3 MainWindowTitle | ForEach-Object { $_.MainWindowTitle } }
      else { "No browser open" }
    }
  `;
  const result = await runCmd(`powershell -Command "${ps.replace(/\n/g, '; ')}"`);
  return { success: true, message: result.trim() };
}

// ============== MOUSE CONTROL ==============

async function mouseClick(x, y, button) {
  const btnCode = button === 'right' ? '2' : '1';
  const ps = `
    Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    public class MouseOps {
      [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
      [DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
    }
"@
    [MouseOps]::SetCursorPos(${x}, ${y})
    Start-Sleep -Milliseconds 50
    [MouseOps]::mouse_event(${btnCode === '2' ? '0x0008' : '0x0002'}, 0, 0, 0, 0)
    Start-Sleep -Milliseconds 50
    [MouseOps]::mouse_event(${btnCode === '2' ? '0x0010' : '0x0004'}, 0, 0, 0, 0)
  `;
  await runCmd(`powershell -Command "${ps.replace(/\n/g, '; ')}"`);
  return { success: true, message: `Clicked at (${x}, ${y})` };
}

async function mouseMove(x, y) {
  const ps = `
    Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    public class MouseMove {
      [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
    }
"@
    [MouseMove]::SetCursorPos(${x}, ${y})
  `;
  await runCmd(`powershell -Command "${ps.replace(/\n/g, '; ')}"`);
  return { success: true, message: `Mouse moved to (${x}, ${y})` };
}

// ============== MULTI-STEP AUTOMATION ==============

async function runAutomation(steps) {
  const results = [];
  for (const step of steps) {
    try {
      const result = await execute(step);
      results.push({ command: step.command, ...result });
      // Wait between steps
      const delay = step.delay || 500;
      await new Promise(r => setTimeout(r, delay));
    } catch (err) {
      results.push({ command: step.command, success: false, message: err.message });
    }
  }
  return { success: true, message: JSON.stringify(results) };
}

// ============== MEDIA CONTROL ==============

async function spotifyControl(action) {
  const keyMap = {
    playpause: '{SPACE}',
    next: '^{RIGHT}',
    previous: '^{LEFT}',
    volumeup: '^{UP}',
    volumedown: '^{DOWN}',
  };

  // First try to focus Spotify
  const ps = `
    $spotify = Get-Process spotify -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowHandle -ne 0}
    if($spotify) {
      Add-Type @"
      using System;
      using System.Runtime.InteropServices;
      public class SpotifyCtrl {
        [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
      }
"@
      [SpotifyCtrl]::SetForegroundWindow($spotify.MainWindowHandle)
      Start-Sleep -Milliseconds 300
      Add-Type -AssemblyName System.Windows.Forms
      [System.Windows.Forms.SendKeys]::SendWait('${keyMap[action] || '{SPACE}'}')
      "OK"
    } else { "Spotify not running" }
  `;
  const result = await runCmd(`powershell -Command "${ps.replace(/\n/g, '; ')}"`);
  return { success: true, message: result.trim() };
}

async function mediaControl(action) {
  // System-wide media keys
  const keyMap = {
    playpause: 179, // VK_MEDIA_PLAY_PAUSE
    next: 176,      // VK_MEDIA_NEXT_TRACK
    previous: 177,  // VK_MEDIA_PREV_TRACK
    stop: 178,      // VK_MEDIA_STOP
  };
  const vk = keyMap[action] || 179;
  const ps = `
    Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    public class MediaKey {
      [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
    }
"@
    [MediaKey]::keybd_event(${vk}, 0, 0, 0)
    [MediaKey]::keybd_event(${vk}, 0, 2, 0)
  `;
  await runCmd(`powershell -Command "${ps.replace(/\n/g, '; ')}"`);
  return { success: true, message: `Media: ${action}` };
}

// ============== SYSTEM TOGGLES ==============

async function toggleBluetooth(enable) {
  const ps = enable
    ? `Add-Type -AssemblyName System.Runtime.WindowsRuntime; [Windows.Devices.Radios.Radio,Windows.System.Devices,ContentType=WindowsRuntime] | Out-Null; $radios = [Windows.Devices.Radios.Radio]::GetRadiosAsync().GetAwaiter().GetResult(); $bt = $radios | Where-Object { $_.Kind -eq 'Bluetooth' }; if($bt){ $bt.SetStateAsync('On').GetAwaiter().GetResult(); 'Bluetooth ON' } else { 'No Bluetooth radio found' }`
    : `Add-Type -AssemblyName System.Runtime.WindowsRuntime; [Windows.Devices.Radios.Radio,Windows.System.Devices,ContentType=WindowsRuntime] | Out-Null; $radios = [Windows.Devices.Radios.Radio]::GetRadiosAsync().GetAwaiter().GetResult(); $bt = $radios | Where-Object { $_.Kind -eq 'Bluetooth' }; if($bt){ $bt.SetStateAsync('Off').GetAwaiter().GetResult(); 'Bluetooth OFF' } else { 'No Bluetooth radio found' }`;
  try {
    const result = await runCmd(`powershell -Command "${ps}"`);
    return { success: true, message: result.trim() };
  } catch (e) {
    // Fallback: open Bluetooth settings
    await shell.openExternal('ms-settings:bluetooth');
    return { success: true, message: `Opened Bluetooth settings (direct toggle requires admin)` };
  }
}

async function toggleDnd(enable) {
  // Windows Focus Assist (DND)
  const ps = enable
    ? `Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings" -Name "NOC_GLOBAL_SETTING_TOASTS_ENABLED" -Value 0 -Type DWord -Force; "DND ON"`
    : `Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings" -Name "NOC_GLOBAL_SETTING_TOASTS_ENABLED" -Value 1 -Type DWord -Force; "DND OFF"`;
  try {
    const result = await runCmd(`powershell -Command "${ps}"`);
    return { success: true, message: result.trim() };
  } catch (e) {
    return { success: true, message: `DND toggled (may need restart to take effect)` };
  }
}

// ============== RAG / FILE INTELLIGENCE ==============

async function readFileContent(filePath, maxChars) {
  const fs = require('fs');
  const ext = path.extname(filePath).toLowerCase();

  // Text-based files
  if (['.txt', '.md', '.csv', '.json', '.js', '.py', '.html', '.css', '.xml', '.log', '.ini', '.cfg', '.yaml', '.yml', '.ts', '.jsx', '.tsx'].includes(ext)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, message: content.substring(0, maxChars) };
  }

  // PDF - extract text via PowerShell
  if (ext === '.pdf') {
    const ps = `
      Add-Type -Path "$env:USERPROFILE\\.nuget\\packages\\pdfsharp\\*\\lib\\net6.0\\PdfSharp.dll" -ErrorAction SilentlyContinue
      $text = ""
      try {
        $reader = [iTextSharp.text.pdf.PdfReader]::new("${filePath.replace(/\\/g, '\\\\')}")
        for($i=1; $i -le $reader.NumberOfPages; $i++) {
          $text += [iTextSharp.text.pdf.parser.PdfTextExtractor]::GetTextFromPage($reader, $i)
        }
      } catch {
        # Fallback: just report it's a PDF
        $text = "PDF file detected but text extraction library not available. File: ${filePath}"
      }
      $text
    `;
    try {
      const result = await runCmd(`powershell -Command "${ps.replace(/\n/g, '; ')}"`);
      return { success: true, message: result.trim().substring(0, maxChars) };
    } catch (e) {
      return { success: true, message: `PDF file: ${filePath} (install iTextSharp for text extraction)` };
    }
  }

  // DOCX - extract text
  if (ext === '.docx') {
    const ps = `
      $word = New-Object -ComObject Word.Application
      $word.Visible = $false
      $doc = $word.Documents.Open("${filePath.replace(/\\/g, '\\\\')}")
      $text = $doc.Content.Text
      $doc.Close($false)
      $word.Quit()
      $text
    `;
    try {
      const result = await runCmd(`powershell -Command "${ps.replace(/\n/g, '; ')}"`);
      return { success: true, message: result.trim().substring(0, maxChars) };
    } catch (e) {
      return { success: true, message: `DOCX file: ${filePath} (Word not available for extraction)` };
    }
  }

  return { success: false, message: `Unsupported file type: ${ext}` };
}

async function setWallpaper(imagePath) {
  const ps = `
    Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    public class Wallpaper {
      [DllImport("user32.dll", CharSet=CharSet.Auto)]
      public static extern int SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni);
    }
"@
    [Wallpaper]::SystemParametersInfo(0x0014, 0, "${imagePath.replace(/\\/g, '\\\\')}", 0x0001 -bor 0x0002)
  `;
  await runCmd(`powershell -Command "${ps.replace(/\n/g, '; ')}"`);
  return { success: true, message: `Wallpaper set: ${imagePath}` };
}

async function checkUpdates() {
  const ps = `
    try {
      $session = New-Object -ComObject Microsoft.Update.Session
      $searcher = $session.CreateUpdateSearcher()
      $result = $searcher.Search("IsInstalled=0")
      $count = $result.Updates.Count
      $titles = ($result.Updates | Select-Object -First 5 Title).Title -join "; "
      "$count updates available: $titles"
    } catch {
      "Windows Update check requires admin privileges or COM object unavailable"
    }
  `;
  const result = await runCmd(`powershell -Command "${ps.replace(/\n/g, '; ')}"`);
  return { success: true, message: result.trim() };
}

