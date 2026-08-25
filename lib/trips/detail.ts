// lib/trips/detail.ts
//
// TW-5 Item- und Gap-Details. Workspace-lokaler Presentation-State
// (ADR-0167). Keine Persistenz, keine kopierte Hard Truth, keine
// zweite Coverage-/Attention-/Booking-Ableitung.
//
// Der State trägt nur Referenzen und UI-Intent. Fachinhalte werden
// bei Renderzeit aus dem vorhandenen Trip-Graphen und den bestehenden
// Domain-Ableitungen gelesen. Guest und Account nutzen dieselbe Logik.

import { mobilitaetsAbdeckung } from '@/lib/mobility/kanten'
import { BUCHUNGSSTATUS_BEZEICHNUNG } from '@/lib/trips/buchung'
import {
  bereichStatus,
  planpunkteSammeln,
  type BereichLage,
} from '@/lib/trips/arbeitsbereich'
import type { AttentionAktion } from '@/lib/trips/attention'
import type { Trip, TripItem, TripItemKind } from '@/types/trips'

const DETAIL_DOMAINS = ['fluege', 'unterkunft', 'aktivitaeten', 'mobilitaet'] as const
export type DetailDomain = (typeof DETAIL_DOMAINS)[number]

export type WorkspaceDetailAuswahl =
  | { art: 'keine' }
  | {
      art: 'gap'
      domain: DetailDomain
      signalId?: string
      sucheOffen: boolean
    }
  | {
      art: 'item'
      itemId: string
      sucheOffen: boolean
    }

const LEERE_DETAIL_AUSWAHL: WorkspaceDetailAuswahl = { art: 'keine' }

export const DETAIL_SUCHE_BEZEICHNUNG: Record<DetailDomain, string> = {
  fluege: 'Flug suchen',
  unterkunft: 'Unterkunft suchen',
  aktivitaeten: 'Aktivitäten suchen',
  mobilitaet: 'Verbindungen prüfen',
}

export const DETAIL_LAGE_TEXT: Record<BereichLage, string> = {
  offen: 'Offen',
  teilweise: 'Teilweise',
  belegt: 'Belegt',
  unbestimmt: 'Noch nicht bestimmbar',
}

export type ItemTrust = 'notiz' | 'manuell' | 'manuell-gebucht' | 'herkunft-vorhanden'

export type GapDetailAbleitung = {
  domain: DetailDomain
  lage: BereichLage
  text: string
  istPflichtLuecke: boolean
  coveredByFlight: boolean
  sucheAnbietbar: boolean
  naechsterSchritt: string
}

export type ItemDetailAbleitung = {
  itemId: string
  kind: TripItemKind
  title: string
  note: string | null
  dayId: string | null
  stageId: string | null
  ungeplant: boolean
  startsAt: string | null
  startsOn: string | null
  endsOn: string | null
  bookingStatus: TripItem['bookingStatus']
  bookingStatusText: string
  priceAmount: number | null
  priceCurrency: string | null
  trust: ItemTrust
  trustText: string
  domain: DetailDomain | null
  sucheAnbietbar: boolean
}

const KIND_DOMAIN: Record<TripItemKind, DetailDomain | null> = {
  flight: 'fluege',
  stay: 'unterkunft',
  activity: 'aktivitaeten',
  transfer: 'mobilitaet',
  rental_car: 'mobilitaet',
  note: null,
}

const TRUST_TEXT: Record<ItemTrust, string> = {
  notiz: 'Persönliche Notiz. Kein Buchungs- oder Anbieterkontext.',
  manuell: 'Manuell erfasst. Das ist kein nachgewiesenes Anbieterangebot.',
  'manuell-gebucht': 'Von dir als gebucht bestätigt. Keine Provider-Bestätigung.',
  'herkunft-vorhanden':
    'Es liegen gespeicherte Herkunftsfelder vor. Das ist kein geprüfter Live-Nachweis.',
}

function istDetailDomain(wert: string): wert is DetailDomain {
  return (DETAIL_DOMAINS as readonly string[]).includes(wert)
}

export function detailDomainFuerKind(kind: TripItemKind): DetailDomain | null {
  return KIND_DOMAIN[kind]
}

export function leereDetailAuswahl(): WorkspaceDetailAuswahl {
  return LEERE_DETAIL_AUSWAHL
}

