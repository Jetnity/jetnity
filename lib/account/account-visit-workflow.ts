// lib/account/account-visit-workflow.ts
//
// Reine Ablaufregeln für Bestätigen, Ändern und Widerrufen.
//
// Kein React, kein Router, kein Speicher, kein Server-Action-Import.
// Eine angenommene Antwort ist keine Listenbeobachtung. Eine veränderte
// angezeigte Liste ist kein Beweis für einen neueren Datenbankstand.
// Anlegen liefert keine Ereignis-Id und wird keiner Zeile zugeordnet.

import { besuchZeitText, type Besuch } from '@/lib/account/besuche'

export const VISIT_PRUEFUNG_MS = 4000

export type VisitFormularWert = {
  ort: { id: string; name: string } | null
  countryCode: string
  jahr: string
  monat: string
  tag: string
}

export type KanonischeFelder = {
  placeId: string | null
  countryCode: string | null
  jahr: number | null
  monat: number | null
  tag: number | null
}

export type VisitEingabe = KanonischeFelder

export type VisitAusgang = { art: 'angenommen' } | { art: 'unbestaetigt' }

export type VisitKonflikt = 'keiner' | 'felder' | 'entfernt'

export type VisitSurface = 'anlegen' | `ereignis:${string}`

export type VisitEntwurf = {
  surface: VisitSurface
  ereignisId: string | null
  felder: VisitFormularWert
  basis: KanonischeFelder | null
  dirty: boolean
  konflikt: VisitKonflikt
  epoche: number
  lokalerHinweis: string | null
  ansehen: boolean
  erneutBereit: boolean
  beobachtung: string | null
  anzeigeText: string | null
}

export type VisitBestaetigung = {
  id: string
  ereignisId: string
  basis: KanonischeFelder
  konflikt: VisitKonflikt
  epoche: number
  beobachtung: string | null
  anzeigeText: string | null
  lokalerHinweis: string | null
}

export type VisitPhase = 'unterwegs' | 'unbestaetigt' | 'angenommen'

export type VisitInhalt = 'ausstehend' | 'gleich' | 'anders' | 'lesefehler'

export type VisitVorgang = {
  id: string
  art: 'bestaetigen' | 'aendern' | 'widerrufen'
  surface: VisitSurface
  ereignisId: string | null
  eingabe: VisitEingabe | null
  entwurfEpoche: number
  bestaetigungId: string | null
  bestaetigungEpoche: number | null
  basisBeiStart: KanonischeFelder | null
  phase: VisitPhase
  stempelGesehen: readonly string[]
  lesenAngefordert: boolean
  pruefung: 'aus' | 'offen' | 'beendet'
  pruefungSeit: number | null
  inhaltBeobachtet: VisitInhalt
  blockerOffen: boolean
}

export type VisitStand = {
  anlegen: VisitEntwurf
  editor: VisitEntwurf | null
  bestaetigung: VisitBestaetigung | null
  vorgaenge: readonly VisitVorgang[]
  epoche: number
}

export type VisitListe = {
  problem: { status: 500 | 503; message: string } | null
  besuche: readonly Besuch[]
}

const VISIT_FORMULAR_LEER: VisitFormularWert = {
  ort: null,
  countryCode: '',
  jahr: '',
  monat: '',
  tag: '',
}

function zahlOderNull(wert: string): number | null {
  const getrimmt = wert.trim()
  if (!getrimmt) return null
  const zahl = Number(getrimmt)
  return Number.isInteger(zahl) ? zahl : Number.NaN
}

function visitEingabeAus(wert: VisitFormularWert): VisitEingabe {
  return {
    placeId: wert.ort?.id ?? null,
    countryCode: wert.ort ? null : wert.countryCode.trim() || null,
    jahr: zahlOderNull(wert.jahr),
    monat: zahlOderNull(wert.monat),
    tag: zahlOderNull(wert.tag),
  }
}

function visitKanonisch(besuch: Besuch): KanonischeFelder {
  return {
    placeId: besuch.placeId,
    countryCode: besuch.placeId ? null : besuch.countryCode,
    jahr: besuch.jahr,
    monat: besuch.monat,
    tag: besuch.tag,
  }
}

