// lib/trips/naechte-abdeckung.ts
//
// Deterministische Nachtabdeckung aus dem echten Reisegraphen.
//
// Check-in/Check-out ist ein halboffenes Intervall `[checkIn, checkOut)`.
// Überlappende Stays werden vereinigt, nicht doppelt gezählt. Fehlende Daten
// werden nicht erfunden: unbekannte Abdeckung ist unbekannt, nicht `0/14`.
// Liegt ein Reisekalender vor und jede vorhandene Etappe hat ein eigenes
// Intervall, gehören die Nächte zwischen den Reiseenden dazu. Nächte ohne
// Etappe bleiben Übergang und werden keiner benachbarten Etappe zugeschlagen.
//
// `unterkunftAbdeckung` rechnet mit Intervallgrenzen. Die Nächte zwischen zwei
// Daten werden nicht aufgezählt. `naechteHalboffen` bleibt die öffentliche Liste.
//
// Frei von React, Next und Providern.

import { istGebucht } from '@/lib/trips/buchung'
import type { Trip, TripItem, TripStage } from '@/types/trips'

function allePunkte(reise: Trip, ohneTag: readonly TripItem[]): TripItem[] {
  const extra = ohneTag.length > 0 ? ohneTag : reise.ohneTag
  return [...reise.days.flatMap((tag) => tag.items), ...extra]
}

const EIN_TAG = 86_400_000

export type UnterkunftZeitraum = {
  start: string
  end: string
  stageId: string | null
  stageName: string | null
}

export type UnterkunftLuecke = UnterkunftZeitraum & {
  naechte: number
}

export type UnterkunftAufenthalt = {
  item: TripItem
  start: string | null
  end: string | null
  naechte: number | null
  status: 'selected' | 'booked' | 'unknown'
  ausserhalb: boolean
}

export type UnterkunftAbdeckung = {
  bekannt: boolean
  naechteGesamt: number | null
  naechteAbgedeckt: number | null
  naechteGebucht: number | null
  naechteAusgewaehlt: number | null
  zeitraeume: UnterkunftZeitraum[]
  luecken: UnterkunftLuecke[]
  aufenthalte: UnterkunftAufenthalt[]
  zusammenfassung: string
}

export function naechteHalboffen(checkIn: string, checkOut: string): string[] {
  const start = Date.parse(`${checkIn}T00:00:00Z`)
  const ende = Date.parse(`${checkOut}T00:00:00Z`)
  if (Number.isNaN(start) || Number.isNaN(ende) || ende <= start) return []

  const naechte: string[] = []
  for (let zeit = start; zeit < ende; zeit += EIN_TAG) {
    naechte.push(new Date(zeit).toISOString().slice(0, 10))
  }
  return naechte
}

function datumGueltig(wert: string | null | undefined): wert is string {
  if (!wert || !/^\d{4}-\d{2}-\d{2}$/.test(wert)) return false
  const [jahr, monat, tag] = wert.split('-').map(Number)
  const geprueft = new Date(Date.UTC(jahr, monat - 1, tag))
  return (
    geprueft.getUTCFullYear() === jahr &&
    geprueft.getUTCMonth() === monat - 1 &&
    geprueft.getUTCDate() === tag
  )
}

function stayZeitraum(punkt: TripItem): { start: string; end: string } | null {
  if (!datumGueltig(punkt.startsOn) || !datumGueltig(punkt.endsOn)) return null
  if (punkt.startsOn >= punkt.endsOn) return null
  return { start: punkt.startsOn, end: punkt.endsOn }
}

function etappenZeitraum(etappe: TripStage): UnterkunftZeitraum | null {
  if (!datumGueltig(etappe.arrivalDate) || !datumGueltig(etappe.departureDate)) return null
  if (etappe.arrivalDate >= etappe.departureDate) return null
  return {
    start: etappe.arrivalDate,
    end: etappe.departureDate,
    stageId: etappe.id,
    stageName: etappe.name,
  }
}

function reiseZeitraum(reise: Trip): UnterkunftZeitraum | null {
  if (!datumGueltig(reise.startDate) || !datumGueltig(reise.endDate)) return null
  if (reise.startDate >= reise.endDate) return null
  return {
    start: reise.startDate,
    end: reise.endDate,
    stageId: reise.stages.length === 1 ? reise.stages[0]?.id ?? null : null,
    stageName: reise.stages.length === 1 ? reise.stages[0]?.name ?? null : null,
  }
}

