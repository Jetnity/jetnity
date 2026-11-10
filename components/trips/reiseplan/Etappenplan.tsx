'use client'

import { Fragment, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  CalendarDays,
  ChevronRight,
  ListTree,
  Map as MapIcon,
  MapPin,
  Plane,
  Plus,
  Route,
  Users,
  NotebookPen,
  Ticket,
  BusFront,
} from 'lucide-react'
import type { Trip, TripItemKind, TripSource } from '@/types/trips'
import { landName } from '@/lib/country/darstellung'
import { etappenZeitraumAnzeigen } from '@/lib/trips/datum-anzeige'
import { reiseFoto } from '@/lib/trips/organisieren/katalog'
import { mobilitaetsAbdeckung } from '@/lib/mobility/kanten'
import { ART_BEZEICHNUNG } from '@/lib/trips/bezeichnungen'
import type { RouteZeile } from '@/lib/trips/ux-u1c-route-design-alignment-1/route'
import Etappenkarte from './Etappenkarte'
import StoppForm from './StoppForm'
import './etappen.css'

type Props = {
  reise: Trip
  quelle: TripSource
  route: RouteZeile[]
  tagId: string | null
  focusRoute: boolean
  onDay: (id: string) => void
  onRoute?: () => void
  onEdge?: (id: string, day: string) => void
  onSaved?: (graph: Trip) => void
  onItem?: (id: string) => void
  onAdd: (tag: string, kind: TripItemKind) => void
  edge: ReactNode
  day: ReactNode
  editor: ReactNode
  status: ReactNode
  editorOffen: boolean
  unassigned: ReactNode
}
const kinds = [
  { kind: 'stay', title: 'Unterkunft', Icon: BedDouble },
  { kind: 'activity', title: 'Aktivität', Icon: Ticket },
  { kind: 'transfer', title: 'Transport', Icon: BusFront },
  { kind: 'note', title: 'Notiz', Icon: NotebookPen },
] as const
const shortDate = new Intl.DateTimeFormat('de-CH', { day: 'numeric', month: 'short', timeZone: 'UTC' })
function date(value: string | null) {
  if (!value) return ''
  const day = new Date(value + 'T12:00:00Z')
  return Number.isFinite(day.getTime()) ? shortDate.format(day) : ''
}
export default function Etappenplan({
  reise,
  quelle,
  route,
  tagId,
  focusRoute,
  onDay,
  onEdge,
  onRoute,
  onItem,
  onSaved,
  onAdd,
  edge,
  day,
  editor,
  status,
  editorOffen,
  unassigned,
}: Props) {
  const [ansicht, setAnsicht] = useState<'plan' | 'karte'>('plan')
  const [tab, setTab] = useState<'uebersicht' | 'tage'>('uebersicht')
  const [stoppForm, setStoppForm] = useState(false)
  const [punkt, setPunkt] = useState<{ lat: number; lng: number } | null>(null)
  const [platzieren, setPlatzieren] = useState(false)
  const [ohneTage, setOhneTage] = useState<string | null>(null)
  const stages = [...reise.stages].sort((a, b) => a.position - b.position)
  const activeDay = !focusRoute && tagId ? reise.days.find((d) => d.id === tagId) : undefined
  const activeStage = stages.find((s) => s.id === (ohneTage || activeDay?.stageId))
  const activeRun = activeDay && route.find((r) => r.art === 'lauf' && r.tagIds.includes(activeDay.id))
  const days = activeStage
    ? reise.days.filter((d) => d.stageId === activeStage.id)
    : activeRun?.art === 'lauf'
      ? reise.days.filter((d) => activeRun.tagIds.includes(d.id))
      : []
  const showDetail = !!(activeDay || activeStage)
  const items = [
    ...days.flatMap((d) => d.items),
    ...(activeStage ? reise.ohneTag.filter((i) => i.stageId === activeStage.id) : []),
  ]
  const head = activeStage?.name || (activeRun?.art === 'lauf' && activeRun.name) || 'Reisetag'
  const country = activeStage?.countryCode ? landName(activeStage.countryCode, 'de') : ''
  const allCountry =
    stages.length && stages[0]?.countryCode && stages.every((s) => s.countryCode === stages[0].countryCode)
      ? landName(stages[0].countryCode, 'de')
      : null
  const hero = reise.title === stages[0]?.name && stages.length > 1 && allCountry ? allCountry : reise.title
  const legs = mobilitaetsAbdeckung(reise, reise.ohneTag).kanten
  const outbound = legs.find((l) => l.art === 'outbound')
  const inbound = legs.find((l) => l.art === 'return')
  const stageRow = (id: string) => stages.find((s) => s.id === id)
  function choose(id: string, dayId?: string) {
    setStoppForm(false)
    setTab('uebersicht')
    setAnsicht('plan')
    const first = dayId || reise.days.find((d) => d.stageId === id)?.id
    if (first) {
      setOhneTage(null)
      onDay(first)
    } else setOhneTage(id)
  }
  function openStop() {
    setPunkt(null)
    setStoppForm(true)
    setPlatzieren(false)
    setAnsicht('plan')
  }
  function back() {
    setOhneTage(null)
    setStoppForm(false)
    setTab('uebersicht')
    onRoute?.()
  }
  const stageTile = (id: string, dayIds: string[], title: string) => {
    const stage = stageRow(id)
    const index = stages.findIndex((s) => s.id === id)
    const entryDays = reise.days.filter((d) => dayIds.includes(d.id))
    const range =
      etappenZeitraumAnzeigen(entryDays[0]?.dayDate, entryDays.at(-1)?.dayDate) ||
      etappenZeitraumAnzeigen(stage?.arrivalDate, stage?.departureDate)
    const entries =
      entryDays.reduce((n, d) => n + d.items.length, 0) +
      (stage ? reise.ohneTag.filter((p) => p.stageId === id).length : 0)
    return (
      <button
        type="button"
        className="et-stage"
        data-u1c-route-lauf
        data-timeline-tag={dayIds[0]}
        onClick={() => choose(id, dayIds[0])}
      >
        <span className={'et-number' + (stage ? '' : ' transit')}>
          {stage ? index + 1 : <Plane size={15} />}
        </span>
        <span className="et-stage-surface">
          {stage && (
            <span className="et-thumb" style={{ backgroundImage: 'url(' + reiseFoto(stage) + ')' }} />
          )}
          <span className="et-tiletext">
            <b>{title}</b>
            <small>{range || (entryDays.length ? entryDays.length + ' Tage' : 'Zeitraum offen')}</small>
            <small>
              {entries === 0 ? 'Noch keine Einträge' : entries + (entries === 1 ? ' Eintrag' : ' Einträge')}
            </small>
          </span>
          <ChevronRight size={18} />
        </span>
      </button>
    )
  }
  return (
    <div className="et-atlas" data-trip-atlas>
      <div
        className="et-hero"
        style={{
          backgroundImage:
            'linear-gradient(90deg,rgba(11,49,42,.98) 0%,rgba(13,48,41,.91) 35%,rgba(13,48,41,.20) 100%),url(' +
            reiseFoto(stages[0], true) +
            ')',
        }}
      >
        <span className="et-eyebrow">
          <Route size={16} /> REISEPLAN
        </span>
        <h1>{hero}</h1>
        <div className="et-routepath">
          {stages.map((s, i) => (
            <Fragment key={s.id}>
              {i > 0 && <ArrowRight size={15} />}
              <span>{s.name}</span>
            </Fragment>
          ))}
        </div>
        <div className="et-meta">
          <span>
            <CalendarDays size={16} />
            {etappenZeitraumAnzeigen(reise.startDate, reise.endDate) || 'Reisedaten offen'}
          </span>
          <span>
            <Users size={16} />
            {reise.travellers} {reise.travellers === 1 ? 'Person' : 'Reisende'}
          </span>
        </div>
      </div>
      <div className="et-mobile-tabs">
        <button type="button" aria-pressed={ansicht === 'plan'} onClick={() => setAnsicht('plan')}>
          <ListTree size={17} /> Reiseplan
        </button>
        <button type="button" aria-pressed={ansicht === 'karte'} onClick={() => setAnsicht('karte')}>
          <MapIcon size={17} /> Karte
        </button>
      </div>
      <div className={'et-board mode-' + ansicht}>
        <section className="et-panel" aria-label="Reiseverlauf" data-u1b-route tabIndex={-1}>
          {stoppForm && onSaved ? (
            <StoppForm
              trip={reise}
              quelle={quelle}
              nach={activeStage?.id || null}
              position={punkt}
              onPosition={setPunkt}
              onKarte={() => {
                setPlatzieren(true)
                setAnsicht('karte')
              }}
              onClose={() => {
                setStoppForm(false)
                setPlatzieren(false)
              }}
              onSaved={(graph) => {
                setStoppForm(false)
                setPlatzieren(false)
                onSaved(graph)
                back()
              }}
            />
          ) : edge ? (
            <>
              <button type="button" className="et-back" data-u1b-zur-route onClick={back}>
                <ArrowLeft size={16} /> Alle Etappen
              </button>
              {edge}
            </>
          ) : showDetail ? (
            <>
              <button type="button" className="et-back" data-u1b-zur-route onClick={back}>
                <ArrowLeft size={16} /> Alle Etappen
              </button>
              <div className="et-detail-title">
                {activeStage && (
                  <span
                    className="et-thumb detail"
                    style={{ backgroundImage: 'url(' + reiseFoto(activeStage) + ')' }}
                  />
                )}
                <div>
                  <small>{country || 'Reiseplan'}</small>
                  <h2>{head}</h2>
                  <small>
                    {days.length} {days.length === 1 ? 'Tag' : 'Tage'} · {items.length}{' '}
                    {items.length === 1 ? 'Eintrag' : 'Einträge'}
                  </small>
                </div>
              </div>
              <div className="et-tabs">
                <button
                  type="button"
                  aria-pressed={tab === 'uebersicht'}
                  onClick={() => setTab('uebersicht')}
                >
                  Übersicht
                </button>
                <button type="button" aria-pressed={tab === 'tage'} onClick={() => setTab('tage')}>
                  Tagesplan
                </button>
              </div>
              <div data-u1b-day>
                {tab === 'uebersicht' && !editorOffen ? (
                  <>
                    {days.length > 0 && (
                      <div className="et-quick">
                        {kinds.map(({ kind, title, Icon }) => (
                          <button
                            type="button"
                            key={kind}
                            onClick={() => {
                              const id = activeDay?.id || days[0].id
                              setTab('tage')
                              onDay(id)
                              onAdd(id, kind)
                            }}
                          >
                            <Icon size={18} />
                            {title}
                            <Plus size={13} />
                          </button>
                        ))}
                      </div>
                    )}
                    <h3>Geplante Einträge</h3>
                    {items.length ? (
                      items.map((i) => (
                        <button type="button" className="et-entry" key={i.id} onClick={() => onItem?.(i.id)}>
                          <span>
                            <b>{i.title}</b>
                            <small>
                              {ART_BEZEICHNUNG[i.kind]}
                              {i.startsOn ? ' · ' + date(i.startsOn) : ''}
                            </small>
                          </span>
                          <ChevronRight size={16} />
                        </button>
                      ))
                    ) : (
                      <p>Hier erscheinen die Einträge für {head}.</p>
                    )}
                    {onSaved && (
                      <button className="et-secondary" type="button" onClick={openStop}>
                        <Plus size={16} /> Nächsten Stopp hinzufügen
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="et-days" data-plan-tag-streifen>
                      {days.map((d) => (
                        <button
                          type="button"
                          key={d.id}
                          data-timeline-tag={d.id}
                          aria-pressed={activeDay?.id === d.id}
                          onClick={() => onDay(d.id)}
                        >
                          Tag {d.dayIndex}
                          <small>{date(d.dayDate)}</small>
                        </button>
                      ))}
                    </div>
                    {editor}
                    {day}
                    {!days.length && <p>Für diese Etappe sind noch keine Tage zugeordnet.</p>}
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="et-row">
                <div>
                  <h2>Deine Route</h2>
                  <p>
                    {stages.length} {stages.length === 1 ? 'Etappe' : 'Etappen'} · {reise.days.length}{' '}
                    {reise.days.length === 1 ? 'Reisetag' : 'Reisetage'}
                  </p>
                </div>
                {onSaved && (
                  <button type="button" className="et-primary" onClick={openStop}>
                    <Plus size={16} /> Stopp hinzufügen
                  </button>
                )}
              </div>
              <div className="et-stages">
                {outbound && (
                  <div className="et-end">
                    <Plane size={15} />
                    <span>
                      <b>{outbound.originName}</b> Abreise{reise.startDate && ' · ' + date(reise.startDate)}
                    </span>
                  </div>
                )}
                {outbound && (
                  <div className="et-leg et-journey">
                    <Plane size={13} /> Hinreise · {outbound.originName} → {outbound.destinationName}
                  </div>
                )}
                {route.map((r) =>
                  r.art === 'kante' ? (
                    <button
                      key={r.occurrenceKey}
                      type="button"
                      className="et-leg"
                      disabled={!r.waehlbar || !onEdge}
                      onClick={() => onEdge?.(r.kanteId, r.rueckTagId)}
                    >
                      <Route size={15} />
                      <span>Verbindung · {r.titel}</span>
                      <ChevronRight size={14} />
                    </button>
                  ) : (
                    <Fragment key={r.schluessel}>{stageTile(r.stageId || '', r.tagIds, r.name)}</Fragment>
                  ),
                )}
                {stages
                  .filter((s) => !route.some((r) => r.art === 'lauf' && r.stageId === s.id))
                  .map((s) => (
                    <Fragment key={s.id}>
                      {stageTile(
                        s.id,
                        reise.days.filter((d) => d.stageId === s.id).map((d) => d.id),
                        s.name,
                      )}
                    </Fragment>
                  ))}
                {inbound && (
                  <div className="et-leg et-journey">
                    <Plane size={13} /> Rückreise · {inbound.originName} → {inbound.destinationName}
                  </div>
                )}
                {inbound && (
                  <div className="et-end">
                    <MapPin size={15} />
                    <span>
                      <b>{inbound.destinationName}</b> Rückkehr{reise.endDate && ' · ' + date(reise.endDate)}
                    </span>
                  </div>
                )}
                {!route.length && !stages.length && <p>Füge deinen ersten Stopp hinzu.</p>}
              </div>
              {unassigned}
            </>
          )}
          {status}
        </section>
        <div className="et-map-wrap">
          {platzieren && (
            <button
              className="et-cancel-pick"
              type="button"
              onClick={() => {
                setPlatzieren(false)
                setAnsicht('plan')
              }}
            >
              Ortswahl abbrechen
            </button>
          )}
          <Etappenkarte
            reise={reise}
            auswahl={activeStage?.id || null}
            onAuswahl={(id) => choose(id)}
            setzen={platzieren}
            onPosition={(p) => {
              setPunkt(p)
              setPlatzieren(false)
              setAnsicht('plan')
            }}
          />
        </div>
      </div>
    </div>
  )
}