function visitFelderAusBesuch(besuch: Besuch): VisitFormularWert {
  return {
    ort: besuch.placeId && besuch.placeLabel ? { id: besuch.placeId, name: besuch.placeLabel } : null,
    countryCode: besuch.placeId ? '' : (besuch.countryCode ?? ''),
    jahr: besuch.jahr === null ? '' : String(besuch.jahr),
    monat: besuch.monat === null ? '' : String(besuch.monat),
    tag: besuch.tag === null ? '' : String(besuch.tag),
  }
}

function felderGleich(links: KanonischeFelder | null, rechts: KanonischeFelder | null): boolean {
  if (!links || !rechts) return links === rechts
  return (
    links.placeId === rechts.placeId &&
    links.countryCode === rechts.countryCode &&
    links.jahr === rechts.jahr &&
    links.monat === rechts.monat &&
    links.tag === rechts.tag
  )
}

function anzeigeText(besuch: Besuch): string {
  const name = besuch.placeLabel ?? besuch.countryCode ?? 'Besuch'
  return `${name} · ${besuchZeitText(besuch)}`
}

export function visitFormularLeer(wert: VisitFormularWert): boolean {
  return (
    wert.ort === null &&
    wert.countryCode.trim() === '' &&
    wert.jahr.trim() === '' &&
    wert.monat.trim() === '' &&
    wert.tag.trim() === ''
  )
}

function entwurfLeer(surface: VisitSurface, epoche: number, leer: VisitFormularWert = VISIT_FORMULAR_LEER): VisitEntwurf {
  return {
    surface,
    ereignisId: surface === 'anlegen' ? null : surface.slice('ereignis:'.length),
    felder: { ...leer },
    basis: null,
    dirty: false,
    konflikt: 'keiner',
    epoche,
    lokalerHinweis: null,
    ansehen: false,
    erneutBereit: false,
    beobachtung: null,
    anzeigeText: null,
  }
}

export function visitWorkflowAnfang(jetztEpoche = 1, leer: VisitFormularWert = VISIT_FORMULAR_LEER): VisitStand {
  return {
    anlegen: entwurfLeer('anlegen', jetztEpoche, leer),
    editor: null,
    bestaetigung: null,
    vorgaenge: [],
    epoche: jetztEpoche,
  }
}

export function visitStempel(besuche: readonly Besuch[]): string {
  const zeilen = besuche
    .map((besuch) => ({
      id: besuch.id,
      placeId: besuch.placeId,
      countryCode: besuch.countryCode,
      jahr: besuch.jahr,
      monat: besuch.monat,
      tag: besuch.tag,
    }))
    .sort((links, rechts) => (links.id < rechts.id ? -1 : links.id > rechts.id ? 1 : 0))
  return JSON.stringify(zeilen)
}

export function visitAusgangLesen(wert: unknown): VisitAusgang {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return { art: 'unbestaetigt' }
  const schluessel = Object.keys(wert)
  if (schluessel.length !== 2 || !schluessel.includes('ok') || !schluessel.includes('wert')) {
    return { art: 'unbestaetigt' }
  }
  const eintrag = wert as { ok: unknown; wert: unknown }
  if (eintrag.ok === true && eintrag.wert === null) return { art: 'angenommen' }
  return { art: 'unbestaetigt' }
}

export function visitDispatchStart(
  gehalten: string | null,
  id: string,
): { gehalten: string; starten: boolean } {
  if (gehalten !== null) return { gehalten, starten: false }
  return { gehalten: id, starten: true }
}

export async function visitThunkBeenden(
  aufruf: () => Promise<unknown>,
  anwenden: (ausgang: VisitAusgang) => void,
  freigeben: () => void,
): Promise<void> {
  let wert: unknown
  try {
    wert = await aufruf()
  } catch {
    wert = undefined
  } finally {
    try {
      anwenden(visitAusgangLesen(wert))
    } finally {
      freigeben()
    }
  }
}

function naechsteEpoche(stand: VisitStand): { stand: VisitStand; epoche: number } {
  const epoche = stand.epoche + 1
  return { stand: { ...stand, epoche }, epoche }
}

function entwurfErsetzen(stand: VisitStand, entwurf: VisitEntwurf): VisitStand {
  if (entwurf.surface === 'anlegen') return { ...stand, anlegen: entwurf }
  return { ...stand, editor: entwurf }
}

function entwurfVon(stand: VisitStand, surface: VisitSurface): VisitEntwurf | null {
  if (surface === 'anlegen') return stand.anlegen
  if (stand.editor?.surface === surface) return stand.editor
  return null
}

