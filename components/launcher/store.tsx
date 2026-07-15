"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { useElectron } from "@/lib/use-electron"
import { CORES, PLUGINS, MODS, VERSIONS, type CoreId, type StoreItem } from "@/lib/launcher-data"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Star, Download, Check, Ban, Search, Package, Puzzle, Info, Loader2, AlertCircle } from "lucide-react"

interface ModrinthHit {
  id: string
  slug: string
  name: string
  author: string
  description: string
  downloads: number
  iconUrl: string | null
  categories: string[]
  projectType: string
}

function formatDownloads(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export function Store() {
  const { t } = useTranslation()
  const [core, setCore] = useState<CoreId>("paper")
  const [query, setQuery] = useState("")
  const { isElectron } = useElectron()
  const active = CORES.find((c) => c.id === core)!
  const isDisabled = active.content === null
  const [liveHits, setLiveHits] = useState<ModrinthHit[]>([])
  const [totalHits, setTotalHits] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = useCallback(
    async (searchQuery: string, coreType: CoreId) => {
      if (!isElectron || !window.electronAPI) return
      if (coreType === "vanilla") return
      setLoading(true)
      setSearchError(null)
      try {
        const latestVersion = VERSIONS.find((v) => v.latest)?.version
        const result = await window.electronAPI.searchStore({
          query: searchQuery,
          coreType: coreType as "paper" | "fabric" | "forge",
          mcVersion: latestVersion,
          limit: 20,
          offset: 0,
        })
        setLiveHits(result.hits as ModrinthHit[])
        setTotalHits(result.totalHits)
        if (result.error) setSearchError(result.error)
      } catch (err: any) {
        setSearchError(err.message ?? t("store.search_failed"))
        setLiveHits([])
        setTotalHits(0)
      } finally {
        setLoading(false)
      }
    },
    [isElectron, t]
  )

  useEffect(() => {
    if (!isDisabled && isElectron) {
      doSearch(query, core)
    }
  }, [core, isDisabled, isElectron, doSearch])

  useEffect(() => {
    if (!isElectron || isDisabled) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(query, core), 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, isElectron, isDisabled, doSearch, core])

  const fallbackItems = active.content === "plugins" ? PLUGINS : active.content === "mods" ? MODS : []
  const fallbackFiltered = fallbackItems.filter(
    (i) =>
      i.name.toLowerCase().includes(query.toLowerCase()) ||
      i.category.toLowerCase().includes(query.toLowerCase())
  )
  const resultCount = isElectron ? totalHits : fallbackFiltered.length

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {CORES.map((c) => {
            const selected = c.id === core
            return (
              <button
                key={c.id}
                onClick={() => { setCore(c.id); setQuery("") }}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  selected
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
                )}
              >
                {c.content === "mods" ? <Package className="size-4" /> : <Puzzle className="size-4" />}
                {c.name}
              </button>
            )
          })}
        </div>
        <div className="relative w-full sm:w-60">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isDisabled}
            placeholder={isDisabled ? t("store.marketplace_unavailable") : t("store.search_placeholder", { content: t(`store.${active.content}`) })}
            className="h-9 w-full rounded-lg border border-input bg-background pr-3 pl-8 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <h2 className="font-heading text-sm font-semibold text-foreground">
          {isDisabled
            ? t("store.marketplace")
            : t("store.title_for_core", {
                contentType: t(`store.${active.content}`),
                coreName: active.name
              })}
        </h2>
        {!isDisabled && (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {loading ? "…" : t("store.results_count", { count: resultCount })}
          </span>
        )}
        {loading && <Loader2 className="size-4 animate-spin text-primary" />}
      </div>

      {searchError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="size-4 shrink-0" />
          {searchError}
        </div>
      )}

      {isDisabled ? (
        <VanillaEmptyState />
      ) : isElectron ? (
        <LiveStoreGrid hits={liveHits} loading={loading} coreType={core} />
      ) : (
        <MockStoreGrid items={fallbackFiltered} />
      )}
    </div>
  )
}

function VanillaEmptyState() {
  const { t } = useTranslation()
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            role="note"
            className="flex cursor-not-allowed flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Ban className="size-6" />
            </span>
            <div>
              <p className="font-heading text-sm font-semibold text-foreground">{t("store.vanilla_empty.title")}</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {t("store.vanilla_empty.description")}
              </p>
            </div>
            <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="size-3.5" />
              {t("store.vanilla_empty.hint")}
            </span>
          </div>
        }
      />
      <TooltipContent side="top">
        {t("store.vanilla_empty.tooltip")}
      </TooltipContent>
    </Tooltip>
  )
}

