// lib/activities/getyourguide/kontext.ts
//
// Zielwahrheit für GetYourGuide. Der angeforderte Tag bleibt der angeforderte
// Tag. Ein Land ist kein Ort an einem Reisetag. Geschlossen heisst: kein Lesen.

import type { Ort } from '@/lib/places/domain'
import { istOrtId } from '@/lib/places/domain'

import type { GetYourGuideFreigabe, GygGrund } from '@/lib/activities/getyourguide/freigabe'
import { suchkonfigurationBauen, type GygSuchkonfiguration } from '@/lib/activities/getyourguide/suche'

export type GygEtappe = {
  id: string
  countryCode: string | null
  placeId: string | null
}

export type GygTag = {
  id: string
  stageId: string | null
}

export type GygReise = {
  id: string
  etappen: readonly GygEtappe[]
  tage: readonly GygTag[]
}

export type GygUmfang = 'tag' | 'land'

export type GygLandOption = {
  countryCode: string
  name: string
}

export type GygPlan =
  | { art: 'geschlossen'; schluessel: string; gruende: readonly GygGrund[] }
  | { art: 'tag_ungueltig'; schluessel: string }
  | { art: 'etappe_fehlt'; schluessel: string }
  | { art: 'ort_unbestaetigt'; schluessel: string }
  | { art: 'ort_widerspruch'; schluessel: string }
  | { art: 'kein_tagesziel'; schluessel: string; name: string | null; countryCode: string | null }
  | { art: 'land_auswahl'; schluessel: string; laender: readonly GygLandOption[] }
  | {
      art: 'nicht_unterstuetzt'
      schluessel: string
      name: string | null
      zielArt: 'stadt' | 'region' | 'insel' | 'land' | 'anders'
      laender?: readonly GygLandOption[]
    }
  | {
      art: 'bereit'
      schluessel: string
      suche: GygSuchkonfiguration
      name: string | null
      zielArt: 'stadt' | 'region' | 'insel' | 'land'
      laender?: readonly GygLandOption[]
    }
  | { art: 'ort_ausstehend'; schluessel: string }

export type GygPlanEingabe = {
  reise: GygReise
  angeforderteTagId: string | null
  umfang: GygUmfang
  landWahl: string | null
  freigabe: GetYourGuideFreigabe
  orteLesen: ((id: string) => Ort | null) | null
}

type ReiseQuelle = {
  id: string
  stages: readonly { id: string; countryCode?: string | null; placeId?: string | null }[]
  days: readonly { id: string; stageId: string | null }[]
}

export function gygReiseAusTrip(reise: ReiseQuelle): GygReise {
  return {
    id: reise.id,
    etappen: reise.stages.map((etappe) => ({
      id: etappe.id,
      countryCode: typeof etappe.countryCode === 'string' ? etappe.countryCode : null,
      placeId: typeof etappe.placeId === 'string' ? etappe.placeId : null,
    })),
    tage: reise.days.map((tag) => ({ id: tag.id, stageId: tag.stageId })),
  }
}

function isoLand(wert: string | null): wert is string {
  return typeof wert === 'string' && /^[A-Z]{2}$/.test(wert)
}

function schluessel(teile: {
  freigabe: GetYourGuideFreigabe['status']
  reiseId: string
  umfang: GygUmfang
  tagId: string | null
  etappeId: string | null
  ortId: string | null
  countryCode: string | null
  landWahl: string | null
  art: GygPlan['art']
  zielTyp: string | null
  sucheUmfang: string | null
  sucheName: string | null
  sucheLand: string | null
  sucheCode: string | null
}): string {
  return JSON.stringify([
    teile.freigabe,
    teile.reiseId,
    teile.umfang,
    teile.tagId,
    teile.etappeId,
    teile.ortId,
    teile.zielTyp,
    teile.countryCode,
    teile.landWahl,
    teile.sucheUmfang,
    teile.sucheName,
    teile.sucheLand,
    teile.sucheCode,
    teile.art,
  ])
}