export function visitAnlegenSetzen(stand: VisitStand, felder: VisitFormularWert): VisitStand {
  const { stand: basis, epoche } = naechsteEpoche(stand)
  return {
    ...basis,
    anlegen: {
      ...basis.anlegen,
      felder,
      dirty: !visitFormularLeer(felder),
      epoche,
      lokalerHinweis: null,
      erneutBereit: false,
    },
  }
}

export function visitEditorOeffnen(stand: VisitStand, besuch: Besuch, felder: VisitFormularWert): VisitStand {
  if (stand.editor && (stand.editor.dirty || stand.editor.konflikt !== 'keiner' || visitSurfaceUnterwegs(stand, stand.editor.surface))) {
    return stand
  }
  const { stand: basis, epoche } = naechsteEpoche(stand)
  return {
    ...basis,
    editor: {
      ...entwurfLeer(`ereignis:${besuch.id}`, epoche),
      felder,
      basis: visitKanonisch(besuch),
      anzeigeText: anzeigeText(besuch),
    },
  }
}

export function visitEditorSetzen(stand: VisitStand, felder: VisitFormularWert): VisitStand {
  if (!stand.editor) return stand
  const { stand: basis, epoche } = naechsteEpoche(stand)
  return {
    ...basis,
    editor: {
      ...basis.editor!,
      felder,
      dirty: true,
      epoche,
      lokalerHinweis: null,
      erneutBereit: false,
    },
  }
}

export function visitSurfaceUnterwegs(stand: VisitStand, surface: VisitSurface): boolean {
  return stand.vorgaenge.some((vorgang) => vorgang.surface === surface && vorgang.phase === 'unterwegs')
}

export function visitBestaetigungUnterwegs(stand: VisitStand, id: string): boolean {
  return stand.vorgaenge.some(
    (vorgang) => vorgang.phase === 'unterwegs' && vorgang.bestaetigungId === id,
  )
}

export function visitEditorSchliessen(stand: VisitStand): VisitStand {
  if (!stand.editor) return stand
  if (visitSurfaceUnterwegs(stand, stand.editor.surface)) return stand
  return { ...stand, editor: null }
}

export function visitBestaetigungOeffnen(stand: VisitStand, besuch: Besuch, id: string): VisitStand {
  const { stand: basis, epoche } = naechsteEpoche(stand)
  return {
    ...basis,
    bestaetigung: {
      id,
      ereignisId: besuch.id,
      basis: visitKanonisch(besuch),
      konflikt: 'keiner',
      epoche,
      beobachtung: null,
      anzeigeText: anzeigeText(besuch),
      lokalerHinweis: null,
    },
  }
}

export function visitBestaetigungSchliessen(stand: VisitStand): VisitStand {
  if (!stand.bestaetigung) return stand
  if (visitBestaetigungUnterwegs(stand, stand.bestaetigung.id)) return stand
  return { ...stand, bestaetigung: null }
}

export function visitErneutBestaetigen(stand: VisitStand, besuch: Besuch, id: string): VisitStand {
  if (!stand.bestaetigung || stand.bestaetigung.ereignisId !== besuch.id) return stand
  if (stand.bestaetigung.konflikt !== 'felder') return stand
  const { stand: basis, epoche } = naechsteEpoche(stand)
  return {
    ...basis,
    bestaetigung: {
      id,
      ereignisId: besuch.id,
      basis: visitKanonisch(besuch),
      konflikt: 'keiner',
      epoche,
      beobachtung: null,
      anzeigeText: anzeigeText(besuch),
      lokalerHinweis: null,
    },
  }
}

export function visitHinweis(stand: VisitStand, surface: VisitSurface, meldung: string): VisitStand {
  if (stand.bestaetigung && `ereignis:${stand.bestaetigung.ereignisId}` === surface) {
    return { ...stand, bestaetigung: { ...stand.bestaetigung, lokalerHinweis: meldung } }
  }
  const entwurf = entwurfVon(stand, surface)
  if (!entwurf) return stand
  return entwurfErsetzen(stand, { ...entwurf, lokalerHinweis: meldung })
}

function blockerOffen(stand: VisitStand, surface: VisitSurface, art?: VisitAufnahme['art']): boolean {
  return stand.vorgaenge.some(
    (vorgang) =>
      vorgang.surface === surface &&
      (art === undefined || vorgang.art === art) &&
      vorgang.phase === 'unbestaetigt' &&
      vorgang.blockerOffen,
  )
}

