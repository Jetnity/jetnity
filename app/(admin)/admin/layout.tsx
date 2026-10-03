'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { Sun, Moon } from 'lucide-react'
import SkipToContentLink from '@/components/layout/SkipToContentLink'
import AdminSidebar from '@/components/layout/AdminSidebar'
import AdminTopbar from '@/components/layout/AdminTopbar'
import {
  AdminNavigationSearchProvider,
  AdminNavigationSearchTrigger,
} from '@/components/admin/AdminNavigationSearch'
import { applyDark, readThemeMode, resolveDark, storeThemeMode } from '@/lib/admin/theme'

/* ───────────────────────── Admin Shell Context ─────────────────────────
   Liefert Sidebar-Status und das Dunkelthema an Sidebar/Topbar. */
type AdminShellCtx = {
  collapsed: boolean
  toggleCollapsed: () => void
  setCollapsed: (v: boolean) => void
  openDrawer: () => void
  closeDrawer: () => void
  isDark: boolean
  toggleTheme: () => void
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

  /* Dunkelthema: nur im Admin.
     Das Layout haelt es, weil es beim Verlassen des Admin-Bereichs abgebaut
     wird und die Klasse dann wieder von <html> nehmen kann. Ohne dieses
     Aufraeumen bliebe sie beim Wechsel auf eine oeffentliche Seite stehen –
     die Navigation im App Router tauscht das Dokument nicht aus – und die
     hellen V2-Seiten wuerden mit den dunklen Tokens gezeichnet. */
  const [isDark, setIsDark] = React.useState(false)
  React.useEffect(() => {
    const dark = resolveDark(readThemeMode())
    applyDark(dark)
    setIsDark(dark)
    return () => applyDark(false)
  }, [])
  const toggleTheme = React.useCallback(() => {
    setIsDark((vorher) => {
      const jetzt = !vorher
      applyDark(jetzt)
      storeThemeMode(jetzt ? 'dark' : 'light')
      return jetzt
    })
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
  const gridCols = collapsed ? 'lg:grid-cols-[72px_minmax(0,1fr)]' : 'lg:grid-cols-[260px_minmax(0,1fr)]'

  return (
    <AdminShellContext.Provider
      value={{ collapsed, toggleCollapsed, setCollapsed, openDrawer, closeDrawer, isDark, toggleTheme }}
    >
      <AdminNavigationSearchProvider drawerOpen={drawerOpen} closeDrawer={closeDrawer}>
      {/* A11y: Skip to main content */}
      <SkipToContentLink targetId="admin-content" />

      <div className="min-h-dvh bg-muted/20 text-foreground">
        {/* Mobile/tablet strip with menu, area search and theme toggle */}
        <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between gap-2 border-b bg-background/75 backdrop-blur px-3 py-2">
          <button
            type="button"
            onClick={openDrawer}
            aria-label="Navigationsmenü öffnen"
            className="inline-flex h-11 items-center gap-2 rounded-lg border px-3 text-sm hover:bg-accent pointer-fine:h-9"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Menü
          </button>
          <AdminNavigationSearchTrigger surface="mobile" />
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Helles Theme' : 'Dunkles Theme'}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border hover:bg-accent"
          >
            {isDark ? <Sun aria-hidden className="h-5 w-5" /> : <Moon aria-hidden className="h-5 w-5" />}
          </button>
        </div>

        {/* App shell */}
        <div className={`mx-auto grid ${gridCols} lg:gap-0`} role="application" aria-label="Jetnity Admin">
          {/* Desktop sidebar */}
          {/* Keep the complementary landmark; collapse only changes its visual density. */}
          <aside
            className={`group/admin-nav hidden lg:block ${sidebarW} border-r bg-background`}
            data-collapsed={collapsed ? 'true' : 'false'}
            aria-label="Admin Navigation"
          >
            <div className="h-dvh sticky top-0 overflow-y-auto">
              <AdminSidebar />
            </div>
          </aside>

          {/* Main column */}
          <div className="min-w-0">
            {/* Desktop topbar */}
            <div className="hidden lg:block sticky top-0 z-30 border-b bg-background/75 backdrop-blur">
              <AdminTopbar onToggleSidebar={toggleCollapsed} />
            </div>

            <main
              id="admin-content"
              tabIndex={-1}
              role="main"
              aria-live="polite"
              className="p-4 lg:p-6 outline-none"
            >
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
            data-admin-mobile-drawer="true"
            className="fixed inset-0 z-50 lg:hidden"
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
                  className="inline-flex h-11 w-11 items-center justify-center rounded-md hover:bg-accent"
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

      </AdminNavigationSearchProvider>
    </AdminShellContext.Provider>
  )
}
