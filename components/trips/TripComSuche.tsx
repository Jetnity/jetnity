import { ArrowUpRight, BedDouble, Plane } from 'lucide-react'

import { TRIPCOM_SUCHLINKS, tripComAufenthalte } from '@/lib/providers/tripcom/suche'
import { etappenZeitraumAnzeigen } from '@/lib/trips/datum-anzeige'
import { ORGANISIEREN_FLAECHE_KLASSE, ORGANISIEREN_PRIMAR_KLASSE } from '@/lib/trips/organize-premium-experience-6'
import { cn } from '@/lib/utils'
import type { Trip } from '@/types/trips'

function zeitraumMitJahr(start: string | null, ende: string | null): string {
  const ankunft = etappenZeitraumAnzeigen(start, start) || 'Noch offen'
  const abreise = etappenZeitraumAnzeigen(ende, ende) || 'Noch offen'
  return `${ankunft} – ${abreise}`
}

/** Reiner externer Sucheinstieg, ohne Provider-Ressourcen oder Seiteneffekte. */
export default function TripComSuche({ reise, art }: { reise: Trip; art: keyof typeof TRIPCOM_SUCHLINKS }) {
  const hotels = art === 'hotels'
  const aufenthalte = tripComAufenthalte(reise)
  const Icon = hotels ? BedDouble : Plane

  return (
    <section aria-label={hotels ? 'Hotels bei Trip.com suchen' : 'Flüge bei Trip.com suchen'} data-tripcom-suche={art} className={cn(ORGANISIEREN_FLAECHE_KLASSE, 'grid gap-4')}>
      <div className="flex items-start gap-3">
        <Icon aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-brand-700" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Trip.com · Partnerlink</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-brand-800">{hotels ? 'Eine Unterkunft finden' : 'Einen Flug finden'}</h2>
        </div>
      </div>
      <p className="text-sm leading-6 text-ink-800">
        {hotels
          ? 'Öffne die Hotelsuche bei Trip.com. Ziel, An- und Abreise sowie Zimmer und Reisende gibst du dort nochmals ein.'
          : 'Öffne die Flugsuche bei Trip.com. Strecke, Reisedaten und Reisende gibst du dort nochmals ein.'}
      </p>
      <details className="min-w-0 rounded-2xl border border-line-200 bg-surface-25 px-3">
        <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600">Deine Reisedaten zur Hand</summary>
        <div className="grid min-w-0 gap-2 pb-3 text-sm leading-6 text-ink-800 [overflow-wrap:anywhere]">
          {hotels ? (
            <>
              {aufenthalte.length === 0 ? <p>Reiseziele noch offen.</p> : (
                <ol className="grid gap-2">
                  {aufenthalte.map((aufenthalt, index) => (
                    <li key={aufenthalt.id}>
                      <p className="font-semibold">{index + 1}. {aufenthalt.ort}</p>
                      <p>{aufenthalt.zeitraum ? zeitraumMitJahr(aufenthalt.zeitraum.checkIn, aufenthalt.zeitraum.checkOut) : 'Aufenthaltszeitraum noch offen'}</p>
                    </li>
                  ))}
                </ol>
              )}
            </>
          ) : (
            <>
              <p><span className="font-semibold">Abreiseort:</span> {reise.origin || 'Noch offen'}</p>
              <p><span className="font-semibold">Reiseziele:</span> {aufenthalte.map((aufenthalt) => aufenthalt.ort).join(' → ') || 'Noch offen'}</p>
              <p><span className="font-semibold">Reisezeitraum:</span> {zeitraumMitJahr(reise.startDate, reise.endDate)}</p>
              <p>Wähle bei Trip.com die passende Flugstrecke und deren Datum aus.</p>
            </>
          )}
          <p>{reise.travellers} Reisende laut Reiseplanung. Die genaue Aufteilung gibst du bei Trip.com an.</p>
          <p>Diese Angaben werden nicht automatisch an Trip.com übertragen.</p>
        </div>
      </details>
      <div>
        <a href={TRIPCOM_SUCHLINKS[art]} target="_blank" rel="noopener noreferrer sponsored" referrerPolicy="no-referrer" className={cn(ORGANISIEREN_PRIMAR_KLASSE, 'py-3 text-center')}>
          {hotels ? 'Hotels bei Trip.com suchen' : 'Flüge bei Trip.com suchen'}
          <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span className="sr-only"> (öffnet einen neuen Tab)</span>
        </a>
        <p className="mt-2 text-xs leading-5 text-ink-700">Öffnet Trip.com in einem neuen Tab. Suche, aktuelle Preise, Verfügbarkeit und Buchung erfolgen dort. Eine Buchung wird nicht automatisch in deinen Reiseplan übernommen.</p>
      </div>
      <p className="text-xs leading-5 text-ink-700">Bei einer Buchung über diesen Partnerlink kann Jetnity eine Provision erhalten.</p>
    </section>
  )
}
