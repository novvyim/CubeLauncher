"use client"
import { useState } from "react"
import "@/lib/i18n"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ElectronProvider, useElectron } from "@/lib/use-electron"
import { Sidebar, type View } from "@/components/launcher/sidebar"
import { VersionMatrix } from "@/components/launcher/version-matrix"
import { Store } from "@/components/launcher/store"
import { FileExplorer } from "@/components/launcher/file-explorer"
import { SettingsPanel } from "@/components/launcher/settings-panel"
import { Console } from "@/components/launcher/console"
import { Players } from "@/components/launcher/players"
import { Backups } from "@/components/launcher/backups"
import { GlobalCommand } from "@/components/launcher/global-command"
import { SystemAlert } from "@/components/launcher/system-alert"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Bell, Plus, Search, FolderOpen, Loader2, Minus, Maximize2, X } from "lucide-react"
const META: Record<View, { title: string; subtitle: string }> = {
  dashboard: { title: "Version Matrix", subtitle: "Spin up a new server from any version and core" },
  store: { title: "Content Store", subtitle: "Browse plugins and mods for your active core" },
  files: { title: "File Explorer", subtitle: "Browse the server directory and edit configs" },
  settings: { title: "Settings", subtitle: "Tune resources, network, and gameplay rules" },
  console: { title: "Console", subtitle: "Live server logs and terminal input" },
  players: { title: "Player Manager", subtitle: "Manage online players via RCON" },
  backups: { title: "Backup Manager", subtitle: "Create ZIP archives of your server data" },
}
export default function Page() {
  return (
    <ElectronProvider>
      <TooltipProvider delay={150}>
        <AppShell />
      </TooltipProvider>
    </ElectronProvider>
  )
}
import { useTranslation } from "react-i18next"

function AppShell() {
  const [view, setView] = useState<View>("dashboard")
  const [cmdOpen, setCmdOpen] = useState(false)
  const { t } = useTranslation()
  const meta = META[view] || { title: "Loading...", subtitle: "" }
  const { initializing, serverPath, selectFolder, isElectron, minimizeWindow, maximizeWindow, closeWindow } = useElectron()
  if (initializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Initializing CubeForge…</p>
        </div>
      </div>
    )
  }
  if (isElectron && !serverPath) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card p-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-xl bg-primary/10">
            <FolderOpen className="size-7 text-primary" />
          </span>
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">Welcome to CubeForge</h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Select a directory to use as your Minecraft server workspace before getting started.
            </p>
          </div>
          <button
            onClick={selectFolder}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <FolderOpen className="size-4" />
            Choose Folder
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {}
      {isElectron && (
        <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-sidebar" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
          <span className="pl-4 text-xs font-medium text-muted-foreground">CubeForge</span>
          <div className="flex" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <button onClick={minimizeWindow} className="flex h-9 w-12 items-center justify-center text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <Minus className="size-3.5" />
            </button>
            <button onClick={maximizeWindow} className="flex h-9 w-12 items-center justify-center text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <Maximize2 className="size-3.5" />
            </button>
            <button onClick={closeWindow} className="flex h-9 w-12 items-center justify-center text-muted-foreground transition-colors hover:bg-red-500/80 hover:text-white">
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar view={view} onViewChange={setView} />
        <main className="flex flex-1 flex-col overflow-hidden">
          {}
          <header className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h1 className="font-heading text-lg font-semibold tracking-tight text-foreground">{meta.title}</h1>
              <p className="text-sm text-muted-foreground">{meta.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCmdOpen(true)}
                className="hidden items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:flex"
              >
                <Search className="size-4" />
                <span>Search…</span>
                <kbd className="ml-2 rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">⌘K</kbd>
              </button>
              <Popover>
                <PopoverTrigger className="relative flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                  <Bell className="size-4" />
                  <span className="absolute top-2 right-2 size-1.5 rounded-full bg-primary" />
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h3 className="font-heading text-sm font-semibold">Notifications</h3>
                    <button className="text-[11px] font-medium text-muted-foreground hover:text-foreground">
                      Clear all
                    </button>
                  </div>
                  <div className="flex h-32 flex-col items-center justify-center text-center">
                    <Bell className="mb-2 size-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No new notifications</p>
                  </div>
                </PopoverContent>
              </Popover>
              <button
                onClick={() => {
                  setView("dashboard")
                  requestAnimationFrame(() => {
                    document.getElementById("quick-create")?.scrollIntoView({ behavior: "smooth", block: "center" })
                  })
                }}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="size-4" /> {t('sidebar.new_server')}
              </button>
            </div>
          </header>
          {}
          <div className="flex-1 overflow-y-auto p-6">
            {view === "dashboard" && <VersionMatrix />}
            {view === "store" && <Store />}
            {view === "files" && <FileExplorer />}
            {view === "settings" && <SettingsPanel />}
            {view === "console" && <Console />}
            {view === "players" && <Players />}
            {view === "backups" && <Backups />}
          </div>
        </main>
      </div>
      <GlobalCommand open={cmdOpen} setOpen={setCmdOpen} onNavigate={setView} />
      <SystemAlert />
    </div>
  )
}