function benoetigteZeitraeume(reise: Trip): { bekannt: boolean; zeitraeume: UnterkunftZeitraum[] } {
  const ausEtappen = reise.stages.map(etappenZeitraum)
  const etappen = ausEtappen.filter((wert): wert is UnterkunftZeitraum => wert !== null)
  const vollstaendig = reise.stages.length > 0 && ausEtappen.every((wert) => wert !== null)
  const kalender = reiseZeitraum(reise)

  // Vollständige Etappen behalten ihren Besitz. Der Reisekalender wird danach
  // angehängt, damit Nächte zwischen den Endpunkten sichtbar bleiben, auch wenn
  // keine Etappe sie besitzt. Die Etappe steht in der Liste zuerst und gewinnt
  // Überlappungen. Ein Loch ausserhalb des Reisekalenders wird nicht aufgefüllt.
  if (vollstaendig) {
    const zeitraeume = [...etappen]
    if (kalender) {
      zeitraeume.push({
        start: kalender.start,
        end: kalender.end,
        stageId: null,
        stageName: null,
      })
    }
    return { bekannt: true, zeitraeume }
  }

  if (reise.stages.length === 0 || reise.stages.length === 1) {
    if (kalender) return { bekannt: true, zeitraeume: [kalender] }
  }

  if (reise.stages.length > 1 && etappen.length > 0 && etappen.length < reise.stages.length) {
    return { bekannt: false, zeitraeume: etappen }
  }

  if (kalender) return { bekannt: true, zeitraeume: [kalender] }
  return { bekannt: false, zeitraeume: [] }
}

/** Halboffene Nachtspanne in UTC-Tagesindizes: `[start, end)`. */
type NachtSpanne = {
  start: number
  end: number
}

type NachtBesitz = NachtSpanne & {
  stageId: string | null
  stageName: string | null
}

/**
 * Tagesindex nur für Daten, die `datumGueltig` schon angenommen hat.
 * `Date.UTC` bildet die Jahre 0–99 auf 1900+ ab; solche Daten scheitern
 * vorher an der bestehenden Prüfung und werden hier nicht repariert.
 */
function tagZahl(iso: string): number {
  const [jahr, monat, tag] = iso.split('-').map(Number)
  return Date.UTC(jahr, monat - 1, tag) / EIN_TAG
}

/** Merkt Quelltexte an ihren Tagesindizes. Grenzen bleiben die Originalstrings. */
function isoMerker() {
  const tage: number[] = []
  const texte: string[] = []
  return {
    merken(iso: string): number {
      const tag = tagZahl(iso)
      for (let i = 0; i < tage.length; i += 1) {
        if (tage[i] === tag) return tag
      }
      tage.push(tag)
      texte.push(iso)
      return tag
    },
    text(tag: number): string {
      for (let i = 0; i < tage.length; i += 1) {
        if (tage[i] === tag) return texte[i]
      }
      throw new Error('Unterkunftsgrenze ohne Quelldatum')
    },
  }
}

function spannenVereinigen(roh: readonly NachtSpanne[]): NachtSpanne[] {
  if (roh.length === 0) return []
  const sortiert = [...roh].sort((a, b) => a.start - b.start || a.end - b.end)
  const aus: NachtSpanne[] = [{ start: sortiert[0].start, end: sortiert[0].end }]
  for (let i = 1; i < sortiert.length; i += 1) {
    const naechste = sortiert[i]
    const letzte = aus[aus.length - 1]
    if (naechste.start <= letzte.end) letzte.end = Math.max(letzte.end, naechste.end)
    else aus.push({ start: naechste.start, end: naechste.end })
  }
  return aus
}

function spannenMass(spannen: readonly NachtSpanne[]): number {
  let summe = 0
  for (const spanne of spannen) summe += spanne.end - spanne.start
  return summe
}

/** Beide Seiten werden vereinigt. Das Ergebnis ist sortiert und überlappungsfrei. */
function spannenSchneiden(links: readonly NachtSpanne[], rechts: readonly NachtSpanne[]): NachtSpanne[] {
  const a = spannenVereinigen(links)
  const b = spannenVereinigen(rechts)
  const aus: NachtSpanne[] = []
  let j = 0
  for (const teil of a) {
    while (j < b.length && b[j].end <= teil.start) j += 1
    let k = j
    while (k < b.length && b[k].start < teil.end) {
      const start = teil.start > b[k].start ? teil.start : b[k].start
      const end = teil.end < b[k].end ? teil.end : b[k].end
      if (start < end) aus.push({ start, end })
      k += 1
    }
  }
  return aus
}

