'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import SkipToContentLink from '@/components/layout/SkipToContentLink'
import AdminSidebar from '@/components/layout/AdminSidebar'
import AdminTopbar from '@/components/layout/AdminTopbar'
import CommandPalette from '@/components/admin/CommandPalette' // ⟵ Neu

/* ───────────────────────── Admin Shell Context ─────────────────────────
   Optional für Sidebar/Topbar: liefert collapsed-Status & Toggle.
   (Bricht nichts, wenn ungenutzt – aber bereit für spätere Upgrades.) */
type AdminShellCtx = {
  collapsed: boolean
  toggleCollapsed: () => void
  setCollapsed: (v: boolean) => void
  openDrawer: () => void
  closeDrawer: () => void
}
export const AdminShellContext = React.createContext<AdminShellCtx | null>(null)
export function useAdminShell() {
  const ctx = React.useContext(AdminShellContext)
  if (!ctx) throw new Error('useAdminShell must be used within AdminLayout')
  return ctx
}

/* ───────────────────────── Component ───────────────────────── */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const LS_KEY = 'admin:sidebar:collapsed'
  const [collapsed, setCollapsed] = React.useState(false)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const pathname = usePathname()

  // Load persisted collapsed state
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw === '1') setCollapsed(true)
    } catch { /* ignore */ }
  }, [])

  // Persist collapsed state
  React.useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, collapsed ? '1' : '0')
    } catch { /* ignore */ }
  }, [collapsed])

  // Hotkey: Cmd/Ctrl + Shift + B
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.shiftKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault()
        setCollapsed(c => !c)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Close drawer on route change
  React.useEffect(() => {
    if (drawerOpen) setDrawerOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Body scroll lock while drawer open
  React.useEffect(() => {
    const el = document.documentElement
    if (drawerOpen) {
      const prev = el.style.overflow
      el.style.overflow = 'hidden'
      return () => { el.style.overflow = prev }
    }
  }, [drawerOpen])

  const toggleCollapsed = React.useCallback(() => setCollapsed(c => !c), [])
  const openDrawer = React.useCallback(() => setDrawerOpen(true), [])
  const closeDrawer = React.useCallback(() => setDrawerOpen(false), [])

  // Drawer focus trap
  const drawerRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    if (!drawerOpen) return
    const root = drawerRef.current
    if (!root) return

    const focusables = () =>
      Array.from(root.querySelectorAll<HTMLElement>(
        'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])'
      )).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'))

    // focus first
    const first = focusables()[0]
    first?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeDrawer()
        return
      }
      if (e.key === 'Tab') {
        const nodes = focusables()
        if (nodes.length === 0) return
        const idx = nodes.indexOf(document.activeElement as HTMLElement)
        if (e.shiftKey) {
          if (idx <= 0) {
            e.preventDefault()
            nodes[nodes.length - 1].focus()
          }
        } else {
          if (idx === -1 || idx >= nodes.length - 1) {
            e.preventDefault()
            nodes[0].focus()
          }
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen, closeDrawer])

  const sidebarW = collapsed ? 'w-[72px]' : 'w-[260px]'
  const gridCols = collapsed ? 'md:grid-cols-[72px_1fr]' : 'md:grid-cols-[260px_1fr]'

  return (
    <AdminShellContext.Provider
      value={{ collapsed, toggleCollapsed, setCollapsed, openDrawer, closeDrawer }}
    >
      {/* A11y: Skip to main content */}
      <SkipToContentLink targetId="admin-content" />

      <div className="min-h-dvh bg-muted/20 text-foreground">
        {/* Mobile top strip with menu + collapse toggle */}
        <div className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b bg-background/75 backdrop-blur px-3 py-2">
          <button
            type="button"
            onClick={openDrawer}
            aria-label="Navigationsmenü öffnen"
            className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm hover:bg-accent"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Menü
          </button>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-pressed={collapsed}
            className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm hover:bg-accent"
            title="Sidebar ein-/ausklappen (Ctrl/Cmd+Shift+B)"
          >
            {collapsed ? '▶︎' : '◀︎'} Sidebar
          </button>
        </div>

        {/* App shell */}
        <div className={`mx-auto grid ${gridCols} md:gap-0`} role="application" aria-label="Jetnity Admin">
          {/* Desktop sidebar */}
          <aside
            className={`hidden md:block ${sidebarW} border-r bg-background`}
            data-collapsed={collapsed ? 'true' : 'false'}
            aria-label="Admin Navigation"
            aria-expanded={!collapsed}
          >
            <div className="h-dvh sticky top-0 overflow-y-auto">
              <AdminSidebar />
            </div>
          </aside>

          {/* Main column */}
          <div className="min-w-0">
            {/* Desktop topbar */}
            <div className="hidden md:block sticky top-0 z-30 border-b bg-background/75 backdrop-blur">
              <AdminTopbar />
            </div>

            <main id="admin-content" role="main" aria-live="polite" className="p-4 md:p-6">
              {children}
            </main>
          </div>
        </div>

        {/* Mobile drawer for sidebar */}
        {drawerOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Admin Navigation"
            className="fixed inset-0 z-50 md:hidden"
          >
            {/* Overlay */}
            <button
              aria-label="Overlay schließen"
              className="absolute inset-0 bg-black/50"
              onClick={closeDrawer}
            />
            {/* Panel */}
            <div
              ref={drawerRef}
              className="absolute inset-y-0 left-0 w-[86%] max-w-[320px] border-r bg-background shadow-xl outline-none"
            >
              <div className="flex items-center justify-between p-3 border-b">
                <span className="text-sm font-medium">Navigation</span>
                <button
                  type="button"
                  aria-label="Navigationsmenü schließen"
                  onClick={closeDrawer}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="h-[calc(100%-3rem)] overflow-y-auto">
                <AdminSidebar />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ⌘/Ctrl+K – globale Befehlspalette */}
      <CommandPalette />
    </AdminShellContext.Provider>
  )
}
