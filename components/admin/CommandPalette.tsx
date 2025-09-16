// components/admin/CommandPalette.tsx
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Search, LayoutDashboard, Users, Images, Megaphone, CreditCard,
  ShieldCheck, Settings, Bot, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Item =
  | { type: 'route'; label: string; href: string; icon: React.ReactNode; keywords?: string }
  | { type: 'action'; label: string; prompt: string; mode?: 'assist'|'auto'|'simulate'; icon: React.ReactNode; modules?: string[]; keywords?: string }

const BASE_ITEMS: Item[] = [
  { type: 'route',  label: 'Dashboard',           href: '/admin',                        icon: <LayoutDashboard className="h-4 w-4" /> },
  { type: 'route',  label: 'CoPilot Pro',         href: '/admin/copilot',                icon: <Bot className="h-4 w-4" /> , keywords: 'copilot ai' },
  { type: 'route',  label: 'Nutzer & Creator',    href: '/admin/users',                  icon: <Users className="h-4 w-4" /> },
  { type: 'route',  label: 'Medien-Studio Review',href: '/admin/media-studio/review',    icon: <Images className="h-4 w-4" /> },
  { type: 'route',  label: 'Kampagnen',           href: '/admin/marketing',              icon: <Megaphone className="h-4 w-4" /> },
  { type: 'route',  label: 'Zahlungen',           href: '/admin/payments',               icon: <CreditCard className="h-4 w-4" /> },
  { type: 'route',  label: 'Security',            href: '/admin/security',               icon: <ShieldCheck className="h-4 w-4" /> },
  { type: 'route',  label: 'Einstellungen',       href: '/admin/settings',               icon: <Settings className="h-4 w-4" /> },
  // Quick Copilot Actions
  { type: 'action', label: 'CoPilot: IP blocken + 24h Report (simulate)', prompt: 'Blockiere IP 203.0.113.42 und generiere Security-Report 24h.', mode: 'simulate', icon: <ShieldCheck className="h-4 w-4" />, modules: ['security'], keywords: 'ip block report security' },
  { type: 'action', label: 'CoPilot: Refund CHF 25 (assist)',             prompt: 'Refund CHF 25.00 für Payment PAY_12345 wegen Doppelbuchung. Bestätigen.', mode: 'assist',   icon: <CreditCard className="h-4 w-4" />, modules: ['payments'], keywords: 'refund rückerstattung' },
  { type: 'action', label: 'CoPilot: Performance Audit (assist)',         prompt: 'Prüfe Performance, minimiere LCP auf Landingpage, schlage 3 Optimierungen vor.', mode: 'assist', icon: <Bot className="h-4 w-4" />, modules: ['ux'], keywords: 'performance lcp audit' },
]

export default function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [active, setActive] = React.useState(0)

  // Öffnen per globalem CustomEvent (wird in Topbar getriggert) & Hotkey
  React.useEffect(() => {
    const onOpen = () => setOpen(true)
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      } else if (open) {
        if (e.key === 'Escape') setOpen(false)
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i)=>Math.min(i+1, filtered.length-1)) }
        if (e.key === 'ArrowUp')   { e.preventDefault(); setActive((i)=>Math.max(i-1, 0)) }
        if (e.key === 'Enter')     { e.preventDefault(); choose(active) }
      }
    }
    window.addEventListener('jetnity:open-command-palette' as any, onOpen)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('jetnity:open-command-palette' as any, onOpen)
      window.removeEventListener('keydown', onKey)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return BASE_ITEMS
    return BASE_ITEMS.filter((it) => {
      const hay = (it.type === 'route' ? it.label : `${it.label} ${it.keywords ?? ''}`).toLowerCase()
      return hay.includes(q)
    })
  }, [query])

  const choose = async (index: number) => {
    const item = filtered[index]
    if (!item) return
    if (item.type === 'route') {
      setOpen(false)
      router.push(item.href)
      return
    }
    // action → Copilot Execute
    try {
      setOpen(false)
      const r = await fetch('/api/admin/copilot/execute', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: item.prompt, mode: item.mode ?? 'assist', modules: item.modules ?? [] }),
      })
      const json = await r.json()
      if (json?.ok) toast.success(json.summary ?? 'Aktion ausgeführt')
      else toast.error(json?.summary ?? 'Aktion fehlgeschlagen')
    } catch (e: any) {
      toast.error(e?.message ?? 'Aktion fehlgeschlagen')
    }
  }

  if (!open) return null

  return (
    <div role="dialog" aria-modal="true" aria-label="Befehlspalette"
         className="fixed inset-0 z-[100]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={()=>setOpen(false)} />

      {/* Panel */}
      <div className="absolute left-1/2 top-[12%] w-[92%] max-w-2xl -translate-x-1/2 rounded-2xl border bg-card shadow-xl">
        {/* Search */}
        <div className="flex items-center gap-2 border-b p-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            placeholder="Suchen oder Befehl eingeben…"
            className="h-9 w-full bg-transparent text-sm outline-none"
            value={query}
            onChange={(e)=>{ setQuery(e.target.value); setActive(0) }}
          />
          <kbd className="rounded border bg-muted px-1.5 text-[10px] text-foreground/70">Esc</kbd>
        </div>

        {/* Results */}
        <ul className="max-h-[60vh] overflow-y-auto p-1">
          {filtered.map((it, i) => (
            <li key={`${it.type}-${i}`}>
              <button
                type="button"
                onClick={()=>choose(i)}
                onMouseEnter={()=>setActive(i)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm',
                  i === active ? 'bg-muted' : 'hover:bg-muted/60'
                )}
              >
                <div className="flex items-center gap-2">
                  {it.icon}
                  <span className="truncate">{it.label}</span>
                </div>
                <ChevronRight className="h-4 w-4 opacity-60" />
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-5 text-center text-sm text-muted-foreground">
              Nichts gefunden.
            </li>
          )}
        </ul>

        {/* Footer */}
        <div className="border-t px-3 py-2 text-[11px] text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>Enter: Öffnen/Ausführen</span>
            <span>↑/↓: Navigieren</span>
          </div>
          <div className="flex items-center gap-2">
            <Bot className="h-3.5 w-3.5" />
            <span>CoPilot integriert</span>
          </div>
        </div>
      </div>
    </div>
  )
}
