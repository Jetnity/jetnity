// lib/activities/zielauswahl.ts
//
// Zielauswahl für die Aktivitätsfläche. Die Reihenfolge ist die Etappenfolge.
// Ein Reisetag ohne Etappe ist gültig und wird nicht zum Ziel umgedeutet.
// Die Suche benutzt nur einen bestätigten kanonischen Ort, nicht den Etappentitel.

import { istOrtId, type Ort } from '@/lib/places/domain'

export type AktivitaetsZielStatus =
  | 'ausstehend'
  | 'bereit'
  | 'land'
  | 'unbestaetigt'
  | 'widerspruch'
  | 'nicht_unterstuetzt'

export type AktivitaetsZielArt = 'stadt' | 'region' | 'insel' | 'land' | 'anders'

export type AktivitaetsZielTag = {
  id: string
  dayDate: string | null
  dayIndex: number
  title: string | null
  stageId: string | null
}

export type AktivitaetsZiel = {
  stageId: string
  name: string
  kanonischerName: string | null
  status: AktivitaetsZielStatus
  placeId: string | null
  countryCode: string | null
  zielArt: AktivitaetsZielArt | null
  tage: readonly AktivitaetsZielTag[]
}

export type AktivitaetsTagEntscheidung =
  | { art: 'automatisch' }
  | { art: 'kein-datum' }
  | { art: 'tag'; tagId: string }

export type AktivitaetsZielwahl = {
  ziele: readonly AktivitaetsZiel[]
  gewaehlt: AktivitaetsZiel | null
  /** Nur ein Tag, der zu genau dieser Etappe gehört. Sonst kein Datumsfilter. */
  tagFilter: AktivitaetsZielTag | null
  datumOffen: boolean
  einstieg: 'wahl' | 'tag' | 'erster' | 'keine'
}

type EtappeQuelle = {
  id: string
  position: number
  name: string
  countryCode: string | null
  placeId: string | null
}

type TagQuelle = {
  id: string
  stageId: string | null
  dayDate: string | null
  dayIndex: number
  title: string | null
}

export type AktivitaetsZielEingabe = {
  etappen: readonly EtappeQuelle[]
  tage: readonly TagQuelle[]
  /** Tag aus dem Arbeitsbereich. Ohne Etappe wählt er das Ziel nicht. */
  tagId: string | null
  gewaehlteEtappeId: string | null
  tagEntscheidung: AktivitaetsTagEntscheidung
  /** null: die Ortslesung läuft noch. Eine Map ist der abgeschlossene Stand. */
  orte: ReadonlyMap<string, Ort | null> | null
}

function isoLand(wert: string | null | undefined): wert is string {
  return typeof wert === 'string' && /^[A-Z]{2}$/.test(wert)
}

function etappenFolge(etappen: readonly EtappeQuelle[]): EtappeQuelle[] {
  return etappen
    .map((etappe, index) => ({ etappe, index }))
    .sort((a, b) => a.etappe.position - b.etappe.position || a.index - b.index)
    .map((eintrag) => eintrag.etappe)
}

function statusFuer(etappe: EtappeQuelle, orte: ReadonlyMap<string, Ort | null> | null): Pick<
  AktivitaetsZiel,
  'status' | 'kanonischerName' | 'countryCode' | 'zielArt' | 'placeId' | 'name'
