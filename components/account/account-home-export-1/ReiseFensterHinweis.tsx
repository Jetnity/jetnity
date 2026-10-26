import type { Route } from 'next'
import Link from 'next/link'

import {
  REISE_SAMMLUNG_HREF,
  REISE_SAMMLUNG_TEXT,
  fensterHinweis,
  type ReiseFenster,
} from '@/lib/account/account-home-export-1/fenster'

export function SeiteNeuLaden({ href }: { href: '/account' | '/account/welt' }) {
  return (
    <p className="mt-4 max-w-xl" data-account-neu-laden={href}>
      <a
        href={href}
        className="inline-flex min-h-11 items-center rounded-full border border-line-200 bg-white px-4 text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
      >
        Seite erneut laden
      </a>
      <span className="mt-2 block text-sm leading-6 text-ink-700">
        Das öffnet diese Ansicht neu. Erst die neu geladene Seite ist eine Aussage über den
        Speicherstand. Der Wechsel selbst bestätigt keine neuen Daten.
      </span>
    </p>
  )
}

export function ReiseFensterHinweis({
  fenster,
  neuLadenHref,
}: {
  fenster: ReiseFenster
  neuLadenHref?: '/account' | '/account/welt'
}) {
  return (
    <div data-account-fenster={fenster.lage} className="mt-4 max-w-2xl break-words">
      <p className="text-sm leading-6 text-ink-800">{fensterHinweis(fenster)}</p>
      {fenster.lage === 'fehler' ? null : (
        <p className="mt-2">
          <Link
            href={REISE_SAMMLUNG_HREF as Route}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-800 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
          >
            {REISE_SAMMLUNG_TEXT}
          </Link>
        </p>
      )}
      {fenster.lage === 'fehler' && neuLadenHref ? <SeiteNeuLaden href={neuLadenHref} /> : null}
    </div>
  )
}