export type VisitAufnahme =
  | { art: 'bestaetigen'; felder: VisitFormularWert }
  | { art: 'aendern'; id: string; felder: VisitFormularWert }
  | { art: 'widerrufen'; id: string; bestaetigung: VisitBestaetigung }

export function visitAufnehmen(
  stand: VisitStand,
  id: string,
  aufnahme: VisitAufnahme,
  liste: VisitListe,
  bewusst = false,
): { ok: true; stand: VisitStand } | { ok: false; stand: VisitStand } {
  if (liste.problem) return { ok: false, stand }
  const surface: VisitSurface = aufnahme.art === 'bestaetigen' ? 'anlegen' : `ereignis:${aufnahme.id}`
  if (!bewusst && blockerOffen(stand, surface, aufnahme.art)) return { ok: false, stand }
  if (!bewusst && aufnahme.art !== 'widerrufen' && blockerOffen(stand, surface)) return { ok: false, stand }
  if (visitSurfaceUnterwegs(stand, surface) && aufnahme.art !== 'widerrufen') return { ok: false, stand }

  let arbeitsstand = stand
  if (aufnahme.art === 'widerrufen') {
    const bestaetigung = arbeitsstand.bestaetigung
    if (
      !bestaetigung ||
      bestaetigung.id !== aufnahme.bestaetigung.id ||
      bestaetigung.ereignisId !== aufnahme.id ||
      bestaetigung.konflikt !== 'keiner'
    ) {
      return { ok: false, stand }
    }
    if (!liste.besuche.some((besuch) => besuch.id === aufnahme.id)) return { ok: false, stand }
  } else if (aufnahme.art === 'aendern') {
    const editor = arbeitsstand.editor
    if (!editor || editor.ereignisId !== aufnahme.id) return { ok: false, stand }
    if (editor.konflikt !== 'keiner' && !editor.erneutBereit) return { ok: false, stand }
    if (!liste.besuche.some((besuch) => besuch.id === aufnahme.id)) return { ok: false, stand }
  }

  const hatAelteren = arbeitsstand.vorgaenge.some((vorgang) => vorgang.surface === surface)
  if (hatAelteren) {
    const gebumpt = naechsteEpoche(arbeitsstand)
    arbeitsstand = gebumpt.stand
    if (surface === 'anlegen') {
      arbeitsstand = { ...arbeitsstand, anlegen: { ...arbeitsstand.anlegen, epoche: gebumpt.epoche } }
    } else if (arbeitsstand.editor?.surface === surface) {
      arbeitsstand = { ...arbeitsstand, editor: { ...arbeitsstand.editor, epoche: gebumpt.epoche } }
    }
    if (aufnahme.art === 'widerrufen' && arbeitsstand.bestaetigung?.ereignisId === aufnahme.id) {
      arbeitsstand = {
        ...arbeitsstand,
        bestaetigung: { ...arbeitsstand.bestaetigung, epoche: gebumpt.epoche },
      }
    }
  }

  const entwurf = entwurfVon(arbeitsstand, surface)
  const bestaetigung = aufnahme.art === 'widerrufen' ? arbeitsstand.bestaetigung : null
  const stempel = visitStempel(liste.besuche)
  const vorgang: VisitVorgang = {
    id,
    art: aufnahme.art,
    surface,
    ereignisId: aufnahme.art === 'bestaetigen' ? null : aufnahme.id,
    eingabe: aufnahme.art === 'widerrufen' ? null : visitEingabeAus(aufnahme.felder),
    entwurfEpoche: entwurf?.epoche ?? arbeitsstand.epoche,
    bestaetigungId: bestaetigung?.id ?? null,
    bestaetigungEpoche: bestaetigung?.epoche ?? null,
    basisBeiStart: aufnahme.art === 'aendern' ? (entwurf?.basis ?? null) : (bestaetigung?.basis ?? null),
    phase: 'unterwegs',
    stempelGesehen: [stempel],
    lesenAngefordert: false,
    pruefung: 'aus',
    pruefungSeit: null,
    inhaltBeobachtet: 'ausstehend',
    blockerOffen: false,
  }
  const vorgaenge = arbeitsstand.vorgaenge.map((alt) =>
    alt.surface === surface && alt.blockerOffen ? { ...alt, blockerOffen: false } : alt,
  )
  const ohneBereit =
    aufnahme.art === 'aendern' && arbeitsstand.editor
      ? { ...arbeitsstand, editor: { ...arbeitsstand.editor, erneutBereit: false, lokalerHinweis: null } }
      : surface === 'anlegen'
        ? { ...arbeitsstand, anlegen: { ...arbeitsstand.anlegen, lokalerHinweis: null } }
        : arbeitsstand
  return { ok: true, stand: { ...ohneBereit, vorgaenge: [...vorgaenge, vorgang] } }
}

