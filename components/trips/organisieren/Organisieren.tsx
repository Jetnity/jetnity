'use client'

import { useId, useState, type ReactNode, type KeyboardEvent } from 'react'
import Reisefoto from './Reisefoto'
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
import Flugsuche, { type FlugSpeichern } from './Flugsuche'
import Hotelsuche from './Hotelsuche'
import Aktivitaeten from './Aktivitaeten'
import Verbindungen from './Verbindungen'
import DiscoverCarsMietwagen from '@/components/trips/rental/DiscoverCarsMietwagen'

const tabs = [
  { key: 'fluege', label: 'Flüge', icon: Plane },
  { key: 'unterkunft', label: 'Unterkunft', icon: BedDouble },
  { key: 'aktivitaeten', label: 'Aktivitäten', icon: Ticket },
  { key: 'mietwagen', label: 'Mietwagen', icon: CarFront },
  { key: 'verbindungen', label: 'Verbindungen', icon: Route },
] as const
type Kategorie = (typeof tabs)[number]['key']

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
  details,
  partnerAktivitaeten,
  flugSpeichern,
}: {
  reise: Trip
  details: ReactNode
  partnerAktivitaeten?: ReactNode
  flugSpeichern?: FlugSpeichern
}) {
  const uid = useId()
  const [tab, setTab] = useState<Kategorie>('fluege')
  const [hotelStart, setHotelStart] = useState<TripStage | undefined>()
  const [suchId, setSuchId] = useState(0)
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
        setHotelStart(s)
        setSuchId((x) => x + 1)
        setTab('unterkunft')
        document.getElementById(uid + '-tabs')?.scrollIntoView({ block: 'nearest' })
      }}
    />
  )
  function wechsle(k: Kategorie) {
    if (k !== tab) {
      setHotelStart(undefined)
      setTab(k)
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
      wechsle(tabs[ziel]!.key)
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
              aria-controls={uid + '-panel'}
              tabIndex={tab === t.key ? 0 : -1}
              onKeyDown={(e) => taste(e, i)}
              onClick={() => wechsle(t.key)}
            >
              <t.icon />
              {t.label}
            </button>
          ))}
        </div>
        <div id={uid + '-panel'} role="tabpanel" aria-labelledby={uid + '-' + tab}>
          {tab === 'fluege' && <Flugsuche reise={reise} etappen={etappen} speichern={flugSpeichern} />}
          {tab === 'unterkunft' && (
            <Hotelsuche
              key={suchId}
              reise={reise}
              start={hotelStart ?? erste}
              sofort={Boolean(hotelStart)}
              etappen={etappen}
            />
          )}
          {tab === 'aktivitaeten' && <Aktivitaeten reise={reise} partner={partnerAktivitaeten} />}
          {tab === 'mietwagen' && <DiscoverCarsMietwagen reise={reise} zentral />}
          {tab === 'verbindungen' && <Verbindungen reise={reise} etappen={etappen} />}
        </div>
        <footer className="org-footer">
          {details}
          <a href="/images/organisieren/Bildnachweise.txt" target="_blank" rel="noopener">
            Bildnachweise
          </a>
        </footer>
      </div>
    </section>
  )
}
