'use client'

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type KeyboardEvent } from 'react'
import { gespeicherteEtappeAnzeigen } from '@/lib/places/titel-name'
import Reisefoto from './Reisefoto'
import OrganisierenBestand from './OrganisierenBestand'
import { organisierenBestand } from '@/lib/trips/organisieren/bestand'
import { organisierenZeileBeobachten } from '@/lib/trips/organisieren/zeile-frei'
import { StadtbildNachweis } from './Stadtbild'
import ManualOffer from '@/components/saved-offers/ManualOffer'
import { providerZurReiseplanUrl } from '@/lib/trips/provider-rueckkehr'
import {
  Plane,
  BedDouble,
  Ticket,
  CarFront,
  Route,
  ArrowUpRight,
  ChevronDown,
} from 'lucide-react'
import { hotelDaten, reiseFoto } from '@/lib/trips/organisieren/katalog'
import { etappenZeitraumAnzeigen } from '@/lib/trips/datum-anzeige'
import { landName } from '@/lib/country/darstellung'
import type { Trip, TripItem, TripStage } from '@/types/trips'
import Flugsuche from './Flugsuche'
import type { Suchkategorie } from '@/lib/trips/workspace-mode'
import Hotelsuche from './Hotelsuche'
import { SuchbereichKontext } from './SuchbereichKontext'
import { hotelKontextVersion } from '@/lib/trips/hotel-suchkontext'
import Aktivitaeten from './Aktivitaeten'
import dynamic from 'next/dynamic'
import { titelFolgtDemErstenZiel } from '@/lib/places/titel-name'
import DiscoverCarsMietwagen from '@/components/trips/rental/DiscoverCarsMietwagen'

const OmioImReiseplan = dynamic(() => import('./omio/OmioImReiseplan'), { ssr: false })

const tabs = [
  { key: 'fluege', label: 'Flüge', icon: Plane },
  { key: 'unterkunft', label: 'Unterkunft', icon: BedDouble },
  { key: 'aktivitaeten', label: 'Aktivitäten', icon: Ticket },
  { key: 'mietwagen', label: 'Mietwagen', icon: CarFront },
  { key: 'verbindungen', label: 'Verbindungen', icon: Route },
] as const

const SUCHAKTION: Record<Suchkategorie, string> = {
  fluege: 'Weitere Flüge suchen',
  unterkunft: 'Neue Unterkünfte suchen',
  aktivitaeten: 'Weitere Aktivitäten entdecken',
  mietwagen: 'Mietwagenangebote suchen',
  verbindungen: 'Weitere Verbindungen suchen',
}

const LEER: Record<Suchkategorie, string> = {
  fluege: 'Noch keine Flüge in dieser Reise gespeichert.',
  unterkunft: 'Noch keine Unterkunft in dieser Reise gespeichert.',
  aktivitaeten: 'Noch keine Aktivitäten in dieser Reise gespeichert.',
  mietwagen: 'Noch kein Mietwagen in dieser Reise gespeichert.',
  verbindungen: 'Noch keine Verbindungen in dieser Reise gespeichert.',
}

