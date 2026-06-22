"use client"

import { useState, useEffect, useCallback } from "react"
import { useElectron } from "@/lib/use-electron"
import { User, Shield, Ban, MessageSquare, RefreshCcw, Command } from "lucide-react"

interface PlayerInfo {
  name: string
  uuid?: string
}

export function Players() {
  const { runningServers, rconCommand } = useElectron()
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [players, setPlayers] = useState<PlayerInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [rconError, setRconError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState(Date.now())

  useEffect(() => {
    if (runningServers.length > 0 && (!activeTab || !runningServers.includes(activeTab))) {
      setActiveTab(runningServers[0])
    } else if (runningServers.length === 0) {
      setActiveTab(null)
      setPlayers([])
    }
  }, [runningServers, activeTab])

  const fetchPlayers = useCallback(async () => {
    if (!activeTab || !rconCommand) return
    setLoading(true)
    setRconError(null)
    try {
      const res = await rconCommand(activeTab, "list")
      if (!res.success) {
        setRconError(res.error ?? "Failed to connect to RCON. Ensure the server has fully started.")
        setPlayers([])
      } else {
        const text = res.response ?? ""
        const parts = text.split(":")
        if (parts.length > 1) {
          const namesStr = parts.pop() || ""
          const names = namesStr.split(",").map((n: string) => n.trim()).filter(Boolean)
          setPlayers(names.map((name: string) => ({ name })))
        } else {
          setPlayers([])
        }
      }
    } catch (err: any) {
      setRconError(err.message)
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }, [activeTab, rconCommand])

  useEffect(() => {
    if (activeTab) {
      fetchPlayers()
      const interval = setInterval(fetchPlayers, 5000)
      return () => clearInterval(interval)
    }
  }, [activeTab, fetchPlayers, lastRefresh])

  const executeAction = async (player: string, action: string) => {
    if (!activeTab || !rconCommand) return
    let cmd = ""
    switch (action) {
      case "kick": cmd = `kick ${player} Kicked by Admin`; break;
      case "ban": cmd = `ban ${player} Banned by Admin`; break;
      case "op": cmd = `op ${player}`; break;
      case "deop": cmd = `deop ${player}`; break;
    }
    if (cmd) {
      await rconCommand(activeTab, cmd)
      setLastRefresh(Date.now())
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">Player Manager</h2>
          <p className="text-sm text-muted-foreground">Manage online players via RCON</p>
        </div>
        <button 
          onClick={() => setLastRefresh(Date.now())}
          className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCcw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-border/50 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground overflow-x-auto">
        <User className="size-4 shrink-0" />
        {runningServers.length === 0 ? (
          <span>No active servers</span>
        ) : (
          <div className="flex gap-2">
            {runningServers.map(id => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-3 py-1 rounded-md transition-colors ${activeTab === id ? 'bg-primary/20 text-primary' : 'hover:bg-secondary text-muted-foreground'}`}
              >
                {id}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {!activeTab ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Ban className="size-8 opacity-20" />
            <p className="text-sm">Start a server to manage players</p>
          </div>
        ) : rconError ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            <strong className="block mb-1 font-semibold">RCON Error</strong>
            {rconError}
          </div>
        ) : players.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
            <User className="size-8 opacity-20" />
            <p className="text-sm">No players online</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {players.map(p => (
              <div key={p.name} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50">
                <div className="flex items-center gap-3">
                  <img 
                    src={`https://minotar.net/armor/bust/${p.name}/64.png`} 
                    alt={p.name} 
                    className="size-12 rounded-md bg-secondary object-cover shadow-sm"
                  />
                  <div className="flex flex-col">
                    <span className="font-heading font-semibold text-foreground">{p.name}</span>
                    <span className="text-xs text-green-500 flex items-center gap-1">
                      <span className="size-2 rounded-full bg-green-500 animate-pulse"></span> Online
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={() => executeAction(p.name, 'kick')} className="flex items-center justify-center gap-1.5 rounded-md bg-secondary/50 px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-orange-500/20 hover:text-orange-500">
                    <Ban className="size-3.5" /> Kick
                  </button>
                  <button onClick={() => executeAction(p.name, 'ban')} className="flex items-center justify-center gap-1.5 rounded-md bg-secondary/50 px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-red-500/20 hover:text-red-500">
                    <Shield className="size-3.5" /> Ban
                  </button>
                  <button onClick={() => executeAction(p.name, 'op')} className="flex items-center justify-center gap-1.5 rounded-md bg-secondary/50 px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-primary/20 hover:text-primary">
                    <Command className="size-3.5" /> OP
                  </button>
                  <button onClick={() => executeAction(p.name, 'deop')} className="flex items-center justify-center gap-1.5 rounded-md bg-secondary/50 px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-zinc-500/20 hover:text-zinc-400">
                    <User className="size-3.5" /> Deop
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
