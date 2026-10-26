// lib/activities/getyourguide/kontext.ts
//
// Zielwahrheit für GetYourGuide. Der angeforderte Tag bleibt der angeforderte
// Tag. Ein Land ist kein Ort an einem Reisetag. Geschlossen heisst: kein Lesen.

import type { Ort } from '@/lib/places/domain'
import { istOrtId } from '@/lib/places/domain'

import type { GetYourGuideFreigabe, GygGrund } from '@/lib/activities/getyourguide/freigabe'
import {
  oeffentlichenBezugBauen,
  type GygOeffentlicherBezug,
  type GygZielabbildung,
} from '@/lib/activities/getyourguide/widget'

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
    }
  | {
      art: 'bereit'
      schluessel: string
      bezug: GygOeffentlicherBezug
      name: string | null
      zielArt: 'stadt' | 'region' | 'insel' | 'land'
    }

export type GygPlanEingabe = {
  reise: GygReise
  angeforderteTagId: string | null
  umfang: GygUmfang
  landWahl: string | null
  freigabe: GetYourGuideFreigabe
  orteLesen: ((id: string) => Ort | null) | null
  abbildung: readonly GygZielabbildung[]
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
}): string {
  return JSON.stringify([
    teile.freigabe,
    teile.reiseId,
    teile.umfang,
    teile.tagId,
    teile.etappeId,
    teile.ortId,
    teile.countryCode,
    teile.landWahl,
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
): { laender: Map<string, LandStuetze>; widerspruch: number; unbestaetigt: number } {
  const laender = new Map<string, LandStuetze>()
  let widerspruch = 0
  let unbestaetigt = 0
  const gesehen = new Set<string>()
  for (const etappe of reise.etappen) {
    if (!etappe.placeId || !istOrtId(etappe.placeId)) {
      unbestaetigt += 1
      continue
    }
    if (gesehen.has(etappe.placeId)) continue
    gesehen.add(etappe.placeId)
    const ort = ortLesen(etappe.placeId, lesen)
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
  return { laender, widerspruch, unbestaetigt }
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
  }
  if (stuetze.laender.size === 0) {
    const art = stuetze.widerspruch > 0 && stuetze.unbestaetigt === 0 ? 'ort_widerspruch' : 'ort_unbestaetigt'
    return { art, schluessel: schluessel({ ...basis, countryCode: null, art }) }
  }
  const optionen = [...stuetze.laender.entries()]
    .map(([countryCode, wert]) => ({ countryCode, name: wert.name, bestaetigt: wert.bestaetigt }))
    .sort((a, b) => a.countryCode.localeCompare(b.countryCode))
  const gewaehlt = optionen.find((eintrag) => eintrag.countryCode === eingabe.landWahl) ?? null
  const einzig = optionen.length === 1 ? optionen[0] : null
  if (eingabe.landWahl && !gewaehlt) {
    return {
      art: 'land_auswahl',
      schluessel: schluessel({ ...basis, countryCode: null, art: 'land_auswahl' }),
      laender: optionen.map(({ countryCode, name }) => ({ countryCode, name })),
    }
  }
  const ziel = gewaehlt ?? (einzig?.bestaetigt ? einzig : null)
  if (!ziel) {
    return {
      art: 'land_auswahl',
      schluessel: schluessel({ ...basis, countryCode: null, art: 'land_auswahl' }),
      laender: optionen.map(({ countryCode, name }) => ({ countryCode, name })),
    }
  }
  const bezug = oeffentlichenBezugBauen(
    { art: 'land', countryCode: ziel.countryCode },
    eingabe.abbildung,
    gesperrtFuer(eingabe.reise),
  )
  if (!bezug) {
    return {
      art: 'nicht_unterstuetzt',
      schluessel: schluessel({ ...basis, countryCode: ziel.countryCode, art: 'nicht_unterstuetzt' }),
      name: ziel.name,
      zielArt: 'land',
    }
  }
  return {
    art: 'bereit',
    schluessel: schluessel({ ...basis, countryCode: ziel.countryCode, art: 'bereit' }),
    bezug,
    name: ziel.name,
    zielArt: 'land',
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
  if (isoLand(etappe.countryCode) && isoLand(ort.countryCode) && etappe.countryCode !== ort.countryCode) {
    return {
      art: 'ort_widerspruch',
      schluessel: schluessel({ ...ortBasis, ortId: ort.id, countryCode: null, art: 'ort_widerspruch' }),
    }
  }
  if (ort.typ === 'country') {
    return {
      art: 'kein_tagesziel',
      schluessel: schluessel({
        ...ortBasis,
        ortId: ort.id,
        countryCode: ort.countryCode,
        art: 'kein_tagesziel',
      }),
      name: ort.name,
      countryCode: ort.countryCode,
    }
  }
  if (ort.typ !== 'city' && ort.typ !== 'region' && ort.typ !== 'island') {
    return {
      art: 'nicht_unterstuetzt',
      schluessel: schluessel({ ...ortBasis, ortId: ort.id, countryCode: ort.countryCode, art: 'nicht_unterstuetzt' }),
      name: ort.name,
      zielArt: 'anders',
    }
  }
  const zielArt = ort.typ === 'city' ? 'stadt' : ort.typ === 'region' ? 'region' : 'insel'
  const bezug = oeffentlichenBezugBauen(
    { art: 'ort', ortId: ort.id, typ: ort.typ },
    eingabe.abbildung,
    gesperrtFuer(eingabe.reise),
  )
  if (!bezug) {
    return {
      art: 'nicht_unterstuetzt',
      schluessel: schluessel({ ...ortBasis, ortId: ort.id, countryCode: ort.countryCode, art: 'nicht_unterstuetzt' }),
      name: ort.name,
      zielArt,
    }
  }
  return {
    art: 'bereit',
    schluessel: schluessel({ ...ortBasis, ortId: ort.id, countryCode: ort.countryCode, art: 'bereit' }),
    bezug,
    name: ort.name,
    zielArt,
  }
}
