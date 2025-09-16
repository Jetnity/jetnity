// components/layout/AdminTopbar.tsx
'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Settings,
  LogOut,
  UserCircle2,
  Wand2,
  Rocket,
  Play,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  /** Überschrift links (fallback: aus Breadcrumbs) */
  title?: string
  /** Optionaler Callback zum Öffnen/Schließen der Sidebar (z. B. Mobile-Drawer) */
  onToggleSidebar?: () => void
  /** Menü-Button links anzeigen (wird meist nur auf <md gebraucht) */
  showMenuButton?: boolean
  /** Optionaler rechter Slot (z. B. Custom-Buttons) */
  rightSlot?: React.ReactNode
}

/* ───────────────────────── Utilities ───────────────────────── */

function buildCrumbs(pathname: string) {
  const parts = (pathname || '/').split('/').filter(Boolean)
  const adminIdx = parts.indexOf('admin')
  const segs = adminIdx >= 0 ? parts.slice(adminIdx) : parts
  const items = segs.map((s, i) => {
    const href = '/' + segs.slice(0, i + 1).join('/')
    const pretty = decodeURIComponent(s)
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (m) => m.toUpperCase())
    return { href, label: pretty || 'Admin' }
  })
  if (items.length === 0 || items[0].label.toLowerCase() !== 'admin') {
    items.unshift({ href: '/admin', label: 'Admin' })
  }
  return items
}

const THEME_LS_KEY = 'jetnity:theme' // 'light' | 'dark' | 'system'

/* ───────────────────────── Component ───────────────────────── */