/** `abzug` wird von der vereinigten Basis abgezogen. */
function spannenDifferenz(basis: readonly NachtSpanne[], abzug: readonly NachtSpanne[]): NachtSpanne[] {
  const a = spannenVereinigen(basis)
  const b = spannenVereinigen(abzug)
  const aus: NachtSpanne[] = []
  let j = 0
  for (const teil of a) {
    let cursor = teil.start
    while (j < b.length && b[j].end <= cursor) j += 1
    let k = j
    while (k < b.length && b[k].start < teil.end) {
      if (b[k].start > cursor) {
        aus.push({ start: cursor, end: b[k].start < teil.end ? b[k].start : teil.end })
      }
      cursor = Math.max(cursor, b[k].end)
      k += 1
      if (cursor >= teil.end) break
    }
    if (cursor < teil.end) aus.push({ start: cursor, end: teil.end })
  }
  return aus
}

/**
 * Zerteilt die Vereinigung an den Intervallgrenzen.
 * Jede Atomspanne gehört zum ersten Intervall in der ursprünglichen Reihenfolge.
 * Aneinanderliegende Stücke mit demselben Etappennamen bleiben ein Besitz;
 * unterschiedliche Namen bleiben getrennt, damit der Lückenname am Lückenanfang steht.
 */
function besitzSegmente(
  zeitraeume: readonly UnterkunftZeitraum[],
  merken: (iso: string) => number,
): NachtBesitz[] {
  const intervalle = zeitraeume.map((zeitraum) => ({
    start: merken(zeitraum.start),
    end: merken(zeitraum.end),
    stageId: zeitraum.stageId,
    stageName: zeitraum.stageName,
  }))
  const grenzen: number[] = []
  for (const intervall of intervalle) grenzen.push(intervall.start, intervall.end)
  grenzen.sort((a, b) => a - b)
  const punkte: number[] = []
  for (const wert of grenzen) {
    if (punkte.length === 0 || punkte[punkte.length - 1] !== wert) punkte.push(wert)
  }

  const roh: NachtBesitz[] = []
  for (let i = 0; i < punkte.length - 1; i += 1) {
    const start = punkte[i]
    const end = punkte[i + 1]
    let besitzer: (typeof intervalle)[number] | undefined
    for (const intervall of intervalle) {
      if (intervall.start <= start && end <= intervall.end) {
        besitzer = intervall
        break
      }
    }
    if (!besitzer) continue
    const letzte = roh[roh.length - 1]
    if (
      letzte &&
      letzte.end === start &&
      letzte.stageId === besitzer.stageId &&
      letzte.stageName === besitzer.stageName
    ) {
      letzte.end = end
      continue
    }
    roh.push({
      start,
      end,
      stageId: besitzer.stageId,
      stageName: besitzer.stageName,
    })
  }
  return roh
}

/** Offene Besitzstücke nach Abzug der abgedeckten Vereinigung. */
function besitzOhneDeckung(besitz: readonly NachtBesitz[], abgedeckt: readonly NachtSpanne[]): NachtBesitz[] {
  const block = spannenVereinigen(abgedeckt)
  const aus: NachtBesitz[] = []
  let j = 0
  for (const teil of besitz) {
    let cursor = teil.start
    while (j < block.length && block[j].end <= cursor) j += 1
    let k = j
    while (k < block.length && block[k].start < teil.end) {
      if (block[k].start > cursor) {
        aus.push({
          start: cursor,
          end: block[k].start < teil.end ? block[k].start : teil.end,
          stageId: teil.stageId,
          stageName: teil.stageName,
        })
      }
      cursor = Math.max(cursor, block[k].end)
      k += 1
      if (cursor >= teil.end) break
    }
    if (cursor < teil.end) {
      aus.push({
        start: cursor,
        end: teil.end,
        stageId: teil.stageId,
        stageName: teil.stageName,
      })
    }
  }
  return aus
}

/**
 * Chronologische Lücken. Aneinanderliegende Stücke derselben `stageId` werden
 * eine Lücke, auch wenn der Name wechselt. Der Name bleibt der am Lückenanfang.
 */
function lueckenVerbinden(stuecke: readonly NachtBesitz[], text: (tag: number) => string): UnterkunftLuecke[] {
  const verbunden: NachtBesitz[] = []
  for (const stueck of stuecke) {
    const letzte = verbunden[verbunden.length - 1]
    if (letzte && letzte.end === stueck.start && letzte.stageId === stueck.stageId) {
      letzte.end = stueck.end
      continue
    }
    verbunden.push({
      start: stueck.start,
      end: stueck.end,
      stageId: stueck.stageId,
      stageName: stueck.stageName,
    })
  }
  return verbunden.map((stueck) => ({
    start: text(stueck.start),
    end: text(stueck.end),
    naechte: stueck.end - stueck.start,
    stageId: stueck.stageId,
    stageName: stueck.stageName,
  }))
}