function editorSchliessenWennPassend(stand: VisitStand, vorgang: VisitVorgang): VisitStand {
  if (vorgang.art === 'widerrufen') return stand
  if (vorgang.art === 'bestaetigen') {
    const entwurf = stand.anlegen
    if (entwurf.epoche !== vorgang.entwurfEpoche || entwurf.konflikt !== 'keiner') return stand
    const { stand: basis, epoche } = naechsteEpoche(stand)
    return { ...basis, anlegen: entwurfLeer('anlegen', epoche) }
  }
  const editor = stand.editor
  if (!editor || editor.surface !== vorgang.surface) return stand
  if (editor.epoche !== vorgang.entwurfEpoche || editor.konflikt !== 'keiner') return stand
  if (editor.ereignisId !== vorgang.ereignisId) return stand
  return { ...stand, editor: null }
}

function bestaetigungSchliessenWennPassend(stand: VisitStand, vorgang: VisitVorgang): VisitStand {
  if (vorgang.art !== 'widerrufen' || !stand.bestaetigung) return stand
  const bestaetigung = stand.bestaetigung
  if (bestaetigung.id !== vorgang.bestaetigungId) return stand
  if (bestaetigung.epoche !== vorgang.bestaetigungEpoche) return stand
  if (bestaetigung.ereignisId !== vorgang.ereignisId) return stand
  if (bestaetigung.konflikt !== 'keiner') return stand
  return { ...stand, bestaetigung: null }
}

export function visitAnwenden(stand: VisitStand, id: string, ausgang: VisitAusgang, jetzt: number): VisitStand {
  const index = stand.vorgaenge.findIndex((vorgang) => vorgang.id === id)
  if (index < 0) return stand
  const bisher = stand.vorgaenge[index]!
  const phase: VisitPhase = ausgang.art === 'angenommen' ? 'angenommen' : 'unbestaetigt'
  const aktualisiert: VisitVorgang = {
    ...bisher,
    phase,
    lesenAngefordert: phase === 'angenommen',
    pruefung: phase === 'angenommen' ? 'offen' : 'aus',
    pruefungSeit: phase === 'angenommen' ? jetzt : null,
    blockerOffen: phase === 'unbestaetigt',
    inhaltBeobachtet: bisher.inhaltBeobachtet,
  }
  let naechster: VisitStand = {
    ...stand,
    vorgaenge: stand.vorgaenge.map((vorgang, stelle) => (stelle === index ? aktualisiert : vorgang)),
  }
  if (phase === 'angenommen') {
    naechster = editorSchliessenWennPassend(naechster, aktualisiert)
    naechster = bestaetigungSchliessenWennPassend(naechster, aktualisiert)
  }
  return naechster
}

function stempelMerken(vorgang: VisitVorgang, stempel: string, unterwegs: boolean): VisitVorgang {
  if (unterwegs) {
    if (vorgang.stempelGesehen.includes(stempel)) return vorgang
    return { ...vorgang, stempelGesehen: [...vorgang.stempelGesehen, stempel] }
  }
  if (vorgang.inhaltBeobachtet === 'lesefehler' || vorgang.inhaltBeobachtet === 'anders') return vorgang
  const gesehen = vorgang.stempelGesehen.includes(stempel)
  const inhalt: VisitInhalt = gesehen ? 'gleich' : 'anders'
  if (vorgang.inhaltBeobachtet === inhalt) return vorgang
  return { ...vorgang, inhaltBeobachtet: inhalt }
}

