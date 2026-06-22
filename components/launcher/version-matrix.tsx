"use client"
import { useState, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"
import { useElectron } from "@/lib/use-electron"
import { CORES, VERSIONS, type CoreId } from "@/lib/launcher-data"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Server, Cpu, HardDrive, Activity, Plus, Search, Check, Minus, Zap, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
const CORE_ACCENT: Record<CoreId, string> = {
  vanilla: "text-muted-foreground",
  paper: "text-chart-3",
  forge: "text-chart-4",
  fabric: "text-chart-2",
}
const DOWNLOADABLE_CORES = new Set<CoreId>(["paper", "fabric", "vanilla", "forge"])
import { useTranslation } from "react-i18next"

export function VersionMatrix() {
  const { t } = useTranslation()
  const [query, setQuery] = useState("")
  const rows = VERSIONS.filter((v) => v.version.includes(query.trim()))
  const { downloadCore, downloads, isElectron, serverPath, onServerStats, getJavaVersion, selectCustomJar } = useElectron()
  const [javaVersion, setJavaVersion] = useState<string | null>(null)
  const [stats, setStats] = useState<{
    activeServers: string[],
    ramUsed: number | string,
    tps: string,
    cpu: string,
    details?: Record<string, { cpu: number, ramUsed: number }>
  }>({
    activeServers: [],
    ramUsed: 0,
    tps: "0.0",
    cpu: "0.0"
  })
  useEffect(() => {
    if (!onServerStats) return
    const unsubscribe = onServerStats((data: any) => {
      setStats(data)
    })
    return () => unsubscribe()
  }, [onServerStats])
  useEffect(() => {
    let mounted = true
    if (getJavaVersion) {
      getJavaVersion().then((v) => {
        if (mounted) setJavaVersion(v)
      })
    }
    return () => {
      mounted = false
    }
  }, [getJavaVersion])
  const handleCreate = async (coreId: CoreId, mcVersion: string, build?: string) => {
    if (!DOWNLOADABLE_CORES.has(coreId)) {
      return
    }
    if (!isElectron) {
      console.warn("Not running in Electron — download skipped")
      return
    }
    if (!serverPath) {
      console.warn("No server directory configured")
      return
    }
    await downloadCore(coreId as "paper" | "fabric" | "vanilla" | "forge", mcVersion, build)
  }
  const numActive = stats.activeServers?.length || 0

  const { totalCpuStr, totalRamStr, cpuDetails, ramDetails } = useMemo(() => {
    let cpuSum = 0
    let ramSum = 0
    const cDetails: { id: string; val: string }[] = []
    const rDetails: { id: string; val: string }[] = []

    if (stats.details) {
      for (const [id, d] of Object.entries(stats.details)) {
        cpuSum += d.cpu
        ramSum += d.ramUsed
        cDetails.push({ id, val: `${d.cpu.toFixed(1)}%` })
        rDetails.push({ id, val: `${(d.ramUsed / 1024 / 1024 / 1024).toFixed(2)} GB` })
      }
    }
    return {
      totalCpuStr: cpuSum > 0 ? `${cpuSum.toFixed(1)}%` : "0.0%",
      totalRamStr: ramSum > 0 ? `${(ramSum / 1024 / 1024 / 1024).toFixed(2)} GB` : "0.00 GB",
      cpuDetails: cDetails,
      ramDetails: rDetails,
    }
  }, [stats.details])

  const dynamicStats = [
    { label: "CPU Usage", value: numActive > 0 ? totalCpuStr : "—", sub: numActive > 0 ? "Process load" : "Server off", icon: Activity, details: cpuDetails },
    { label: "Total RAM Used", value: numActive > 0 ? totalRamStr : "—", sub: numActive > 0 ? "Allocated to JVM" : "Not allocated", icon: HardDrive, details: ramDetails },
    { label: "Avg. Tick Rate", value: numActive > 0 ? stats.tps : "—", sub: numActive > 0 ? "TPS (20.0 max)" : "No servers", icon: Server },
    { label: "Java Runtime", value: javaVersion ?? "—", sub: javaVersion ? "Detected" : "Checking...", icon: Cpu },
  ]
  return (
    <div className="flex flex-col gap-6">
      {}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {dynamicStats.map((s, i) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="animate-card-enter rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_20px_-4px] hover:shadow-primary/20"
              style={{ animationDelay: `${i * 75}ms` }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                <Icon className={cn("size-4", s.value !== "—" ? "text-primary" : "text-muted-foreground")} />
              </div>
              <p className={cn("mt-2 font-heading text-2xl font-semibold tracking-tight", s.value !== "—" ? "text-primary" : "text-card-foreground")}>
                {s.value}
              </p>
              {s.details && s.details.length > 0 && numActive > 0 && (
                <div className="mt-2 flex flex-col gap-0.5">
                  {s.details.map((d) => (
                    <div key={d.id} className="text-xs text-muted-foreground truncate">
                      {d.id}: <span className="text-foreground font-medium">{d.val}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-1 text-[11px] text-muted-foreground/70">{s.sub}</p>
            </div>
          )
        })}
      </div>
      {}
      <div id="quick-create">
        <h2 className="mb-3 font-heading text-sm font-semibold text-foreground">{t('matrix.quick_create')}</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {CORES.map((core, i) => {
            const canDownload = DOWNLOADABLE_CORES.has(core.id)
            const dlKey = Object.keys(downloads).find(
              (k) => k.startsWith(`core-${core.id}-`) && downloads[k].status === "downloading"
            )
            const isDownloading = !!dlKey
            return (
              <button
                key={core.id}
                disabled={!canDownload || isDownloading}
                onClick={() => {
                  const latest = VERSIONS.find((v) => v.latest && v.cores[core.id].available)
                  if (latest) handleCreate(core.id, latest.version)
                }}
                className={cn(
                  "animate-card-enter group flex flex-col items-start rounded-xl border border-border bg-card p-4 text-left transition-all duration-300 hover:border-primary/50 hover:bg-card/80 hover:shadow-[0_0_20px_-4px] hover:shadow-primary/20",
                  (!canDownload || isDownloading) && "opacity-60 cursor-not-allowed hover:border-border hover:bg-card hover:shadow-none"
                )}
                style={{ animationDelay: `${300 + i * 75}ms` }}
              >
                <div className="flex w-full items-center justify-between">
                  <span className={cn("flex size-9 items-center justify-center rounded-lg bg-secondary", CORE_ACCENT[core.id])}>
                    <Zap className="size-4" />
                  </span>
                  {isDownloading ? (
                    <Loader2 className="size-4 animate-spin text-primary" />
                  ) : (
                    <Plus className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
                  )}
                </div>
                <p className="mt-3 font-heading text-sm font-semibold text-card-foreground">{core.name}</p>
                <p className="text-xs text-muted-foreground">
                  {isDownloading ? t('matrix.downloading') : !canDownload ? t('matrix.coming_soon') : core.tagline}
                </p>
              </button>
            )
          })}
          <button
            onClick={() => selectCustomJar && selectCustomJar()}
            className="animate-card-enter group flex flex-col items-start rounded-xl border border-dashed border-border bg-transparent p-4 text-left transition-all duration-300 hover:border-primary/50 hover:bg-card/40 hover:shadow-[0_0_20px_-4px] hover:shadow-primary/20"
            style={{ animationDelay: `${300 + CORES.length * 75}ms` }}
          >
            <div className="flex w-full items-center justify-between">
              <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors group-hover:text-primary group-hover:bg-primary/10">
                <Plus className="size-4" />
              </span>
            </div>
            <p className="mt-3 font-heading text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors">{t('matrix.custom_core')}</p>
            <p className="text-xs text-muted-foreground">
              {t('matrix.select_jar')}
            </p>
          </button>
        </div>
      </div>
      {}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-sm font-semibold text-card-foreground">{t('matrix.title')}</h2>
            <p className="text-xs text-muted-foreground">{t('matrix.subtitle')}</p>
          </div>
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('matrix.search')}
              className="h-9 w-full rounded-lg border border-input bg-background pr-3 pl-8 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>
        </div>
        {}
        <div className="grid grid-cols-[1.2fr_repeat(4,1fr)] gap-2 border-b border-border px-4 py-2.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t('matrix.version')}</span>
          {CORES.map((c) => (
            <span key={c.id} className="text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {c.name}
            </span>
          ))}
        </div>
        <div className="divide-y divide-border">
          {rows.map((row) => (
            <div id={`version-${row.version}`} key={row.version} className="grid grid-cols-[1.2fr_repeat(4,1fr)] items-center gap-2 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium text-foreground">{row.version}</span>
                {row.latest && (
                  <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    {t('matrix.latest')}
                  </span>
                )}
              </div>
              {CORES.map((core) => {
                const cell = row.cores[core.id]
                if (!cell.available) {
                  return (
                    <div key={core.id} className="flex justify-center">
                      <span className="flex size-7 items-center justify-center rounded-md text-muted-foreground/40">
                        <Minus className="size-4" />
                      </span>
                    </div>
                  )
                }
                const dlId = `core-${core.id}-${row.version}`
                const dl = downloads[dlId]
                const isActive = dl?.status === "downloading"
                const isDone = dl?.status === "done"
                const isError = dl?.status === "error"
                const canDl = DOWNLOADABLE_CORES.has(core.id)
                return (
                  <div key={core.id} className="flex justify-center">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <button
                            disabled={!canDl || isActive}
                            onClick={() => handleCreate(core.id, row.version, cell.build)}
                            className={cn(
                              "group flex items-center gap-1.5 rounded-md border border-border bg-secondary/60 px-2.5 py-1 transition-colors",
                              canDl && !isActive && "hover:border-primary/60 hover:bg-primary/10",
                              isActive && "border-primary/40 bg-primary/5",
                              isDone && "border-green-500/40 bg-green-500/5",
                              isError && "border-red-500/40 bg-red-500/5",
                              !canDl && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {isActive ? (
                              <Loader2 className="size-3.5 animate-spin text-primary" />
                            ) : isDone ? (
                              <CheckCircle2 className="size-3.5 text-green-500" />
                            ) : isError ? (
                              <AlertCircle className="size-3.5 text-red-500" />
                            ) : (
                              <Check className={cn("size-3.5", CORE_ACCENT[core.id])} />
                            )}
                            <span className="text-[11px] font-medium text-foreground">
                              {isActive
                                ? `${dl.percent}%`
                                : isDone
                                  ? "Done"
                                  : isError
                                    ? "Error"
                                    : cell.build ?? "Ready"}
                            </span>
                          </button>
                        }
                      />
                      <TooltipContent>
                        {isActive
                          ? `Downloading ${core.name} ${row.version}…`
                          : isDone
                            ? `${core.name} ${row.version} installed!`
                            : isError
                              ? `Failed: ${dl?.error}`
                              : canDl
                                ? `Create ${core.name} ${row.version}`
                                : `${core.name} download not supported yet`}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )
              })}
            </div>
          ))}
          {rows.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No versions match "{query}".</p>
          )}
        </div>
      </div>
    </div>
  )
}