export default function AdminTopbar({
  title,
  onToggleSidebar,
  showMenuButton = true,
  rightSlot,
}: Props) {
  const pathname = usePathname()

  // ---- Breadcrumbs
  const crumbs = React.useMemo(() => buildCrumbs(pathname || '/'), [pathname])
  const heading = title ?? crumbs.at(-1)?.label ?? 'Admin'

  // ---- Theme
  const [isDark, setIsDark] = React.useState(false)
  React.useEffect(() => {
    const root = document.documentElement
    const saved = (localStorage.getItem(THEME_LS_KEY) as 'light' | 'dark' | 'system' | null) || 'system'
    const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    const wantsDark = saved === 'dark' || (saved === 'system' && systemDark)
    root.classList.toggle('dark', wantsDark)
    setIsDark(wantsDark)
  }, [])
  const toggleTheme = () => {
    const root = document.documentElement
    const nowDark = !root.classList.contains('dark')
    root.classList.toggle('dark', nowDark)
    setIsDark(nowDark)
    try { localStorage.setItem(THEME_LS_KEY, nowDark ? 'dark' : 'light') } catch {}
  }

  // ---- Notifications & User-Menü (A11y)
  const [notifOpen, setNotifOpen] = React.useState(false)
  const [userOpen, setUserOpen] = React.useState(false)
  const notifRef = React.useRef<HTMLDivElement | null>(null)
  const userRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (notifOpen && notifRef.current && !notifRef.current.contains(t)) setNotifOpen(false)
      if (userOpen && userRef.current && !userRef.current.contains(t)) setUserOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setNotifOpen(false); setUserOpen(false) } }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onEsc)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onEsc) }
  }, [notifOpen, userOpen])

  // ---- Command Palette (⌘/Ctrl+K)
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      if (isCmdK) {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('jetnity:open-command-palette'))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ---- CoPilot Quick Actions (Assist/Auto/Simulate)
  const [copilotOpen, setCopilotOpen] = React.useState(false)
  const [busy, setBusy] = React.useState<null | 'assist' | 'auto' | 'simulate'>(null)
  const copilotRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (copilotOpen && copilotRef.current && !copilotRef.current.contains(t)) setCopilotOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [copilotOpen])

  async function runCopilot(mode: 'assist' | 'auto' | 'simulate') {
    if (busy) return
    setBusy(mode)
    try {
      const res = await fetch('/api/admin/copilot/actions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'Aktion fehlgeschlagen')
      // Event für Panels/Widgets feuern
      window.dispatchEvent(new CustomEvent('jetnity:copilot:executed', { detail: { mode, suggestion: json?.suggestion } }))
      setCopilotOpen(false)
    } catch (e: any) {
      alert(e?.message || 'Aktion fehlgeschlagen.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <header
      role="banner"
      className={cn(
        'sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md',
        'border-border'
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5">
        {/* Links: Sidebar Toggle + Titel / Breadcrumb */}
        <div className="flex min-w-0 items-center gap-3">
          {showMenuButton && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Sidebar umschalten"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card hover:bg-muted/60"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold leading-6 sm:text-base">
                {heading}
              </h1>
              <span className="hidden text-xs text-muted-foreground sm:block">
                Adminbereich
              </span>
            </div>

            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="mt-0.5 hidden text-xs sm:block">
              <ol className="flex flex-wrap items-center gap-1 text-muted-foreground">
                {crumbs.map((c, i) => (
                  <li key={c.href} className="inline-flex items-center gap-1">
                    {i > 0 && <span aria-hidden>/</span>}
                    {i < crumbs.length - 1 ? (
                      <Link
                        href={c.href}
                        className="hover:text-foreground hover:underline underline-offset-4"
                      >
                        {c.label}
                      </Link>
                    ) : (
                      <span aria-current="page" className="text-foreground">
                        {c.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </div>

        {/* Rechts: Aktionen */}
        <div className="flex items-center gap-2">
          {/* Suche / Palette */}
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent('jetnity:open-command-palette'))
            }
            className="group hidden items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm hover:bg-muted/60 sm:flex"
            aria-label="Suchen (⌘/Ctrl+K)"
            title="Suchen (⌘/Ctrl+K)"
          >
            <Search className="h-4 w-4 opacity-80 group-hover:opacity-100" />
            <span className="text-foreground/80">Suchen…</span>
            <kbd className="ml-1 rounded border border-border bg-muted px-1.5 text-[10px] tracking-wider text-foreground/70">
              ⌘K
            </kbd>
          </button>

          {/* CoPilot Quick Actions */}
          <div className="relative" ref={copilotRef}>
            <button
              type="button"
              onClick={() => setCopilotOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={copilotOpen}
              aria-controls="admin-copilot-menu"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm hover:bg-muted/60"
              title="CoPilot Aktionen"
            >
              <Wand2 className="h-4 w-4" />
              <span>CoPilot</span>
              <ChevronDown className="h-4 w-4 opacity-70" />
            </button>
            {copilotOpen && (
              <div
                id="admin-copilot-menu"
                role="menu"
                aria-label="CoPilot Aktionen"
                className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-md"
              >
                <button
                  role="menuitem"
                  onClick={() => runCopilot('assist')}
                  disabled={!!busy}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted/60 disabled:opacity-60"
                >
                  {busy === 'assist' ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-border border-t-transparent" /> : <Wand2 className="h-4 w-4" />}
                  Assist – Antwort & Schritte
                </button>
                <button
                  role="menuitem"
                  onClick={() => runCopilot('auto')}
                  disabled={!!busy}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted/60 disabled:opacity-60"
                >
                  {busy === 'auto' ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-border border-t-transparent" /> : <Rocket className="h-4 w-4" />}
                  Auto – sicher ausführen
                </button>
                <button
                  role="menuitem"
                  onClick={() => runCopilot('simulate')}
                  disabled={!!busy}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted/60 disabled:opacity-60"
                >
                  {busy === 'simulate' ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-border border-t-transparent" /> : <Play className="h-4 w-4" />}
                  Simulate – ohne Änderungen
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            aria-label="Theme umschalten"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card hover:bg-muted/60"
            onClick={toggleTheme}
            title={isDark ? 'Helles Theme' : 'Dunkles Theme'}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={notifOpen}
              aria-controls="admin-notifications"
              onClick={() => setNotifOpen((v) => !v)}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card hover:bg-muted/60"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                3
              </span>
            </button>

            {notifOpen && (
              <div
                id="admin-notifications"
                role="menu"
                aria-label="Benachrichtigungen"
                className="absolute right-0 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-card shadow-md"
              >
                <div className="border-b border-border px-3 py-2 text-xs font-semibold">
                  Neu
                </div>
                <ul className="max-h-72 overflow-auto text-sm">
                  <li className="px-3 py-2 hover:bg-muted/60">
                    1 neuer Kommentar in <span className="font-medium">Blogpost</span>
                  </li>
                  <li className="px-3 py-2 hover:bg-muted/60">
                    Session <span className="font-medium">#A9K3</span> veröffentlicht
                  </li>
                  <li className="px-3 py-2 hover:bg-muted/60">
                    2 Meldungen in Moderation
                  </li>
                </ul>
                <div className="border-t border-border px-3 py-2 text-right">
                  <Link href="/admin/notifications" className="text-sm hover:underline">
                    Alle ansehen
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={userOpen}
              aria-controls="admin-user-menu"
              onClick={() => setUserOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm hover:bg-muted/60"
            >
              <UserCircle2 className="h-5 w-5" />
              <span className="hidden sm:inline">Admin</span>
              <ChevronDown className="h-4 w-4 opacity-70" />
            </button>

            {userOpen && (
              <div
                id="admin-user-menu"
                role="menu"
                aria-label="Benutzermenü"
                className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-md"
              >
                <Link
                  role="menuitem"
                  href="/admin/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted/60"
                  onClick={() => setUserOpen(false)}
                >
                  <Settings className="h-4 w-4" /> Einstellungen
                </Link>
                <Link
                  role="menuitem"
                  href="/logout"
                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted/60"
                  onClick={() => setUserOpen(false)}
                >
                  <LogOut className="h-4 w-4" /> Abmelden
                </Link>
              </div>
            )}
          </div>

          {rightSlot}
        </div>
      </div>
    </header>
  )
}
