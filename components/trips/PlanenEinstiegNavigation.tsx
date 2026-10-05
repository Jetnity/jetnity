'use client'

// components/trips/PlanenEinstiegNavigation.tsx
//
// Sichtbare In-Page-Wege auf /planen.
// Nur Navigation: kein Absenden, keine Persistenz, kein Modell- oder
// Provideraufruf. Eine Aktivierung darf nur fokussieren und scrollen.
// Reduced Motion kommt aus `scrollVerhalten`.

import type { MouseEvent, ReactNode } from 'react'

import { scrollVerhalten } from '@/lib/formular/sicht'

export const PLANEN_IDEE_ZIEL_ID = 'reise-beschreiben'
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
 * Fokussiert ein Einstiegsziel und holt es unter den klebenden Kopf.
 * Scrollt nur auf ausdrückliche Aktivierung, nicht bei Formular-Rerenders.
 * `replaceState` legt keinen zusätzlichen History-Eintrag an.
 */
function aktuelleHistory(): PlanenManuellHistory | null {
  if (typeof window === 'undefined') return null
  return {
    replaceState: (data, unused, url) => window.history.replaceState(data, unused, url),
    location: window.location,
  }
}

function zielAnsteuern(
  id: string,
  ziel: PlanenManuellZielElement | null | undefined,
  historyApi: PlanenManuellHistory | null | undefined,
): boolean {
  if (!ziel) return false
  ziel.focus({ preventScroll: true })
  ziel.scrollIntoView({
    block: 'start',
    inline: 'nearest',
    behavior: scrollVerhalten(),
  })
  const hash = `#${id}`
  if (historyApi && historyApi.location.hash !== hash) {
    historyApi.replaceState(null, '', hash)
  }
  return true
}

export function planenIdeeZielAnsteuern(
  ziel: PlanenManuellZielElement | null | undefined,
  historyApi: PlanenManuellHistory | null | undefined = aktuelleHistory(),
): boolean {
  return zielAnsteuern(PLANEN_IDEE_ZIEL_ID, ziel, historyApi)
}

export function planenManuellZielAnsteuern(
  ziel: PlanenManuellZielElement | null | undefined,
  historyApi: PlanenManuellHistory | null | undefined = aktuelleHistory(),
): boolean {
  return zielAnsteuern(PLANEN_MANUELL_ZIEL_ID, ziel, historyApi)
}

const wegLinkClass =
  'flex min-h-11 min-w-0 max-w-full items-center rounded-2xl px-4 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-4'

function wegAktivieren(id: string) {
  return (ereignis: MouseEvent<HTMLAnchorElement>) => {
    const ziel = document.getElementById(id)
    if (!ziel) return
    ereignis.preventDefault()
    if (id === PLANEN_MANUELL_ZIEL_ID) planenManuellZielAnsteuern(ziel)
    else planenIdeeZielAnsteuern(ziel)
  }
}

export function PlanenManuellZeiger() {
  return (
    <nav aria-label="Wege zur neuen Reise" className="min-w-0 max-w-full">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-700">
        Zwei Wege, eine Reise
      </p>
      <div className="mt-3 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
        <a
          href={`#${PLANEN_IDEE_ZIEL_ID}`}
          onClick={wegAktivieren(PLANEN_IDEE_ZIEL_ID)}
          className={`${wegLinkClass} border border-brand-800 bg-brand-800 text-white shadow-[0_12px_30px_rgba(21,58,51,0.12)] hover:bg-brand-900 focus-visible:ring-citrus-300`}
        >
          <span className="min-w-0">
            <span className="block break-words text-sm font-semibold">In eigenen Worten</span>
            <span aria-hidden="true" className="mt-0.5 block break-words text-xs font-medium text-white/75">
              Zuerst. Entwurf vor dem Speichern.
            </span>
          </span>
        </a>
        <a
          href={`#${PLANEN_MANUELL_ZIEL_ID}`}
          onClick={wegAktivieren(PLANEN_MANUELL_ZIEL_ID)}
          className={`${wegLinkClass} border border-line-200 bg-white text-brand-900 hover:border-brand-600 focus-visible:ring-brand-600/15`}
        >
          <span className="min-w-0">
            <span className="block break-words text-sm font-semibold">Schritt für Schritt planen</span>
            <span aria-hidden="true" className="mt-0.5 block break-words text-xs font-medium text-ink-700">
              Vollständig, ohne intelligente Planung.
            </span>
          </span>
        </a>
      </div>
    </nav>
  )
}

export function PlanenIdeeZeiger() {
  return (
    <p className="min-w-0 max-w-full text-sm leading-6 text-ink-800">
      Lieber beschreiben?{' '}
      <a
        href={`#${PLANEN_IDEE_ZIEL_ID}`}
        onClick={wegAktivieren(PLANEN_IDEE_ZIEL_ID)}
        className="inline-block min-h-11 min-w-0 max-w-full break-words rounded-sm font-semibold text-brand-800 underline underline-offset-2 transition hover:text-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
      >
        In eigenen Worten beginnen
      </a>
    </p>
  )
}

const zielRahmenClass =
  'scroll-mt-[calc(var(--jet-header-h)+env(safe-area-inset-top)+1rem)] min-w-0 max-w-full rounded-[28px] outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15'

export function PlanenIdeeZiel({ children }: { children: ReactNode }) {
  return (
    <section
      id={PLANEN_IDEE_ZIEL_ID}
      tabIndex={-1}
      aria-label="In eigenen Worten"
      className={zielRahmenClass}
    >
      {children}
    </section>
  )
}

export function PlanenManuellZiel({ children }: { children: ReactNode }) {
  return (
    <section
      id={PLANEN_MANUELL_ZIEL_ID}
      tabIndex={-1}
      aria-label="Schritt für Schritt planen"
      className={zielRahmenClass}
    >
      {children}
    </section>
  )
}
