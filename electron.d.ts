export interface DownloadProgress {
  id: string;
  percent: number;
  fileName: string;
}
export interface DownloadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}
export interface StoreSearchOpts {
  query: string;
  coreType: 'paper' | 'fabric' | 'forge';
  mcVersion?: string;
  limit?: number;
  offset?: number;
}
export interface StoreHit {
  id: string;
  slug: string;
  name: string;
  author: string;
  description: string;
  downloads: number;
  iconUrl: string | null;
  categories: string[];
  projectType: string;
}
export interface StoreSearchResult {
  hits: StoreHit[];
  totalHits: number;
  error?: string;
}
export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  ext?: string;
  children?: FileNode[];
}
export interface ElectronAPI {
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  selectFolder: () => Promise<string | null>;
  selectFile: () => Promise<string | null>;
  getServerPath: () => Promise<string | null>;
  setServerPath: (dirPath: string) => Promise<void>;
  saveConfig: (data: any) => Promise<boolean>;
  readConfig: () => Promise<any>;
  checkLocalFiles: () => Promise<string[]>;
  getRam: () => Promise<number>;
  getSavedRam: () => Promise<number>;
  setSavedRam: (ramGb: number) => Promise<void>;
  getJavaPath: () => Promise<string>;
  setJavaPath: (execPath: string) => Promise<void>;
  startServer: (jarName: string) => Promise<boolean>;
  stopServer: (serverId?: string) => Promise<boolean>;
  sendCommand: (serverId: string, cmd: string) => Promise<boolean>;
  rconCommand: (serverId: string, cmd: string) => Promise<{success: boolean, response?: string, error?: string}>;
  createBackup: (serverId: string, paths: string[]) => Promise<{success: boolean, file?: string, size?: number, error?: string}>;
  onServerLog: (callback: (data: { serverId: string, log: string }) => void) => () => void;
  getLogs: (serverId?: string) => Promise<string[]>;
  onJavaError: (callback: (data: { detected: string, required: number }) => void) => () => void;
  onJavaFallback: (callback: (data: string) => void) => () => void;
  onServerStats: (callback: (data: { activeServers: string[], cpu: string, ramUsed: number, tps: string, details?: Record<string, { cpu: number, ramUsed: number }> }) => void) => () => void;
  readWorkspace: () => Promise<FileNode[]>;
  readFile: (filePath: string) => Promise<string>;
  saveFile: (filePath: string, content: string) => Promise<boolean>;
  downloadCore: (coreType: 'paper' | 'fabric' | 'vanilla' | 'forge', mcVersion: string, build?: string) => Promise<DownloadResult>;
  searchModrinth: (opts: SearchOptions) => Promise<SearchResult>;
  downloadPlugin: (projectId: string, coreType: string, mcVersion: string) => Promise<DownloadResult>;
  checkInstalled: (fileName: string, coreType: string) => Promise<boolean>;
  onDownloadProgress: (callback: (data: { id: string; percent: number; fileName: string }) => void) => () => void;
  onDownloadComplete: (callback: (id: string) => void) => () => void;
  searchStore: (opts: StoreSearchOpts) => Promise<StoreSearchResult>;
  openExternal: (url: string) => Promise<void>;
  getJavaVersion: () => Promise<string | null>;
  getAikarFlags: () => Promise<boolean>;
  setAikarFlags: (val: boolean) => Promise<void>;
  onLocalFilesChanged: (callback: (files: string[]) => void) => () => void;
  selectCustomJar: () => Promise<string | null>;
}
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
