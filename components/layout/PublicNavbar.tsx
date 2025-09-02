// components/layout/PublicNavbar.tsx
'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu,
  X,
  ChevronDown,
  User,
  LogIn,
  UserPlus,
  LayoutDashboard,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = { label: string; href: string }
const NAV_ITEMS: NavItem[] = [
  { label: 'Reiseideen', href: '/reiseideen' },
  { label: 'Blog', href: '/blog' },
]

export default function PublicNavbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [creatorOpen, setCreatorOpen] = React.useState(false)
  const [elevated, setElevated] = React.useState(false)

  const creatorRef = React.useRef<HTMLDivElement | null>(null)
  const creatorBtnRef = React.useRef<HTMLButtonElement | null>(null)
  const creatorItemRefs = React.useRef<Array<HTMLAnchorElement | null>>([])

  // helper: erzeugt einen void-Ref-Callback
  const setCreatorItemRef = (i: number) => (el: HTMLAnchorElement | null) => {
    creatorItemRefs.current[i] = el
  }

  React.useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!creatorOpen) return
      const target = e.target as Node
      const root = creatorRef.current
      if (root && !root.contains(target)) setCreatorOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setCreatorOpen(false)
        creatorBtnRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [creatorOpen])

  function onCreatorKeyDown(e: React.KeyboardEvent) {
    if (!creatorOpen) return
    const items = creatorItemRefs.current.filter(Boolean) as HTMLAnchorElement[]
    if (items.length === 0) return
    const current = document.activeElement as HTMLElement | null
    const idx = items.findIndex((n) => n === current)
    const focusAt = (i: number) => items[i]?.focus()

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      focusAt(idx < 0 ? 0 : (idx + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      focusAt(idx < 0 ? items.length - 1 : (idx - 1 + items.length) % items.length)
    } else if (e.key === 'Home') {
      e.preventDefault()
      focusAt(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      focusAt(items.length - 1)
    } else if (e.key === 'Tab') {
      setTimeout(() => {
        const active = document.activeElement
        if (active && !creatorRef.current?.contains(active)) setCreatorOpen(false)
      }, 0)
    }
  }

  const activeLink = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')

  const linkCls = (isActive: boolean) =>
    cn(
      'rounded-lg px-3 py-2 text-sm font-medium transition',
      isActive
        ? 'text-primary-foreground bg-primary/10'
        : 'text-foreground/80 hover:text-foreground hover:bg-muted/60'
    )

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only fixed left-2 top-2 z-[100] rounded bg-primary px-3 py-2 text-xs font-semibold text-white"
      >
        Zum Inhalt springen
      </a>

      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition border-b',
          elevated
            ? 'bg-background/95 backdrop-blur supports-blur:backdrop-blur-xl border-border'
            : 'bg-background/70 backdrop-blur supports-blur:backdrop-blur-md border-transparent'
        )}
        role="banner"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="text-base font-extrabold tracking-tight text-foreground hover:opacity-90"
            aria-label="Startseite"
          >
            Jetnity
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Hauptnavigation">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className={linkCls(activeLink(item.href))}>
                {item.label}
              </Link>
            ))}

            <div className="relative ml-2" ref={creatorRef}>
              <button
                ref={creatorBtnRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={creatorOpen}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg bg-foreground px-3.5 py-2 text-sm font-semibold text-background shadow-sm transition',
                  'hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                )}
                onClick={() => setCreatorOpen((v) => !v)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' && !creatorOpen) {
                    e.preventDefault()
                    setCreatorOpen(true)
                    setTimeout(() => creatorItemRefs.current[0]?.focus(), 0)
                  }
                }}
              >
                <User className="h-4 w-4" />
                Creator Login
                <ChevronDown
                  className={cn('h-4 w-4 transition-transform', creatorOpen && 'rotate-180')}
                />
              </button>

              {creatorOpen && (
                <div
                  role="menu"
                  aria-label="Creator Menü"
                  tabIndex={-1}
                  onKeyDown={onCreatorKeyDown}
                  className={cn(
                    'absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border bg-card shadow-e3',
                    'border-border'
                  )}
                >
                  <Link
                    ref={setCreatorItemRef(0)}
                    role="menuitem"
                    href="/login"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted/60 focus:bg-muted/60 focus:outline-none"
                    onClick={() => setCreatorOpen(false)}
                  >
                    <LogIn className="h-4 w-4" />
                    Anmelden
                  </Link>
                  <Link
                    ref={setCreatorItemRef(1)}
                    role="menuitem"
                    href="/register"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted/60 focus:bg-muted/60 focus:outline-none"
                    onClick={() => setCreatorOpen(false)}
                  >
                    <UserPlus className="h-4 w-4" />
                    Registrieren
                  </Link>
                  <Link
                    ref={setCreatorItemRef(2)}
                    role="menuitem"
                    href="/creator/creator-dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted/60 focus:bg-muted/60 focus:outline-none"
                    onClick={() => setCreatorOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Creator Dashboard
                  </Link>
                </div>
              )}
            </div>
          </nav>

          <button
            type="button"
            aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
            className="inline-flex items-center justify-center rounded-lg p-2 md:hidden hover:bg-muted/60"
            onClick={() => {
              setMobileOpen((v) => !v)
              setCreatorOpen(false)
            }}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden">
            <nav aria-label="Mobile Navigation" className="border-t border-border bg-card shadow-e2">
              <div className="px-4 py-3">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'block rounded-lg px-3 py-2 text-sm',
                      activeLink(item.href)
                        ? 'bg-primary/10 text-foreground'
                        : 'text-foreground/80 hover:bg-muted/60'
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="border-t border-border px-4 py-3">
                <div className="mb-2 text-[13px] font-semibold text-muted-foreground">Creator</div>
                <div className="grid gap-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted/60"
                    onClick={() => setMobileOpen(false)}
                  >
                    <LogIn className="h-4 w-4" />
                    Anmelden
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted/60"
                    onClick={() => setMobileOpen(false)}
                  >
                    <UserPlus className="h-4 w-4" />
                    Registrieren
                  </Link>
                  <Link
                    href="/creator/creator-dashboard"
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted/60"
                    onClick={() => setMobileOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Creator Dashboard
                  </Link>
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>

      <div aria-hidden className="h-[64px]" />
    </>
  )
}
