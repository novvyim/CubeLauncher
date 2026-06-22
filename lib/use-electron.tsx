"use client"
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
function getAPI() {
  if (typeof window !== "undefined" && window.electronAPI) return window.electronAPI
  return null
}
export interface DownloadState {
  id: string
  fileName: string
  percent: number
  status: "downloading" | "finishing" | "done" | "error"
  error?: string
}
interface ElectronContextValue {
  isElectron: boolean
  serverPath: string | null
  initializing: boolean
  runningServers: string[]
  selectFolder: () => Promise<string | void | null>
  selectFile: () => Promise<string | null>
  downloadCore: (coreType: "paper" | "fabric" | "vanilla" | "forge", mcVersion: string, build?: string) => Promise<{ success: boolean; filePath?: string; error?: string }>
  downloads: Record<string, DownloadState>
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void
  getRam: () => Promise<number | null>
  getSavedRam: () => Promise<number | null>
  setSavedRam: (ramGb: number) => Promise<void>
  getJavaPath: () => Promise<string | null>
  setJavaPath: (execPath: string) => Promise<void>
  startServer: (jarName: string) => Promise<boolean | null>
  stopServer: (serverId: string) => Promise<boolean>
  sendCommand: (serverId: string, cmd: string) => Promise<boolean>
  rconCommand: (serverId: string, cmd: string) => Promise<{success: boolean, response?: string, error?: string}>
  createBackup: (serverId: string, paths: string[]) => Promise<{success: boolean, file?: string, size?: number, error?: string}>
  getLogs: (serverId: string) => Promise<string[]>
  onServerLog?: (callback: (data: { serverId: string, log: string }) => void) => () => void
  onJavaError?: (callback: (data: { detected: string, required: number }) => void) => () => void
  onJavaFallback?: (callback: (data: string) => void) => () => void
  onServerStats?: (callback: (data: { activeServers: string[], cpu: string, ramUsed: number, tps: string, details?: Record<string, { cpu: number, ramUsed: number }> }) => void) => () => void
  onLocalFilesChanged?: (callback: (files: string[]) => void) => () => void
  searchModrinth: (opts: any) => Promise<any>
  downloadPlugin: (projectId: string, coreType: string, mcVersion: string) => Promise<any>
  checkInstalled: (fileName: string, coreType: string) => Promise<boolean>
  readWorkspace: () => Promise<any[]>
  readFile: (filePath: string) => Promise<string | null>
  saveFile: (filePath: string, content: string) => Promise<boolean>
  saveConfig: (data: any) => Promise<boolean>
  readConfig: () => Promise<any | null>
  openExternal: (url: string) => void
  getJavaVersion: () => Promise<string | null>
  selectCustomJar: () => Promise<string | null>
  getAikarFlags: () => Promise<boolean>
  setAikarFlags: (val: boolean) => Promise<void>
}
const ElectronContext = createContext<ElectronContextValue | null>(null)
export function ElectronProvider({ children }: { children: ReactNode }) {
  const api = getAPI()
  const isElectron = !!api
  const [serverPath, setServerPath] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [downloads, setDownloads] = useState<Record<string, DownloadState>>({})
  const [runningServers, setRunningServers] = useState<string[]>([])
  useEffect(() => {
    if (!api) {
      setInitializing(false)
      return
    }
    const unsub = api.onDownloadProgress((data) => {
      setDownloads((prev) => {
        const capped = Math.min(data.percent, 99)
        const existing = prev[data.id]
        if (existing && (existing.status === "done" || existing.status === "error")) {
          return prev
        }
        return {
          ...prev,
          [data.id]: {
            id: data.id,
            fileName: data.fileName,
            percent: capped,
            status: "downloading",
          },
        }
      })
    })
    const unsubComplete = api.onDownloadComplete?.((id) => {
      setDownloads((prev) => {
        const existing = prev[id]
        if (!existing) return prev
        return {
          ...prev,
          [id]: { ...existing, percent: 100, status: "finishing" }
        }
      })
      setTimeout(() => {
        setDownloads((current) => {
          const existing = current[id]
          if (!existing) return current
          if (id.startsWith('plugin-')) {
            const newState = { ...current }
            delete newState[id]
            return newState
          }
          return {
            ...current,
            [id]: { ...existing, status: "done" }
          }
        })
      }, 1000)
    })
    return () => {
      unsub()
      unsubComplete?.()
    }
  }, [api])
  useEffect(() => {
    if (!api?.onLocalFilesChanged) return
    const unsub = api.onLocalFilesChanged((files: string[]) => {
      setDownloads(prev => {
        const next = { ...prev }
        let changed = false
        for (const [id, d] of Object.entries(next)) {
          if (d.status === "done" && !files.includes(d.fileName)) {
            delete next[id]
            changed = true
          }
        }
        for (const file of files) {
          const exists = Object.values(next).some(d => d.fileName === file)
          if (!exists) {
            let id = `custom-${file}`
            if (file.startsWith('paper-')) {
              const parts = file.split('-')
              if (parts.length >= 2) id = `core-paper-${parts[1]}`
            } else if (file.startsWith('fabric-server-mc.')) {
              const match = file.match(/fabric-server-mc\.([^-]+)/)
              if (match) id = `core-fabric-${match[1]}`
            } else if (file.startsWith('server-') && file.endsWith('.jar')) {
              const match = file.match(/server-([^.]+(?:\.[^.]+)*)\.jar/)
              if (match) id = `core-vanilla-${match[1]}`
            }
            next[id] = { id, fileName: file, percent: 100, status: "done" }
            changed = true
          }
        }
        return changed ? next : prev
      })
    })
    return () => unsub()
  }, [api])
  useEffect(() => {
    if (!api?.onServerStats) return
    const unsub = api.onServerStats((data: { activeServers: string[] }) => {
      setRunningServers(data.activeServers)
    })
    return () => unsub()
  }, [api])
  useEffect(() => {
    if (!api) {
      setInitializing(false)
      return
    }
    let cancelled = false
    async function init() {
      if (!api) return
      try {
        const path = await api.getServerPath()
        if (cancelled) return
        if (path) {
          setServerPath(path)
          const files = await api.checkLocalFiles()
          const initDownloads: Record<string, DownloadState> = {}
            for (const file of files) {
              let id = null
              if (file.startsWith('paper-')) {
                const parts = file.split('-')
                if (parts.length >= 2) id = `core-paper-${parts[1]}`
              } else if (file.startsWith('fabric-server-mc.')) {
                const match = file.match(/fabric-server-mc\.([^-]+)/)
                if (match) id = `core-fabric-${match[1]}`
              } else if (file.startsWith('forge-') && file.endsWith('-shim.jar')) {
                const match = file.match(/forge-([^-]+)-/)
                if (match) id = `core-forge-${match[1]}`
              }
              if (id) {
                initDownloads[id] = { id, fileName: file, percent: 100, status: "done" }
              }
              if (!id && file.startsWith('server-') && file.endsWith('.jar')) {
                const match = file.match(/server-([^.]+(?:\.[^.]+)*)\.jar/)
                if (match) {
                  const vid = `core-vanilla-${match[1]}`
                  initDownloads[vid] = { id: vid, fileName: file, percent: 100, status: "done" }
                }
              }
            }
            if (Object.keys(initDownloads).length > 0) {
              setDownloads(prev => ({ ...prev, ...initDownloads }))
            }
        } else {
          const selected = await api.selectFolder()
          if (!cancelled && selected) {
            setServerPath(selected)
            const files = await api.checkLocalFiles()
            const initDownloads: Record<string, DownloadState> = {}
              for (const file of files) {
                let id = null
                if (file.startsWith('paper-')) {
                  const parts = file.split('-')
                  if (parts.length >= 2) id = `core-paper-${parts[1]}`
                } else if (file.startsWith('fabric-server-mc.')) {
                  const match = file.match(/fabric-server-mc\.([^-]+)/)
                  if (match) id = `core-fabric-${match[1]}`
                }
                if (id) {
                  initDownloads[id] = { id, fileName: file, percent: 100, status: "done" }
                }
                if (!id && file.startsWith('server-') && file.endsWith('.jar')) {
                  const match = file.match(/server-([^.]+(?:\.[^.]+)*)\.jar/)
                  if (match) {
                    const vid = `core-vanilla-${match[1]}`
                    initDownloads[vid] = { id: vid, fileName: file, percent: 100, status: "done" }
                  }
                }
              }
              if (Object.keys(initDownloads).length > 0) {
                setDownloads(initDownloads)
              }
          }
        }
      } catch (err) {
        console.error("[ElectronProvider] init error:", err)
      } finally {
        if (!cancelled) setInitializing(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [api])
  const selectFolder = useCallback(async () => {
    if (!api?.selectFolder) return
    const path = await api.selectFolder()
    if (path) {
      setServerPath(path)
      if (api.checkLocalFiles) {
        const files = await api.checkLocalFiles()
        const newDownloads: Record<string, DownloadState> = {}
        for (const file of files) {
          let id = null
          if (file.startsWith('paper-')) {
            const parts = file.split('-')
            if (parts.length >= 2) id = `core-paper-${parts[1]}`
          } else if (file.startsWith('fabric-server-mc.')) {
            const match = file.match(/fabric-server-mc\.([^-]+)/)
            if (match) id = `core-fabric-${match[1]}`
          }
          if (id) {
            newDownloads[id] = { id, fileName: file, percent: 100, status: "done" }
          }
          if (!id && file.startsWith('server-') && file.endsWith('.jar')) {
            const match = file.match(/server-([^.]+(?:\.[^.]+)*)\.jar/)
            if (match) {
              const vid = `core-vanilla-${match[1]}`
              newDownloads[vid] = { id: vid, fileName: file, percent: 100, status: "done" }
            }
          }
        }
        setDownloads(newDownloads) 
      }
    }
    return path
  }, [api])
  const selectFile = useCallback(async () => {
    if (!api?.selectFile) return null
    return await api.selectFile()
  }, [api])
  const downloadCore = useCallback(
    async (coreType: "paper" | "fabric" | "vanilla" | "forge", mcVersion: string, build?: string) => {
      if (!api) return { success: false, error: "Not running in Electron" }
      const id = `core-${coreType}-${mcVersion}`
      setDownloads((prev) => ({
        ...prev,
        [id]: { id, fileName: `${coreType}-${mcVersion}.jar`, percent: 0, status: "downloading" },
      }))
      const result = await api.downloadCore(coreType, mcVersion, build)
      setDownloads((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          percent: result.success ? 100 : prev[id]?.percent ?? 0,
          status: result.success ? "done" : "error",
          error: result.error,
        },
      }))
      return result
    },
    [api]
  )
  const minimizeWindow = useCallback(() => api?.minimizeWindow(), [api])
  const maximizeWindow = useCallback(() => api?.maximizeWindow(), [api])
  const closeWindow = useCallback(() => api?.closeWindow(), [api])
  const getRam = useCallback(async () => (api?.getRam ? await api.getRam() : null), [api])
  const readWorkspace = useCallback(async () => (api?.readWorkspace ? await api.readWorkspace() : []), [api])
  const readFile = useCallback(async (fp: string) => (api?.readFile ? await api.readFile(fp) : null), [api])
  const saveFile = useCallback(async (fp: string, c: string) => (api?.saveFile ? await api.saveFile(fp, c) : false), [api])
  const getSavedRam = useCallback(async () => (api?.getSavedRam ? await api.getSavedRam() : null), [api])
  const setSavedRam = useCallback(async (r: number) => (api?.setSavedRam ? await api.setSavedRam(r) : undefined), [api])
  const getJavaPath = useCallback(async () => (api?.getJavaPath ? await api.getJavaPath() : null), [api])
  const getJavaVersion = useCallback(async () => (api?.getJavaVersion ? await api.getJavaVersion() : null), [api])
  const setJavaPath = useCallback(async (p: string) => (api?.setJavaPath ? await api.setJavaPath(p) : undefined), [api])
  const getAikarFlags = useCallback(async () => (api?.getAikarFlags ? await api.getAikarFlags() : false), [api])
  const setAikarFlags = useCallback(async (v: boolean) => (api?.setAikarFlags ? await api.setAikarFlags(v) : undefined), [api])
  const startServer = useCallback(async (j: string) => (api?.startServer ? await api.startServer(j) : null), [api])
  const stopServer = useCallback(async (s: string) => (api?.stopServer ? await api.stopServer(s) : false), [api])
  const sendCommand = useCallback(async (s: string, c: string) => (api?.sendCommand ? await api.sendCommand(s, c) : false), [api])
  const rconCommand = useCallback(async (s: string, c: string) => (api?.rconCommand ? await api.rconCommand(s, c) : {success: false}), [api])
  const createBackup = useCallback(async (s: string, p: string[]) => (api?.createBackup ? await api.createBackup(s, p) : {success: false}), [api])
  const getLogs = useCallback(async (s: string) => (api?.getLogs ? await api.getLogs(s) : []), [api])
  const saveConfig = useCallback(async (data: any) => (api?.saveConfig ? await api.saveConfig(data) : false), [api])
  const readConfig = useCallback(async () => (api?.readConfig ? await api.readConfig() : null), [api])
  const checkInstalled = useCallback(async (fileName: string, coreType: string) => (api?.checkInstalled ? await api.checkInstalled(fileName, coreType) : false), [api])
  const searchModrinth = useCallback(async (opts: any) => (api?.searchModrinth ? await api.searchModrinth(opts) : null), [api])
  const downloadPlugin = useCallback(async (pid: string, ct: string, mv: string) => (api?.downloadPlugin ? await api.downloadPlugin(pid, ct, mv) : null), [api])
  const onServerLog = api?.onServerLog
  const onJavaError = api?.onJavaError
  const onJavaFallback = api?.onJavaFallback
  const onServerStats = api?.onServerStats
  const onLocalFilesChanged = api?.onLocalFilesChanged
  const openExternal = useCallback((url: string) => api?.openExternal?.(url), [api])
  const selectCustomJar = useCallback(async () => (api?.selectCustomJar ? await api.selectCustomJar() : null), [api])
  return (
    <ElectronContext.Provider
      value={{
        isElectron,
        serverPath,
        initializing,
        runningServers,
        selectFolder,
        selectFile,
        downloadCore,
        downloads,
        minimizeWindow,
        maximizeWindow,
        closeWindow,
        getRam,
        getSavedRam,
        setSavedRam,
        getJavaPath,
        getJavaVersion,
        setJavaPath,
        startServer,
        stopServer,
        sendCommand,
        rconCommand,
        createBackup,
        getLogs,
        saveConfig,
        readConfig,
        onServerLog,
        onJavaError,
        onJavaFallback,
        onServerStats,
        readWorkspace,
        readFile,
        saveFile,
        searchModrinth,
        downloadPlugin,
        checkInstalled,
        openExternal,
        selectCustomJar,
        onLocalFilesChanged,
        getAikarFlags,
        setAikarFlags,
      }}
    >
      {children}
    </ElectronContext.Provider>
  )
}
export function useElectron() {
  const ctx = useContext(ElectronContext)
  if (!ctx) throw new Error("useElectron must be used within <ElectronProvider>")
  return ctx
}