export function gapAuswahl(
  domain: DetailDomain,
  signalId?: string,
  sucheOffen = false,
): WorkspaceDetailAuswahl {
  return signalId
    ? { art: 'gap', domain, signalId, sucheOffen }
    : { art: 'gap', domain, sucheOffen }
}

export function itemAuswahl(itemId: string, sucheOffen = false): WorkspaceDetailAuswahl {
  return { art: 'item', itemId, sucheOffen }
}

/**
 * Audit-/Übergangsstart. Ein historischer Domain-Bereich öffnet das Gap,
 * nicht die Suche. Die Produktansicht startet ohne Detail.
 */
export function detailAuswahlAusBereich(wert: string | null | undefined): WorkspaceDetailAuswahl {
  if (wert && istDetailDomain(wert)) return gapAuswahl(wert)
  return LEERE_DETAIL_AUSWAHL
}

export function itemInReise(
  reise: Trip,
  ohneTag: readonly TripItem[],
  itemId: string,
): TripItem | null {
  return planpunkteSammeln(reise, ohneTag).find((punkt) => punkt.id === itemId) ?? null
}

export function detailDomainVon(auswahl: WorkspaceDetailAuswahl, reise?: Trip, ohneTag: readonly TripItem[] = []): DetailDomain | null {
  if (auswahl.art === 'gap') return auswahl.domain
  if (auswahl.art !== 'item') return null
  if (!reise) return null
  const punkt = itemInReise(reise, ohneTag, auswahl.itemId)
  return punkt ? detailDomainFuerKind(punkt.kind) : null
}

/**
 * Tote Item-Refs fallen auf die Reiseoberfläche. Gap-Refs bleiben gültig,
 * weil ihre Inhalte bei Renderzeit neu aus dem Graphen gelesen werden.
 */
export function detailBereinigen(
  auswahl: WorkspaceDetailAuswahl,
  reise: Trip,
  ohneTag: readonly TripItem[] = [],
): WorkspaceDetailAuswahl {
  if (auswahl.art === 'keine') return auswahl
  if (auswahl.art === 'gap') return auswahl
  return itemInReise(reise, ohneTag, auswahl.itemId) ? auswahl : LEERE_DETAIL_AUSWAHL
}

export function sucheIstOffen(auswahl: WorkspaceDetailAuswahl): boolean {
  return auswahl.art !== 'keine' && auswahl.sucheOffen
}

export function sucheOeffnen(auswahl: WorkspaceDetailAuswahl): WorkspaceDetailAuswahl {
  if (auswahl.art === 'keine') return auswahl
  return { ...auswahl, sucheOffen: true }
}

export function sucheSollMounten(
  domain: DetailDomain,
  auswahl: WorkspaceDetailAuswahl,
  bereitsBesucht: ReadonlySet<DetailDomain>,
  reise?: Trip,
  ohneTag: readonly TripItem[] = [],
): boolean {
  if (bereitsBesucht.has(domain)) return true
  if (!sucheIstOffen(auswahl)) return false
  return detailDomainVon(auswahl, reise, ohneTag) === domain
}

export function bestandSollMounten(
  domain: DetailDomain,
  auswahl: WorkspaceDetailAuswahl,
  bereitsBesucht: ReadonlySet<DetailDomain>,
  reise?: Trip,
  ohneTag: readonly TripItem[] = [],
): boolean {
  if (bereitsBesucht.has(domain)) return true
  return detailDomainVon(auswahl, reise, ohneTag) === domain
}

export function besuchteDomainsErweitern(
  bisher: ReadonlySet<DetailDomain>,
  naechste: DetailDomain | null,
): ReadonlySet<DetailDomain> {
  if (!naechste || bisher.has(naechste)) return bisher
  return new Set([...bisher, naechste])
}

/**
 * Interpretiert die bestehende TW-4-Attention-Aktion workspace-lokal.
 * Official/Readiness bleiben auf der Reiseoberfläche. Coverage-Flight/Stay
 * öffnen ihr Gap. Safety/Seasonal ohne Aktion bleiben ohne erfundene Aktion.
 */
export function attentionAktionAlsDetail(aktion: AttentionAktion | null): WorkspaceDetailAuswahl | 'reise' | null {
  if (!aktion) return null
  if (aktion.bereich === 'uebersicht') return 'reise'
  if (istDetailDomain(aktion.bereich)) return gapAuswahl(aktion.bereich)
  return 'reise'
}

