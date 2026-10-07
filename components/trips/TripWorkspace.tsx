'use client'

// components/trips/TripWorkspace.tsx
//
// Der Reise-Arbeitsbereich. Eine Produktlogik für alle Geräte (ADR-0163 / TW-1).
// Die Übersicht verdichtet vorhandene Reise-Wahrheit (ADR-0164 / TW-2).
// Jetzt wichtig priorisiert vorhandene Signale (ADR-0165 / TW-4).
// Der Verlauf zeigt Etappen und Tage als Timeline (ADR-0166 / TW-3).
// Item- und Gap-Details öffnen vorhandene Flächen kontextuell (ADR-0167 / TW-5).
//
// Die Reise bleibt die primäre Oberfläche. Domain-Flächen sind Details
// und Werkzeuge, keine gleichrangige Hauptnavigation. Commercial-Suche
// wird erst nach ausdrücklicher Nutzeraktion gemountet.

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import {
  ARBEITSBEREICH_DESKTOP_AB_PX,
  type Arbeitsbereich,
  aenderungIstSichtbar,
  begleiterIstSichtbar,
  bereichDarstellungKlasse,
  gewaehlterTagId,
} from '@/lib/trips/arbeitsbereich'
import {
  ABDECKUNG_LUFT_PX,
  AKTIVE_DOMAIN_WEIT_AB_PX,
  abdeckungsKante,
  type AbdeckungsBand,
  domainAnordnung,
  domainRasterKlasse,
} from '@/lib/trips/cross-device-interaction-1'
import { heutigesDatum } from '@/lib/account/naechste-reise'
import type { AttentionAktion } from '@/lib/trips/attention'
import { attentionAbleiten } from '@/lib/trips/attention'
import {
  attentionAktionAlsDetail,
  bestandSollMounten,
  besuchteDomainsErweitern,
  detailAuswahlAusBereich,
  detailBereinigen,
  detailDomainVon,
  gapAuswahl,
  gapDetailAbleiten,
  itemAuswahl,
  itemDetailAbleiten,
  itemInReise,
  leereDetailAuswahl,
  sucheIstOffen,
  sucheOeffnen,
  sucheSollMounten,
  type DetailDomain,
  type WorkspaceDetailAuswahl,
  type WorkspaceRueckkehr,
} from '@/lib/trips/detail'
import { destinationEssentialsAbleiten } from '@/lib/trips/destination-essentials'
import { uebersichtAbleiten } from '@/lib/trips/uebersicht'
import type { OfficialEvaluation } from '@/lib/readiness/official'
import { PREPARATION_BEREICHE, type PreparationBereichId, type PreparationZiel } from '@/lib/readiness/preparation-premium-experience-5'
import type { SafetyEvaluation } from '@/lib/safety/domain'
import type { SeasonalEvaluation } from '@/lib/seasonal/domain'
import ReiseSicherheit from '@/components/trips/ReiseSicherheit'
import ReisezeitHinweise from '@/components/trips/ReisezeitHinweise'
import type { ReadinessKind, ReadinessUserStatus, TravellerDocumentType } from '@/types/trips'
import type { FlugSegmentManuell, PlanpunktFormular } from '@/lib/trips/schema'
import TripWorkspaceDomainNavigation from '@/components/trips/TripWorkspaceDomainNavigation'
import TripWorkspaceKopf from '@/components/trips/TripWorkspaceKopf'
import TripWorkspaceModeNavigation from '@/components/trips/TripWorkspaceModeNavigation'
import TripWorkspaceNavigation from '@/components/trips/TripWorkspaceNavigation'
import type { MobilityManuellEingabe } from '@/lib/mobility/schema'
import { readinessAnsicht } from '@/lib/readiness/status'
import type { PlanAenderung } from '@/lib/trips/trip-plan-integrated/manual'
import TripWorkspacePlan from '@/components/trips/TripWorkspacePlan'
import Reisevorbereitung from '@/components/trips/Reisevorbereitung'
import TripWorkspaceUebersicht, { TripWorkspaceAktionen } from '@/components/trips/TripWorkspaceUebersicht'
import TripWorkspaceDetail from '@/components/trips/TripWorkspaceDetail'
import {
  WORKSPACE_QUERY_KEYS,
  detailElternModus,
  modusFuerReise,
  modusAusAnfangsBereich,
  modusAusQuery,
  modusUrl,
  type WorkspaceAnsicht,
  type WorkspaceModus,
} from '@/lib/trips/workspace-mode'
import FlugBestand from '@/components/trips/FlugBestand'
import UnterkunftBestand from '@/components/trips/UnterkunftBestand'
import type { Trip, TripItem, TripSource } from '@/types/trips'

function kompakteAnsichtAbonnieren(melden: () => void) {
  const mq = window.matchMedia(`(min-width: ${ARBEITSBEREICH_DESKTOP_AB_PX}px)`)
  mq.addEventListener('change', melden)
  return () => mq.removeEventListener('change', melden)
}

function kompakteAnsichtLesen() {
  return !window.matchMedia(`(min-width: ${ARBEITSBEREICH_DESKTOP_AB_PX}px)`).matches
}

function weiteAnsichtAbonnieren(melden: () => void) {
  const mq = window.matchMedia(`(min-width: ${AKTIVE_DOMAIN_WEIT_AB_PX}px)`)
  mq.addEventListener('change', melden)
  return () => mq.removeEventListener('change', melden)
}

function weiteAnsichtLesen() {
  return window.matchMedia(`(min-width: ${AKTIVE_DOMAIN_WEIT_AB_PX}px)`).matches
}

function bandVon(el: Element | null): AbdeckungsBand | null {
  if (!(el instanceof HTMLElement)) return null
  const stil = getComputedStyle(el)
  if (stil.position !== 'sticky' && stil.position !== 'fixed') return null
  if (stil.display === 'none' || stil.visibility === 'hidden') return null
  const rand = el.getBoundingClientRect()
  if (rand.height <= 0 || rand.width <= 0) return null
  return { top: rand.top, bottom: rand.bottom, height: rand.height }
}

