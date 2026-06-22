"use client"
import { useEffect } from "react"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { VERSIONS } from "@/lib/launcher-data"
import { LayoutGrid, Store, FolderTree, Settings, Download } from "lucide-react"
import { type View } from "@/components/launcher/sidebar"
import type { Dispatch, SetStateAction } from "react"

export function GlobalCommand({
  open,
  setOpen,
  onNavigate,
}: {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  onNavigate: (view: View) => void
}) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [setOpen])
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command>
        <CommandInput placeholder="Search versions, pages, or commands..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => { onNavigate("dashboard"); setOpen(false) }}>
              <LayoutGrid className="mr-2 size-4" />
              <span>Version Matrix</span>
            </CommandItem>
            <CommandItem onSelect={() => { onNavigate("store"); setOpen(false) }}>
              <Store className="mr-2 size-4" />
              <span>Store</span>
            </CommandItem>
            <CommandItem onSelect={() => { onNavigate("files"); setOpen(false) }}>
              <FolderTree className="mr-2 size-4" />
              <span>File Explorer</span>
            </CommandItem>
            <CommandItem onSelect={() => { onNavigate("settings"); setOpen(false) }}>
              <Settings className="mr-2 size-4" />
              <span>Settings</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Minecraft Versions">
            {VERSIONS.map((v) => (
              <CommandItem key={v.version} onSelect={() => { 
                onNavigate("dashboard")
                setOpen(false)
                requestAnimationFrame(() => {
                  document.getElementById(`version-${v.version}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
                })
              }}>
                <Download className="mr-2 size-4" />
                <span>Download {v.version}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