> {
  const rohName = etappe.name.trim()
  const platzhalter = rohName || 'Ziel ohne Namen'
  if (!etappe.placeId || !istOrtId(etappe.placeId)) {
    return {
      status: 'unbestaetigt',
      kanonischerName: null,
      countryCode: null,
      zielArt: null,
      placeId: etappe.placeId,
      name: platzhalter,
    }
  }
  if (orte === null) {
    return {
      status: 'ausstehend',
      kanonischerName: null,
      countryCode: null,
      zielArt: null,
      placeId: etappe.placeId,
      name: platzhalter,
    }
  }
  const ort = orte.get(etappe.placeId) ?? null
  if (!ort || ort.id !== etappe.placeId || !isoLand(ort.countryCode)) {
    return {
      status: 'unbestaetigt',
      kanonischerName: null,
      countryCode: null,
      zielArt: null,
      placeId: etappe.placeId,
      name: platzhalter,
    }
  }
  if (isoLand(etappe.countryCode) && etappe.countryCode !== ort.countryCode) {
    return {
      status: 'widerspruch',
      kanonischerName: null,
      countryCode: null,
      zielArt: null,
      placeId: etappe.placeId,
      name: platzhalter,
    }
  }
  if (ort.typ === 'country') {
    return {
      status: 'land',
      kanonischerName: ort.name,
      countryCode: ort.countryCode,
      zielArt: 'land',
      placeId: ort.id,
      name: ort.name,
    }
  }
  if (ort.typ === 'city' || ort.typ === 'region' || ort.typ === 'island') {
    const zielArt = ort.typ === 'city' ? 'stadt' : ort.typ === 'region' ? 'region' : 'insel'
    return {
      status: 'bereit',
      kanonischerName: ort.name,
      countryCode: ort.countryCode,
      zielArt,
      placeId: ort.id,
      name: ort.name,
    }
  }
  return {
    status: 'nicht_unterstuetzt',
    kanonischerName: ort.name,
    countryCode: ort.countryCode,
    zielArt: 'anders',
    placeId: ort.id,
    name: ort.name,
  }
}

function ersterPassend(ziele: readonly AktivitaetsZiel[]): AktivitaetsZiel | null {
  for (const ziel of ziele) {
    if (ziel.status === 'ausstehend') return ziel
    if (ziel.status === 'bereit' || ziel.status === 'land') return ziel
  }
  return ziele[0] ?? null
}

function tagVon(tage: readonly AktivitaetsZielTag[], id: string | null | undefined): AktivitaetsZielTag | null {
  if (!id) return null
  return tage.find((tag) => tag.id === id) ?? null
}

export function aktivitaetsZieleWaehlen(eingabe: AktivitaetsZielEingabe): AktivitaetsZielwahl {
  const folge = etappenFolge(eingabe.etappen)
  const tage: AktivitaetsZielTag[] = [...eingabe.tage]
    .map((tag) => ({
      id: tag.id,
      dayDate: tag.dayDate,
      dayIndex: tag.dayIndex,
      title: tag.title,
      stageId: tag.stageId,
    }))
    .sort((a, b) => a.dayIndex - b.dayIndex || a.id.localeCompare(b.id))
  const ziele: AktivitaetsZiel[] = folge.map((etappe) => ({
    stageId: etappe.id,
    tage: tage.filter((tag) => tag.stageId === etappe.id),
    ...statusFuer(etappe, eingabe.orte),
  }))

  const ausWahl = eingabe.gewaehlteEtappeId
    ? ziele.find((ziel) => ziel.stageId === eingabe.gewaehlteEtappeId) ?? null
    : null
  let gewaehlt = ausWahl
  let einstieg: AktivitaetsZielwahl['einstieg'] = ausWahl ? 'wahl' : 'keine'

  const automatischerTag =
    eingabe.tagEntscheidung.art === 'automatisch' ? tagVon(tage, eingabe.tagId) : null
  const bewussterTag =
    eingabe.tagEntscheidung.art === 'tag' ? tagVon(tage, eingabe.tagEntscheidung.tagId) : null
  const tagMitEtappe = bewussterTag ?? automatischerTag
  if (!gewaehlt && tagMitEtappe?.stageId) {
    const ausTag = ziele.find((ziel) => ziel.stageId === tagMitEtappe.stageId) ?? null
    if (ausTag) {
      gewaehlt = ausTag
      einstieg = 'tag'
    }
  }
  if (!gewaehlt) {
    gewaehlt = ersterPassend(ziele)
    einstieg = gewaehlt ? 'erster' : 'keine'
  }

  let tagFilter: AktivitaetsZielTag | null = null
  if (gewaehlt && eingabe.tagEntscheidung.art !== 'kein-datum') {
    const kandidat = eingabe.tagEntscheidung.art === 'tag' ? bewussterTag : automatischerTag
    if (kandidat && kandidat.stageId === gewaehlt.stageId) tagFilter = kandidat
  }
  const datumOffen = Boolean(gewaehlt && gewaehlt.status === 'bereit' && !tagFilter && tage.length > 0)

  return { ziele, gewaehlt, tagFilter, datumOffen, einstieg }
}