function zusammenfassungAus(abdeckung: Omit<UnterkunftAbdeckung, 'zusammenfassung'>): string {
  if (!abdeckung.bekannt || abdeckung.naechteGesamt === null || abdeckung.naechteAbgedeckt === null) {
    return 'Unterkunftsstand noch unklar'
  }
  if (abdeckung.naechteGesamt === 0) return 'Keine Übernachtung in diesem Zeitraum'
  if (abdeckung.aufenthalte.some((aufenthalt) => aufenthalt.status === 'unknown')) {
    return 'Unterkunftsstand noch unklar'
  }
  if (abdeckung.naechteAbgedeckt === 0 && abdeckung.aufenthalte.length === 0) {
    return 'Noch keine Unterkunft ausgewählt'
  }
  const gebucht = abdeckung.naechteGebucht ?? 0
  const kern = `${abdeckung.naechteAbgedeckt}/${abdeckung.naechteGesamt} Nächte abgedeckt`
  if (gebucht > 0 && gebucht === abdeckung.naechteAbgedeckt) return `${kern} · gebucht`
  if (gebucht > 0) return `${kern} · ${gebucht} gebucht`
  return kern
}

export function unterkunftAbdeckung(reise: Trip, ohneTag: readonly TripItem[] = []): UnterkunftAbdeckung {
  const { bekannt, zeitraeume } = benoetigteZeitraeume(reise)
  const merker = isoMerker()
  const bedarf = zeitraeume.map((zeitraum) => ({
    start: merker.merken(zeitraum.start),
    end: merker.merken(zeitraum.end),
  }))
  const bedarfVereinigt = spannenVereinigen(bedarf)
  const bedarfMass = spannenMass(bedarfVereinigt)
  const besitz = besitzSegmente(zeitraeume, (iso) => merker.merken(iso))

  const stays = allePunkte(reise, ohneTag).filter((punkt) => punkt.kind === 'stay')
  const gebucht: NachtSpanne[] = []
  const gewaehlt: NachtSpanne[] = []
  const aufenthalte: UnterkunftAufenthalt[] = stays.map((item) => {
    const zeitraum = stayZeitraum(item)
    if (!zeitraum) {
      return {
        item,
        start: item.startsOn,
        end: item.endsOn,
        naechte: null,
        status: 'unknown',
        ausserhalb: false,
      }
    }

    const start = merker.merken(zeitraum.start)
    const end = merker.merken(zeitraum.end)
    const imZeitraum = spannenSchneiden([{ start, end }], bedarfVereinigt)
    const status = istGebucht(item) ? 'booked' : 'selected'
    if (status === 'booked') gebucht.push({ start, end })
    else gewaehlt.push({ start, end })

    return {
      item,
      start: zeitraum.start,
      end: zeitraum.end,
      naechte: end - start,
      status,
      ausserhalb: bedarfMass > 0 && spannenMass(imZeitraum) === 0,
    }
  })

  const gebuchtImBedarf = spannenSchneiden(gebucht, bedarfVereinigt)
  const gewaehltImBedarf = spannenDifferenz(spannenSchneiden(gewaehlt, bedarfVereinigt), gebuchtImBedarf)
  const abgedeckt = spannenVereinigen([...gebuchtImBedarf, ...gewaehltImBedarf])
  const naechteGesamt = bekannt ? bedarfMass : null
  const naechteAbgedeckt = bekannt ? spannenMass(abgedeckt) : null
  const naechteGebucht = bekannt ? spannenMass(gebuchtImBedarf) : null
  const naechteAusgewaehlt = bekannt ? spannenMass(gewaehltImBedarf) : null

  const ergebnis: Omit<UnterkunftAbdeckung, 'zusammenfassung'> = {
    bekannt,
    naechteGesamt,
    naechteAbgedeckt,
    naechteGebucht,
    naechteAusgewaehlt,
    zeitraeume,
    luecken: bekannt ? lueckenVerbinden(besitzOhneDeckung(besitz, abgedeckt), (tag) => merker.text(tag)) : [],
    aufenthalte,
  }

  return { ...ergebnis, zusammenfassung: zusammenfassungAus(ergebnis) }
}
