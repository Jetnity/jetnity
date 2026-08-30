'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Search, Sun, Moon, ChevronDown, LogOut, UserCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOutAction } from '@/app/auth/sign-out'
import GlobalesAbmeldenForm from '@/components/auth/GlobalesAbmeldenForm'
import { useAdminShell } from '@/app/(admin)/admin/layout'
import { ADMIN_EHRLICHE_TEXTE } from '@/lib/admin/ehrliche-zustaende'

type Props = {
  title?: string
  onToggleSidebar?: () => void
  showMenuButton?: boolean
  rightSlot?: React.ReactNode
}

const PFAD_LABEL: Record<string, string> = {
  admin: 'Steuerzentrale',
  users: 'Nutzer',
  payments: 'Zahlungen',
  security: 'Security',
  'system-health': 'System Health',
  'provider-ops': 'Provider & Kosten',
  analytics: 'Analytics',
  content: 'Content',
  marketing: 'Marketing',
  settings: 'Einstellungen',
  localization: 'Lokalisierung',
}

function buildCrumbs(pathname: string) {
  const parts = (pathname || '/').split('/').filter(Boolean)
  const adminIdx = parts.indexOf('admin')
  const segs = adminIdx >= 0 ? parts.slice(adminIdx) : parts
  const items = segs.map((s, i) => {
    const href = '/' + segs.slice(0, i + 1).join('/')
    const pretty =
      PFAD_LABEL[s] ??
      decodeURIComponent(s)
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (m) => m.toUpperCase())
    return { href, label: pretty || 'Steuerzentrale' }
  })
  if (items.length === 0 || items[0]?.href !== '/admin') {
    items.unshift({ href: '/admin', label: 'Steuerzentrale' })
  }
  return items
}

export default function AdminTopbar({
  title,
  onToggleSidebar,
  showMenuButton = true,
  rightSlot,
}: Props) {
  const pathname = usePathname()
  const crumbs = React.useMemo(() => buildCrumbs(pathname || '/'), [pathname])
  const heading = title ?? crumbs.at(-1)?.label ?? 'Steuerzentrale'
  const { isDark, toggleTheme } = useAdminShell()

  const [userOpen, setUserOpen] = React.useState(false)
  const userRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (userOpen && userRef.current && !userRef.current.contains(t)) setUserOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onEsc)
    }
  }, [userOpen])

  return (
    <header
      role="banner"
      className={cn(
        'sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md',
        'border-border',
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5">
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
              <h1 className="truncate text-sm font-semibold leading-6 sm:text-base">{heading}</h1>
              <span className="hidden text-xs text-muted-foreground sm:block">Steuerzentrale</span>
            </div>

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

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            className="group hidden items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm text-muted-foreground sm:flex"
            aria-label={ADMIN_EHRLICHE_TEXTE.sucheFolgtHinweis}
            title={ADMIN_EHRLICHE_TEXTE.sucheFolgtHinweis}
          >
            <Search className="h-4 w-4 opacity-80" />
            <span>{ADMIN_EHRLICHE_TEXTE.sucheFolgt}</span>
          </button>

          <span
            className="hidden items-center rounded-lg border border-dashed border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground sm:inline-flex"
            title={ADMIN_EHRLICHE_TEXTE.copilotFolgtHinweis}
          >
            {ADMIN_EHRLICHE_TEXTE.copilotFolgt}
          </span>

          <button
            type="button"
            aria-label="Theme umschalten"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card hover:bg-muted/60"
            onClick={toggleTheme}
            title={isDark ? 'Helles Theme' : 'Dunkles Theme'}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

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
              <span className="hidden sm:inline">Konto</span>
              <ChevronDown className="h-4 w-4 opacity-70" />
            </button>

            <GlobalesAbmeldenForm
              action={signOutAction}
              fehlerClassName="mt-2 max-w-[14rem] text-xs"
              onErgebnis={(ergebnis) => {
                if (!ergebnis.ok) setUserOpen(true)
              }}
            >
              {userOpen ? (
                <div
                  id="admin-user-menu"
                  role="menu"
                  aria-label="Kontomenü"
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-md"
                >
                  <button
                    role="menuitem"
                    type="submit"
                    className="flex min-h-11 w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted/60"
                  >
                    <LogOut className="h-4 w-4" /> Abmelden
                  </button>
                </div>
              ) : null}
            </GlobalesAbmeldenForm>
          </div>

          {rightSlot}
        </div>
      </div>
    </header>
  )
}
