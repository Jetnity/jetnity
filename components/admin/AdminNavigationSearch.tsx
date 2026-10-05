'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { useAdminSession } from '@/components/admin/AdminSessionProvider'
import { ADMIN_NAV_ITEMS } from '@/lib/admin/navigation'
import {
  adminNavSearchOptionId,
  filterAdminNavSearch,
  isAdminNavSearchShortcut,
  leseVerfuegbaresSichtfeld,
  resolveAdminNavSearchHref,
  retainAdminNavSearchHref,
  scrollDeltaToReveal,
  stepAdminNavSearchHref,
} from '@/lib/admin/navigation-search'
import { ADMIN_EHRLICHE_TEXTE } from '@/lib/admin/ehrliche-zustaende'
import { cn } from '@/lib/utils'

type SearchCtx = {
  open: boolean
  openSearch: (invoker?: HTMLElement | null) => void
  closeSearch: () => void
}

const AdminNavigationSearchContext = React.createContext<SearchCtx | null>(null)

function useAdminNavigationSearch(): SearchCtx {
  const ctx = React.useContext(AdminNavigationSearchContext)
  if (!ctx) throw new Error('useAdminNavigationSearch braucht AdminNavigationSearchProvider')
  return ctx
}

function elementSichtbar(el: HTMLElement | null): el is HTMLElement {
  if (!el || !el.isConnected) return false
  const style = window.getComputedStyle(el)
  if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') {
    return false
  }
  const rect = el.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

function fremdesModalOffen(): boolean {
  const dialoge = document.querySelectorAll<HTMLElement>('[aria-modal="true"]')
  for (const dialog of dialoge) {
    if (dialog.id === 'admin-nav-search-dialog') continue
    if (dialog.hasAttribute('data-admin-mobile-drawer')) continue
    return true
  }
  return false
}

function fokussierbare(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])'),
  ).filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true')
}

function useVerfuegbaresSichtfeld(aktiv: boolean) {
  const [feld, setFeld] = React.useState<ReturnType<typeof leseVerfuegbaresSichtfeld> | null>(null)

  React.useEffect(() => {
    if (!aktiv) return
    const lesen = () => {
      setFeld(
        leseVerfuegbaresSichtfeld({
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          visualViewport: window.visualViewport
            ? {
                width: window.visualViewport.width,
                height: window.visualViewport.height,
                offsetTop: window.visualViewport.offsetTop,
                offsetLeft: window.visualViewport.offsetLeft,
              }
            : null,
        }),
      )
    }
    lesen()
    window.addEventListener('resize', lesen)
    const vv = window.visualViewport
    vv?.addEventListener('resize', lesen)
    vv?.addEventListener('scroll', lesen)
    return () => {
      window.removeEventListener('resize', lesen)
      vv?.removeEventListener('resize', lesen)
      vv?.removeEventListener('scroll', lesen)
    }
  }, [aktiv])

  return feld
}

type ProviderProps = {
  drawerOpen: boolean
  closeDrawer: () => void
  children: React.ReactNode
}