function entwurfBeobachten(
  entwurf: VisitEntwurf,
  liste: VisitListe,
  unterwegs: boolean,
): VisitEntwurf {
  if (!entwurf.ereignisId || liste.problem) return entwurf
  const besuch = liste.besuche.find((eintrag) => eintrag.id === entwurf.ereignisId)
  if (!besuch) {
    if (entwurf.konflikt === 'entfernt' && entwurf.beobachtung === 'entfernt') return entwurf
    return {
      ...entwurf,
      konflikt: 'entfernt',
      epoche: unterwegs ? entwurf.epoche + 1 : entwurf.epoche,
      beobachtung: 'entfernt',
      ansehen: false,
      erneutBereit: false,
    }
  }
  const kanonisch = visitKanonisch(besuch)
  const signatur = JSON.stringify(kanonisch)
  if (felderGleich(kanonisch, entwurf.basis)) {
    if (entwurf.konflikt === 'keiner') return entwurf
    return entwurf
  }
  if (entwurf.beobachtung === signatur && entwurf.konflikt !== 'keiner') return entwurf
  if (unterwegs || entwurf.dirty) {
    return {
      ...entwurf,
      konflikt: 'felder',
      epoche: unterwegs ? entwurf.epoche + 1 : entwurf.epoche,
      beobachtung: signatur,
      anzeigeText: anzeigeText(besuch),
      ansehen: false,
      erneutBereit: false,
    }
  }
  return {
    ...entwurf,
    felder: visitFelderAusBesuch(besuch),
    basis: kanonisch,
    dirty: false,
    konflikt: 'keiner',
    epoche: entwurf.epoche + 1,
    beobachtung: signatur,
    anzeigeText: anzeigeText(besuch),
    ansehen: false,
    erneutBereit: false,
    lokalerHinweis: null,
  }
}

function bestaetigungBeobachten(
  bestaetigung: VisitBestaetigung,
  liste: VisitListe,
  unterwegs: boolean,
): VisitBestaetigung {
  if (liste.problem) return bestaetigung
  const besuch = liste.besuche.find((eintrag) => eintrag.id === bestaetigung.ereignisId)
  if (!besuch) {
    if (bestaetigung.konflikt === 'entfernt' && bestaetigung.beobachtung === 'entfernt') return bestaetigung
    return {
      ...bestaetigung,
      konflikt: 'entfernt',
      epoche: unterwegs ? bestaetigung.epoche + 1 : bestaetigung.epoche,
      beobachtung: 'entfernt',
    }
  }
  const kanonisch = visitKanonisch(besuch)
  const signatur = JSON.stringify(kanonisch)
  if (felderGleich(kanonisch, bestaetigung.basis)) return bestaetigung
  if (bestaetigung.beobachtung === signatur && bestaetigung.konflikt === 'felder') return bestaetigung
  return {
    ...bestaetigung,
    konflikt: 'felder',
    epoche: bestaetigung.epoche + 1,
    beobachtung: signatur,
    anzeigeText: anzeigeText(besuch),
  }
}

export function visitPropsBeobachten(stand: VisitStand, liste: VisitListe): VisitStand {
  const gueltig = liste.problem === null
  const stempel = gueltig ? visitStempel(liste.besuche) : null
  let vorgangGeaendert = false
  const vorgaenge = stand.vorgaenge.map((vorgang) => {
    let naechster = vorgang
    if (vorgang.pruefung === 'offen') naechster = { ...naechster, pruefung: 'beendet' }
    if (!gueltig) {
      if (naechster.phase !== 'unterwegs' && naechster.inhaltBeobachtet !== 'lesefehler') {
        naechster = { ...naechster, inhaltBeobachtet: 'lesefehler' }
      }
    } else {
      naechster = stempelMerken(naechster, stempel!, naechster.phase === 'unterwegs')
    }
    if (naechster !== vorgang) vorgangGeaendert = true
    return naechster
  })
  let naechster: VisitStand = vorgangGeaendert ? { ...stand, vorgaenge } : stand
  if (!gueltig) return naechster
  if (naechster.editor) {
    const unterwegs = visitSurfaceUnterwegs(naechster, naechster.editor.surface)
    const editor = entwurfBeobachten(naechster.editor, liste, unterwegs)
    if (editor !== naechster.editor) {
      naechster = {
        ...naechster,
        epoche: Math.max(naechster.epoche, editor.epoche),
        editor,
      }
    }
  }
  if (naechster.bestaetigung) {
    const unterwegs =
      visitBestaetigungUnterwegs(naechster, naechster.bestaetigung.id) ||
      visitSurfaceUnterwegs(naechster, `ereignis:${naechster.bestaetigung.ereignisId}`)
    const bestaetigung = bestaetigungBeobachten(naechster.bestaetigung, liste, unterwegs)
    if (bestaetigung !== naechster.bestaetigung) {
      naechster = {
        ...naechster,
        epoche: Math.max(naechster.epoche, bestaetigung.epoche),
        bestaetigung,
      }
    }
  }
  return naechster
}

