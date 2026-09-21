'use client'

// components/trips/PlanenEinstiegNavigation.tsx
//
// Sichtbarer In-Page-Zeiger zum bestehenden manuellen Formular auf /planen.
// Nur Navigation: kein Absenden, keine Persistenz, kein Modell- oder
// Provideraufruf. Reduced Motion kommt aus `scrollVerhalten`.

import type { MouseEvent, ReactNode } from 'react'

import { scrollVerhalten } from '@/lib/formular/sicht'

export const PLANEN_MANUELL_ZIEL_ID = 'manuell-planen'

export type PlanenManuellZielElement = {
  focus: (options?: FocusOptions) => void
  scrollIntoView: (init?: ScrollIntoViewOptions) => void
}

export type PlanenManuellHistory = {
  replaceState: (data: unknown, unused: string, url?: string | URL | null) => void
  location: { hash: string }
}

/**
 * Fokussiert das manuelle Ziel und holt es unter den klebenden Kopf.
 * Scrollt nur auf ausdrückliche Aktivierung, nicht bei Formular-Rerenders.
 */
function aktuelleHistory(): PlanenManuellHistory | null {
  if (typeof window === 'undefined') return null
  return {
    replaceState: (data, unused, url) => window.history.replaceState(data, unused, url),
    location: window.location,
  }
}

export function planenManuellZielAnsteuern(
  ziel: PlanenManuellZielElement | null | undefined,
  historyApi: PlanenManuellHistory | null | undefined = aktuelleHistory(),
): boolean {
  if (!ziel) return false
  ziel.focus({ preventScroll: true })
  ziel.scrollIntoView({
    block: 'start',
    inline: 'nearest',
    behavior: scrollVerhalten(),
  })
  const hash = `#${PLANEN_MANUELL_ZIEL_ID}`
  if (historyApi && historyApi.location.hash !== hash) {
    historyApi.replaceState(null, '', hash)
  }
  return true
}

export function PlanenManuellZeiger() {
  const aktivieren = (ereignis: MouseEvent<HTMLAnchorElement>) => {
    const ziel = document.getElementById(PLANEN_MANUELL_ZIEL_ID)
    if (!ziel) return
    ereignis.preventDefault()
    planenManuellZielAnsteuern(ziel)
  }

  return (
    <p className="min-w-0 text-sm leading-6 text-ink-800">
      Lieber selbst ausfüllen?{' '}
      <a
        href={`#${PLANEN_MANUELL_ZIEL_ID}`}
        onClick={aktivieren}
        className="inline-block min-h-11 min-w-0 max-w-full break-words rounded-sm font-semibold text-brand-800 underline underline-offset-2 transition hover:text-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
      >
        Schritt für Schritt planen
      </a>
    </p>
  )
}

export function PlanenManuellZiel({ children }: { children: ReactNode }) {
  return (
    <section
      id={PLANEN_MANUELL_ZIEL_ID}
      tabIndex={-1}
      aria-label="Schritt für Schritt planen"
      className="scroll-mt-[calc(var(--jet-header-h)+env(safe-area-inset-top)+1rem)] rounded-[28px] outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
    >
      {children}
    </section>
  )
}
