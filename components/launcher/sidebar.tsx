"use client"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useElectron } from "@/lib/use-electron"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useTranslation } from "react-i18next"
import { Boxes, LayoutGrid, Store, FolderTree, Settings, Cpu, Loader2, FolderOpen, Play, Server, Terminal, Square, Check, Heart, Users, Archive } from "lucide-react"
export type View = "dashboard" | "store" | "files" | "settings" | "console" | "players" | "backups"
const NAV: { id: View; label: string; icon: any; hint: string; beta?: boolean }[] = [
  { id: "dashboard", label: "Version Matrix", icon: LayoutGrid, hint: "Create servers" },
  { id: "store", label: "Store", icon: Store, hint: "Plugins & mods" },
  { id: "files", label: "File Explorer", icon: FolderTree, hint: "Browse & edit" },
  { id: "console", label: "Console", icon: Terminal, hint: "View logs" },
  { id: "players", label: "Players", icon: Users, hint: "Manage players", beta: true },
  { id: "backups", label: "Backups", icon: Archive, hint: "Zip server data", beta: true },
  { id: "settings", label: "Settings", icon: Settings, hint: "Configure" },
]
export function Sidebar({
  view,
  onViewChange,
}: {
  view: View
  onViewChange: (v: View) => void
}) {
  const { t } = useTranslation()
  const { serverPath, downloads, runningServers, selectFolder, startServer, stopServer, openExternal, getAikarFlags, setAikarFlags } = useElectron()
  const activeDownload = Object.values(downloads).find((d) => d.status === "downloading" || d.status === "finishing")
  const installedJars = Object.values(downloads).filter((d) => d.status === "done").map(d => d.fileName)
  const [selectedJar, setSelectedJar] = useState<string>("")
  const isRunning = runningServers.includes(selectedJar)
  const [isStarting, setIsStarting] = useState(false)
  useEffect(() => {
    if (installedJars.length > 0 && !selectedJar) {
      setSelectedJar(installedJars[0])
    }
  }, [installedJars, selectedJar])
  const handleStart = async () => {
    if (!selectedJar || !startServer) return
    setIsStarting(true)
    const serverId = await startServer(selectedJar)
    if (serverId) {
      onViewChange("console")
    }
    setIsStarting(false)
  }
  const handleStop = async () => {
    if (!stopServer || !selectedJar) return
    await stopServer(selectedJar)
  }
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Boxes className="size-5" />
        </div>
        <div className="leading-tight">
          <p className="font-heading text-sm font-semibold text-sidebar-foreground">{t('sidebar.title')}</p>
          <p className="text-xs text-muted-foreground">{t('sidebar.subtitle')}</p>
        </div>
      </div>
      {}
      <nav className="flex flex-1 flex-col gap-1 px-3">
        <p className="px-2 pt-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {t('sidebar.manage')}
        </p>
        {NAV.map((item) => {
          const Icon = item.icon
          const active = view === item.id
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className={cn("size-[18px]", active && "text-primary")} />
              <span className="flex-1 text-left font-medium">{t(`sidebar.${item.id.replace('dashboard', 'version_matrix').replace('files', 'file_explorer')}`)}</span>
              {item.beta && <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-500">Beta</span>}
              {active && <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />}
            </button>
          )
        })}
      </nav>
      {}
      {activeDownload ? (
        <div className="m-3 rounded-xl border border-sidebar-border bg-card/60 p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              {activeDownload.status === "finishing" ? (
                <>
                  <Check className="size-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Done!</span>
                </>
              ) : (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Downloading…
                </>
              )}
            </span>
            <span className="text-xs font-semibold tabular-nums text-primary">
              {activeDownload.percent}%
            </span>
          </div>
          <p className="mt-1.5 truncate text-xs text-muted-foreground">{activeDownload.fileName}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${activeDownload.percent}%` }}
            />
          </div>
        </div>
      ) : installedJars.length > 0 ? (
        <div className="m-3 rounded-xl border border-sidebar-border bg-card/60 p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Server className="size-3.5" /> {t('sidebar.active_server')}
            </span>
          </div>
            <div className="flex-1 mt-3">
              <Select value={selectedJar} onValueChange={(v) => setSelectedJar(v || "")}>
                <SelectTrigger className="h-8 w-full border-border bg-card text-xs hover:bg-accent/50 focus:ring-0">
                  <SelectValue placeholder="Select Core" />
                </SelectTrigger>
                <SelectContent className="border-border bg-card/95 backdrop-blur-md">
                  {installedJars.map((jar) => (
                    <SelectItem key={jar} value={jar} className="text-xs hover:bg-accent focus:bg-accent">
                      {jar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          {isRunning ? (
            <button
              onClick={handleStop}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20"
            >
              <Square className="size-3.5" fill="currentColor" />
              {t('sidebar.stop_server')}
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={isStarting || activeDownload !== undefined || !selectedJar}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isStarting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Play className="size-3.5" fill="currentColor" />
              )}
              {t('sidebar.start_server')}
            </button>
          )}
        </div>
      ) : serverPath ? (
        <div className="m-3 rounded-xl border border-sidebar-border bg-card/60 p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Cpu className="size-3.5" /> {t('sidebar.workspace')}
            </span>
          </div>
          <p className="mt-1.5 truncate text-xs text-muted-foreground" title={serverPath}>
            {serverPath}
          </p>
          <button
            onClick={selectFolder}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <FolderOpen className="size-3.5" />
            {t('sidebar.change_folder')}
          </button>
        </div>
      ) : null}

      <div className="px-3 pb-4">
        <button
          onClick={() => openExternal('https://donatello.to/CTPAX4OK')}
          className="flex w-full items-center gap-2.5 rounded-lg border border-pink-500/20 bg-pink-500/5 px-3 py-2.5 text-sm font-medium text-pink-400 transition-all duration-300 hover:border-pink-500/40 hover:bg-pink-500/10 hover:shadow-[0_0_20px_-4px] hover:shadow-pink-500/30"
        >
          <Heart className="size-[18px]" />
          <span>{t('sidebar.support_author')}</span>
        </button>
      </div>
    </aside>
  )
}
