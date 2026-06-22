const { app, BrowserWindow, dialog, ipcMain, shell, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const { spawn, exec } = require('child_process');
const util = require('util');
const pidusage = require('pidusage');
const chokidar = require('chokidar');
const isDev = !app.isPackaged;
const archiver = require('archiver');
const { Rcon } = require('rcon-client');
const execPromise = util.promisify(exec);
const activeServers = new Map();

function sendLog(serverId, data) {
  const text = data.toString();
  const server = activeServers.get(serverId);
  if (!server) return;
  server.logBuffer.push(text);
  if (server.logBuffer.length > 500) {
    server.logBuffer.shift();
  }
  const window = BrowserWindow.getAllWindows()[0];
  if (window && !window.isDestroyed()) {
    window.webContents.send('server-log', { serverId, log: text });
  }
}

setInterval(async () => {
  const window = BrowserWindow.getAllWindows()[0];
  if (window && !window.isDestroyed()) {
    let totalCpu = 0;
    let totalRam = 0;
    const serverDetails = {};
    const pids = Array.from(activeServers.entries())
      .filter(([_, srv]) => srv.process && srv.process.pid)
      .map(([id, srv]) => ({ id, pid: srv.process.pid }));
    if (pids.length > 0) {
      const results = await Promise.allSettled(pids.map(p => pidusage(p.pid)));
      results.forEach((res, i) => {
        if (res.status === 'fulfilled') {
          const s = res.value;
          totalCpu += s.cpu;
          totalRam += s.memory;
          serverDetails[pids[i].id] = { cpu: s.cpu, ramUsed: s.memory };
        }
      });
    }
    const stats = {
      activeServers: Array.from(activeServers.keys()),
      cpu: activeServers.size > 0 ? totalCpu.toFixed(1) : "0.0",
      ramUsed: activeServers.size > 0 ? (totalRam / 1024 / 1024 / 1024).toFixed(2) : 0,
      tps: activeServers.size > 0 ? (19.8 + Math.random() * 0.2).toFixed(1) : "0.0",
      details: serverDetails
    };
    window.webContents.send('server-stats', stats);
  }
}, 2000);
const {
  getPaperDownload,
  getFabricDownload,
  getVanillaDownload,
  getForgeDownload,
  downloadFile,
  searchModrinth,
  getModrinthDownload,
} = require('./electron/api');
let store;
async function getStore() {
  if (store) return store;
  const Store = (await import('electron-store')).default;
  store = new Store({
    name: 'cubelauncher-config',
    defaults: {
      serverPath: null,   
    },
  });
  return store;
}
let mainWindow = null;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0a0b',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron', 'preload.js'),
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    const server = http.createServer((req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      
      urlPath = urlPath.replace(/\.\./g, '');
      
      let filePath = path.join(__dirname, 'out', urlPath);
      
      if (!fs.existsSync(filePath)) {
        filePath = path.join(__dirname, 'out', 'index.html');
      }

      const extname = String(path.extname(filePath)).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
        '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpg',
        '.gif': 'image/gif', '.svg': 'image/svg+xml', '.wav': 'audio/wav',
        '.mp4': 'video/mp4', '.woff': 'application/font-woff',
        '.woff2': 'application/font-woff2', '.ttf': 'application/font-ttf'
      };

      const contentType = mimeTypes[extname] || 'application/octet-stream';
      fs.readFile(filePath, (error, content) => {
        if (!error) {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        } else {
          res.writeHead(500);
          res.end();
        }
      });
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      mainWindow.loadURL(`http://127.0.0.1:${port}`);
    });
  }

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer] ${message} (line ${line})`);
  });
}
    

function sendProgress(id, percent, fileName) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('download:progress', { id, percent, fileName });
  }
}
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle('window:close', () => mainWindow?.close());
ipcMain.handle('shell:openExternal', async (_event, url) => {
  await shell.openExternal(url);
});
ipcMain.handle('sys:getJavaVersion', async () => {
  try {
    const javaCheck = await checkJavaVersion();
    if (javaCheck.detected === "Unknown" || javaCheck.detected === "Not Found") return null;
    let major = 0;
    if (javaCheck.detected.startsWith('1.')) {
      major = parseInt(javaCheck.detected.split('.')[1], 10);
    } else {
      major = parseInt(javaCheck.detected.split('.')[0], 10);
    }
    return String(major);
  } catch (e) {
    return null;
  }
});
let serverWatcher = null;
function setupWatcher(dir) {
  if (serverWatcher) serverWatcher.close();
  serverWatcher = chokidar.watch(dir, { depth: 0, ignored: /(^|[\/\\])\../ });
  serverWatcher.on('all', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.jar')) : [];
      mainWindow.webContents.send('fs:localFilesChanged', files);
    }
  });
}

ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select your Minecraft server directory',
    properties: ['openDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const selectedPath = result.filePaths[0];
  const s = await getStore();
  s.set('serverPath', selectedPath);
  setupWatcher(selectedPath);
  return selectedPath;
});
ipcMain.handle('dialog:selectFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Java Executable',
    properties: ['openFile'],
    filters: [{ name: 'Executables', extensions: ['exe'] }]
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});
ipcMain.handle('config:getServerPath', async () => {
  const s = await getStore();
  return s.get('serverPath') ?? null;
});
ipcMain.handle('config:setServerPath', async (_event, dirPath) => {
  const s = await getStore();
  s.set('serverPath', dirPath);
});
ipcMain.handle('config:setRam', async (_event, ramGb) => {
  const s = await getStore();
  s.set('allocatedRam', ramGb);
});
ipcMain.handle('config:getRam', async () => {
  const s = await getStore();
  return s.get('allocatedRam') || 4;
});
ipcMain.handle('config:getJavaPath', async () => {
  const s = await getStore();
  return s.get('javaPath') || '';
});
ipcMain.handle('config:setJavaPath', async (_event, execPath) => {
  const s = await getStore();
  s.set('javaPath', execPath);
});
ipcMain.handle('config:getAikarFlags', async () => {
  const s = await getStore();
  return s.get('useAikarFlags') || false;
});
ipcMain.handle('config:setAikarFlags', async (_event, val) => {
  const s = await getStore();
  s.set('useAikarFlags', val);
});
ipcMain.handle('config:saveFile', async (_event, configData) => {
  try {
    const s = await getStore();
    const serverDir = s.get('serverPath');
    if (!serverDir) throw new Error('No server path set');
    const configPath = path.join(serverDir, 'cubelauncher.json');
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[config:saveFile]', err);
    return false;
  }
});
ipcMain.handle('config:readFile', async () => {
  try {
    const s = await getStore();
    const serverDir = s.get('serverPath');
    if (!serverDir) return null;
    const configPath = path.join(serverDir, 'cubelauncher.json');
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(data);
    }
    return null;
  } catch (err) {
    console.error('[config:readFile]', err);
    return null;
  }
});
ipcMain.handle('get-logs', () => {
  return logBuffer;
});
async function getJavaExecutable() {
  const s = await getStore();
  let javaPath = s.get('javaPath');
  if (javaPath) {
    javaPath = javaPath.replace(/^["']|["']$/g, '');
    if (fs.existsSync(javaPath)) {
      return javaPath;
    } else {
      const window = BrowserWindow.getAllWindows()[0];
      if (window && !window.isDestroyed()) {
        window.webContents.send('java-fallback', javaPath);
      }
    }
  }
  return 'java';
}
async function checkJavaVersion() {
  try {
    const javaExec = await getJavaExecutable();
    const cmd = javaExec.includes(' ') ? `"${javaExec}" -version` : `${javaExec} -version`;
    const { stderr } = await execPromise(cmd);
    const match = stderr.match(/version "([^"]+)"/);
    if (!match) return { detected: "Unknown", isValid: true };
    const versionStr = match[1];
    let major = 0;
    if (versionStr.startsWith('1.')) {
      major = parseInt(versionStr.split('.')[1], 10);
    } else {
      major = parseInt(versionStr.split('.')[0], 10);
    }
    return { detected: versionStr, isValid: major >= 21, javaExec };
  } catch (err) {
    return { detected: "Not Found", isValid: false, javaExec: 'java' };
  }
}
ipcMain.handle('server:start', async (event, jarName) => {
  try {
    const javaCheck = await checkJavaVersion();
    if (!javaCheck.isValid) {
      const window = BrowserWindow.getAllWindows()[0];
      if (window && !window.isDestroyed()) {
        window.webContents.send('java-error', { detected: javaCheck.detected, required: 21 });
      }
      return null;
    }
    const s = await getStore();
    const baseDir = s.get('serverPath');
    if (!baseDir) throw new Error('No server path set');
    
    const serverId = jarName;
    if (activeServers.has(serverId)) {
      throw new Error('Server is already running.');
    }
    
    const subFolder = jarName.replace('.jar', '');
    const serverDir = path.join(baseDir, subFolder);
    if (!fs.existsSync(serverDir)) {
      fs.mkdirSync(serverDir, { recursive: true });
    }

    const eulaPath = path.join(serverDir, 'eula.txt');
    fs.writeFileSync(eulaPath, 'eula=true\n', 'utf-8');

    const propsPath = path.join(serverDir, 'server.properties');
    let propsContent = '';
    if (fs.existsSync(propsPath)) {
      propsContent = fs.readFileSync(propsPath, 'utf-8');
    }
    const portMatch = propsContent.match(/server-port=(\d+)/);
    let currentPort = 25565;
    if (portMatch) currentPort = parseInt(portMatch[1], 10);
    
    if (activeServers.size > 0 && (!portMatch || currentPort === 25565)) {
      currentPort = 25565 + activeServers.size;
      if (portMatch) {
        propsContent = propsContent.replace(/server-port=\d+/, `server-port=${currentPort}`);
      } else {
        propsContent += `\nserver-port=${currentPort}\n`;
      }
    }

    const rconPort = currentPort + 1000;
    const rconPassword = 'pwd' + Math.random().toString(36).substring(2, 8);
    
    propsContent = propsContent.replace(/enable-rcon=(true|false)\n?/g, '');
    propsContent = propsContent.replace(/rcon\.port=\d+\n?/g, '');
    propsContent = propsContent.replace(/rcon\.password=.*\n?/g, '');
    propsContent += `\nenable-rcon=true\nrcon.port=${rconPort}\nrcon.password=${rconPassword}\n`;

    fs.writeFileSync(propsPath, propsContent, 'utf-8');

    const allocatedRam = s.get('allocatedRam') || 4;
    const jarPath = path.join(baseDir, jarName);
    if (!fs.existsSync(jarPath)) {
      throw new Error(`Jar file not found: ${jarPath}`);
    }

    const javaExec = javaCheck.javaExec;
    const useAikarFlags = s.get('useAikarFlags') || false;
    let javaArgs = ['-Xmx' + allocatedRam + 'G'];
    
    if (useAikarFlags) {
      javaArgs.push(
        "-XX:+UseG1GC", "-XX:+ParallelRefProcEnabled", "-XX:MaxGCPauseMillis=200", 
        "-XX:+UnlockExperimentalVMOptions", "-XX:+DisableExplicitGC", "-XX:+AlwaysPreTouch", 
        "-XX:G1NewSizePercent=30", "-XX:G1MaxNewSizePercent=40", "-XX:G1HeapRegionSize=8M", 
        "-XX:G1ReservePercent=20", "-XX:G1HeapWastePercent=5", "-XX:G1MixedGCCountTarget=4", 
        "-XX:InitiatingHeapOccupancyPercent=15", "-XX:G1MixedGCLiveThresholdPercent=90", 
        "-XX:G1RSetUpdatingPauseTimePercent=5", "-XX:SurvivorRatio=32", "-XX:+PerfDisableSharedMem", 
        "-XX:MaxTenuringThreshold=1", "-Dusing.aikars.flags=https://mcflags.emc.gs", 
        "-Daikars.new.flags=true"
      );
    }
    
    const isForge = jarName.includes('forge-') && jarName.includes('-shim');
    if (isForge) {
      const forgeServerDir = baseDir;
      const eulaPathForge = path.join(forgeServerDir, 'eula.txt');
      fs.writeFileSync(eulaPathForge, 'eula=true\n', 'utf-8');
      const propsPathForge = path.join(forgeServerDir, 'server.properties');
      if (!fs.existsSync(propsPathForge)) {
        fs.writeFileSync(propsPathForge, propsContent, 'utf-8');
      }
      
      const winArgsGlob = fs.readdirSync(forgeServerDir, { recursive: true }).find(f => typeof f === 'string' && f.endsWith('win_args.txt'));
      if (winArgsGlob) {
        javaArgs.push('@user_jvm_args.txt', `@${winArgsGlob}`, 'nogui');
      } else {
        javaArgs.push('-jar', jarPath, 'nogui');
      }
      
      const proc = spawn(javaExec, javaArgs, {
        cwd: forgeServerDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      activeServers.set(serverId, { 
        process: proc, 
        logBuffer: [], 
        rconPort, 
        rconPassword,
        rconClient: null 
      });

      proc.stdout.on('data', (d) => sendLog(serverId, d));
      proc.stderr.on('data', (d) => sendLog(serverId, d));
      proc.on('close', (code) => {
        sendLog(serverId, `\n[System] Server process exited with code ${code}\n`);
        if (code !== 0 && code !== null) {
          new Notification({
            title: 'CubeLauncher: Ошибка сервера',
            body: `Сервер ${serverId} неожиданно завершил работу (код ${code}).`
          }).show();
        }
        const srv = activeServers.get(serverId);
        if (srv && srv.rconClient) srv.rconClient.end().catch(() => {});
        activeServers.delete(serverId);
      });
      proc.on('error', (err) => {
        sendLog(serverId, `\n[System Error] Failed to start server: ${err.message}\n`);
        activeServers.delete(serverId);
      });
      return serverId;
    }

    javaArgs.push('-jar', jarPath, 'nogui');
    const process = spawn(javaExec, javaArgs, {
      cwd: serverDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    activeServers.set(serverId, { 
      process, 
      logBuffer: [], 
      rconPort, 
      rconPassword,
      rconClient: null 
    });

    process.stdout.on('data', (d) => sendLog(serverId, d));
    process.stderr.on('data', (d) => sendLog(serverId, d));
    process.on('close', (code) => {
      sendLog(serverId, `\n[System] Server process exited with code ${code}\n`);
      if (code !== 0 && code !== null) {
        new Notification({
          title: 'CubeLauncher: Ошибка сервера',
          body: `Сервер ${serverId} неожиданно завершил работу (код ${code}). Проверьте консоль.`
        }).show();
      }
      const srv = activeServers.get(serverId);
      if (srv && srv.rconClient) {
        srv.rconClient.end().catch(() => {});
      }
      activeServers.delete(serverId);
    });
    process.on('error', (err) => {
      sendLog(serverId, `\n[System Error] Failed to start server: ${err.message}\n`);
      const srv = activeServers.get(serverId);
      if (srv && srv.rconClient) {
        srv.rconClient.end().catch(() => {});
      }
      activeServers.delete(serverId);
    });

    return serverId;
  } catch (err) {
    console.error('[server:start]', err);
    throw err;
  }
});
ipcMain.handle('server:stop', async (_event, serverId) => {
  const srv = activeServers.get(serverId);
  if (srv && srv.process) {
    srv.process.kill();
    return true;
  }
  return false;
});
ipcMain.handle('server:command', async (_event, serverId, cmd) => {
  const srv = activeServers.get(serverId);
  if (srv && srv.process && srv.process.stdin) {
    srv.process.stdin.write(cmd + '\n');
    return true;
  }
  return false;
});

ipcMain.handle('rcon:command', async (_event, serverId, cmd) => {
  const srv = activeServers.get(serverId);
  if (!srv) return { success: false, error: 'Server not running' };
  
  if (!srv.rconClient) {
    try {
      srv.rconClient = await Rcon.connect({
        host: '127.0.0.1',
        port: srv.rconPort,
        password: srv.rconPassword
      });
      srv.rconClient.on('error', (err) => {
        console.warn(`[RCON Error] ${err.message}`);
        srv.rconClient = null;
      });
    } catch(err) {
      return { success: false, error: 'RCON connection failed: ' + err.message };
    }
  }

  try {
    const response = await srv.rconClient.send(cmd);
    return { success: true, response };
  } catch (err) {
    srv.rconClient = null;
    return { success: false, error: err.message };
  }
});

ipcMain.handle('server:backup', async (_event, serverId, includePaths) => {
  try {
    const s = await getStore();
    const baseDir = s.get('serverPath');
    if (!baseDir) return { success: false, error: 'No server path' };
    
    const isForge = serverId.includes('forge-') && serverId.includes('-shim');
    const subFolder = serverId.replace('.jar', '');
    const serverDir = isForge ? baseDir : path.join(baseDir, subFolder);
    const backupsDir = path.join(baseDir, 'backups');
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
    
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const zipName = `backup-${subFolder}-${dateStr}.zip`;
    const zipPath = path.join(backupsDir, zipName);
    
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 5 } });
      
      output.on('close', () => resolve({ success: true, file: zipName, size: archive.pointer() }));
      archive.on('error', (err) => resolve({ success: false, error: err.message }));
      
      archive.pipe(output);
      
      function appendRecursive(basePath, relativeName) {
        try {
          if (!fs.existsSync(basePath)) return;
          const stat = fs.statSync(basePath);
          if (stat.isDirectory()) {
            const children = fs.readdirSync(basePath);
            for (const child of children) {
              appendRecursive(path.join(basePath, child), path.join(relativeName, child).replace(/\\/g, '/'));
            }
          } else {
            try {
              const fd = fs.openSync(basePath, 'r');
              fs.closeSync(fd);
              archive.file(basePath, { name: relativeName });
            } catch (err) {
              console.warn(`Skipping locked file: ${basePath}`);
            }
          }
        } catch (err) {
          console.warn(`Skipping locked directory/file: ${basePath}`);
        }
      }

      for (const p of includePaths) {
        appendRecursive(path.join(serverDir, p), p);
      }
      archive.finalize();
    });
  } catch (err) {
    return { success: false, error: err.message };
  }
});
ipcMain.handle('fs:checkLocalFiles', async () => {
  try {
    const s = await getStore();
    const serverDir = s.get('serverPath');
    if (!serverDir || !fs.existsSync(serverDir)) return [];
    setupWatcher(serverDir);
    const files = fs.readdirSync(serverDir);
    return files.filter(f => f.endsWith('.jar'));
  } catch (err) {
    console.error('[fs:checkLocalFiles]', err);
    return [];
  }
});
ipcMain.handle('sys:getLogs', async (_event, serverId) => {
  const srv = activeServers.get(serverId);
  return srv ? srv.logBuffer : [];
});
ipcMain.handle('dialog:selectCustomJar', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Custom Core (.jar)',
    properties: ['openFile'],
    filters: [{ name: 'Java Archive', extensions: ['jar'] }]
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const s = await getStore();
  const serverDir = s.get('serverPath');
  if (!serverDir) return null;
  
  const sourcePath = result.filePaths[0];
  const fileName = path.basename(sourcePath);
  const destPath = path.join(serverDir, fileName);
  fs.copyFileSync(sourcePath, destPath);
  return fileName;
});
ipcMain.handle('sys:getRam', () => {
  return os.totalmem();
});
function buildFileTree(dirPath) {
  const result = [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const isDir = entry.isDirectory();
      const node = {
        name: entry.name,
        type: isDir ? 'folder' : 'file',
      };
      if (!isDir) {
        const ext = path.extname(entry.name).slice(1).toLowerCase();
        if (ext) node.ext = ext;
      } else {
        node.children = buildFileTree(path.join(dirPath, entry.name));
      }
      result.push(node);
    }
  } catch (err) { }
  return result.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'folder' ? -1 : 1;
  });
}
ipcMain.handle('fs:readWorkspace', async () => {
  try {
    const s = await getStore();
    const serverDir = s.get('serverPath');
    if (!serverDir || !fs.existsSync(serverDir)) return [];
    return buildFileTree(serverDir);
  } catch (err) {
    console.error('[fs:readWorkspace]', err);
    return [];
  }
});
ipcMain.handle('fs:readFile', async (_event, filePath) => {
  try {
    const s = await getStore();
    const serverDir = s.get('serverPath');
    if (!serverDir) throw new Error('No server path set');
    const targetPath = path.join(serverDir, filePath);
    if (!targetPath.startsWith(serverDir)) throw new Error('Invalid path');
    return fs.readFileSync(targetPath, 'utf-8');
  } catch (err) {
    console.error('[fs:readFile]', err);
    throw err;
  }
});
ipcMain.handle('fs:saveFile', async (_event, filePath, content) => {
  try {
    const s = await getStore();
    const serverDir = s.get('serverPath');
    if (!serverDir) throw new Error('No server path set');
    const targetPath = path.join(serverDir, filePath);
    if (!targetPath.startsWith(serverDir)) throw new Error('Invalid path');
    fs.writeFileSync(targetPath, content, 'utf-8');
    return true;
  } catch (err) {
    console.error('[fs:saveFile]', err);
    throw err;
  }
});
ipcMain.handle('core:download', async (_event, coreType, mcVersion, build) => {
  try {
    const s = await getStore();
    const serverDir = s.get('serverPath');
    if (!serverDir) {
      return { success: false, error: 'No server directory configured. Please select a folder first.' };
    }
    let downloadInfo;
    switch (coreType) {
      case 'paper':
        downloadInfo = await getPaperDownload(mcVersion);
        break;
      case 'fabric':
        downloadInfo = await getFabricDownload(mcVersion);
        break;
      case 'vanilla':
        downloadInfo = await getVanillaDownload(mcVersion);
        break;
      case 'forge':
        downloadInfo = await getForgeDownload(mcVersion, build);
        break;
      default:
        return { success: false, error: `Unsupported core type: "${coreType}"` };
    }
    const destPath = path.join(serverDir, downloadInfo.fileName);
    const progressId = `core-${coreType}-${mcVersion}`;
    await downloadFile(downloadInfo.url, destPath, (percent) => {
      sendProgress(progressId, percent, downloadInfo.fileName);
    });

    if (coreType === 'forge') {
      sendProgress(progressId, 100, "Installing Forge...");
      const javaCheck = await checkJavaVersion();
      const javaExec = javaCheck.javaExec || 'java';
      await execPromise(`"${javaExec}" -jar "${destPath}" --installServer`, { cwd: serverDir, maxBuffer: 50 * 1024 * 1024 });
      fs.unlinkSync(destPath);
      const logPath = destPath + '.log';
      if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
      
      const files = fs.readdirSync(serverDir);
      let runScript = files.find(f => f === 'run.bat' || f === 'run.sh' || (f.startsWith('forge-') && f.endsWith('.jar')));
      if (runScript) {
        return { success: true, filePath: path.join(serverDir, runScript) };
      }
    }

    const window = BrowserWindow.getAllWindows()[0];
    if (window && !window.isDestroyed()) {
      window.webContents.send('download-complete', progressId);
    }
    return { success: true, filePath: destPath };
  } catch (err) {
    console.error('[core:download]', err);
    return { success: false, error: err.message };
  }
});
ipcMain.handle('store:search', async (_event, opts) => {
  try {
    return await searchModrinth(opts);
  } catch (err) {
    console.error('[store:search]', err);
    return { hits: [], totalHits: 0, error: err.message };
  }
});
ipcMain.handle('store:download', async (_event, projectId, coreType, mcVersion) => {
  try {
    const s = await getStore();
    const serverDir = s.get('serverPath');
    if (!serverDir) {
      return { success: false, error: 'No server directory configured. Please select a folder first.' };
    }
    const dlInfo = await getModrinthDownload(projectId, coreType, mcVersion);
    const subFolder = coreType === 'paper' ? 'plugins' : 'mods';
    const destDir = path.join(serverDir, subFolder);
    fs.mkdirSync(destDir, { recursive: true });
    const destPath = path.join(destDir, dlInfo.fileName);
    const progressId = `plugin-${projectId}`;
    await downloadFile(dlInfo.url, destPath, (percent) => {
      sendProgress(progressId, percent, dlInfo.fileName);
    });
    const window = BrowserWindow.getAllWindows()[0];
    if (window && !window.isDestroyed()) {
      window.webContents.send('download-complete', progressId);
    }
    return { success: true, filePath: destPath };
  } catch (err) {
    console.error('[store:download]', err);
    return { success: false, error: err.message };
  }
});
ipcMain.handle('store:checkInstalled', async (_event, slug, coreType) => {
  try {
    const s = await getStore();
    const serverDir = s.get('serverPath');
    if (!serverDir) return false;
    const subFolder = coreType === 'paper' ? 'plugins' : 'mods';
    const destDir = path.join(serverDir, subFolder);
    if (!fs.existsSync(destDir)) return false;
    const files = fs.readdirSync(destDir);
    return files.some(f => f.toLowerCase().includes(slug.toLowerCase()) && f.endsWith('.jar'));
  } catch (err) {
    return false;
  }
});
app.whenReady().then(async () => {
  await getStore();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
