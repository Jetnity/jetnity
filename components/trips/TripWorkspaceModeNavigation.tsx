'use client'

import { useLayoutEffect, useRef, useSyncExternalStore } from 'react'

import { modusScrollerZiel } from '@/lib/trips/trip-workspace-premium-experience-3'
import {
  shellBrowserZoom,
  shellNavLage,
  shellRootSchriftPx,
  shellTastaturOffen,
  type ShellMessung,
  type ShellNavLage,
} from '@/lib/trips/ux-u1a-shell-1'
import { WORKSPACE_ANSICHTEN, WORKSPACE_ANSICHT_LABEL, type WorkspaceAnsicht } from '@/lib/trips/workspace-mode'
import { cn } from '@/lib/utils'

const SERVER_MESSUNG: ShellMessung = {
  viewportBreite: 280,
  rootSchriftPx: 16,
  browserZoom: 1,
  tastatur: false,
}

let messungCache: ShellMessung = SERVER_MESSUNG

function messungLesen(): ShellMessung {
  const vv = window.visualViewport
  const scale = vv?.scale ?? null
  const zoom = shellBrowserZoom({
    innerWidth: window.innerWidth,
    outerWidth: window.outerWidth,
    visualScale: scale,
  })
  const sichtbareBreite =
    scale != null && scale >= 1.9 && vv != null && vv.width > 0 ? Math.round(vv.width) : window.innerWidth
  const naechste: ShellMessung = {
    viewportBreite: sichtbareBreite,
    rootSchriftPx: Math.round(shellRootSchriftPx(getComputedStyle(document.documentElement).fontSize) * 10) / 10,
    browserZoom: Math.round(zoom * 100) / 100,
    tastatur: shellTastaturOffen({
      innerHeight: window.innerHeight,
      visualHeight: vv?.height ?? null,
      visualOffsetTop: vv?.offsetTop ?? 0,
    }),
  }
  if (
    messungCache.viewportBreite === naechste.viewportBreite &&
    messungCache.rootSchriftPx === naechste.rootSchriftPx &&
    messungCache.browserZoom === naechste.browserZoom &&
    messungCache.tastatur === naechste.tastatur
  ) {
    return messungCache
  }
  messungCache = naechste
  return messungCache
}

function messungAbonnieren(melden: () => void) {
  const vv = window.visualViewport
  const medien = [
    window.matchMedia('(max-width: 320px)'),
    window.matchMedia('(max-width: 767px)'),
    window.matchMedia('(min-width: 768px)'),
  ]
  window.addEventListener('resize', melden)
  vv?.addEventListener('resize', melden)
  vv?.addEventListener('scroll', melden)
  for (const medium of medien) medium.addEventListener('change', melden)
  const beobachter = new ResizeObserver(melden)
  beobachter.observe(document.documentElement)
  return () => {
    window.removeEventListener('resize', melden)
    vv?.removeEventListener('resize', melden)
    vv?.removeEventListener('scroll', melden)
    for (const medium of medien) medium.removeEventListener('change', melden)
    beobachter.disconnect()
  }
}