function gesperrtFuer(reise: GygReise): string[] {
  return [reise.id, ...reise.etappen.map((etappe) => etappe.id), ...reise.tage.map((tag) => tag.id)]
}

function ortLesen(id: string, lesen: ((id: string) => Ort | null) | null): Ort | null {
  if (!lesen || !istOrtId(id)) return null
  const ort = lesen(id)
  if (!ort || ort.id !== id) return null
  return ort
}

type LandStuetze = { name: string; bestaetigt: boolean }

function laenderSammeln(
  reise: GygReise,
  lesen: ((id: string) => Ort | null) | null,
): { laender: Map<string, LandStuetze>; widerspruch: number; unbestaetigt: number; lesungen: number } {
  const laender = new Map<string, LandStuetze>()
  let widerspruch = 0
  let unbestaetigt = 0
  let lesungen = 0
  const cache = new Map<string, Ort | null>()
  const einmal = (id: string) => {
    const vorhanden = cache.get(id)
    if (vorhanden !== undefined || cache.has(id)) return cache.get(id) ?? null
    lesungen += 1
    const ort = ortLesen(id, lesen)
    cache.set(id, ort)
    return ort
  }
  for (const etappe of reise.etappen) {
    if (!etappe.placeId || !istOrtId(etappe.placeId)) {
      unbestaetigt += 1
      continue
    }
    const ort = einmal(etappe.placeId)
    if (!ort) {
      unbestaetigt += 1
      continue
    }
    if (isoLand(etappe.countryCode) && isoLand(ort.countryCode) && etappe.countryCode !== ort.countryCode) {
      widerspruch += 1
      continue
    }
    if (ort.typ === 'airport' || !isoLand(ort.countryCode)) {
      unbestaetigt += 1
      continue
    }
    const bestaetigt = ort.typ === 'country'
    const name = bestaetigt ? ort.name : ort.country ?? ort.countryCode
    const bisher = laender.get(ort.countryCode)
    if (!bisher) {
      laender.set(ort.countryCode, { name, bestaetigt })
      continue
    }
    if (bestaetigt) laender.set(ort.countryCode, { name: ort.name, bestaetigt: true })
  }
  return { laender, widerspruch, unbestaetigt, lesungen }
}

function landErgebnis(
  eingabe: GygPlanEingabe,
  tagId: string | null,
  stuetze: { laender: Map<string, LandStuetze>; widerspruch: number; unbestaetigt: number },
): GygPlan {
  const basis = {
    freigabe: eingabe.freigabe.status,
    reiseId: eingabe.reise.id,
    umfang: 'land' as const,
    tagId,
    etappeId: null,
    ortId: null,
    landWahl: eingabe.landWahl,
    zielTyp: null,
    sucheUmfang: null,
    sucheName: null,
    sucheLand: null,
    sucheCode: null,
  }
  const laender = [...stuetze.laender.entries()]
    .map(([countryCode, wert]) => ({ countryCode, name: wert.name, bestaetigt: wert.bestaetigt }))
    .sort((a, b) => a.countryCode.localeCompare(b.countryCode))
  const auswahl = laender.map(({ countryCode, name }) => ({ countryCode, name }))
  if (laender.length === 0) {
    const art = stuetze.widerspruch > 0 && stuetze.unbestaetigt === 0 ? 'ort_widerspruch' : 'ort_unbestaetigt'
    return { art, schluessel: schluessel({ ...basis, countryCode: null, art }) }
  }
  const gewaehlt = laender.find((eintrag) => eintrag.countryCode === eingabe.landWahl) ?? null
  const einzig = laender.length === 1 ? laender[0] : null
  const unsicher = stuetze.unbestaetigt > 0 || stuetze.widerspruch > 0 || laender.length > 1
  if (eingabe.landWahl && !gewaehlt) {
    return {
      art: 'land_auswahl',
      schluessel: schluessel({ ...basis, countryCode: null, art: 'land_auswahl' }),
      laender: auswahl,
    }
  }
  const automatisch = Boolean(einzig?.bestaetigt) && !unsicher
  const ziel = gewaehlt ?? (automatisch ? einzig : null)
  if (!ziel) {
    return {
      art: 'land_auswahl',
      schluessel: schluessel({ ...basis, countryCode: null, art: 'land_auswahl' }),
      laender: auswahl,
    }
  }
  const suche = suchkonfigurationBauen({
    umfang: 'land',
    name: ziel.name,
    countryCode: ziel.countryCode,
    gesperrt: gesperrtFuer(eingabe.reise),
  })
  const identitaet = {
    ...basis,
    countryCode: ziel.countryCode,
    zielTyp: 'country',
    sucheUmfang: suche?.umfang ?? null,
    sucheName: suche?.name ?? null,
    sucheLand: suche?.land ?? null,
    sucheCode: suche?.countryCode ?? null,
  }
  if (!suche) {
    return {
      art: 'nicht_unterstuetzt',
      schluessel: schluessel({ ...identitaet, art: 'nicht_unterstuetzt' }),
      name: ziel.name,
      zielArt: 'land',
      ...(unsicher ? { laender: auswahl } : {}),
    }
  }
  return {
    art: 'bereit',
    schluessel: schluessel({ ...identitaet, art: 'bereit' }),
    suche,
    name: ziel.name,
    zielArt: 'land',
    ...(unsicher ? { laender: auswahl } : {}),
  }
}

