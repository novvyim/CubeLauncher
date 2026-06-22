const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  selectFile: () => ipcRenderer.invoke('dialog:selectFile'),
  getServerPath: () => ipcRenderer.invoke('config:getServerPath'),
  setServerPath: (dirPath) => ipcRenderer.invoke('config:setServerPath', dirPath),
  saveConfig: (data) => ipcRenderer.invoke('config:saveFile', data),
  readConfig: () => ipcRenderer.invoke('config:readFile'),
  getRam: () => ipcRenderer.invoke('sys:getRam'),
  getSavedRam: () => ipcRenderer.invoke('config:getRam'),
  setSavedRam: (ramGb) => ipcRenderer.invoke('config:setRam', ramGb),
  getJavaPath: () => ipcRenderer.invoke('config:getJavaPath'),
  setJavaPath: (execPath) => ipcRenderer.invoke('config:setJavaPath', execPath),
  startServer: (jarName) => ipcRenderer.invoke('server:start', jarName),
  stopServer: (serverId) => ipcRenderer.invoke('server:stop', serverId),
  sendCommand: (serverId, cmd) => ipcRenderer.invoke('server:command', serverId, cmd),
  rconCommand: (serverId, cmd) => ipcRenderer.invoke('rcon:command', serverId, cmd),
  createBackup: (serverId, paths) => ipcRenderer.invoke('server:backup', serverId, paths),
  getLogs: (serverId) => ipcRenderer.invoke('sys:getLogs', serverId),
  onServerLog: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('server-log', handler);
    return () => ipcRenderer.removeListener('server-log', handler);
  },
  onJavaError: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('java-error', handler);
    return () => ipcRenderer.removeListener('java-error', handler);
  },
  onJavaFallback: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('java-fallback', handler);
    return () => ipcRenderer.removeListener('java-fallback', handler);
  },
  onServerStats: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('server-stats', handler);
    return () => ipcRenderer.removeListener('server-stats', handler);
  },
  checkLocalFiles: () => ipcRenderer.invoke('fs:checkLocalFiles'),
  readWorkspace: () => ipcRenderer.invoke('fs:readWorkspace'),
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  saveFile: (filePath, content) => ipcRenderer.invoke('fs:saveFile', filePath, content),
  downloadCore: (coreType, mcVersion, build) =>
    ipcRenderer.invoke('core:download', coreType, mcVersion, build),
  searchStore: (opts) => ipcRenderer.invoke('store:search', opts),
  searchModrinth: (opts) => ipcRenderer.invoke('store:search', opts),
  downloadPlugin: (projectId, coreType, mcVersion) => ipcRenderer.invoke('store:download', projectId, coreType, mcVersion),
  checkInstalled: (fileName, coreType) => ipcRenderer.invoke('store:checkInstalled', fileName, coreType),
  onDownloadProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('download:progress', handler);
    return () => ipcRenderer.removeListener('download:progress', handler);
  },
  onDownloadComplete: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('download-complete', handler);
    return () => ipcRenderer.removeListener('download-complete', handler);
  },
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  getJavaVersion: () => ipcRenderer.invoke('sys:getJavaVersion'),
  getAikarFlags: () => ipcRenderer.invoke('config:getAikarFlags'),
  setAikarFlags: (val) => ipcRenderer.invoke('config:setAikarFlags', val),
  onLocalFilesChanged: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('fs:localFilesChanged', handler);
    return () => ipcRenderer.removeListener('fs:localFilesChanged', handler);
  },
  selectCustomJar: () => ipcRenderer.invoke('dialog:selectCustomJar'),
});
