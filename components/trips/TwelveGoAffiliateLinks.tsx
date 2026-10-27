// components/trips/TwelveGoAffiliateLinks.tsx
//
// Eine Fläche für benachbarte Zielvorkommen. Der Link wird erst beim
// Klick verlassen. Vorher lädt nichts von 12Go.

import { ORGANISIEREN_FLAECHE_KLASSE } from '@/lib/trips/organize-premium-experience-6'
import {
  TWELVE_GO_HINWEIS,
  twelveGoKantenFuerReise,
} from '@/lib/providers/twelve-go/affiliate/kanten'
import type { Trip } from '@/types/trips'

const AKTION_KLASSE =
  'mt-3 inline-flex min-h-11 w-full max-w-full items-center whitespace-normal break-words rounded-full border border-line-300 bg-white px-4 py-2 text-left text-sm font-semibold text-brand-800 transition hover:border-line-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 sm:w-auto'

export default function TwelveGoAffiliateLinks({ reise }: { reise: Trip }) {
  const kanten = twelveGoKantenFuerReise(reise)

  return (
    <section
      aria-label="Externe 12Go-Suche"
      data-organisieren-flaeche="twelve-go"
      data-twelve-go-affiliate="1"
      data-twelve-go-reise={reise.id}
      className={ORGANISIEREN_FLAECHE_KLASSE}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Extern</p>
      <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-2xl">
        Verbindungen bei 12Go suchen
      </h2>
      <p className="mt-1 text-sm leading-6 text-ink-800">{TWELVE_GO_HINWEIS}.</p>

      {kanten.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-surface-25 px-4 py-3 text-sm leading-6 text-ink-800">
          Sobald mindestens zwei Ziele in der Reise stehen, kannst du jede benachbarte Strecke bei 12Go selbst suchen.
        </p>
      ) : (
        <ul className="mt-5 grid gap-3">
          {kanten.map((kante) => (
            <li
              key={kante.id}
              data-twelve-go-kante={kante.id}
              className="min-w-0 rounded-2xl border border-line-200 px-3 py-3"
            >
              <p className="break-words text-sm font-semibold text-brand-800">
                {kante.vonName} → {kante.nachName}
              </p>
              {kante.streckenHinweis ? (
                <p className="mt-1 text-sm leading-6 text-ink-800">{kante.streckenHinweis}</p>
              ) : null}
              <p className="mt-1 text-sm leading-6 text-ink-800" data-geplant={kante.geplantesDatum ?? ''}>
                {kante.datumHinweis}
              </p>
              <p className="mt-1 text-sm leading-6 text-ink-800">{kante.waehrungHinweis}</p>
              <a
                href={kante.href}
                target="_blank"
                rel="noopener noreferrer sponsored"
                data-twelve-go-art={kante.art}
                className={AKTION_KLASSE}
              >
                {kante.aktion}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