const OHNE_ZIEL = { zielTyp: null, sucheUmfang: null, sucheName: null, sucheLand: null, sucheCode: null }

export function gygOrtAnfrage(
  reise: GygReise,
  umfang: GygUmfang,
  angeforderteTagId: string | null,
): { anfrage: string; ids: readonly string[] } {
  if (umfang === 'land') {
    const ids: string[] = []
    const gesehen = new Set<string>()
    for (const etappe of reise.etappen) {
      if (!etappe.placeId || !istOrtId(etappe.placeId) || gesehen.has(etappe.placeId)) continue
      gesehen.add(etappe.placeId)
      ids.push(etappe.placeId)
    }
    return { anfrage: JSON.stringify(['land', ids]), ids }
  }
  const tagId = angeforderteTagId && angeforderteTagId.length > 0 ? angeforderteTagId : null
  const tag = tagId ? reise.tage.find((eintrag) => eintrag.id === tagId) ?? null : null
  const etappe = tag?.stageId ? reise.etappen.find((eintrag) => eintrag.id === tag.stageId) ?? null : null
  const id = etappe?.placeId && istOrtId(etappe.placeId) ? etappe.placeId : null
  return {
    anfrage: JSON.stringify(['tag', tag?.id ?? null, etappe?.id ?? null, id]),
    ids: id ? [id] : [],
  }
}