export default function TripWorkspaceModeNavigation({
  ansicht,
  kompakt,
  detailOffen,
  onWechsel,
}: {
  ansicht: WorkspaceAnsicht
  kompakt: boolean
  detailOffen: boolean
  onWechsel: (ansicht: WorkspaceAnsicht, tastatur: boolean) => void
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const messung = useSyncExternalStore(messungAbonnieren, messungLesen, () => SERVER_MESSUNG)
  const lage: ShellNavLage = shellNavLage({ ...messung, detailOffen })

  useLayoutEffect(() => {
    if (lage !== 'sticky') return
    const scroller = scrollerRef.current
    const button = scroller?.querySelector<HTMLButtonElement>('[aria-current="page"]')
    if (!scroller || !button) return
    const scrollerRand = scroller.getBoundingClientRect()
    const knopfRand = button.getBoundingClientRect()
    const ziel = modusScrollerZiel({
      scrollLeft: scroller.scrollLeft,
      clientWidth: scroller.clientWidth,
      scrollWidth: scroller.scrollWidth,
      buttonOffset: scroller.scrollLeft + (knopfRand.left - scrollerRand.left),
      buttonWidth: knopfRand.width,
    })
    if (ziel == null) return
    scroller.scrollTo({ left: ziel, behavior: 'auto' })
  }, [ansicht, lage])

  useLayoutEffect(() => {
    const hulle = document.querySelector('[data-workspace-shell]')
    const vv = window.visualViewport
    if (hulle instanceof HTMLElement) {
      if (messung.browserZoom >= 1.9 && vv && vv.width > 0) {
        hulle.style.maxWidth = `${Math.floor(vv.width)}px`
        hulle.style.marginLeft = `${Math.max(0, Math.floor(vv.offsetLeft))}px`
      } else {
        hulle.style.removeProperty('max-width')
        hulle.style.removeProperty('margin-left')
      }
    }
    const wurzel = document.documentElement
    const nav = navRef.current
    if (lage !== 'bottom' || !nav) {
      wurzel.style.removeProperty('--ux-u1a-nav-offset')
      wurzel.style.scrollPaddingBottom = ''
      return
    }
    const setzen = () => {
      const hoehe = `${nav.offsetHeight}px`
      wurzel.style.setProperty('--ux-u1a-nav-offset', hoehe)
      wurzel.style.scrollPaddingBottom = hoehe
    }
    setzen()
    const beobachter = new ResizeObserver(setzen)
    beobachter.observe(nav)
    return () => {
      beobachter.disconnect()
      wurzel.style.removeProperty('--ux-u1a-nav-offset')
      wurzel.style.scrollPaddingBottom = ''
      if (hulle instanceof HTMLElement) {
        hulle.style.removeProperty('max-width')
        hulle.style.removeProperty('margin-left')
      }
    }
  }, [lage, ansicht, messung.browserZoom])

  useLayoutEffect(() => {
    if (lage !== 'bottom') return
    const onFocus = (ereignis: FocusEvent) => {
      const ziel = ereignis.target
      const nav = navRef.current
      if (!(ziel instanceof HTMLElement) || !nav || nav.contains(ziel)) return
      const navOben = nav.getBoundingClientRect().top
      const rand = ziel.getBoundingClientRect()
      if (rand.bottom > navOben - 8) {
        window.scrollBy({ top: rand.bottom - (navOben - 8), behavior: 'auto' })
      }
    }
    document.addEventListener('focusin', onFocus)
    return () => document.removeEventListener('focusin', onFocus)
  }, [lage])

  const knopf = (modus: WorkspaceAnsicht, variante: ShellNavLage) => {
    const aktiv = ansicht === modus
    return (
      <button
        key={modus}
        type="button"
        aria-current={aktiv ? 'page' : undefined}
        onClick={(ereignis) => onWechsel(modus, ereignis.detail === 0)}
        className={cn(
          'inline-flex min-h-11 min-w-11 items-center justify-center whitespace-normal break-words px-2 py-2 text-center text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15',
          variante === 'sticky' &&
            'w-full rounded-full sm:w-auto sm:shrink-0 sm:grow sm:basis-auto sm:whitespace-nowrap sm:px-3.5',
          variante === 'bottom' && 'w-full rounded-2xl px-1 leading-4',
          variante === 'flow' && 'w-auto min-w-0 flex-1 basis-36 rounded-full px-3',
          aktiv ? 'bg-brand-800 text-white' : 'text-brand-800 hover:bg-surface-50',
        )}
      >
        {WORKSPACE_ANSICHT_LABEL[modus]}
      </button>
    )
  }

  if (lage === 'bottom') {
    return (
      <nav
        ref={navRef}
        aria-label="Reiseansicht"
        data-workspace-mode-nav
        data-shell-nav="bottom"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line-200 bg-white pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] shadow-[0_-8px_24px_rgba(15,46,42,0.06)]"
      >
        <div className="grid min-w-0 grid-cols-4 gap-1 px-1 py-1">
          {WORKSPACE_ANSICHTEN.map((modus) => knopf(modus, 'bottom'))}
        </div>
      </nav>
    )
  }

  if (lage === 'flow') {
    return (
      <nav
        ref={navRef}
        aria-label="Reiseansicht"
        data-workspace-mode-nav
        data-shell-nav="flow"
        className="relative z-30 mt-3 min-w-0 max-w-full"
      >
        <div className="flex min-w-0 max-w-full flex-wrap gap-1 rounded-3xl border border-line-200 bg-white p-2 shadow-[0_8px_24px_rgba(15,46,42,0.05)]">
          {WORKSPACE_ANSICHTEN.map((modus) => knopf(modus, 'flow'))}
        </div>
      </nav>
    )
  }

  return (
    <nav
      ref={navRef}
      aria-label="Reiseansicht"
      data-workspace-mode-nav
      data-shell-nav="sticky"
      className={cn(
        'z-30 mt-3 min-w-0 max-w-full',
        !(kompakt && detailOffen) && 'sticky top-[calc(72px+env(safe-area-inset-top))]',
      )}
    >
      <div
        ref={scrollerRef}
        data-workspace-mode-scroller
        className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain rounded-3xl border border-line-200 bg-white p-2 shadow-[0_8px_24px_rgba(15,46,42,0.05)] [scrollbar-width:none] sm:rounded-full sm:p-1"
      >
        <div className="grid min-w-0 grid-cols-1 gap-1 sm:flex sm:w-max sm:min-w-full sm:flex-nowrap">
          {WORKSPACE_ANSICHTEN.map((modus) => knopf(modus, 'sticky'))}
        </div>
      </div>
    </nav>
  )
}
