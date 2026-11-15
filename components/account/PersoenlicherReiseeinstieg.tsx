import type { Route } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPinned, Plus } from 'lucide-react'

import { naechsteReiseAus } from '@/lib/account/naechste-reise'
import { etappenZeitraumAnzeigen } from '@/lib/trips/datum-anzeige'
import type { TripSummary } from '@/types/trips'

/** The account landing never fetches a second trip list. Supplied rows are an already-read collection. */
export default function PersoenlicherReiseeinstieg({
  reisen,
  weitereReisen = false,
}: {
  reisen?: readonly TripSummary[]
  weitereReisen?: boolean
}) {
  // Without a device calendar, choose the last edited open trip; do not claim it is the next departure.
  const fortsetzung = reisen ? naechsteReiseAus(reisen, null)?.reise : null
  const erstesMal = reisen?.length === 0 && !weitereReisen
  const nurArchiv = reisen !== undefined && !fortsetzung && !erstesMal
  const zeitraum = fortsetzung ? etappenZeitraumAnzeigen(fortsetzung.startDate, fortsetzung.endDate) : null

  return (
    <section aria-label="Dein nächster Schritt" className="rounded-[26px] bg-brand-800 px-5 py-7 text-white sm:px-8 sm:py-8">
      <div className="flex min-w-0 items-start gap-4">
        <span className="hidden h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/20 sm:grid">
          <MapPinned className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-white/75">Deine Reise beginnt hier</p>
          <h2 className="mt-2 break-words text-2xl font-semibold tracking-tight sm:text-3xl">
            {fortsetzung ? fortsetzung.title : erstesMal ? 'Beginne deine erste Reise.' : nurArchiv ? 'Wohin geht deine nächste Reise?' : 'Dein Plan. Dein nächster Schritt.'}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90">
            {fortsetzung
              ? `Hier hast du zuletzt weitergeplant${zeitraum ? ` · ${zeitraum}` : ''}. Öffne deinen Reiseplan und mache dort weiter.`
              : erstesMal
                ? 'Wähle ein Ziel und deinen Zeitraum. Danach bringst du Route, Unterkunft und Erlebnisse in deinem Reiseplan zusammen.'
                : nurArchiv
                  ? 'Beginne einen neuen Reiseplan oder öffne deine gespeicherten Reisen.'
                  : 'Setze eine gespeicherte Reise fort oder beginne mit einem neuen Ziel. Deine Reisen bleiben an einem Ort.'}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {fortsetzung || reisen === undefined ? (
              <Link href={fortsetzung ? `/reisen/${fortsetzung.id}` as Route : '/reisen'} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-citrus-400 px-5 py-3 text-sm font-semibold text-brand-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                Reise fortsetzen <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : null}
            <Link href="/planen" className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${fortsetzung || reisen === undefined ? 'border border-white/35 text-white hover:bg-white/10' : 'bg-citrus-400 text-brand-900'}`}>
              <Plus className="h-4 w-4" aria-hidden="true" />{erstesMal ? 'Erste Reise beginnen' : 'Neue Reise beginnen'}
            </Link>
            {nurArchiv ? <Link href="/reisen?archiv=archiv" className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-white underline underline-offset-4">Archivierte Reisen ansehen</Link> : null}
          </div>
        </div>
      </div>
    </section>
  )
}
