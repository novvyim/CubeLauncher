"use client"

import { useState, useEffect } from "react"
import { useElectron } from "@/lib/use-electron"
import { Archive, Download, CheckSquare, Square, FolderArchive, Loader2, Server } from "lucide-react"

const COMMON_PATHS = [
  { path: "world", label: "World (Overworld)", type: "folder" },
  { path: "world_nether", label: "World (Nether)", type: "folder" },
  { path: "world_the_end", label: "World (The End)", type: "folder" },
  { path: "plugins", label: "Plugins & Data", type: "folder" },
  { path: "mods", label: "Mods", type: "folder" },
  { path: "config", label: "Configuration", type: "folder" },
  { path: "logs", label: "Server Logs", type: "folder" },
  { path: "server.properties", label: "server.properties", type: "file" },
  { path: "ops.json", label: "ops.json", type: "file" },
  { path: "whitelist.json", label: "whitelist.json", type: "file" },
]

import { useTranslation } from "react-i18next"

export function Backups() {
  const { t } = useTranslation()
  const { downloads, runningServers, createBackup, isElectron } = useElectron()
  const installedJars = Object.values(downloads || {}).filter((d) => d.status === "done").map(d => d.fileName)
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set(["world", "world_nether", "world_the_end"]))
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [result, setResult] = useState<{ success: boolean; file?: string; size?: number; error?: string } | null>(null)

  useEffect(() => {
    if (installedJars.length > 0 && (!activeTab || !installedJars.includes(activeTab))) {
      setActiveTab(installedJars[0])
    } else if (installedJars.length === 0) {
      setActiveTab(null)
    }
  }, [installedJars, activeTab])

  const togglePath = (path: string) => {
    setSelectedPaths(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const handleBackup = async () => {
    if (!activeTab || !createBackup || selectedPaths.size === 0) return
    setIsBackingUp(true)
    setResult(null)
    try {
      const res = await createBackup(activeTab, Array.from(selectedPaths))
      setResult(res)
    } catch (err: any) {
      setResult({ success: false, error: err.message })
    } finally {
      setIsBackingUp(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`
    if (bytes > 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${bytes} B`
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">{t('backups.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('backups.subtitle')}</p>
      </div>

      <div className="flex items-center gap-2 border-b border-border/50 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground overflow-x-auto">
        <Server className="size-4 shrink-0" />
        {installedJars.length === 0 ? (
          <span>{t('backups.no_servers')}</span>
        ) : (
          <div className="flex gap-2">
            {installedJars.map(id => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center px-3 py-1 rounded-md transition-colors ${activeTab === id ? 'bg-primary/20 text-primary' : 'hover:bg-secondary text-muted-foreground'}`}
              >
                {id}
                {runningServers.includes(id) && (
                  <span className="ml-1.5 flex size-2 items-center justify-center rounded-full bg-green-500">
                    <span className="size-1.5 animate-pulse rounded-full bg-green-200" />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {!activeTab ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
            <FolderArchive className="size-8 opacity-20" />
            <p className="text-sm">{t('backups.start_to_backup')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-4 font-heading text-sm font-semibold text-foreground">{t('backups.select_files')}</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {COMMON_PATHS.map(item => {
                  const isSelected = selectedPaths.has(item.path)
                  return (
                    <button
                      key={item.path}
                      onClick={() => togglePath(item.path)}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                        isSelected 
                          ? 'border-primary/50 bg-primary/10' 
                          : 'border-border bg-secondary/50 hover:bg-secondary'
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare className="size-5 shrink-0 text-primary" />
                      ) : (
                        <Square className="size-5 shrink-0 text-muted-foreground" />
                      )}
                      <div>
                        <p className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">/{item.path}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
                <Archive className="size-6" />
              </div>
              <h3 className="mb-1 font-heading text-lg font-semibold text-foreground">{t('backups.ready')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('backups.ready_desc')}
              </p>
              <button
                onClick={handleBackup}
                disabled={isBackingUp || selectedPaths.size === 0}
                className="mt-6 flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isBackingUp ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                {isBackingUp ? t('backups.backing_up') : t('backups.create')}
              </button>

              {result && (
                <div className={`mt-4 w-full max-w-md rounded-lg border p-4 text-left text-sm ${
                  result.success ? 'border-green-500/20 bg-green-500/10 text-green-400' : 'border-red-500/20 bg-red-500/10 text-red-400'
                }`}>
                  <strong className="block font-semibold mb-1">
                    {result.success ? t('backups.success') : t('backups.failed')}
                  </strong>
                  {result.success ? (
                    <span className="flex flex-col gap-1 text-xs text-green-500/70">
                      <span>{result.file} ({formatSize(result.size || 0)})</span>
                    </span>
                  ) : (
                    <span className="text-xs text-red-500/70">{result.error}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