/** Site-Header plus die kompakte Rückkehrleiste, wenn sie an der Kopfkante klebt. */
function abdeckungUnten(): number {
  const baender = [
    bandVon(document.querySelector('header')),
    bandVon(document.querySelector('[data-workspace-mode-nav]')),
    bandVon(document.querySelector('nav[aria-label="Reise"]')),
  ].filter(
    (band): band is AbdeckungsBand => band != null,
  )
  return abdeckungsKante(baender)
}

function zielHeading(el: HTMLElement): HTMLElement {
  if (el.matches('h1, h2, h3')) return el
  const heading = el.querySelector('h1, h2, h3')
  return heading instanceof HTMLElement ? heading : el
}

/**
 * Dokumentposition der Identität: die Überschrift und, wenn sie direkt darüber
 * steht, die Domain-Zeile davor. So bleibt „Flüge“ mit „Verbindungen für diese Reise“ sichtbar.
 */
function identitaetsDokumentOben(el: HTMLElement): number {
  const ziel = zielHeading(el)
  const zielRand = ziel.getBoundingClientRect()
  let oben = zielRand.top
  const davor = ziel.previousElementSibling
  if (davor instanceof HTMLElement) {
    const rand = davor.getBoundingClientRect()
    if (rand.height > 0 && rand.width > 0 && rand.bottom <= oben + ABDECKUNG_LUFT_PX) oben = rand.top
  }
  return oben + window.scrollY
}

function identitaetLiegtFrei(el: HTMLElement, kante: number): boolean {
  const frei = kante + ABDECKUNG_LUFT_PX
  const heading = zielHeading(el).getBoundingClientRect()
  if (heading.height <= 0) return true
  const identitaetOben = identitaetsDokumentOben(el) - window.scrollY
  return identitaetOben >= frei - 1 && heading.top < window.innerHeight - 48 && heading.bottom > frei
}

function arbeitsflaecheZeigen(el: HTMLElement) {
  if (zielHeading(el).getBoundingClientRect().height <= 0) return
  const ersteKante = abdeckungUnten()
  if (!identitaetLiegtFrei(el, ersteKante)) {
    const oben = identitaetsDokumentOben(el)
    window.scrollTo({ top: Math.max(0, oben - (ersteKante + ABDECKUNG_LUFT_PX)), behavior: 'instant' })
  }
  const zweiteKante = abdeckungUnten()
  if (Math.abs(zweiteKante - ersteKante) > 0.5 && !identitaetLiegtFrei(el, zweiteKante)) {
    const oben = identitaetsDokumentOben(el)
    window.scrollTo({ top: Math.max(0, oben - (zweiteKante + ABDECKUNG_LUFT_PX)), behavior: 'instant' })
  }
}

function sichtbareSuchflaeche(wurzel: ParentNode | null) {
  if (!wurzel) return null
  for (const name of ['flugsuche', 'hotelsuche', 'aktivitaeten']) {
    const el = wurzel.querySelector(`[data-arbeitsbereich="${name}"]`)
    if (el instanceof HTMLElement && !el.hidden) return el
  }
  return null
}

function auswahlAusModus(modus: WorkspaceModus): WorkspaceDetailAuswahl {
  if (modus.ansicht === 'organisieren' && modus.bereich) return gapAuswahl(modus.bereich)
  if (modus.ansicht === 'plan' && modus.itemId) return itemAuswahl(modus.itemId)
  return leereDetailAuswahl()
}

