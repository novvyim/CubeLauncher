"use client"
import { useState, useEffect } from "react"
import { useElectron } from "@/lib/use-electron"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslation } from "react-i18next"
import { MemoryStick, Coffee, Network, SlidersHorizontal, Save, Globe, Loader2 } from "lucide-react"
function SectionCard({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: typeof MemoryStick
  title: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
          <Icon className="size-4" />
        </span>
        <div>
          <h3 className="font-heading text-sm font-semibold text-card-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  )
}
function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string
  desc: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
export function SettingsPanel() {
  const { t, i18n } = useTranslation()
  const { getRam, getSavedRam, setSavedRam, getJavaPath, setJavaPath, selectFile, saveConfig, readConfig, getAikarFlags, setAikarFlags } = useElectron()
  const [maxRam, setMaxRam] = useState(32)
  const [ram, setRam] = useState(4)
  const [javaExec, setJavaExec] = useState("")
  useEffect(() => {
    Promise.all([getRam(), getSavedRam(), getJavaPath?.()]).then(([mem, saved, path]) => {
      if (mem) {
        const gb = Math.floor(mem / (1024 * 1024 * 1024))
        setMaxRam(gb)
        setRam(saved || Math.min(4, gb))
      }
      if (path !== undefined && path !== null) setJavaExec(path)
    })
    if (getAikarFlags) {
      getAikarFlags().then(setAikarFlagsEnabled)
    }
    if (readConfig) {
      readConfig().then((data) => {
        if (data) {
          if (data.serverPort !== undefined) setServerPort(data.serverPort)
          if (data.queryPort !== undefined) setQueryPort(data.queryPort)
          if (data.difficulty !== undefined) setDifficulty(data.difficulty)
          if (data.onlineMode !== undefined) setOnlineMode(data.onlineMode)
          if (data.pvp !== undefined) setPvp(data.pvp)
          if (data.whitelist !== undefined) setWhitelist(data.whitelist)
        }
      })
    }
  }, [getRam, getSavedRam, getJavaPath, readConfig, getAikarFlags])
  const handleSelectJava = async () => {
    if (!selectFile) return
    const path = await selectFile()
    if (path) {
      setJavaExec(path)
      setJavaPath?.(path)
    }
  }
  const [java, setJava] = useState("21")
  const [aikarFlagsEnabled, setAikarFlagsEnabled] = useState(false)
  const [serverPort, setServerPort] = useState("25565")
  const [queryPort, setQueryPort] = useState("25565")
  const [difficulty, setDifficulty] = useState("normal")
  const [onlineMode, setOnlineMode] = useState(true)
  const [pvp, setPvp] = useState(true)
  const [whitelist, setWhitelist] = useState(false)
  const [hardcore, setHardcore] = useState(false)
  const [saving, setSaving] = useState(false)
  const handleSave = async () => {
    setSaving(true)
    const configData = {
      serverPort,
      queryPort,
      difficulty,
      onlineMode,
      pvp,
      whitelist,
      hardcore
    }
    if (setAikarFlags) {
      await setAikarFlags(aikarFlagsEnabled)
    }
    await saveConfig(configData)
    setSaving(false)
  }
  return (
    <div className="flex w-full max-w-[1200px] flex-col gap-6 p-6">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{t('settings.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('settings.subtitle')}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {t('settings.save_changes')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <SectionCard icon={MemoryStick} title={t('settings.ram_allocation')} desc={t('settings.ram_desc')}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl font-bold tracking-tighter text-primary">
              {ram} GB
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {t('settings.of_available', { total: maxRam })}
            </span>
          </div>
          <Slider
            className="mt-4"
            value={[ram]}
            min={1}
            max={maxRam}
            step={1}
            onValueChange={(v) => {
              const val = Array.isArray(v) ? v[0] : v
              setRam(val)
              setSavedRam(val)
            }}
          />
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            <span>1 GB</span>
            <span>{maxRam} GB</span>
          </div>
          <div className="mt-6 border-t border-border pt-4">
            <ToggleRow
              label={t('settings.aikar_flags')}
              desc={t('settings.aikar_desc')}
              checked={aikarFlagsEnabled}
              onChange={setAikarFlagsEnabled}
            />
          </div>
        </SectionCard>

        <SectionCard icon={Coffee} title={t('settings.java_runtime')} desc={t('settings.java_desc')}>
          <div className="flex w-full items-center gap-2">
            <div className="flex h-10 flex-1 items-center rounded-lg border border-input bg-background px-3">
              <span className="truncate text-sm text-muted-foreground">
                {javaExec || t('settings.system_default')}
              </span>
            </div>
            <button
              onClick={handleSelectJava}
              className="h-10 rounded-lg bg-secondary px-4 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
            >
              {t('settings.browse')}
            </button>
          </div>
          {javaExec && (
            <button 
              onClick={() => {
                setJavaExec("")
                setJavaPath?.("")
              }}
              className="mt-2 text-xs text-destructive hover:underline"
            >
              {t('settings.reset')}
            </button>
          )}
        </SectionCard>
      </div>

      <SectionCard icon={Globe} title={t('settings.language')} desc={t('settings.language_desc')}>
        <div className="w-full max-w-sm">
          <Select value={i18n.language} onValueChange={(v) => v && i18n.changeLanguage(v)}>
            <SelectTrigger className="h-10 border-input bg-card text-sm">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent className="border-border bg-card/95 backdrop-blur-md">
              <SelectItem value="en">{t('settings.english')}</SelectItem>
              <SelectItem value="ru">{t('settings.russian')}</SelectItem>
              <SelectItem value="uk">{t('settings.ukrainian')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SectionCard>

      <SectionCard icon={Network} title={t('settings.network')} desc={t('settings.network_desc')}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('settings.server_port')}</label>
            <input
              value={serverPort}
              onChange={(e) => setServerPort(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('settings.query_port')}</label>
            <input
              value={queryPort}
              onChange={(e) => setQueryPort(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={SlidersHorizontal} title={t('settings.server_rules')} desc={t('settings.server_rules_desc')}>
        <div className="grid gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">{t('settings.online_mode')}</label>
              <p className="text-xs text-muted-foreground">{t('settings.online_mode_desc')}</p>
            </div>
            <Switch checked={onlineMode} onCheckedChange={setOnlineMode} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">{t('settings.whitelist')}</label>
              <p className="text-xs text-muted-foreground">{t('settings.whitelist_desc')}</p>
            </div>
            <Switch checked={whitelist} onCheckedChange={setWhitelist} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">{t('settings.pvp')}</label>
              <p className="text-xs text-muted-foreground">{t('settings.pvp_desc')}</p>
            </div>
            <Switch checked={pvp} onCheckedChange={setPvp} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">{t('settings.hardcore')}</label>
              <p className="text-xs text-muted-foreground">{t('settings.hardcore_desc')}</p>
            </div>
            <Switch checked={hardcore} onCheckedChange={setHardcore} />
          </div>
        </div>
        <div className="mt-6 border-t border-border pt-6">
          <label className="mb-3 block text-sm font-medium text-foreground">{t('settings.difficulty')}</label>
          <div className="grid grid-cols-4 gap-2">
            {["peaceful", "easy", "normal", "hard"].map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                  difficulty === d
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