/** Etappe, Ort oder Kante sind ein ausdrücklicher Einstieg, kein gewöhnlicher Reiterwechsel. */
function ausdruecklicheSuche(
  kategorie: Suchkategorie,
  etappeId?: string,
  hotelOrtKey?: string,
  kanteId?: string,
): string | null {
  if (kategorie === 'unterkunft' && (etappeId || hotelOrtKey)) return `unterkunft:${etappeId ?? ''}:${hotelOrtKey ?? ''}`
  if (kategorie === 'aktivitaeten' && etappeId) return `aktivitaeten:${etappeId}`
  if (kategorie === 'verbindungen' && kanteId) return `verbindungen:${kanteId}`
  return null
}

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
              aria-label={'Unterkünfte in ' + gespeicherteEtappeAnzeigen(s) + ' suchen'}
            >
              <Reisefoto src={reiseFoto(s)} ziel={s} breite={400} hoehe={158} />
              <span className="org-stagecaption">
                <small>{etappenZeitraumAnzeigen(daten.anreise, daten.abreise) ?? 'Zeitraum offen'}</small>
                <b>{gespeicherteEtappeAnzeigen(s)}</b>
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
  rueckkehrTagId,
  ohneTag,
  onItem,
}: {
  reise: Trip
  tab: Suchkategorie
  kategorieWaehlen: (kategorie: Suchkategorie, etappeId?: string) => void
  etappeId?: string
  hotelOrtKey?: string
  kanteId?: string
  rueckkehrTagId?: string
  partnerAktivitaeten?: ReactNode
  /** Separat geladene ungeplante Punkte; ohne Angabe die der Reise. */
  ohneTag?: readonly TripItem[]
  onItem?: (itemId: string) => void
}) {
  const uid = useId()
  const ungeplant = ohneTag ?? reise.ohneTag
  const bestand = useMemo(
    () => Object.fromEntries(tabs.map((t) => [t.key, organisierenBestand(reise, ungeplant, t.key)])) as Record<Suchkategorie, ReturnType<typeof organisierenBestand>>,
    [reise, ungeplant],
  )
  useEffect(() => {
    const leiste = document.getElementById(uid + '-tabs')
    const knopf = document.getElementById(uid + '-' + tab)
    if (!leiste || !knopf || leiste.scrollWidth <= leiste.clientWidth) return
    const links = knopf.offsetLeft - 4
    const rechts = knopf.offsetLeft + knopf.offsetWidth + 4
    if (links < leiste.scrollLeft) leiste.scrollLeft = links
    else if (rechts > leiste.scrollLeft + leiste.clientWidth) leiste.scrollLeft = rechts - leiste.clientWidth
  }, [tab, uid])
  const [auswahlVersion, setAuswahlVersion] = useState(0)
  const anfang = ausdruecklicheSuche(tab, etappeId, hotelOrtKey, kanteId)
  // Reiseeinträge zuerst. Anbieterflächen erst nach einer ausdrücklichen Aktion mounten.
  const [sucheOffen, setSucheOffen] = useState<Partial<Record<Suchkategorie, boolean>>>(() => anfang ? { [tab]: true } : {})
  const [sucheBesucht, setSucheBesucht] = useState<readonly Suchkategorie[]>(() => anfang ? [tab] : [])
  const [ausdruckGesehen, setAusdruckGesehen] = useState(anfang)
  const sucheWechseln = (k: Suchkategorie) => {
    setSucheOffen(bisher => ({ ...bisher, [k]: !bisher[k] }))
    setSucheBesucht(bisher => bisher.includes(k) ? bisher : [...bisher, k])
  }
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
  const ausdruck = ausdruecklicheSuche(tab, etappeId, hotelOrtKey, kanteId)
  if (ausdruck && ausdruck !== ausdruckGesehen) {
    setAusdruckGesehen(ausdruck)
    setSucheOffen(bisher => ({ ...bisher, [tab]: true }))
    setSucheBesucht(bisher => bisher.includes(tab) ? bisher : [...bisher, tab])
  }
  // Beim Reiterwechsel nicht die alte, auf Mobile oft tiefe Suchposition übernehmen.
  const kategorieSprung = useRef(false)
  useLayoutEffect(() => {
    if (kategorieSprung.current) {
      kategorieSprung.current = false
      const leiste = document.getElementById(uid + '-tabs')
      if (leiste) {
        const kopf = document.querySelector('header')
        const kopfHoehe = kopf instanceof HTMLElement && ['sticky', 'fixed'].includes(getComputedStyle(kopf).position)
          ? kopf.getBoundingClientRect().height : 0
        const oben = leiste.getBoundingClientRect().top + window.scrollY - kopfHoehe - 12
        window.scrollTo({ top: Math.max(0, oben), behavior: 'instant' })
      }
    }
    return organisierenZeileBeobachten(tab)
  }, [tab, uid, bestand])
  const erste = reise.stages[0]
  const land = erste?.countryCode
  const landTitel = land && reise.stages.every((s) => s.countryCode === land) ? landName(land, 'de') : null
  const titel =
    landTitel && erste && titelFolgtDemErstenZiel(reise.title, erste)
      ? landTitel
      : reise.title || landTitel || (erste ? gespeicherteEtappeAnzeigen(erste) : '') || 'Deine Reise'
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
      kategorieSprung.current = !tastatur
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
      <div className="org-wrap org-intro">
        <h2 id="workspace-organisieren-titel" data-workspace-modus-heading tabIndex={-1} className="sr-only">
          {titel} organisieren
        </h2>
        <p className="max-w-prose text-meta text-[color:var(--org-muted)]">Anbieter öffnen sich separat. Deine gespeicherte Reise bleibt bei Jetnity; eine externe Buchung wird nicht automatisch übernommen. Was du dort buchst, trägst du danach im Reiseplan ein, damit alles an einem Ort bleibt.</p>
        <a href={providerZurReiseplanUrl(reise, rueckkehrTagId)} className="org-rueckkehr" data-provider-rueckkehr="plan">Zurück zu meinem Reiseplan</a>
      </div>
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
          {bestand[t.key].length > 0
            ? <OrganisierenBestand kategorie={t.key} eintraege={bestand[t.key]} onItem={onItem} />
            : <section className="org-bestand" data-organisieren-bestand={t.key} aria-label="Gespeicherte Reiseleistungen">
                <h3 className="text-subtitle text-foreground">Das hast du schon</h3>
                <p className="mt-2 break-words text-body text-muted-foreground">
                  {LEER[t.key]} Eine neue Suche kannst du getrennt öffnen.
                </p>
              </section>}
          <section className="mt-4 grid min-w-0 gap-3 rounded-card border border-border bg-card p-3 sm:p-4"
            aria-label={SUCHAKTION[t.key]} data-organisieren-angebote={t.key}>
            <button type="button" data-organisieren-suche-toggle={t.key}
              aria-expanded={Boolean(sucheOffen[t.key])} aria-controls={uid + '-suche-' + t.key}
              onClick={() => sucheWechseln(t.key)}
              className="flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-control border border-input bg-background px-4 py-2 text-left text-body font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <span className="min-w-0 break-words">{sucheOffen[t.key] ? 'Angebotssuche schliessen' : SUCHAKTION[t.key]}</span>
              <ChevronDown size={18} className={sucheOffen[t.key] ? 'shrink-0 rotate-180' : 'shrink-0'} aria-hidden="true" />
            </button>
            <div id={uid + '-suche-' + t.key} data-organisieren-suche={t.key}
              hidden={!sucheOffen[t.key]} inert={!sucheOffen[t.key]}
              className={sucheOffen[t.key] ? 'min-w-0' : 'hidden'}>
              {sucheBesucht.includes(t.key) && <>
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
              </>}
            </div>
          </section>
        </div>
        </SuchbereichKontext.Provider>
        ))}
        <footer className="org-footer">
          <a href="/images/organisieren/Bildnachweise.txt" target="_blank" rel="noopener">
            Bildnachweise
          </a>
        </footer>
      </div>
    <div className="org-wrap grid gap-3 py-6">{Array.from(new Map(reise.stages.map(s => [s.placeId ?? s.name, s])).values()).map(s => <StadtbildNachweis key={s.id} ziel={s} />)}<ManualOffer key={tab} category={({ fluege: 'flight', unterkunft: 'stay', aktivitaeten: 'activity', mietwagen: 'rental_car', verbindungen: 'transfer' } as const)[tab]} destination={reise.stages.find(s => s.id === etappeId)?.name ?? erste?.name ?? ''} startsOn={reise.startDate ?? ''} endsOn={reise.endDate ?? ''} /></div>
    </section>
  )
}