function aktuelleAdresse(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

/** History ist ausschließlich Präsentationskontext. Fremde/alte Einträge sind kein Back-Marker. */
function historyElternLesen(reiseId: string): string | null {
  const stand: unknown = window.history.state?.jetnityWorkspace
  if (!stand || typeof stand !== 'object' || !('reiseId' in stand) || stand.reiseId !== reiseId ||
    !('url' in stand) || stand.url !== aktuelleAdresse() ||
    !('elternUrl' in stand) || typeof stand.elternUrl !== 'string') return null
  const eltern = new URL(stand.elternUrl, window.location.href)
  if (eltern.origin !== window.location.origin || eltern.pathname !== window.location.pathname) return null
  return stand.elternUrl
}

function historieSchreiben(
  reiseId: string,
  naechster: WorkspaceModus,
  art: 'push' | 'replace',
  kontext: 'child' | 'canonical' | 'root',
) {
  const url = modusUrl(window.location.href, naechster)
  const jetzt = aktuelleAdresse()
  if (url === jetzt) return
  const elternUrl = kontext === 'child' ? jetzt : kontext === 'canonical' ? historyElternLesen(reiseId) : null
  // Next-/Browser-State bleibt erhalten; kein zweiter Router und kein fake Origin im Query.
  const stand = { ...window.history.state, jetnityWorkspace: { reiseId, url, ...(elternUrl && { elternUrl }) } }
  if (art === 'push') window.history.pushState(stand, '', url)
  else window.history.replaceState(stand, '', url)
}

type TripWorkspaceProps = {
  reise: Trip
  quelle: TripSource
  ohneTag?: TripItem[]
  onVerbindungAnlegen?: (values: MobilityManuellEingabe) => Promise<string | null>
  onPunktBearbeiten?: (original: TripItem, change: PlanAenderung) => Promise<string | null>
  onPunktAnlegen: (tagId: string, eingabe: PlanpunktFormular) => Promise<string | null>
  onPunktEntfernen: (tagId: string, punktId: string) => Promise<string | null>
  kopfzeile?: React.ReactNode
  hinweis?: React.ReactNode
  aenderung?: React.ReactNode
  /**
   * Die Assistant-Fläche. Ohne diese Prop gibt es keinen Reisebegleiter und
   * keinen Knopf dafür – der Gast-Arbeitsbereich lässt sie aus.
   */
  begleiter?: React.ReactNode
  flugsuche?: React.ReactNode
  hotelsuche?: React.ReactNode
  aktivitaetensuche?: React.ReactNode
  mobilitaetssuche?: React.ReactNode
  onBuchungsstatus?: (itemId: string, gebucht: boolean) => Promise<string | null>
  onFlugRouteManuell?: (itemId: string, segments: FlugSegmentManuell[]) => Promise<string | null>
  onUnterkunftZeitraum?: (itemId: string, startsOn: string, endsOn: string) => Promise<string | null>
  onReadinessSetzen?: (eingabe: {
    clientRef: string
    kind: ReadinessKind
    userStatus: ReadinessUserStatus
    countryCode: string | null
    tripItemId: string | null
    title: string | null
  }) => Promise<string | null>
  onReadinessEntfernen?: (clientRef: string) => Promise<string | null>
  onTravellerSetzen?: (eingabe: {
    clientRef: string
    label: string | null
    residenceCountryCode: string | null
    citizenships: Array<{ clientRef?: string; countryCode: string }>
    documents: Array<{
      clientRef?: string
      documentType: TravellerDocumentType
      issuingCountryCode: string | null
      expiresOn: string | null
      citizenshipClientRef: string | null
    }>
  }) => Promise<string | null>
  onTravellerEntfernen?: (clientRef: string) => Promise<string | null>
  registryUebernahme?: React.ReactNode
  officialEvaluations?: OfficialEvaluation[]
  safetyEvaluations?: SafetyEvaluation[]
  seasonalEvaluations?: SeasonalEvaluation[]
  /**
   * Nur für interne Audits: startet mit einem Gap, nicht mit der Suche.
   * Der Produktweg lässt den Parameter weg.
   */
  anfangsBereich?: Arbeitsbereich
}

function sucheMitTag(
  knoten: React.ReactNode,
  tagId: string,
  onTagWechseln: (id: string) => void,
) {
  if (!React.isValidElement(knoten)) return knoten
  return React.cloneElement(
    knoten as React.ReactElement<{ tagId?: string; onTagWechseln?: (id: string) => void }>,
    { tagId, onTagWechseln },
  )
}

function setzeInert(el: HTMLElement | null, verborgen: boolean) {
  if (!el) return
  if (verborgen) el.setAttribute('inert', '')
  else el.removeAttribute('inert')
}

function FlaecheHuelle({
  name,
  verborgen,
  sichtbarKlasse,
  children,
}: {
  name: string
  verborgen: boolean
  sichtbarKlasse?: string
  children: React.ReactNode
}) {
  return (
    <div
      data-arbeitsbereich={name}
      hidden={verborgen}
      className={bereichDarstellungKlasse(verborgen, sichtbarKlasse)}
      ref={(el) => setzeInert(el, verborgen)}
    >
      {children}
    </div>
  )
}

export default function TripWorkspace({
  reise,
  quelle,
  ohneTag = [],
  onPunktAnlegen,
  onPunktBearbeiten,
  onVerbindungAnlegen,
  onPunktEntfernen,
  kopfzeile,
  hinweis,
  aenderung,
  begleiter,
  flugsuche,
  hotelsuche,
  aktivitaetensuche,
  mobilitaetssuche,
  onBuchungsstatus,
  onUnterkunftZeitraum,
  onFlugRouteManuell,
  onReadinessSetzen,
  onReadinessEntfernen,
  onTravellerSetzen,
  onTravellerEntfernen,
  registryUebernahme,
  officialEvaluations,
  safetyEvaluations,
  seasonalEvaluations,
  anfangsBereich,
}: TripWorkspaceProps) {
  const kompakt = React.useSyncExternalStore(
    kompakteAnsichtAbonnieren,
    kompakteAnsichtLesen,
    () => true,
  )
  const weit = React.useSyncExternalStore(weiteAnsichtAbonnieren, weiteAnsichtLesen, () => false)

  const [modus, setModus] = React.useState<WorkspaceModus>(() => modusAusAnfangsBereich(anfangsBereich))
  const [modusBereit, setModusBereit] = React.useState(false)
  const navigationBereitRef = React.useRef(false)
  const [historyEltern, setHistoryEltern] = React.useState<WorkspaceModus | null>(null)
  const backAusstehendRef = React.useRef(false)
  const rueckkehrFokussiertRef = React.useRef(false)
  const [offeneBereiche, setOffeneBereiche] = React.useState<ReadonlySet<PreparationBereichId>>(
    () => new Set(PREPARATION_BEREICHE.map((bereich) => bereich.id)),
  )
  const [preparationAnfrage, setPreparationAnfrage] = React.useState(0)
  const modusTastaturRef = React.useRef(false)
  const vorherModusRef = React.useRef(modus)
  const letzterBereichRef = React.useRef(modus.bereich)
  const [auswahl, setAuswahl] = React.useState<WorkspaceDetailAuswahl>(() =>
    detailAuswahlAusBereich(anfangsBereich),
  )
  const [bestandBesucht, setBestandBesucht] = React.useState<ReadonlySet<DetailDomain>>(() => {
    const start = detailAuswahlAusBereich(anfangsBereich)
    return start.art === 'gap' ? new Set([start.domain]) : new Set()
  })
  const [sucheBesucht, setSucheBesucht] = React.useState<ReadonlySet<DetailDomain>>(new Set())
  const [aktiverTag, setAktiverTag] = React.useState(reise.days[0]?.id ?? '')
  const [aenderungOffen, setAenderungOffen] = React.useState(false)
  const [aenderungBereit, setAenderungBereit] = React.useState(!kompakt)
  const aenderungKnopfRef = React.useRef<HTMLButtonElement>(null)
  const aenderungFeldRef = React.useRef<HTMLDivElement>(null)
  const [begleiterOffen, setBegleiterOffen] = React.useState(false)
  // Erst beim ersten Öffnen eingehängt – auf jedem Gerät. Eine Fläche, die
  // nicht gemountet ist, kann keinen Effekt und keinen Aufruf auslösen.
  const [begleiterBereit, setBegleiterBereit] = React.useState(false)
  const begleiterKnopfRef = React.useRef<HTMLButtonElement>(null)
  const begleiterFeldRef = React.useRef<HTMLDivElement>(null)
  const zurueckRef = React.useRef<HTMLButtonElement>(null)
  const detailFokusRef = React.useRef<HTMLButtonElement>(null)
  const letzterAusloeserRef = React.useRef<HTMLElement | null>(null)
  const vorherOffenRef = React.useRef(false)
  const vorherKompaktRef = React.useRef(kompakt)
  const detailAnkerRef = React.useRef<HTMLDivElement | null>(null)
  const arbeitRef = React.useRef<HTMLDivElement | null>(null)
  const sucheTastaturRef = React.useRef(false)
  const vorherSucheRef = React.useRef(false)
  const oeffnungsArbeitRef = React.useRef<{ rahmen: number; timeout: number } | null>(null)

  const oeffnungsArbeitBeenden = () => {
    const arbeit = oeffnungsArbeitRef.current
    if (!arbeit) return
    window.cancelAnimationFrame(arbeit.rahmen)
    window.clearTimeout(arbeit.timeout)
    oeffnungsArbeitRef.current = null
  }

  const scrollDetailInSicht = (el: HTMLElement | null) => {
    if (!el) return
    const oben = el.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top: Math.max(0, oben - 72), behavior: 'instant' })
  }

  const ungeplantePunkte = ohneTag.length > 0 ? ohneTag : reise.ohneTag
  const bereinigt = detailBereinigen(auswahl, reise, ungeplantePunkte)
  const detailOffen =
    modusBereit &&
    ((modus.ansicht === 'organisieren' && modus.bereich != null && bereinigt.art === 'gap') ||
      (modus.ansicht === 'plan' && bereinigt.art === 'item'))
  const gewaehlterPunktId = bereinigt.art === 'item' ? bereinigt.itemId : undefined

  React.useEffect(() => {
    if (!kompakt) setAenderungBereit(true)
  }, [kompakt])

  React.useLayoutEffect(() => {
    if (!modusBereit) return
    const oeffnet = detailOffen && !vorherOffenRef.current
    const schliesst = !detailOffen && vorherOffenRef.current
    const sichtwechsel = detailOffen && vorherKompaktRef.current !== kompakt

    if (schliesst) {
      oeffnungsArbeitBeenden()
      const ausloeser = letzterAusloeserRef.current
      rueckkehrFokussiertRef.current = false
      if (ausloeser?.isConnected && !ausloeser.closest('[hidden], [inert]') && ausloeser.getClientRects().length > 0) {
        ausloeser.focus()
        rueckkehrFokussiertRef.current = true
      } else {
        const bereich = letzterBereichRef.current
        const knopf = bereich
          ? document.querySelector(`[data-workspace-domain-nav] button[data-bereich="${bereich}"]`)
          : null
        const ziel = knopf instanceof HTMLElement && !knopf.closest('[hidden], [inert]')
          ? knopf : document.querySelector('[data-workspace-modus-heading]')
        if (ziel instanceof HTMLElement) {
          ziel.focus({ preventScroll: true })
          arbeitsflaecheZeigen(ziel)
          rueckkehrFokussiertRef.current = true
        }
      }
    }

    if (oeffnet || sichtwechsel) {
      oeffnungsArbeitBeenden()
      const fokus = kompakt ? zurueckRef.current : detailFokusRef.current
      if (oeffnet) fokus?.focus({ preventScroll: true })
      const ziel = kompakt ? detailAnkerRef.current : fokus
      if (ziel) scrollDetailInSicht(ziel)
      if (kompakt) {
        const rahmen = window.requestAnimationFrame(() => {
          if (detailAnkerRef.current) scrollDetailInSicht(detailAnkerRef.current)
        })
        const timeout = window.setTimeout(() => {
          const heading = document.querySelector('[data-workspace-detail] h2')
          if (heading instanceof HTMLElement) {
            const rand = heading.getBoundingClientRect()
            if (rand.top >= 80 && rand.bottom <= window.innerHeight - 8) return
          }
          const flaeche = document.querySelector('[data-arbeitsbereich="detail"]')
          if (flaeche instanceof HTMLElement) {
            flaeche.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'instant' })
          }
        }, 0)
        oeffnungsArbeitRef.current = { rahmen, timeout }
      } else {
        const rahmen = window.requestAnimationFrame(() => {
          const heading = document.querySelector('[data-workspace-detail] h2')
          if (heading instanceof HTMLElement) arbeitsflaecheZeigen(heading)
        })
        oeffnungsArbeitRef.current = { rahmen, timeout: 0 }
      }
    }

    vorherOffenRef.current = detailOffen
    vorherKompaktRef.current = kompakt
    letzterBereichRef.current = modus.bereich
    return () => {
      oeffnungsArbeitBeenden()
    }
  }, [detailOffen, kompakt, modus.bereich, modusBereit])

  const merkeAusloeser = () => {
    const aktiv = document.activeElement
    letzterAusloeserRef.current = aktiv instanceof HTMLElement ? aktiv : null
  }

  const bereichOffenSetzen = React.useCallback((id: PreparationBereichId, offen: boolean) => {
    setOffeneBereiche((bisher) => {
      if (bisher.has(id) === offen) return bisher
      const next = new Set(bisher)
      if (offen) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const navigationAnwenden = React.useCallback((gelesen: WorkspaceModus, zielFokussieren: boolean, detailErhalten = false) => {
    const naechster = modusFuerReise(gelesen, reise, ungeplantePunkte)
    const elternUrl = historyElternLesen(reise.id)
    setHistoryEltern(elternUrl ? modusAusQuery(new URL(elternUrl, window.location.href).searchParams) : null)
    setModus((bisher) => modusUrl('/', bisher) === modusUrl('/', naechster) ? bisher : { ...naechster, urlAnpassen: false })
    const detail = auswahlAusModus(naechster)
    setAuswahl((bisher) => {
      if (detailErhalten && ((bisher.art === 'gap' && detail.art === 'gap' && bisher.domain === detail.domain) ||
        (bisher.art === 'item' && detail.art === 'item' && bisher.itemId === detail.itemId))) return bisher
      return bisher.art === 'keine' && detail.art === 'keine' ? bisher : detail
    })
    if (naechster.ansicht === 'plan') setAktiverTag(gewaehlterTagId(reise, naechster.tagId ?? ''))
    const domain = detailDomainVon(detail, reise, ungeplantePunkte)
    setBestandBesucht((bisher) => besuchteDomainsErweitern(bisher, domain))
    if (zielFokussieren && naechster.preparationZiel) {
      bereichOffenSetzen(naechster.preparationZiel.bereich, true)
      setPreparationAnfrage((bisher) => bisher + 1)
    }
  }, [reise, ungeplantePunkte, bereichOffenSetzen])

  const modusSetzen = React.useCallback((naechster: WorkspaceModus, art: 'push' | 'replace', child = false) => {
    const validiert = modusFuerReise(naechster, reise, ungeplantePunkte)
    historieSchreiben(reise.id, validiert, art, child ? 'child' : 'root')
    navigationAnwenden(validiert, true)
  }, [reise, ungeplantePunkte, navigationAnwenden])

  const oeffneGap = (domain: DetailDomain, signalId?: string) => {
    merkeAusloeser()
    modusTastaturRef.current = false
    modusSetzen({ ansicht: 'organisieren', bereich: domain, urlAnpassen: false }, 'push', true)
    setAuswahl(gapAuswahl(domain, signalId))
  }

  const oeffneItem = (itemId: string) => {
    if (!itemInReise(reise, ungeplantePunkte, itemId)) return
    merkeAusloeser()
    modusTastaturRef.current = false
    modusSetzen({ ansicht: 'plan', bereich: null, itemId, urlAnpassen: false }, 'push', true)
  }

  const schliessen = React.useCallback(() => {
    if (backAusstehendRef.current) return
    if (historyElternLesen(reise.id)) {
      backAusstehendRef.current = true
      window.history.back()
      return
    }
    modusTastaturRef.current = true
    modusSetzen(detailElternModus(modusFuerReise(modus, reise, ungeplantePunkte)), 'replace')
  }, [reise, modus, ungeplantePunkte, modusSetzen])

  const rueckkehr: WorkspaceRueckkehr = {
    label: bereinigt.art === 'item' || historyEltern?.ansicht === 'plan' ? 'Zum Tagesplan'
      : historyEltern?.ansicht === 'uebersicht' ? 'Zur Übersicht'
        : historyEltern?.ansicht === 'vorbereitung' ? 'Zur Vorbereitung' : 'Zur Organisation',
    ausfuehren: schliessen,
  }

  const tagWechseln = (tagId: string) => {
    if (!reise.days.some((tag) => tag.id === tagId)) return
    setAktiverTag(tagId)
    if (modus.ansicht === 'plan') modusSetzen({ ansicht: 'plan', bereich: null, tagId, urlAnpassen: false }, 'push')
  }

  const preparationOeffnen = (preparationZiel?: PreparationZiel) => {
    modusTastaturRef.current = false
    merkeAusloeser()
    modusSetzen({ ansicht: 'vorbereitung', bereich: null, ...(preparationZiel && { preparationZiel }), urlAnpassen: false }, 'push', true)
  }

  const sucheAusdruecklich = (vonTastatur = false) => {
    sucheTastaturRef.current = vonTastatur
    setAuswahl((bisher) => sucheOeffnen(bisher))
    setSucheBesucht((bisher) =>
      besuchteDomainsErweitern(bisher, detailDomainVon(bereinigt, reise, ungeplantePunkte)),
    )
  }

  const onAttention = (aktion: AttentionAktion) => {
    const ziel = attentionAktionAlsDetail(aktion)
    if (ziel === 'reise') {
      preparationOeffnen(aktion.preparationZiel ?? undefined)
      return
    }
    if (ziel && ziel.art === 'gap') oeffneGap(ziel.domain, ziel.signalId)
  }

  const onModus = (ansicht: WorkspaceAnsicht, tastatur: boolean) => {
    modusTastaturRef.current = tastatur
    const tagId = ansicht === 'plan' ? gewaehlterTagId(reise, aktiverTag) : ''
    modusSetzen({ ansicht, bereich: null, ...(tagId && { tagId }), urlAnpassen: false }, 'push')
  }

  React.useLayoutEffect(() => {
    const anwenden = (art: 'mount' | 'pop' | 'graph') => {
      const params = new URLSearchParams(window.location.search)
      const besitzt = WORKSPACE_QUERY_KEYS.some((key) => params.has(key))
      const roh = art === 'mount' && !besitzt && anfangsBereich
        ? modusAusAnfangsBereich(anfangsBereich) : modusAusQuery(params)
      const gelesen = modusFuerReise(roh, reise, ungeplantePunkte)
      if (art === 'pop') {
        backAusstehendRef.current = false
        modusTastaturRef.current = true
      }
      // Nur replace zur Kanonisierung; popstate erzeugt niemals einen Push.
      historieSchreiben(reise.id, gelesen, 'replace', 'canonical')
      navigationAnwenden(gelesen, art !== 'graph', art === 'graph')
    }
    anwenden(navigationBereitRef.current ? 'graph' : 'mount')
    navigationBereitRef.current = true
    setModusBereit(true)
    const onPop = () => anwenden('pop')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [navigationAnwenden, anfangsBereich, reise, ungeplantePunkte])

  const aenderungOeffnen = () => {
    const naechster = !aenderungOffen
    setAenderungOffen(naechster)
    if (naechster) setAenderungBereit(true)
  }

  React.useEffect(() => {
    if (!aenderungOffen) return
    const feld = aenderungFeldRef.current?.querySelector<HTMLTextAreaElement>('textarea')
    feld?.focus()
  }, [aenderungOffen])

  const begleiterOeffnen = () => {
    const naechster = !begleiterOffen
    setBegleiterOffen(naechster)
    if (naechster) setBegleiterBereit(true)
  }

  React.useEffect(() => {
    if (!begleiterOffen) return
    const feld = begleiterFeldRef.current?.querySelector<HTMLTextAreaElement>('textarea')
    feld?.focus()
  }, [begleiterOffen])

  const aenderungSichtbar = aenderungIstSichtbar(aenderungOffen)
  const begleiterSichtbar = begleiterIstSichtbar(begleiterOffen)
  const uebersicht = uebersichtAbleiten(reise, ungeplantePunkte, heutigesDatum())
  const destinationEssentials = destinationEssentialsAbleiten({
    reise,
    officialEvaluations,
    safetyEvaluations,
    seasonalEvaluations,
  })
  const attention = attentionAbleiten({
    reise,
    ohneTag: ungeplantePunkte,
    safetyEvaluations,
    seasonalEvaluations,
    officialEvaluations,
  })
  const aktivitaeten = sucheMitTag(aktivitaetensuche, aktiverTag, tagWechseln)
  const gap = bereinigt.art === 'gap' ? gapDetailAbleiten(reise, ungeplantePunkte, bereinigt.domain) : null
  const item = bereinigt.art === 'item' ? itemDetailAbleiten(reise, ungeplantePunkte, bereinigt.itemId) : null
  const aktiveDomain = detailDomainVon(bereinigt, reise, ungeplantePunkte)
  const detailVerborgen = !detailOffen
  const domainNavSichtbar = modusBereit && modus.ansicht === 'organisieren' && !(kompakt && detailOffen)

  const sicherheit = <ReiseSicherheit reise={reise} evaluations={safetyEvaluations} />
  const reisezeit = <ReisezeitHinweise reise={reise} evaluations={seasonalEvaluations} />

  const vorbereitung = (
    <Reisevorbereitung
      reise={reise}
      officialEvaluations={officialEvaluations}
      onSetzen={onReadinessSetzen}
      onEntfernen={onReadinessEntfernen}
      onTravellerSetzen={onTravellerSetzen}
      onTravellerEntfernen={onTravellerEntfernen}
      registryUebernahme={registryUebernahme}
      offeneBereiche={offeneBereiche}
      onBereichOffen={bereichOffenSetzen}
      onZiel={(bereich) => preparationOeffnen({ bereich })}
    />
  )

  const plan = (
    <TripWorkspacePlan
      reise={reise}
      ohneTag={ungeplantePunkte}
      aktiverTag={aktiverTag}
      kompakt={kompakt}
      eingebettet
      onTagWechseln={tagWechseln}
      onPunktAnlegen={onPunktAnlegen}
      onPunktBearbeiten={onPunktBearbeiten}
      readinessItems={readinessAnsicht({...reise, ohneTag: ungeplantePunkte}, officialEvaluations).items}
      onPreparation={preparationOeffnen}
      onVerbindungAnlegen={onVerbindungAnlegen}
      onPunktEntfernen={onPunktEntfernen}
      onPunktOeffnen={oeffneItem}
      gewaehlterPunktId={gewaehlterPunktId}
    />
  )

  const aenderungFeld = aenderungBereit && aenderung && (
    <div
      id="reise-aenderung"
      hidden={!aenderungSichtbar}
      ref={(el) => {
        aenderungFeldRef.current = el
        setzeInert(el, !aenderungSichtbar)
      }}
      onKeyDown={(ereignis) => {
        if (ereignis.key !== 'Escape' || !aenderungOffen) return
        ereignis.stopPropagation()
        setAenderungOffen(false)
        aenderungKnopfRef.current?.focus()
      }}
    >
      {aenderung}
    </div>
  )

  const begleiterFeld = begleiterBereit && begleiter && (
    <div
      id="reisebegleiter"
      hidden={!begleiterSichtbar}
      ref={(el) => {
        begleiterFeldRef.current = el
        setzeInert(el, !begleiterSichtbar)
      }}
      onKeyDown={(ereignis) => {
        if (ereignis.key !== 'Escape' || !begleiterOffen) return
        ereignis.stopPropagation()
        setBegleiterOffen(false)
        begleiterKnopfRef.current?.focus()
      }}
    >
      {begleiter}
    </div>
  )

  const flugBestandBereit = bestandSollMounten('fluege', bereinigt, bestandBesucht, reise, ungeplantePunkte)
  const hotelBestandBereit = bestandSollMounten('unterkunft', bereinigt, bestandBesucht, reise, ungeplantePunkte)
  const mobilitaetBereit = bestandSollMounten('mobilitaet', bereinigt, bestandBesucht, reise, ungeplantePunkte)
  const flugSucheBereit = sucheSollMounten('fluege', bereinigt, sucheBesucht, reise, ungeplantePunkte)
  const hotelSucheBereit = sucheSollMounten('unterkunft', bereinigt, sucheBesucht, reise, ungeplantePunkte)
  const aktivitaetenSucheBereit = sucheSollMounten('aktivitaeten', bereinigt, sucheBesucht, reise, ungeplantePunkte)

  const sucheSichtbar = sucheIstOffen(bereinigt)
  const anordnung = domainAnordnung({
    kompakt,
    detailOffen: modus.ansicht === 'organisieren' && modus.bereich != null && detailOffen,
    weit,
  })
  const rasterKlasse = domainRasterKlasse(anordnung, sucheSichtbar)

  React.useEffect(() => {
    if (!detailOffen && !(modus.ansicht === 'vorbereitung' && historyEltern)) return
    const zu = (ereignis: KeyboardEvent) => {
      if (ereignis.key !== 'Escape' || ereignis.defaultPrevented) return
      const ziel = ereignis.target
      if (ziel instanceof Element && ziel.closest('#reise-aenderung, #reisebegleiter')) return
      ereignis.preventDefault()
      schliessen()
    }
    window.addEventListener('keydown', zu)
    return () => window.removeEventListener('keydown', zu)
  }, [detailOffen, schliessen, modus.ansicht, historyEltern])

  const detailSchluessel =
    bereinigt.art === 'item' ? bereinigt.itemId : bereinigt.art === 'gap' ? bereinigt.domain : ''

  React.useEffect(() => {
    if (!detailSchluessel) return
    const heading = document.querySelector('[data-workspace-detail] h2')
    if (heading instanceof HTMLElement) arbeitsflaecheZeigen(heading)
  }, [detailSchluessel])

  React.useLayoutEffect(() => {
    const oeffnetSuche = sucheSichtbar && !vorherSucheRef.current
    vorherSucheRef.current = sucheSichtbar
    if (!oeffnetSuche) return
    const tastatur = sucheTastaturRef.current
    sucheTastaturRef.current = false
    const flaeche = sichtbareSuchflaeche(arbeitRef.current)
    const heading = flaeche?.querySelector('h2')
    if (heading instanceof HTMLElement) arbeitsflaecheZeigen(heading)
    if (!tastatur || !flaeche) return
    const feld = flaeche.querySelector<HTMLElement>('input:not([type="hidden"]), select, textarea')
    feld?.focus({ preventScroll: true })
  }, [sucheSichtbar])

  React.useLayoutEffect(() => {
    if (!modusBereit) return
    const vorher = vorherModusRef.current
    const geaendert = vorher.ansicht !== modus.ansicht || vorher.bereich !== modus.bereich
    vorherModusRef.current = modus
    if (rueckkehrFokussiertRef.current) {
      rueckkehrFokussiertRef.current = false
      modusTastaturRef.current = false
      return
    }
    if (!geaendert) return
    if (vorher.ansicht === 'vorbereitung' && modus.ansicht === 'plan') {
      const trigger = letzterAusloeserRef.current
      if (trigger?.isConnected && trigger.getClientRects().length && !trigger.closest('[hidden], [inert]')) {
        trigger.focus({ preventScroll: true }); arbeitsflaecheZeigen(trigger); return
      }
    }
    const tastatur = modusTastaturRef.current
    modusTastaturRef.current = false
    if (modus.ansicht === 'organisieren' && modus.bereich) return
    if (modus.ansicht === 'plan' && detailOffen) return
    const heading = document.querySelector('[data-workspace-modus-heading]')
    if (!(heading instanceof HTMLElement)) return
    arbeitsflaecheZeigen(heading)
    if (tastatur) heading.focus({ preventScroll: true })
  }, [modus, modusBereit, detailOffen])

  React.useLayoutEffect(() => {
    if (!modusBereit || modus.ansicht !== 'vorbereitung' || !modus.preparationZiel || !preparationAnfrage) return
    const ziel = modus.preparationZiel
    const bereich = document.querySelector<HTMLDetailsElement>(`[data-preparation-section="${ziel.bereich}"]`)
    if (!bereich?.open) return
    // Exakter DOM-Attributvergleich statt CSS-/ID-Semantik aus einer opaken Ref.
    const karte = ziel.travellerClientRef
      ? [...bereich.querySelectorAll<HTMLElement>('[data-preparation-traveller]')].find(
        (el) => el.dataset.preparationTraveller === ziel.travellerClientRef,
      ) : null
    const fokus = karte?.querySelector<HTMLElement>('h5') ?? bereich.querySelector<HTMLElement>('[data-preparation-heading]')
    if (!fokus) return
    fokus.focus({ preventScroll: true })
    arbeitsflaecheZeigen(fokus)
  }, [modus, modusBereit, preparationAnfrage])

  return (
    <main data-workspace-premium="3" className="min-h-screen bg-surface-75 pb-20 [overflow-anchor:none]">
      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-10">
        <Link
          href="/reisen"
          className="-ml-2 inline-flex min-h-11 items-center gap-2 px-2 text-sm font-medium text-ink-800 transition hover:text-brand-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Meine Reisen
        </Link>

        {hinweis}

        <TripWorkspaceKopf
          reise={reise}
          quelle={quelle}
          kompakt={kompakt}
          uebersicht={uebersicht}
          kopfzeile={kopfzeile}
        />

        {modusBereit ? (
          <div data-workspace-ansicht={modus.ansicht} data-workspace-bereich={modus.bereich ?? ''}>
            <TripWorkspaceModeNavigation
              ansicht={modus.ansicht}
              kompakt={kompakt}
              detailOffen={detailOffen}
              onWechsel={onModus}
            />
            <TripWorkspaceAktionen
              aenderungOffen={aenderungOffen}
              begleiterOffen={begleiterOffen}
              begleiterVorhanden={begleiter != null}
              onAenderung={aenderungOeffnen}
              onBegleiter={begleiterOeffnen}
              aenderungKnopfRef={aenderungKnopfRef}
              begleiterKnopfRef={begleiterKnopfRef}
            />
            {aenderungFeld}
            {begleiterFeld}
          </div>
        ) : (
          <div
            data-workspace-modus-ausstehend=""
            role="status"
            aria-live="polite"
            aria-busy="true"
            inert
            className="mt-6 text-sm leading-6 text-ink-800"
          >
            Die Reiseansicht wird vorbereitet.
          </div>
        )}

        {kompakt && detailOffen ? (
          <div
            ref={detailAnkerRef}
            data-workspace-detail-anker="ein"
            aria-hidden="true"
            className="h-px scroll-mt-[calc(72px+env(safe-area-inset-top))]"
          />
        ) : null}

        <TripWorkspaceNavigation sichtbar={kompakt && detailOffen} rueckkehr={rueckkehr} zurueckRef={zurueckRef} />

        <div className={rasterKlasse} data-workspace-split={anordnung}>
          {modusBereit && modus.ansicht === 'uebersicht' ? (
            <FlaecheHuelle name="uebersicht" verborgen={false}>
              <TripWorkspaceUebersicht
                reise={reise}
                uebersicht={uebersicht}
                attention={attention}
                destinationEssentials={destinationEssentials}
                onLuecke={oeffneGap}
                onAttention={onAttention}
              />
            </FlaecheHuelle>
          ) : null}

          {modusBereit && modus.ansicht === 'plan' ? (
            <section aria-labelledby="workspace-plan-titel" className="mt-4 min-w-0" data-workspace-modus="plan">
              <h2
                id="workspace-plan-titel"
                tabIndex={-1}
                data-workspace-modus-heading
                className="text-xl font-semibold tracking-[-0.03em] text-brand-800 outline-none"
              >
                Reiseplan
              </h2>
              {plan}
            </section>
          ) : null}

          {domainNavSichtbar ? (
            <section aria-labelledby="workspace-organisieren-titel" className="mt-4 min-w-0" data-workspace-modus="organisieren">
              <h2
                id="workspace-organisieren-titel"
                tabIndex={-1}
                data-workspace-modus-heading
                className="text-xl font-semibold tracking-[-0.03em] text-brand-800 outline-none"
              >
                Organisieren
              </h2>
              <p className="mt-1 text-sm leading-6 text-ink-800">
                Wähle einen Bereich. Eine Suche startet erst, wenn du sie ausdrücklich öffnest.
              </p>
              <div className="mt-4">
                <TripWorkspaceDomainNavigation
                  abdeckungen={uebersicht.abdeckungen}
                  aktiv={modus.bereich}
                  onWaehlen={(domain) => oeffneGap(domain)}
                />
              </div>
            </section>
          ) : null}

          {modusBereit && modus.ansicht === 'vorbereitung' ? (
            <section
              aria-labelledby="workspace-vorbereitung-titel"
              className="mt-4 grid min-w-0 gap-4"
              data-workspace-modus="vorbereitung"
            >
              <h2
                id="workspace-vorbereitung-titel"
                tabIndex={-1}
                data-workspace-modus-heading
                className="text-xl font-semibold tracking-[-0.03em] text-brand-800 outline-none"
              >
                Vorbereitung
              </h2>
              {historyEltern && <button type="button" onClick={schliessen}
                className="my-3 min-h-11 rounded-full border border-line-300 px-4 text-sm font-semibold text-brand-800 focus-visible:ring-4 focus-visible:ring-brand-600/15">
                {rueckkehr.label}
              </button>}
              {sicherheit}
              {reisezeit}
              {vorbereitung}
            </section>
          ) : null}

          <div
            data-workspace-active-domain={detailOffen ? (aktiveDomain ?? 'offen') : 'aus'}
            data-workspace-anordnung={anordnung}
            hidden={!detailOffen}
            className="min-w-0"
            ref={(el) => setzeInert(el, !detailOffen)}
            onKeyDown={(ereignis) => {
              if (ereignis.key !== 'Escape' || !detailOffen) return
              ereignis.stopPropagation()
              schliessen()
            }}
          >
            <FlaecheHuelle
              name="detail"
              verborgen={detailVerborgen}
              sichtbarKlasse="min-w-0 scroll-mt-[calc(72px+3.75rem)]"
            >
              {detailOffen ? (
                <TripWorkspaceDetail
                  auswahl={bereinigt}
                  gap={gap}
                  item={item}
                  kompakt={kompakt}
                  rueckkehr={rueckkehr}
                  onSuche={sucheAusdruecklich}
                  fokusRef={detailFokusRef}
                />
              ) : null}
            </FlaecheHuelle>
            <div
              ref={arbeitRef}
              data-workspace-arbeit={detailOffen ? 'ein' : 'aus'}
              hidden={!detailOffen}
              className={detailOffen ? 'mt-4 grid min-w-0 gap-4' : undefined}
            >
              {flugBestandBereit && (
          <FlaecheHuelle
            name="fluege"
            verborgen={!detailOffen || aktiveDomain !== 'fluege'}
            sichtbarKlasse="grid gap-6"
          >
            <FlugBestand reise={reise} ohneTag={ungeplantePunkte} onBuchungsstatus={onBuchungsstatus} onFlugRouteManuell={onFlugRouteManuell} />
          </FlaecheHuelle>
        )}
        {hotelBestandBereit && (
          <FlaecheHuelle
            name="unterkunft"
            verborgen={!detailOffen || aktiveDomain !== 'unterkunft'}
            sichtbarKlasse="grid gap-6"
          >
            <UnterkunftBestand reise={reise} ohneTag={ungeplantePunkte} onBuchungsstatus={onBuchungsstatus} onUnterkunftZeitraum={onUnterkunftZeitraum} />
          </FlaecheHuelle>
        )}
        {mobilitaetBereit && mobilitaetssuche && (
          <FlaecheHuelle
            name="mobilitaet"
            verborgen={!detailOffen || aktiveDomain !== 'mobilitaet'}
            sichtbarKlasse="min-w-0"
          >
            {mobilitaetssuche}
          </FlaecheHuelle>
        )}
        {flugSucheBereit && flugsuche && (
          <FlaecheHuelle
            name="flugsuche"
            verborgen={!detailOffen || aktiveDomain !== 'fluege' || !sucheSichtbar}
            sichtbarKlasse="min-w-0"
          >
            {flugsuche}
          </FlaecheHuelle>
        )}
        {hotelSucheBereit && hotelsuche && (
          <FlaecheHuelle
            name="hotelsuche"
            verborgen={!detailOffen || aktiveDomain !== 'unterkunft' || !sucheSichtbar}
            sichtbarKlasse="min-w-0"
          >
            {hotelsuche}
          </FlaecheHuelle>
        )}
        {aktivitaetenSucheBereit && aktivitaeten && (
          <FlaecheHuelle
            name="aktivitaeten"
            verborgen={!detailOffen || aktiveDomain !== 'aktivitaeten' || !sucheSichtbar}
            sichtbarKlasse="min-w-0"
          >
            {aktivitaeten}
          </FlaecheHuelle>
        )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