export function visitPruefungOeffnen(stand: VisitStand, id: string, jetzt: number): VisitStand {
  if (stand.vorgaenge.some((vorgang) => vorgang.pruefung === 'offen')) return stand
  const index = stand.vorgaenge.findIndex((vorgang) => vorgang.id === id)
  if (index < 0) return stand
  const vorgang = stand.vorgaenge[index]!
  if (vorgang.phase === 'unterwegs') return stand
  const aktualisiert: VisitVorgang = { ...vorgang, pruefung: 'offen', pruefungSeit: jetzt }
  return {
    ...stand,
    vorgaenge: stand.vorgaenge.map((eintrag, stelle) => (stelle === index ? aktualisiert : eintrag)),
  }
}

export function visitPruefungBeenden(stand: VisitStand, id: string): VisitStand {
  return {
    ...stand,
    vorgaenge: stand.vorgaenge.map((vorgang) =>
      vorgang.id === id && vorgang.pruefung === 'offen'
        ? { ...vorgang, pruefung: 'beendet' }
        : vorgang,
    ),
  }
}

export function visitVorgangSchliessen(stand: VisitStand, id: string): VisitStand {
  return {
    ...stand,
    vorgaenge: stand.vorgaenge.map((vorgang) =>
      vorgang.id === id ? { ...vorgang, blockerOffen: false } : vorgang,
    ),
  }
}

export function visitAenderungenAnsehen(stand: VisitStand): VisitStand {
  if (!stand.editor || stand.editor.konflikt !== 'felder') return stand
  return { ...stand, editor: { ...stand.editor, ansehen: true } }
}

export function visitListeUebernehmen(stand: VisitStand, besuch: Besuch): VisitStand {
  if (!stand.editor || stand.editor.ereignisId !== besuch.id || stand.editor.konflikt !== 'felder') return stand
  if (visitSurfaceUnterwegs(stand, stand.editor.surface)) return stand
  const { stand: basis, epoche } = naechsteEpoche(stand)
  return {
    ...basis,
    editor: {
      ...basis.editor!,
      felder: visitFelderAusBesuch(besuch),
      basis: visitKanonisch(besuch),
      dirty: false,
      konflikt: 'keiner',
      epoche,
      ansehen: false,
      erneutBereit: false,
      beobachtung: JSON.stringify(visitKanonisch(besuch)),
      anzeigeText: anzeigeText(besuch),
    },
  }
}

export function visitEntwurfBewaffnen(stand: VisitStand, besuch: Besuch): VisitStand {
  if (!stand.editor || stand.editor.ereignisId !== besuch.id || stand.editor.konflikt !== 'felder') return stand
  if (visitSurfaceUnterwegs(stand, stand.editor.surface)) return stand
  const { stand: basis, epoche } = naechsteEpoche(stand)
  return {
    ...basis,
    editor: {
      ...basis.editor!,
      basis: visitKanonisch(besuch),
      konflikt: 'keiner',
      erneutBereit: true,
      epoche,
      ansehen: false,
      beobachtung: JSON.stringify(visitKanonisch(besuch)),
    },
  }
}

export function visitEntwurfVerwerfen(
  stand: VisitStand,
  surface: VisitSurface,
  leer: VisitFormularWert = VISIT_FORMULAR_LEER,
): VisitStand {
  if (visitSurfaceUnterwegs(stand, surface)) return stand
  if (surface === 'anlegen') {
    const { stand: basis, epoche } = naechsteEpoche(stand)
    return { ...basis, anlegen: entwurfLeer('anlegen', epoche, leer) }
  }
  if (stand.editor?.surface !== surface) return stand
  return { ...stand, editor: null }
}

export function visitFokusErlaubt(lage: {
  sucheAktiv: boolean
  aufBody: boolean
  inSurface: boolean
  entwurfEpoche: number | null
  vorgangEpoche: number | null
}): boolean {
  if (lage.sucheAktiv) return false
  if (lage.entwurfEpoche !== null && lage.vorgangEpoche !== null && lage.entwurfEpoche > lage.vorgangEpoche) {
    return false
  }
  return lage.aufBody || lage.inSurface
}