export function gygPlanen(eingabe: GygPlanEingabe): GygPlan {
  const tagId = eingabe.angeforderteTagId && eingabe.angeforderteTagId.length > 0 ? eingabe.angeforderteTagId : null
  const offen = eingabe.freigabe.status === 'bereit'
  const basis = {
    freigabe: eingabe.freigabe.status,
    reiseId: eingabe.reise.id,
    umfang: eingabe.umfang,
    tagId,
    landWahl: eingabe.landWahl,
    ...OHNE_ZIEL,
  }

  if (eingabe.umfang === 'land') {
    if (!offen) {
      return {
        art: 'geschlossen',
        schluessel: schluessel({ ...basis, etappeId: null, ortId: null, countryCode: null, art: 'geschlossen' }),
        gruende: eingabe.freigabe.status === 'geschlossen' ? eingabe.freigabe.gruende : [],
      }
    }
    return landErgebnis(eingabe, tagId, laenderSammeln(eingabe.reise, eingabe.orteLesen))
  }

  const tag = tagId ? eingabe.reise.tage.find((eintrag) => eintrag.id === tagId) ?? null : null
  if (!tag) {
    return {
      art: 'tag_ungueltig',
      schluessel: schluessel({ ...basis, etappeId: null, ortId: null, countryCode: null, art: 'tag_ungueltig' }),
    }
  }
  const etappe = tag.stageId ? eingabe.reise.etappen.find((eintrag) => eintrag.id === tag.stageId) ?? null : null
  if (!tag.stageId || !etappe) {
    return {
      art: 'etappe_fehlt',
      schluessel: schluessel({
        ...basis,
        etappeId: tag.stageId,
        ortId: null,
        countryCode: null,
        art: 'etappe_fehlt',
      }),
    }
  }
  if (eingabe.freigabe.status === 'geschlossen') {
    return {
      art: 'geschlossen',
      schluessel: schluessel({
        ...basis,
        etappeId: etappe.id,
        ortId: null,
        countryCode: null,
        art: 'geschlossen',
      }),
      gruende: eingabe.freigabe.gruende,
    }
  }

  const ortBasis = { ...basis, etappeId: etappe.id }
  if (!etappe.placeId || !istOrtId(etappe.placeId)) {
    return {
      art: 'ort_unbestaetigt',
      schluessel: schluessel({ ...ortBasis, ortId: null, countryCode: null, art: 'ort_unbestaetigt' }),
    }
  }
  const ort = ortLesen(etappe.placeId, eingabe.orteLesen)
  if (!ort) {
    return {
      art: 'ort_unbestaetigt',
      schluessel: schluessel({ ...ortBasis, ortId: etappe.placeId, countryCode: null, art: 'ort_unbestaetigt' }),
    }
  }
  // Der kanonische Landescode gilt nur in der bereits gespeicherten Form:
  // zwei Grossbuchstaben, wie ein erfolgreicher Import ihn ablegt. Die Etappe
  // füllt ihn nicht auf, und Kleinbuchstaben oder Freitext werden nicht zu einem Land.
  if (!isoLand(ort.countryCode)) {
    return {
      art: 'ort_unbestaetigt',
      schluessel: schluessel({
        ...ortBasis,
        ortId: ort.id,
        countryCode: null,
        zielTyp: ort.typ,
        art: 'ort_unbestaetigt',
      }),
    }
  }
  if (isoLand(etappe.countryCode) && etappe.countryCode !== ort.countryCode) {
    return {
      art: 'ort_widerspruch',
      schluessel: schluessel({ ...ortBasis, ortId: ort.id, countryCode: null, zielTyp: ort.typ, art: 'ort_widerspruch' }),
    }
  }
  if (ort.typ === 'country') {
    return {
      art: 'kein_tagesziel',
      schluessel: schluessel({
        ...ortBasis,
        ortId: ort.id,
        countryCode: ort.countryCode,
        zielTyp: ort.typ,
        art: 'kein_tagesziel',
      }),
      name: ort.name,
      countryCode: ort.countryCode,
    }
  }
  if (ort.typ !== 'city' && ort.typ !== 'region' && ort.typ !== 'island') {
    return {
      art: 'nicht_unterstuetzt',
      schluessel: schluessel({
        ...ortBasis,
        ortId: ort.id,
        countryCode: ort.countryCode,
        zielTyp: ort.typ,
        art: 'nicht_unterstuetzt',
      }),
      name: ort.name,
      zielArt: 'anders',
    }
  }
  const zielArt = ort.typ === 'city' ? 'stadt' : ort.typ === 'region' ? 'region' : 'insel'
  const suche = suchkonfigurationBauen({
    umfang: zielArt,
    name: ort.name,
    countryCode: ort.countryCode,
    gesperrt: gesperrtFuer(eingabe.reise),
  })
  const identitaet = {
    ...ortBasis,
    ortId: ort.id,
    countryCode: ort.countryCode,
    zielTyp: ort.typ,
    sucheUmfang: suche?.umfang ?? null,
    sucheName: suche?.name ?? null,
    sucheLand: suche?.land ?? null,
    sucheCode: suche?.countryCode ?? null,
  }
  if (!suche) {
    return {
      art: 'nicht_unterstuetzt',
      schluessel: schluessel({ ...identitaet, art: 'nicht_unterstuetzt' }),
      name: ort.name,
      zielArt,
    }
  }
  return {
    art: 'bereit',
    schluessel: schluessel({ ...identitaet, art: 'bereit' }),
    suche,
    name: ort.name,
    zielArt,
  }
}
