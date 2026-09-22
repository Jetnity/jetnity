// lib/places/route-einstieg.ts
//
// Provider-unabhängiger bestätigter Routeneinstieg.
// Transient Navigation Input, keine zweite Persistenz und keine
// natürliche-Sprache-Interpretation. Duplikate und Reihenfolge bleiben.

import { auswahlFehlt, zielHrefAusListe, type OrtAuswahl } from '@/lib/places/auswahl'
import { istOrtId, type Ort } from '@/lib/places/domain'
import { ORT_MELDUNG } from '@/lib/places/pruefen'
import { reisezielIdsLesen, reisezieleAusBestand } from '@/lib/places/reiseziele'
import { GRENZEN } from '@/lib/trips/schema'

export const ROUTE_EINSTIEG_KEY = 'zielIds' as const
export const ROUTE_TRANSPORT_MAX = 8192
export const ROUTE_EINTRAG_MAX = 64

export const ROUTE_EINSTIEG_MELDUNG = {
  konflikt:
    'Diese Routenangabe vermischt einzelne und mehrere Ziele. Bitte starte die Auswahl neu.',
  leer: 'Diese Routenangabe enthält kein bestätigtes Reiseziel.',
  zuGross: 'Diese Routenangabe ist zu umfangreich.',
  zuViele: `Höchstens ${GRENZEN.etappenJeReise} Reiseziele sind möglich.`,
  ungueltig: ORT_MELDUNG.zielUnbekannt,
  unvollstaendig:
    'Mindestens ein Reiseziel dieser Route konnte nicht bestätigt werden. Es wurde keine Teilroute übernommen.',
  ausfall:
    'Die Reiseziele konnten gerade nicht bestätigt werden. Es wurde keine Teilroute übernommen.',
  pending:
    'Bitte wähle das Ziel aus der Liste oder verwirf den unbestätigten Text.',
  fehlt: ORT_MELDUNG.zielFehlt,
} as const

export type RouteVorkommen = {
  key: string
  ort: OrtAuswahl | null
  text: string
}

export type RouteEinstiegLesen =
  | { art: 'kein' }
  | { art: 'konflikt'; meldung: string }
  | {
      art: 'transport_ungueltig'
      grund: 'leer' | 'zuGross' | 'zuViele' | 'ungueltig'
      meldung: string
    }
  | { art: 'ok'; ids: string[] }

export type RouteZieleBestaetigung =
  | { art: 'bestaetigt'; ziele: Ort[] }
  | { art: 'ausfall'; meldung: string }
  | { art: 'unbestaetigt'; meldung: string; zielIndex?: number }

export type RouteAbsenden =
  | { ok: true; ziele: OrtAuswahl[] }
  | { ok: false; meldung: string }

type PlanenParams = Record<string, string | string[] | undefined> | null | undefined

function hatRouteEinstiegKey(params: PlanenParams): boolean {
  return Boolean(params && Object.hasOwn(params, ROUTE_EINSTIEG_KEY))
}

function routeParamWerte(wert: string | string[] | undefined): string[] {
  if (wert === undefined) return []
  return Array.isArray(wert) ? wert.map((eintrag) => String(eintrag)) : [String(wert)]
}

function transportLaenge(werte: string[]): number {
  if (werte.length === 0) return ROUTE_EINSTIEG_KEY.length
  return werte.reduce((summe, wert, index) => {
    const trenner = index === 0 ? `${ROUTE_EINSTIEG_KEY}=` : `&${ROUTE_EINSTIEG_KEY}=`
    return summe + trenner.length + encodeURIComponent(wert).length
  }, 0)
}

function hatLegacyZiel(params: PlanenParams): boolean {
  if (!params) return false
  return Object.hasOwn(params, 'zielId') || Object.hasOwn(params, 'ziel')
}

/**
 * Liest nur den Transport. Keine Ortsabfrage, kein Filtern, kein Deduplizieren.
 * `zielIds` schaltet in den Routenmodus. Gleichzeitiges zielId/ziel ist Konflikt.
 */
export function routeEinstiegAusParams(params: PlanenParams): RouteEinstiegLesen {
  if (!hatRouteEinstiegKey(params)) return { art: 'kein' }
  if (hatLegacyZiel(params)) {
    return { art: 'konflikt', meldung: ROUTE_EINSTIEG_MELDUNG.konflikt }
  }

  const werte = routeParamWerte(params?.[ROUTE_EINSTIEG_KEY])
  if (transportLaenge(werte) > ROUTE_TRANSPORT_MAX) {
    return { art: 'transport_ungueltig', grund: 'zuGross', meldung: ROUTE_EINSTIEG_MELDUNG.zuGross }
  }
  if (werte.length === 0 || werte.every((wert) => wert.trim() === '')) {
    return { art: 'transport_ungueltig', grund: 'leer', meldung: ROUTE_EINSTIEG_MELDUNG.leer }
  }
  if (werte.length > GRENZEN.etappenJeReise) {
    return { art: 'transport_ungueltig', grund: 'zuViele', meldung: ROUTE_EINSTIEG_MELDUNG.zuViele }
  }
  if (werte.some((wert) => wert.length > ROUTE_EINTRAG_MAX)) {
    return { art: 'transport_ungueltig', grund: 'zuGross', meldung: ROUTE_EINSTIEG_MELDUNG.zuGross }
  }

  const [erste, ...weitere] = werte
  const gelesen = reisezielIdsLesen(erste, weitere)
  if (!gelesen.ok) {
    return { art: 'transport_ungueltig', grund: 'ungueltig', meldung: gelesen.meldung }
  }
  return { art: 'ok', ids: gelesen.ids }
}

