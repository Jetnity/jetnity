'use client'

import { useId, useLayoutEffect, useRef, useState, type ReactNode, type KeyboardEvent } from 'react'
import Reisefoto from './Reisefoto'
import ManualOffer from '@/components/saved-offers/ManualOffer'
import {
  Plane,
  BedDouble,
  Ticket,
  CarFront,
  Route,
  BriefcaseBusiness,
  CalendarDays,
  Users,
  Wallet,
  ArrowUpRight,
} from 'lucide-react'
import { hotelDaten, reiseFoto } from '@/lib/trips/organisieren/katalog'
import { betragLesbar } from '@/lib/trips/bezeichnungen'
import { etappenZeitraumAnzeigen } from '@/lib/trips/datum-anzeige'
import { landName } from '@/lib/country/darstellung'
import type { Trip, TripStage } from '@/types/trips'
import Flugsuche from './Flugsuche'
import type { Suchkategorie } from '@/lib/trips/workspace-mode'
import Hotelsuche from './Hotelsuche'
import { SuchbereichKontext } from './SuchbereichKontext'
import { hotelKontextVersion } from '@/lib/trips/hotel-suchkontext'
import Aktivitaeten from './Aktivitaeten'
import dynamic from 'next/dynamic'
import DiscoverCarsMietwagen from '@/components/trips/rental/DiscoverCarsMietwagen'

const OmioImReiseplan = dynamic(() => import('./omio/OmioImReiseplan'), { ssr: false })

const tabs = [
  { key: 'fluege', label: 'Flüge', icon: Plane },
  { key: 'unterkunft', label: 'Unterkunft', icon: BedDouble },
  { key: 'aktivitaeten', label: 'Aktivitäten', icon: Ticket },
  { key: 'mietwagen', label: 'Mietwagen', icon: CarFront },
  { key: 'verbindungen', label: 'Verbindungen', icon: Route },
] as const


