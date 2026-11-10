'use client'

import { useId, useMemo } from 'react'
import { ArrowRight, CalendarDays, ChevronDown, ChevronRight, TriangleAlert } from 'lucide-react'

import { useGeraetekalendertag } from '@/components/account/account-home-export-1/useGeraetekalendertag'
import { etappenAgenda, offenerEtappentag, tagesKonflikte } from '@/lib/trips/etappen-tagesagenda'
import { ART_BEZEICHNUNG } from '@/lib/trips/bezeichnungen'
import { tripZeitpruefung } from '@/lib/trips/trip-timeline-temporal-review-1'
import type { Trip, TripDay } from '@/types/trips'

const SICHTBARE_TAGE = 4

export default function EtappenTage({ days, reise, onDay }: {
  days: readonly TripDay[]
  reise: Trip
  onDay: (id: string) => void
}) {
  const titelId = useId()
  const heute = useGeraetekalendertag()
  const tage = useMemo(() => etappenAgenda(days), [days])
  const zeitpruefung = useMemo(() => tripZeitpruefung(reise), [reise])
  const konflikte = useMemo(() => tagesKonflikte(days, zeitpruefung), [days, zeitpruefung])
  const namen = useMemo(() => new Map([...reise.days.flatMap((tag) => tag.items), ...reise.ohneTag]
    .map((punkt) => [punkt.id, punkt.title.trim() || ART_BEZEICHNUNG[punkt.kind]])), [reise])
  const offen = offenerEtappentag(tage, heute)
  const weitere = tage.slice(SICHTBARE_TAGE)
  const mehrereJahre = new Set(tage.flatMap((tag) => tag.iso ? [tag.iso.slice(0, 4)] : [])).size > 1

  function tagesliste(auswahl: typeof tage) {
    return (
      <ol className="et-agenda-liste">
        {auswahl.map((tag) => {
          const konflikt = konflikte.get(tag.id)
          const paar = konflikt?.ids.map((id) => namen.get(id)).filter(Boolean)
          const nummer = 'Tag ' + tag.index
          const titel = tag.title && tag.title !== nummer ? tag.title : tag.wochentag ?? nummer
          return (
            <li key={tag.id}>
              <button type="button" className="et-agenda-tag" onClick={() => onDay(tag.id)}>
                <span className="et-agenda-datum" aria-hidden="true">
                  {tag.iso ? <><small>{tag.monat}</small><b>{tag.kalendertag}</b></> : <CalendarDays size={20} />}
                </span>
                <span className="et-agenda-inhalt">
                  <span className="et-agenda-zeile">
                    <strong>{titel}</strong>
                    {titel !== nummer && <small>{nummer}</small>}
                    {mehrereJahre && tag.iso && <small>{tag.iso.slice(0, 4)}</small>}
                    {tag.datumText ? <span className="sr-only"> · {tag.datumText}</span> : <small>{tag.datumUngueltig ? 'Datum prüfen' : 'Datum offen'}</small>}
                  </span>
                  {tag.vorschau.map(({ punkt, label }) => (
                    <span key={punkt.id} className="et-agenda-eintrag">
                      <span>{label}</span> {punkt.title.trim() || ART_BEZEICHNUNG[punkt.kind]}
                    </span>
                  ))}
                  {tag.anzahl === 0 && <span className="et-agenda-frei">Noch ohne Eintrag</span>}
                  {tag.anzahl > tag.vorschau.length && <span className="et-agenda-mehr">
                    {tag.anzahl - tag.vorschau.length === 1 ? 'Ein weiterer Eintrag' : (tag.anzahl - tag.vorschau.length) + ' weitere Einträge'}
                  </span>}
                  {konflikt && paar?.length === 2 && <span className="et-agenda-konflikt">
                    <TriangleAlert size={14} aria-hidden="true" />
                    <span>{konflikt.minuten ? konflikt.minuten + ' Min. Überschneidung' : konflikt.sicher ? 'Überschneidung' : 'Ortszeiten prüfen'} · {paar.join(' / ')}</span>
                  </span>}
                </span>
                <ChevronRight className="et-agenda-pfeil" size={17} aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ol>
    )
  }

  return (
    <section className="et-agenda" aria-labelledby={titelId}>
      <header className="et-agenda-kopf">
        <h3 id={titelId}>Tagesplanung</h3>
        {offen && <button type="button" className="et-agenda-einstieg" onClick={() => onDay(offen.id)}>
          Tag {offen.index} planen <ArrowRight size={15} aria-hidden="true" />
        </button>}
      </header>
      {tage.length === 0 ? <p className="et-agenda-leer">Dieser Etappe ist noch kein Reisetag zugeordnet.</p> : tagesliste(tage.slice(0, SICHTBARE_TAGE))}
      {weitere.length > 0 && <details className="et-agenda-weitere">
        <summary><ChevronDown size={16} aria-hidden="true" />{weitere.length === 1 ? 'Ein weiterer Tag' : weitere.length + ' weitere Tage'}</summary>
        {tagesliste(weitere)}
      </details>}
    </section>
  )
}
