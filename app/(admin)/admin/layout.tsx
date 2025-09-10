'use client'

import * as React from 'react'
import AdminSidebar from '@/components/layout/AdminSidebar'
import AdminTopbar from '@/components/layout/AdminTopbar'

/**
 * AdminLayout
 * - Skip-Link für Tastatur/Screenreader
 * - Mobile Drawer für Sidebar
 * - Kollabierbare Sidebar (persistiert), Toggle per Button + Hotkey Ctrl/Cmd+Shift+B
 * - Sticky Topbar
 * - Saubere ARIA-Roles
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Persistente Sidebar-Breite
  const LS_KEY = 'admin:sidebar:collapsed'
  const [collapsed, setCollapsed] = React.useState<boolean>(false)
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  // beim Mount Zustand aus localStorage laden
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      setCollapsed(raw === '1')
    } catch {/* ignore */}
  }, [])

  // Zustand speichern
  React.useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, collapsed ? '1' : '0')
    } catch {/* ignore */}
  }, [collapsed])

  // Tastatur-Hotkey: Ctrl/Cmd + Shift + B
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.shiftKey && (e.key === 'B' || e.key === 'b')) {
        e.preventDefault()
        setCollapsed(c => !c)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Klassen für Grid-Layout (collapsible)
  const sidebarW = collapsed ? 'w-[72px]' : 'w-[260px]'
  const gridCols = collapsed
    ? 'md:grid-cols-[72px_1fr]'
    : 'md:grid-cols-[260px_1fr]'

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Skip to content */}
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-[100] focus:top-3 focus:left-3 rounded-md bg-black px-3 py-2 text-white"
      >
        Zum Inhalt springen
      </a>

      {/* Mobile Top-Leiste für Drawer-Toggle (klein & unaufdringlich) */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 py-2">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Navigationsmenü öffnen"
          className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm hover:bg-accent"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Menü
        </button>

        {/* Optional: Schnell-Toggle für Collapse, wirkt auch auf Desktop */}
        <button
          type="button"
          onClick={() => setCollapsed(c => !c)}
          aria-pressed={collapsed}
          className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm hover:bg-accent"
          title="Sidebar ein-/ausklappen (Ctrl/Cmd+Shift+B)"
        >
          {collapsed ? '▶︎' : '◀︎'} Sidebar
        </button>
      </div>

      {/* App-Shell: Sidebar + Content */}
      <div className={`mx-auto grid ${gridCols} md:gap-0`}>
        {/* Desktop-Sidebar */}
        <aside
          className={`hidden md:block ${sidebarW} border-r bg-background`}
          aria-label="Admin Navigation"
          aria-expanded={!collapsed}
        >
          <div className="h-screen sticky top-0 overflow-y-auto">
            <AdminSidebar />
          </div>
        </aside>

        {/* Content-Spalte */}
        <div className="min-w-0">
          {/* Sticky Topbar (Desktop) */}
          <div className="hidden md:block sticky top-0 z-30 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <AdminTopbar />
          </div>

          {/* Hauptinhalt */}
          <main
            id="admin-content"
            role="main"
            className="p-4 md:p-6"
          >
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Drawer für Sidebar */}
      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 md:hidden"
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Panel */}
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-[320px] border-r bg-background shadow-xl">
            <div className="flex items-center justify-between p-3 border-b">
              <span className="text-sm font-medium">Navigation</span>
              <button
                type="button"
                aria-label="Navigationsmenü schließen"
                onClick={() => setDrawerOpen(false)}
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
  )
}