function LiveStoreGrid({
  hits,
  loading,
  coreType,
}: {
  hits: ModrinthHit[]
  loading: boolean
  coreType: CoreId
}) {
  const { t } = useTranslation()

  if (loading && hits.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t("store.searching_modrinth")}</p>
        </div>
      </div>
    )
  }

  if (hits.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">{t("store.no_results")}</p>
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {hits.map((hit) => (
        <LiveStoreCard key={hit.id} hit={hit} coreType={coreType} />
      ))}
    </div>
  )
}

function LiveStoreCard({ hit, coreType }: { hit: ModrinthHit; coreType: CoreId }) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<"idle" | "downloading" | "installed" | "error">("idle")
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.checkInstalled) {
      window.electronAPI.checkInstalled(hit.slug, coreType as string).then(installed => {
        if (installed) setStatus("installed")
      })
    }
  }, [hit.slug, coreType])

  const handleInstall = async () => {
    if (!window.electronAPI) return
    setStatus("downloading")
    setProgress(0)
    const unsub = window.electronAPI.onDownloadProgress((data) => {
      if (data.id === `plugin-${hit.id}`) {
        setProgress(data.percent)
      }
    })
    try {
      const latestVersion = VERSIONS.find((v) => v.latest)?.version ?? "1.21.4"
      const result = await window.electronAPI.downloadPlugin(
        hit.id,
        coreType as string,
        latestVersion
      )
      if (result.success) {
        setStatus("installed")
      } else {
        setStatus("error")
        setErrorMsg(result.error ?? t("store.download_failed"))
      }
    } catch (err: any) {
      setStatus("error")
      setErrorMsg(err.message ?? t("store.download_failed"))
    } finally {
      unsub()
    }
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
      <div className="flex items-start gap-3">
        {hit.iconUrl ? (
          <img
            src={hit.iconUrl}
            alt={hit.name}
            className="size-11 shrink-0 rounded-lg bg-secondary object-cover"
          />
        ) : (
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary font-heading text-sm font-bold text-primary">
            {hit.name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-sm font-semibold text-card-foreground">{hit.name}</p>
          <p className="truncate text-xs text-muted-foreground">{t("store.by_author", { author: hit.author ?? t("store.unknown_author") })}</p>
        </div>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {hit.projectType}
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{hit.description}</p>

      {status === "downloading" && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Download className="size-3.5" /> {formatDownloads(hit.downloads)}
          </span>
        </div>
        <button
          onClick={handleInstall}
          disabled={status === "downloading" || status === "installed"}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
            status === "installed"
              ? "border border-green-500/50 bg-green-500/10 text-green-500"
              : status === "downloading"
                ? "border border-primary/50 bg-primary/10 text-primary cursor-wait"
                : status === "error"
                  ? "border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  : "bg-primary text-primary-foreground hover:opacity-90"
          )}
        >
          {status === "installed" ? (
            <><Check className="size-3.5" /> {t("store.installed")}</>
          ) : status === "downloading" ? (
            <><Loader2 className="size-3.5 animate-spin" /> {progress}%</>
          ) : status === "error" ? (
            <><AlertCircle className="size-3.5" /> {t("store.retry")}</>
          ) : (
            <><Download className="size-3.5" /> {t("store.install")}</>
          )}
        </button>
      </div>
    </div>
  )
}

function MockStoreGrid({ items }: { items: StoreItem[] }) {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <MockStoreCard key={item.id} item={item} />
      ))}
      {items.length === 0 && (
        <p className="col-span-full py-10 text-center text-sm text-muted-foreground">{t("store.no_results")}</p>
      )}
    </div>
  )
}

function MockStoreCard({ item }: { item: StoreItem }) {
  const { t } = useTranslation()
  const [installed, setInstalled] = useState(Boolean(item.installed))
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary font-heading text-sm font-bold text-primary">
          {item.name.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-sm font-semibold text-card-foreground">{item.name}</p>
          <p className="truncate text-xs text-muted-foreground">{t("store.by_author", { author: item.author })}</p>
        </div>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {item.category}
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="size-3.5 fill-primary text-primary" /> {item.rating.toFixed(1)}
          </span>
          <span className="flex items-center gap-1">
            <Download className="size-3.5" /> {item.downloads}
          </span>
        </div>
        <button
          onClick={() => setInstalled((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
            installed
              ? "border border-primary/50 bg-primary/10 text-primary"
              : "bg-primary text-primary-foreground hover:opacity-90"
          )}
        >
          {installed ? (
            <><Check className="size-3.5" /> {t("store.installed")}</>
          ) : (
            <><Download className="size-3.5" /> {t("store.install")}</>
          )}
        </button>
      </div>
    </div>
  )
}