/**
 * Bestätigt die komplette Liste gegen bereits gelesenen Bestand.
 * `bestand === null` ist ein Leseausfall, nicht „kein Treffer“.
 * Es wird niemals eine Teilliste zurückgegeben.
 */
export function routeZieleBestaetigen(
  ids: string[],
  bestand: Ort[] | null,
): RouteZieleBestaetigung {
  if (bestand === null) {
    return { art: 'ausfall', meldung: ROUTE_EINSTIEG_MELDUNG.ausfall }
  }
  const ziele = reisezieleAusBestand(bestand, ids)
  if (!ziele.ok) {
    return {
      art: 'unbestaetigt',
      meldung: ROUTE_EINSTIEG_MELDUNG.unvollstaendig,
      zielIndex: ziele.zielIndex,
    }
  }
  return { art: 'bestaetigt', ziele: ziele.ziele }
}

export function routeEinstiegHref(auswahlen: OrtAuswahl[], idee?: string): string | null {
  return zielHrefAusListe(auswahlen, idee)
}

export function neuesRouteVorkommen(key: string, ort?: OrtAuswahl | null): RouteVorkommen {
  return {
    key,
    ort: ort ?? null,
    text: ort?.name ?? '',
  }
}

export function routeVorkommenHinzufuegen(
  liste: RouteVorkommen[],
  auswahl: OrtAuswahl,
  key: string,
): RouteVorkommen[] {
  if (liste.length >= GRENZEN.etappenJeReise) return liste
  return [...liste, neuesRouteVorkommen(key, auswahl)]
}

export function routeVorkommenEntfernen(liste: RouteVorkommen[], key: string): RouteVorkommen[] {
  return liste.filter((eintrag) => eintrag.key !== key)
}

export function routeVorkommenErsetzen(
  liste: RouteVorkommen[],
  key: string,
  auswahl: OrtAuswahl,
): RouteVorkommen[] {
  return liste.map((eintrag) =>
    eintrag.key === key ? { key: eintrag.key, ort: auswahl, text: auswahl.name } : eintrag,
  )
}

export function routeVorkommenVerschieben(
  liste: RouteVorkommen[],
  key: string,
  richtung: 'hoch' | 'runter',
): RouteVorkommen[] {
  const index = liste.findIndex((eintrag) => eintrag.key === key)
  if (index < 0) return liste
  const ziel = richtung === 'hoch' ? index - 1 : index + 1
  if (ziel < 0 || ziel >= liste.length) return liste
  const naechste = [...liste]
  const aktuelles = naechste[index]
  naechste[index] = naechste[ziel]
  naechste[ziel] = aktuelles
  return naechste
}

export function routeKannVerschieben(
  liste: readonly RouteVorkommen[],
  key: string,
  richtung: 'hoch' | 'runter',
): boolean {
  const index = liste.findIndex((eintrag) => eintrag.key === key)
  if (index < 0) return false
  return richtung === 'hoch' ? index > 0 : index < liste.length - 1
}

function routeBestaetigteZiele(liste: readonly RouteVorkommen[]): OrtAuswahl[] {
  return liste
    .map((eintrag) => eintrag.ort)
    .filter((ort): ort is OrtAuswahl => Boolean(ort && istOrtId(ort.id)))
}

export function routePendingText(text: string): boolean {
  return text.trim().length > 0
}

export function routeAbsendenPruefen(
  liste: readonly RouteVorkommen[],
  sucheText: string,
  ersetzenKey: string | null = null,
): RouteAbsenden {
  if (routePendingText(sucheText) || ersetzenKey) {
    return { ok: false, meldung: ROUTE_EINSTIEG_MELDUNG.pending }
  }

  const unbestaetigt = liste.find((eintrag) => auswahlFehlt(eintrag.text, eintrag.ort, 'ziel'))
  if (unbestaetigt) {
    return {
      ok: false,
      meldung: unbestaetigt.text.trim()
        ? ROUTE_EINSTIEG_MELDUNG.pending
        : ROUTE_EINSTIEG_MELDUNG.fehlt,
    }
  }

  const ziele = routeBestaetigteZiele(liste)
  if (ziele.length === 0) {
    return { ok: false, meldung: ROUTE_EINSTIEG_MELDUNG.fehlt }
  }
  if (ziele.length !== liste.length) {
    return { ok: false, meldung: ROUTE_EINSTIEG_MELDUNG.pending }
  }
  return { ok: true, ziele }
}

export function tripPlannerRouteVorbelegen(eingabe: {
  destinationId?: string
  destination?: string
  weitereZiele?: { id: string; name: string }[]
}): { primaer: OrtAuswahl | null; weitere: RouteVorkommen[] } {
  const primaer =
    eingabe.destinationId && eingabe.destination
      ? { id: eingabe.destinationId, name: eingabe.destination }
      : null
  const weitere = (eingabe.weitereZiele ?? []).map((ziel, index) =>
    neuesRouteVorkommen(`handoff-${index + 1}`, { id: ziel.id, name: ziel.name }),
  )
  return { primaer, weitere }
}