function Etappenkarten({ reise, waehlen }: { reise: Trip; waehlen: (s: TripStage) => void }) {
  if (!reise.stages.length)
    return (
      <p className="org-empty">
        Füge deiner Reise ein Ziel hinzu, um Unterkünfte und Aktivitäten zu entdecken.
      </p>
    )
  return (
    <section className="org-results">
      <div className="org-sectionhead">
        <div>
          <h2>Deine Etappen</h2>
          <p>Unterkünfte für einen Aufenthalt entdecken.</p>
        </div>
        <small>
          {reise.stages.length} {reise.stages.length === 1 ? 'Reiseziel' : 'Reiseziele'}
        </small>
      </div>
      <div className="org-stages">
        {reise.stages.map((s) => {
          const daten = hotelDaten(reise, s)
          return (
            <button
              type="button"
              key={s.id}
              className="org-stage"
              onClick={() => waehlen(s)}
              aria-label={'Unterkünfte in ' + s.name + ' suchen'}
            >
              <Reisefoto src={reiseFoto(s)} breite={400} hoehe={158} />
              <span className="org-stagecaption">
                <small>{etappenZeitraumAnzeigen(daten.anreise, daten.abreise) ?? 'Zeitraum offen'}</small>
                <b>{s.name}</b>
              </span>
              <span className="org-circle">
                <ArrowUpRight size={15} />
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default function Organisieren({
  reise,
  tab,
  kategorieWaehlen,
  partnerAktivitaeten,
  etappeId,
  hotelOrtKey,
  kanteId,
}: {
  reise: Trip
  tab: Suchkategorie
  kategorieWaehlen: (kategorie: Suchkategorie, etappeId?: string) => void
  etappeId?: string
  hotelOrtKey?: string
  kanteId?: string
  partnerAktivitaeten?: ReactNode
}) {
  const uid = useId()
  const [auswahlVersion, setAuswahlVersion] = useState(0)
  // Resume a category's existing search. Only an explicit route/destination
  // request changes its entry context; ordinary tab navigation supplies none.
  const eingang = JSON.stringify([tab, etappeId, hotelOrtKey, kanteId])
  const [sitzung, setSitzung] = useState(() => ({
    eingang,
    besucht: [tab] as Suchkategorie[],
    hotel: { etappeId: tab === 'unterkunft' ? etappeId : undefined, ort: tab === 'unterkunft' ? hotelOrtKey : undefined },
    aktivitaeten: tab === 'aktivitaeten' ? etappeId : undefined,
    verbindungen: tab === 'verbindungen' ? kanteId : undefined,
  }))
  if (sitzung.eingang !== eingang) {
    setSitzung({
      ...sitzung, eingang,
      besucht: sitzung.besucht.includes(tab) ? sitzung.besucht : [...sitzung.besucht, tab],
      hotel: tab === 'unterkunft' && (etappeId || hotelOrtKey) ? { etappeId, ort: hotelOrtKey } : sitzung.hotel,
      aktivitaeten: tab === 'aktivitaeten' && etappeId ? etappeId : sitzung.aktivitaeten,
      verbindungen: tab === 'verbindungen' && kanteId ? kanteId : sitzung.verbindungen,
    })
  }
  const einstieg = reise.stages.find(s => s.id === sitzung.hotel.etappeId)
  const scrollPositionen = useRef<Partial<Record<Suchkategorie, number>>>({})
  const scrollZiel = useRef<number | null>(null)
  useLayoutEffect(() => {
    if (scrollZiel.current !== null) {
      window.scrollTo({ top: scrollZiel.current, behavior: 'instant' })
      scrollZiel.current = null
    }
  }, [tab])
  const erste = reise.stages[0]
  const land = erste?.countryCode
  const landTitel = land && reise.stages.every((s) => s.countryCode === land) ? landName(land, 'de') : null
  const titel =
    landTitel && reise.title === erste?.name
      ? landTitel
      : reise.title || landTitel || erste?.name || 'Deine Reise'
  const etappen = (
    <Etappenkarten
      reise={reise}
      waehlen={(s) => {
        setAuswahlVersion(v => v + 1)
        kategorieWaehlen('unterkunft', s.id)
        document.getElementById(uid + '-tabs')?.scrollIntoView({ block: 'nearest' })
      }}
    />
  )
  function wechsle(k: Suchkategorie, tastatur = false) {
    if (k !== tab) {
      scrollPositionen.current[tab] = window.scrollY
      scrollZiel.current = tastatur ? null : (scrollPositionen.current[k] ?? null)
      kategorieWaehlen(k)
    }
  }
  function taste(e: KeyboardEvent, index: number) {
    const ziel =
      e.key === 'ArrowRight'
        ? (index + 1) % 5
        : e.key === 'ArrowLeft'
          ? (index + 4) % 5
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? 4
              : null
    if (ziel !== null) {
      e.preventDefault()
      wechsle(tabs[ziel]!.key, true)
      document.getElementById(uid + '-' + tabs[ziel]!.key)?.focus()
    }
  }
  return (
    <section
      className="org-workspace"
      data-workspace-modus="organisieren"
      aria-labelledby="workspace-organisieren-titel"
    >
      <header className="org-hero">
        <Reisefoto src={reiseFoto(erste, true)} sofort breite={1200} hoehe={270} />
        <div className="org-shade" />
        <div className="org-wrap org-heading">
          <p className="org-kicker">
            <BriefcaseBusiness size={15} /> Reise organisieren
          </p>
          <h1 id="workspace-organisieren-titel" data-workspace-modus-heading tabIndex={-1}>
            {titel}
          </h1>
          <p className="org-route">
            {reise.stages.map((s, i) => (
              <span key={s.id}>
                {i > 0 && <i aria-hidden="true"> → </i>}
                {s.name}
              </span>
            ))}
          </p>
          <div className="org-meta">
            <span>
              <CalendarDays />
              {etappenZeitraumAnzeigen(reise.startDate, reise.endDate) ?? 'Reisezeit offen'}
            </span>
            <span>
              <Users />
              {reise.travellers} Reisende
            </span>
            {reise.budgetAmount != null && (
              <span>
                <Wallet />
                {betragLesbar(reise.budgetAmount, reise.currency)}
              </span>
            )}
          </div>
        </div>
      </header>
      <div className="org-wrap org-body">
        <div className="org-tabs" role="tablist" id={uid + '-tabs'} aria-label="Reisekategorien">
          {tabs.map((t, i) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={uid + '-' + t.key}
              aria-selected={tab === t.key}
              aria-controls={uid + '-panel-' + t.key}
              tabIndex={tab === t.key ? 0 : -1}
              onKeyDown={(e) => taste(e, i)}
              onClick={() => wechsle(t.key)}
            >
              <t.icon />
              {t.label}
            </button>
          ))}
        </div>
        {tabs.filter(t => sitzung.besucht.includes(t.key) || t.key === tab).map(t => (
        <SuchbereichKontext.Provider key={t.key} value={tab === t.key}>
        <div id={uid + '-panel-' + t.key} role="tabpanel" aria-labelledby={uid + '-' + t.key}
          hidden={tab !== t.key} inert={tab !== t.key} data-suchbereich={t.key}>
          {t.key === 'fluege' && <Flugsuche reise={reise} etappen={etappen} />}
          {t.key === 'unterkunft' && (
            <Hotelsuche
              key={hotelKontextVersion(reise) + ':' + (sitzung.hotel.ort ?? '')}
              reise={reise}
              start={einstieg ?? erste}
              startOrt={sitzung.hotel.ort}
              auswahlVersion={auswahlVersion}
              etappen={etappen}
            />
          )}
          {t.key === 'aktivitaeten' && <Aktivitaeten key={sitzung.aktivitaeten} reise={reise} startId={sitzung.aktivitaeten} partner={partnerAktivitaeten} />}
          {t.key === 'mietwagen' && <DiscoverCarsMietwagen reise={reise} zentral />}
          {t.key === 'verbindungen' && <OmioImReiseplan key={sitzung.verbindungen} reise={reise} etappen={etappen} kanteId={sitzung.verbindungen} />}
        </div>
        </SuchbereichKontext.Provider>
        ))}
        <footer className="org-footer">
          <a href="/images/organisieren/Bildnachweise.txt" target="_blank" rel="noopener">
            Bildnachweise
          </a>
        </footer>
      </div>
    <div className="org-wrap py-6"><ManualOffer key={tab} category={({ fluege: 'flight', unterkunft: 'stay', aktivitaeten: 'activity', mietwagen: 'rental_car', verbindungen: 'transfer' } as const)[tab]} destination={reise.stages.find(s => s.id === etappeId)?.name ?? erste?.name ?? ''} startsOn={reise.startDate ?? ''} endsOn={reise.endDate ?? ''} /></div>
    </section>
  )
}