export function gapDetailAbleiten(
  reise: Trip,
  ohneTag: readonly TripItem[],
  domain: DetailDomain,
): GapDetailAbleitung {
  const status = bereichStatus(reise, ohneTag).find((eintrag) => eintrag.bereich === domain)
  const lage = status?.lage ?? 'unbestimmt'
  const text = status?.text ?? 'Lage noch nicht bestimmbar'
  const coveredByFlight = domain === 'mobilitaet' && mobilityNurDurchFlug(reise, ohneTag)
  const istPflichtLuecke = domain !== 'aktivitaeten' && lage !== 'belegt' && !coveredByFlight

  return {
    domain,
    lage,
    text,
    istPflichtLuecke,
    coveredByFlight,
    sucheAnbietbar: domain !== 'mobilitaet',
    naechsterSchritt: gapNaechsterSchritt(domain, lage, istPflichtLuecke, coveredByFlight),
  }
}

export function itemDetailAbleiten(
  reise: Trip,
  ohneTag: readonly TripItem[],
  itemId: string,
): ItemDetailAbleitung | null {
  const punkt = itemInReise(reise, ohneTag, itemId)
  if (!punkt) return null

  const tagExistiert = Boolean(punkt.dayId && reise.days.some((tag) => tag.id === punkt.dayId))
  const etappeExistiert = Boolean(
    punkt.stageId && reise.stages.some((etappe) => etappe.id === punkt.stageId),
  )
  const domain = detailDomainFuerKind(punkt.kind)
  const trust = itemTrust(punkt)

  return {
    itemId: punkt.id,
    kind: punkt.kind,
    title: punkt.title,
    note: punkt.note,
    dayId: tagExistiert ? punkt.dayId : null,
    stageId: etappeExistiert ? punkt.stageId : null,
    ungeplant: !tagExistiert,
    startsAt: punkt.startsAt,
    startsOn: punkt.startsOn,
    endsOn: punkt.endsOn,
    bookingStatus: punkt.bookingStatus,
    bookingStatusText: BUCHUNGSSTATUS_BEZEICHNUNG[punkt.bookingStatus],
    priceAmount: punkt.priceAmount,
    priceCurrency: punkt.priceCurrency,
    trust,
    trustText: TRUST_TEXT[trust],
    domain,
    sucheAnbietbar: domain !== null && domain !== 'mobilitaet',
  }
}

export function itemTrust(punkt: Pick<TripItem, 'kind' | 'provider' | 'externalRef' | 'bookingUrl' | 'bookingStatus'>): ItemTrust {
  if (punkt.kind === 'note') return 'notiz'
  if (punkt.provider || punkt.externalRef || punkt.bookingUrl) return 'herkunft-vorhanden'
  if (punkt.bookingStatus === 'booked') return 'manuell-gebucht'
  return 'manuell'
}

function mobilityNurDurchFlug(reise: Trip, ohneTag: readonly TripItem[]): boolean {
  const abdeckung = mobilitaetsAbdeckung(reise, ohneTag)
  if (!abdeckung.bestimmbar || abdeckung.kanten.length === 0) return false
  return abdeckung.kanten.every((kante) => kante.status === 'covered_by_flight')
}

function gapNaechsterSchritt(
  domain: DetailDomain,
  lage: BereichLage,
  istPflichtLuecke: boolean,
  coveredByFlight: boolean,
): string {
  if (domain === 'aktivitaeten') {
    return 'Aktivitäten sind optional. Eine Suche startet erst, wenn du sie ausdrücklich öffnest.'
  }
  if (coveredByFlight) {
    return 'Diese Verbindung ist durch einen vorhandenen Flug abgedeckt. Das ist keine offene Bodenmobilitätslücke.'
  }
  if (lage === 'unbestimmt') {
    return 'Die Lage ist noch nicht vollständig bestimmbar. Es wird kein fehlender Anbieter erfunden.'
  }
  if (lage === 'belegt') {
    return 'Der vorhandene Bestand kann geprüft werden. Eine Suche startet erst nach ausdrücklicher Aktion.'
  }
  if (domain === 'mobilitaet') {
    return istPflichtLuecke
      ? 'Vorhandene Verbindungen und manuelle Erfassung bleiben ehrlich. Es gibt keinen Live-Mobilitätsadapter.'
      : 'Mobilität kann optional ergänzt werden. Kein Live-Adapter wird vorgetäuscht.'
  }
  return 'Du kannst den vorhandenen Bestand prüfen oder eine Suche ausdrücklich öffnen.'
}