export function AdminNavigationSearchProvider({ drawerOpen, closeDrawer, children }: ProviderProps) {
  const session = useAdminSession()
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [selectedHref, setSelectedHref] = React.useState<string | null>(null)
  const invokerRef = React.useRef<HTMLElement | null>(null)
  const dialogRef = React.useRef<HTMLDivElement | null>(null)
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const listeRef = React.useRef<HTMLUListElement | null>(null)
  const warOffenRef = React.useRef(false)
  const selectedHrefRef = React.useRef<string | null>(selectedHref)
  const sichtfeld = useVerfuegbaresSichtfeld(open)

  const results = React.useMemo(
    () => filterAdminNavSearch(ADMIN_NAV_ITEMS, session, query),
    [session, query],
  )
  const resultsRef = React.useRef(results)
  const sichtbareAuswahl = retainAdminNavSearchHref(selectedHref, results)

  React.useEffect(() => {
    resultsRef.current = results
  }, [results])

  React.useEffect(() => {
    selectedHrefRef.current = sichtbareAuswahl
  }, [sichtbareAuswahl])

  const closeSearch = React.useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  const openSearch = React.useCallback(
    (invoker?: HTMLElement | null) => {
      if (fremdesModalOffen()) return
      if (drawerOpen) closeDrawer()
      invokerRef.current = invoker ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null)
      setQuery('')
      setOpen(true)
    },
    [closeDrawer, drawerOpen],
  )

  React.useEffect(() => {
    if (open) closeSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!isAdminNavSearchShortcut(event) || event.defaultPrevented) return
      event.preventDefault()
      if (open) {
        inputRef.current?.focus()
        return
      }
      openSearch()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, openSearch])

  React.useEffect(() => {
    if (!open) return
    const id = window.setTimeout(() => inputRef.current?.focus(), 0)
    const vorher = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      window.clearTimeout(id)
      document.documentElement.style.overflow = vorher
    }
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      const aktuelle = resultsRef.current
      if (event.key === 'Escape') {
        event.preventDefault()
        closeSearch()
        return
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSelectedHref((aktuell) => {
          const basis = retainAdminNavSearchHref(aktuell, aktuelle)
          const next = stepAdminNavSearchHref(basis, aktuelle, 1)
          selectedHrefRef.current = next
          return next
        })
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSelectedHref((aktuell) => {
          const basis = retainAdminNavSearchHref(aktuell, aktuelle)
          const next = stepAdminNavSearchHref(basis, aktuelle, -1)
          selectedHrefRef.current = next
          return next
        })
        return
      }
      if (event.key === 'Enter' && inputRef.current === document.activeElement) {
        const ziel = resolveAdminNavSearchHref(selectedHrefRef.current ?? '', aktuelle)
        if (!ziel) return
        event.preventDefault()
        const option = document.getElementById(adminNavSearchOptionId(ziel))
        option?.click()
        return
      }
      const root = dialogRef.current
      if (event.key === 'Tab' && root) {
        const nodes = fokussierbare(root)
        if (nodes.length === 0) return
        const idx = nodes.indexOf(document.activeElement as HTMLElement)
        if (event.shiftKey) {
          if (idx <= 0) {
            event.preventDefault()
            nodes[nodes.length - 1]?.focus()
          }
        } else if (idx === -1 || idx >= nodes.length - 1) {
          event.preventDefault()
          nodes[0]?.focus()
        }
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, closeSearch])

  React.useEffect(() => {
    if (!open || !sichtbareAuswahl) return
    const liste = listeRef.current
    const option = document.getElementById(adminNavSearchOptionId(sichtbareAuswahl))
    if (!liste || !option) return
    const anwenden = () => {
      const listRect = liste.getBoundingClientRect()
      const optRect = option.getBoundingClientRect()
      liste.scrollTop += scrollDeltaToReveal(listRect.top, listRect.bottom, optRect.top, optRect.bottom)
    }
    anwenden()
    if (typeof ResizeObserver === 'undefined') return
    const beobachter = new ResizeObserver(anwenden)
    beobachter.observe(liste)
    return () => beobachter.disconnect()
  }, [open, sichtbareAuswahl, sichtfeld?.height, sichtfeld?.width])

  React.useEffect(() => {
    if (open) {
      warOffenRef.current = true
      return
    }
    if (!warOffenRef.current) return
    warOffenRef.current = false
    const desktop = document.querySelector<HTMLElement>('[data-admin-nav-search-trigger="desktop"]')
    const mobile = document.querySelector<HTMLElement>('[data-admin-nav-search-trigger="mobile"]')
    const fallback = document.getElementById('admin-content')
    const ziel = [invokerRef.current, desktop, mobile, fallback].find(elementSichtbar)
    if (ziel) {
      ziel.focus()
    }
  }, [open])

  const value = React.useMemo(() => ({ open, openSearch, closeSearch }), [open, openSearch, closeSearch])

  return (
    <AdminNavigationSearchContext.Provider value={value}>
      {children}
      {open ? (
        <div
          id="admin-nav-search-dialog"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-nav-search-title"
          className="z-[60] overflow-hidden"
          style={
            sichtfeld
              ? {
                  position: 'fixed',
                  top: sichtfeld.top,
                  left: sichtfeld.left,
                  width: sichtfeld.width,
                  height: sichtfeld.height,
                }
              : { position: 'fixed', inset: 0 }
          }
        >
          <div
            aria-hidden="true"
            data-admin-nav-search-backdrop
            className="absolute inset-0 bg-black/50"
            onClick={closeSearch}
          />
          <div className="pointer-events-none relative flex h-full w-full items-center justify-center">
            <div
              data-admin-nav-search-panel
              className="pointer-events-auto relative flex min-h-0 w-[min(calc(100%-24px),36rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
              onClick={(event) => event.stopPropagation()}
              style={{ maxHeight: 'calc(100% - 24px)' }}
            >
              <div className="shrink-0 border-b border-border px-3 pt-2">
                <div className="flex items-center justify-between gap-2">
                  <h2 id="admin-nav-search-title" className="text-sm font-semibold leading-tight">
                    {ADMIN_EHRLICHE_TEXTE.sucheBereiche}
                  </h2>
                  <button
                    type="button"
                    aria-label="Bereichssuche schliessen"
                    onClick={closeSearch}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-sm hover:bg-muted/60 pointer-fine:h-9 pointer-fine:w-9"
                  >
                    ×
                  </button>
                </div>
                <p
                  className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground"
                  title={ADMIN_EHRLICHE_TEXTE.sucheBereicheHinweis}
                >
                  {ADMIN_EHRLICHE_TEXTE.sucheBereicheHinweis}
                </p>
                <label className="sr-only" htmlFor="admin-nav-search-input">
                  {ADMIN_EHRLICHE_TEXTE.sucheBereiche}
                </label>
                <div className="mb-2 mt-2 flex items-center gap-2 rounded-xl border border-input bg-background px-3">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <input
                    id="admin-nav-search-input"
                    ref={inputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={ADMIN_EHRLICHE_TEXTE.sucheBereichePlatzhalter}
                    autoComplete="off"
                    autoFocus
                    spellCheck={false}
                    role="combobox"
                    aria-expanded="true"
                    aria-controls="admin-nav-search-list"
                    aria-autocomplete="list"
                    aria-activedescendant={
                      sichtbareAuswahl ? adminNavSearchOptionId(sichtbareAuswahl) : undefined
                    }
                    className="h-11 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground pointer-fine:h-10 pointer-fine:text-sm"
                  />
                </div>
              </div>
              <ul
                id="admin-nav-search-list"
                ref={listeRef}
                role="listbox"
                aria-label={ADMIN_EHRLICHE_TEXTE.sucheBereiche}
                className="min-h-[calc(2.75rem+1rem)] flex-1 overflow-y-auto p-2"
              >
              {results.length === 0 ? (
                <li className="px-3 py-3 text-sm text-muted-foreground" role="presentation">
                  {query.trim()
                    ? ADMIN_EHRLICHE_TEXTE.sucheBereicheKeinTreffer
                    : ADMIN_EHRLICHE_TEXTE.sucheBereicheLeer}
                </li>
              ) : (
                results.map((item) => {
                  const aktiv = item.href === sichtbareAuswahl
                  const ziel = resolveAdminNavSearchHref(item.href, results)
                  if (!ziel) return null
                  return (
                    <li key={item.href} role="presentation">
                      <Link
                        id={adminNavSearchOptionId(item.href)}
                        href={ziel}
                        prefetch={false}
                        role="option"
                        aria-selected={aktiv}
                        onMouseEnter={() => {
                          selectedHrefRef.current = item.href
                          setSelectedHref(item.href)
                        }}
                        onClick={closeSearch}
                        className={cn(
                          'flex min-h-11 items-center rounded-xl px-3 py-2 text-sm outline-none',
                          'focus-visible:ring-2 focus-visible:ring-primary/40',
                          aktiv ? 'bg-primary/10 text-foreground' : 'text-foreground/80 hover:bg-muted',
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                })
              )}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </AdminNavigationSearchContext.Provider>
  )
}

export function AdminNavigationSearchTrigger({ surface }: { surface: 'desktop' | 'mobile' }) {
  const { open, openSearch } = useAdminNavigationSearch()
  const ref = React.useRef<HTMLButtonElement | null>(null)
  const desktop = surface === 'desktop'

  return (
    <button
      ref={ref}
      type="button"
      data-admin-nav-search-trigger={surface}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={open ? 'admin-nav-search-dialog' : undefined}
      aria-label={ADMIN_EHRLICHE_TEXTE.sucheBereicheHinweis}
      title={ADMIN_EHRLICHE_TEXTE.sucheBereicheHinweis}
      onClick={() => openSearch(ref.current)}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm hover:bg-muted/60',
        'pointer-fine:min-h-0 pointer-fine:h-9',
        desktop && 'px-2.5 py-1.5 text-muted-foreground',
      )}
    >
      <Search className="h-4 w-4 opacity-80" aria-hidden="true" />
      <span>{desktop ? ADMIN_EHRLICHE_TEXTE.sucheBereiche : 'Bereiche'}</span>
      {desktop ? (
        <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
          {ADMIN_EHRLICHE_TEXTE.sucheBereicheKuerzel}
        </kbd>
      ) : null}
    </button>
  )
}
