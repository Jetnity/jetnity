// lib/traveller/account-registry-workflow.ts
//
// Reine Zustände für die acht Konto-Registry-Schreibwege.
// Kein React, kein Router, keine Server Action.

import type { Problem } from '@/lib/api/datenbank-lesen'
import type { AccountRegistryTraveller } from '@/lib/traveller/account-registry'
import { registryDokumentCitizenshipId } from '@/lib/traveller/account-registry-anzeige'
import { registryKindLimitErreicht } from '@/lib/traveller/account-registry-eingabe'

export type RegistryAktion =
  | 'traveller-anlegen'
  | 'traveller-aendern'
  | 'traveller-loeschen'
  | 'citizenship-anlegen'
  | 'citizenship-loeschen'
  | 'document-anlegen'
  | 'document-aendern'
  | 'document-loeschen'

export type RegistryZiel = {
  travellerId: string | null
  citizenshipId: string | null
  documentId: string | null
}

export type RegistryBeleg = {
  id: string
  aktion: RegistryAktion
  schluessel: string
  editor: string
  surface: string
  epoche: number
  ziel: RegistryZiel
  payload: unknown
  ausgang: 'offen' | 'gespeichert' | 'abgewiesen' | 'unbestaetigt'
  meldung: string | null
  startStempel: string | null
  basisStempel: string | null
}

export type RegistrySlot = {
  editor: string
  surface: string
  epoche: number
  offen: boolean
  dirty: boolean
  konflikt: boolean
  felder: unknown
  basisFelder: unknown
  kontext: string
  neueFelder: unknown
  hinweis: string | null
}

export type RegistryProps = {
  problem: Problem | null
  travellers: AccountRegistryTraveller[] | null
}

export type RegistryFokus = {
  ziel: string
  bedingung: 'body' | 'editor-oder-body'
  editor: string | null
}

export type RegistryStand = {
  belege: RegistryBeleg[]
  slots: RegistrySlot[]
  epochen: Record<string, number>
  unterwegs: string[]
  props: RegistryProps
  sicht: string
  lesen: { offen: boolean; seit: number | null }
  fokus: RegistryFokus | null
  entferntNachAbschluss: string[]
}

export type RegistryAufruf = {
  editor: string
  payload: unknown
  anerkennung?: { belegId: string; schluessel: string } | null
}

export type RegistryVersuch = {
  id: string
  aktion: RegistryAktion
  editor: string
  surface: string
  epoche: number
  ziel: RegistryZiel
  payload: unknown
}

export type RegistryAusgang =
  | { art: 'gespeichert' }
  | { art: 'abgewiesen'; meldung: string }
  | { art: 'unbestaetigt' }

export type IdQuelle = { naechste: () => string }

export type FokusLage = { innen: string | null; traeger: string | null; aufBody: boolean }

export type ListenBild = { nichtGeladen: boolean; neu: boolean; fehlt: boolean }

const LEER_ZIEL: RegistryZiel = { travellerId: null, citizenshipId: null, documentId: null }

export function registryWorkflowAnfang(): RegistryStand {
  return {
    belege: [],
    slots: [],
    epochen: {},
    unterwegs: [],
    props: { problem: null, travellers: null },
    sicht: '',
    lesen: { offen: false, seit: null },
    fokus: null,
    entferntNachAbschluss: [],
  }
}

export function registryListeKlasse(props: RegistryProps): 'gueltig' | 'fehler' | 'ungueltig' {
  if (props.problem?.status === 500 || props.problem?.status === 503) return 'fehler'
  if (props.problem) return 'ungueltig'
  if (!Array.isArray(props.travellers)) return 'ungueltig'
  return 'gueltig'
}

function registryListeStempel(travellers: readonly AccountRegistryTraveller[]): string {
  return JSON.stringify(
    travellers.map((traveller) => [
      traveller.id,
      traveller.facts.label,
      traveller.facts.residenceCountryCode,
      traveller.facts.citizenships.map((eintrag) => [eintrag.id, eintrag.countryCode]),
      traveller.facts.documents.map((eintrag) => [
        eintrag.id,
        eintrag.documentType,
        eintrag.issuingCountryCode,
        registryDokumentCitizenshipId(eintrag.citizenshipClientRef, traveller.facts.citizenships) ||
          eintrag.citizenshipClientRef,
        eintrag.expiresOn,
      ]),
    ]),
  )
}

function sichtVon(props: RegistryProps): string {
  const klasse = registryListeKlasse(props)
  if (klasse !== 'gueltig') return `${klasse}:${props.problem?.status ?? 'x'}`
  return `gueltig:${registryListeStempel(props.travellers ?? [])}`
}

function text(wert: unknown): string {
  return JSON.stringify(wert) ?? 'null'
}

function gleich(links: unknown, rechts: unknown): boolean {
  return text(links) === text(rechts)
}

function gueltigeListe(props: RegistryProps): AccountRegistryTraveller[] | null {
  return registryListeKlasse(props) === 'gueltig' ? (props.travellers ?? []) : null
}

export function registryAktuellerBlocker(stand: RegistryStand, schluessel: string): RegistryBeleg | null {
  let blocker: RegistryBeleg | null = null
  for (const beleg of stand.belege) {
    if (beleg.schluessel === schluessel && beleg.ausgang === 'unbestaetigt') blocker = beleg
  }
  return blocker
}

export function registrySlot(stand: RegistryStand, editor: string): RegistrySlot | null {
  return stand.slots.find((slot) => slot.editor === editor) ?? null
}

function person(liste: readonly AccountRegistryTraveller[], id: string | null): AccountRegistryTraveller | null {
  if (!id) return null
  return liste.find((eintrag) => eintrag.id === id) ?? null
}

function personMitCitizenship(liste: readonly AccountRegistryTraveller[], id: string): AccountRegistryTraveller | null {
  return liste.find((eintrag) => eintrag.facts.citizenships.some((staat) => staat.id === id)) ?? null
}

function personMitDokument(liste: readonly AccountRegistryTraveller[], id: string): AccountRegistryTraveller | null {
  return liste.find((eintrag) => eintrag.facts.documents.some((dokument) => dokument.id === id)) ?? null
}

type EditorBild = { aktion: RegistryAktion; surface: string; ziel: RegistryZiel }

function editorBild(editor: string, liste: readonly AccountRegistryTraveller[] | null): EditorBild | null {
  if (editor === 'anlegen') {
    return { aktion: 'traveller-anlegen', surface: 'anlegen', ziel: LEER_ZIEL }
  }
  const teile = editor.split(':')
  if (teile.length !== 3) return null
  const [art, id, tat] = teile
  if (!id) return null
  if (art === 'reisender' && tat === 'aendern') {
    return { aktion: 'traveller-aendern', surface: `reisender:${id}`, ziel: { ...LEER_ZIEL, travellerId: id } }
  }
  if (art === 'reisender' && tat === 'loeschen') {
    return { aktion: 'traveller-loeschen', surface: `reisender:${id}`, ziel: { ...LEER_ZIEL, travellerId: id } }
  }
  if (art === 'reisender' && tat === 'citizenship-anlegen') {
    return {
      aktion: 'citizenship-anlegen',
      surface: `reisender:${id}`,
      ziel: { ...LEER_ZIEL, travellerId: id },
    }
  }
  if (art === 'reisender' && tat === 'document-anlegen') {
    return { aktion: 'document-anlegen', surface: `reisender:${id}`, ziel: { ...LEER_ZIEL, travellerId: id } }
  }
  if (art === 'citizenship' && tat === 'loeschen') {
    const traeger = liste ? personMitCitizenship(liste, id) : null
    return {
      aktion: 'citizenship-loeschen',
      surface: traeger ? `reisender:${traeger.id}` : '',
      ziel: { travellerId: traeger?.id ?? null, citizenshipId: id, documentId: null },
    }
  }
  if (art === 'document' && tat === 'aendern') {
    const traeger = liste ? personMitDokument(liste, id) : null
    return {
      aktion: 'document-aendern',
      surface: traeger ? `reisender:${traeger.id}` : '',
      ziel: { travellerId: traeger?.id ?? null, citizenshipId: null, documentId: id },
    }
  }
  if (art === 'document' && tat === 'loeschen') {
    const traeger = liste ? personMitDokument(liste, id) : null
    return {
      aktion: 'document-loeschen',
      surface: traeger ? `reisender:${traeger.id}` : '',
      ziel: { travellerId: traeger?.id ?? null, citizenshipId: null, documentId: id },
    }
  }
  return null
}

function zielErlaubt(bild: EditorBild, liste: readonly AccountRegistryTraveller[]): boolean {
  if (bild.aktion === 'traveller-anlegen') return true
  const traeger = person(liste, bild.ziel.travellerId)
  if (bild.aktion === 'traveller-aendern' || bild.aktion === 'traveller-loeschen') return traeger != null
  if (!traeger) return false
  if (bild.aktion === 'citizenship-anlegen') {
    return !registryKindLimitErreicht('citizenship', traeger.facts.citizenships.length)
  }
  if (bild.aktion === 'citizenship-loeschen') {
    return traeger.facts.citizenships.some((eintrag) => eintrag.id === bild.ziel.citizenshipId)
  }
  if (bild.aktion === 'document-anlegen') {
    return !registryKindLimitErreicht('document', traeger.facts.documents.length)
  }
  return traeger.facts.documents.some((eintrag) => eintrag.id === bild.ziel.documentId)
}

function zielFehlt(beleg: RegistryBeleg, liste: readonly AccountRegistryTraveller[]): boolean {
  if (beleg.aktion === 'traveller-anlegen') return false
  if (beleg.aktion === 'citizenship-loeschen') return !personMitCitizenship(liste, beleg.ziel.citizenshipId ?? '')
  if (beleg.aktion === 'document-aendern' || beleg.aktion === 'document-loeschen') {
    return !personMitDokument(liste, beleg.ziel.documentId ?? '')
  }
  return !person(liste, beleg.ziel.travellerId)
}

export function registryKanonisch(
  editor: string,
  props: RegistryProps,
): { felder: unknown; kontext: string } | null {
  const liste = gueltigeListe(props)
  if (!liste) return null
  const teile = editor.split(':')
  if (teile[0] === 'reisender' && teile[2] === 'aendern') {
    const traeger = person(liste, teile[1] ?? null)
    if (!traeger) return null
    const felder = {
      label: traeger.facts.label ?? '',
      residenceCountryCode: traeger.facts.residenceCountryCode ?? '',
    }
    return { felder, kontext: text(felder) }
  }
  if (teile[0] === 'reisender' && teile[2] === 'citizenship-anlegen') {
    const traeger = person(liste, teile[1] ?? null)
    if (!traeger) return null
    return {
      felder: { countryCode: '' },
      kontext: traeger.facts.citizenships.map((eintrag) => `${eintrag.id}:${eintrag.countryCode}`).join('|'),
    }
  }
  if (teile[0] === 'reisender' && teile[2] === 'document-anlegen') {
    const traeger = person(liste, teile[1] ?? null)
    if (!traeger) return null
    return {
      felder: { documentType: '', issuingCountryCode: '', citizenshipId: '', expiresOn: '' },
      kontext: traeger.facts.citizenships.map((eintrag) => eintrag.id).join('|'),
    }
  }
  if (teile[0] === 'document' && teile[2] === 'aendern') {
    const traeger = personMitDokument(liste, teile[1] ?? '')
    const dokument = traeger?.facts.documents.find((eintrag) => eintrag.id === teile[1])
    if (!traeger || !dokument) return null
    const felder = {
      documentType: dokument.documentType,
      issuingCountryCode: dokument.issuingCountryCode ?? '',
      citizenshipId: registryDokumentCitizenshipId(dokument.citizenshipClientRef, traeger.facts.citizenships),
      expiresOn: dokument.expiresOn ?? '',
    }
    return {
      felder,
      kontext: `${text(felder)}#${traeger.facts.citizenships.map((eintrag) => eintrag.id).join('|')}`,
    }
  }
  return null
}

function hoechsteEpoche(stand: RegistryStand, editor: string): number {
  const benutzt = stand.epochen[editor] ?? 0
  return stand.belege.reduce(
    (max, beleg) => (beleg.editor === editor ? Math.max(max, beleg.epoche) : max),
    benutzt,
  )
}

function mitEpoche(stand: RegistryStand, editor: string): { stand: RegistryStand; epoche: number } {
  const epoche = hoechsteEpoche(stand, editor) + 1
  return { stand: { ...stand, epochen: { ...stand.epochen, [editor]: epoche } }, epoche }
}

function ersetzeSlot(stand: RegistryStand, slot: RegistrySlot): RegistryStand {
  const vorhanden = stand.slots.some((eintrag) => eintrag.editor === slot.editor)
  return {
    ...stand,
    slots: vorhanden
      ? stand.slots.map((eintrag) => (eintrag.editor === slot.editor ? slot : eintrag))
      : [...stand.slots, slot],
  }
}

export function registryEditorOeffnen(
  stand: RegistryStand,
  editor: string,
  surface: string,
  felder: unknown,
  kontext: string,
): RegistryStand {
  const vorhanden = registrySlot(stand, editor)
  if (vorhanden?.offen) return stand
  const gehoben = mitEpoche(stand, editor)
  const slot: RegistrySlot = vorhanden
    ? { ...vorhanden, surface, epoche: gehoben.epoche, offen: true }
    : {
        editor,
        surface,
        epoche: gehoben.epoche,
        offen: true,
        dirty: false,
        konflikt: false,
        felder,
        basisFelder: felder,
        kontext,
        neueFelder: felder,
        hinweis: null,
      }
  return ersetzeSlot(gehoben.stand, slot)
}

export function registryFeldSetzen(stand: RegistryStand, editor: string, felder: unknown): RegistryStand {
  const slot = registrySlot(stand, editor)
  if (!slot?.offen || gleich(slot.felder, felder)) return stand
  const gehoben = mitEpoche(stand, editor)
  return ersetzeSlot(gehoben.stand, {
    ...slot,
    felder,
    epoche: gehoben.epoche,
    dirty: !gleich(felder, slot.basisFelder),
    hinweis: null,
  })
}

export function registryHinweisSetzen(stand: RegistryStand, editor: string, hinweis: string | null): RegistryStand {
  const slot = registrySlot(stand, editor)
  if (!slot || slot.hinweis === hinweis) return stand
  return ersetzeSlot(stand, { ...slot, hinweis })
}

export function registryEditorSchliessen(stand: RegistryStand, editor: string): RegistryStand {
  const slot = registrySlot(stand, editor)
  if (!slot?.offen) return stand
  const gehoben = mitEpoche(stand, editor)
  return ersetzeSlot(gehoben.stand, { ...slot, offen: false, epoche: gehoben.epoche })
}

export function registrySurfaceSchliessen(stand: RegistryStand, surface: string): RegistryStand {
  return stand.slots
    .filter((slot) => slot.surface === surface && slot.offen)
    .reduce((aktuell, slot) => registryEditorSchliessen(aktuell, slot.editor), stand)
}

export function registryUebernehmen(stand: RegistryStand, editor: string): RegistryStand {
  const slot = registrySlot(stand, editor)
  if (!slot?.konflikt) return stand
  return ersetzeSlot(stand, {
    ...slot,
    felder: slot.neueFelder,
    basisFelder: slot.neueFelder,
    dirty: false,
    konflikt: false,
    hinweis: null,
  })
}

function anfangFelder(aktion: RegistryAktion, bisher: unknown): unknown {
  if (aktion === 'traveller-anlegen' || aktion === 'traveller-aendern') {
    return { label: '', residenceCountryCode: '' }
  }
  if (aktion === 'citizenship-anlegen') return { countryCode: '' }
  if (aktion === 'document-anlegen' || aktion === 'document-aendern') {
    return { documentType: '', issuingCountryCode: '', citizenshipId: '', expiresOn: '' }
  }
  return bisher
}

function editorWeg(editor: string, liste: readonly AccountRegistryTraveller[]): boolean {
  const teile = editor.split(':')
  if (editor === 'anlegen') return false
  if (teile[0] === 'reisender') return !person(liste, teile[1] ?? null)
  if (teile[0] === 'citizenship') return !personMitCitizenship(liste, teile[1] ?? '')
  if (teile[0] === 'document') return !personMitDokument(liste, teile[1] ?? '')
  return false
}

function ohneSlots(stand: RegistryStand, editoren: readonly string[]): RegistryStand {
  if (editoren.length === 0) return stand
  const menge = new Set(editoren)
  return { ...stand, slots: stand.slots.filter((slot) => !menge.has(slot.editor)) }
}

function fokusWennWeg(liste: readonly AccountRegistryTraveller[], lage: FokusLage): RegistryFokus | null {
  if (!lage.aufBody || !lage.innen) return null
  const [art, id] = lage.innen.split(':')
  if (!id) return null
  if (art === 'reisender' && !person(liste, id)) {
    return { ziel: 'anlegen-knopf', bedingung: 'body', editor: lage.innen }
  }
  if (art === 'citizenship' && !personMitCitizenship(liste, id)) {
    return { ziel: `verwalten:${lage.traeger ?? ''}`, bedingung: 'body', editor: lage.innen }
  }
  if (art === 'document' && !personMitDokument(liste, id)) {
    return { ziel: `verwalten:${lage.traeger ?? ''}`, bedingung: 'body', editor: lage.innen }
  }
  return null
}

export function registryPropsBeobachten(
  stand: RegistryStand,
  props: RegistryProps,
  lage: FokusLage = { innen: null, traeger: null, aufBody: false },
): RegistryStand {
  const sicht = sichtVon(props)
  if (sicht === stand.sicht) return stand
  let naechster: RegistryStand = { ...stand, props, sicht, lesen: { ...stand.lesen, offen: false } }
  if (registryListeKlasse(props) !== 'gueltig') return naechster
  const liste = props.travellers ?? []
  const weg = naechster.slots.map((slot) => slot.editor).filter((editor) => editorWeg(editor, liste))
  const sofort = weg.filter((editor) => {
    const slot = registrySlot(naechster, editor)
    return slot != null && !naechster.unterwegs.includes(slot.surface)
  })
  const spaeter = weg.filter((editor) => !sofort.includes(editor))
  naechster = ohneSlots(naechster, sofort)
  naechster = {
    ...naechster,
    entferntNachAbschluss: [
      ...new Set([
        ...naechster.entferntNachAbschluss.filter((editor) => !sofort.includes(editor)),
        ...spaeter,
      ]),
    ],
  }
  const fokus = fokusWennWeg(liste, lage)
  if (fokus) naechster = { ...naechster, fokus }
  for (const slot of [...naechster.slots]) {
    const kanonisch = registryKanonisch(slot.editor, props)
    if (!kanonisch) continue
    if (gleich(slot.felder, kanonisch.felder) && slot.kontext === kanonisch.kontext && !slot.konflikt) continue
    if (!slot.dirty && gleich(slot.felder, slot.basisFelder)) {
      const gehoben = mitEpoche(naechster, slot.editor)
      naechster = ersetzeSlot(gehoben.stand, {
        ...slot,
        epoche: gehoben.epoche,
        felder: kanonisch.felder,
        basisFelder: kanonisch.felder,
        kontext: kanonisch.kontext,
        neueFelder: kanonisch.felder,
        dirty: false,
        konflikt: false,
      })
      continue
    }
    if (slot.kontext === kanonisch.kontext && gleich(slot.neueFelder, kanonisch.felder)) continue
    const gehoben = mitEpoche(naechster, slot.editor)
    naechster = ersetzeSlot(gehoben.stand, {
      ...slot,
      epoche: gehoben.epoche,
      kontext: kanonisch.kontext,
      neueFelder: kanonisch.felder,
      konflikt: true,
    })
  }
  return naechster
}

function qualifiziert(stand: RegistryStand, beleg: RegistryBeleg): boolean {
  if (registryListeKlasse(stand.props) !== 'gueltig') return false
  const stempel = registryListeStempel(stand.props.travellers ?? [])
  if (beleg.basisStempel == null) return true
  return stempel !== beleg.basisStempel
}

function anerkennungPasst(
  aufruf: RegistryAufruf,
  blocker: RegistryBeleg | null,
): boolean {
  const wert = aufruf.anerkennung
  if (!blocker) return wert == null
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return false
  return wert.belegId === blocker.id && wert.schluessel === blocker.schluessel
}

export function registryBeginnen(
  stand: RegistryStand,
  aufruf: RegistryAufruf,
  ids: IdQuelle,
): { stand: RegistryStand; versuch: RegistryVersuch | null; grund: string | null } {
  const liste = gueltigeListe(stand.props)
  const bild = editorBild(aufruf.editor, liste)
  const slot = registrySlot(stand, aufruf.editor)
  const blocker = registryAktuellerBlocker(stand, aufruf.editor)
  const ersatz = stand.belege.some((beleg) => beleg.schluessel === aufruf.editor && beleg.ausgang === 'offen')
  if (!bild || !slot) return { stand, versuch: null, grund: 'editor' }
  if ((bild.surface !== '' && stand.unterwegs.includes(bild.surface)) || ersatz) {
    return { stand, versuch: null, grund: 'unterwegs' }
  }
  if (!anerkennungPasst(aufruf, blocker)) return { stand, versuch: null, grund: 'anerkennung' }
  if (blocker) {
    if (!qualifiziert(stand, blocker)) return { stand, versuch: null, grund: 'stand' }
    if (aufruf.editor !== blocker.editor || !gleich(aufruf.payload, slot.felder)) {
      return { stand, versuch: null, grund: 'editor' }
    }
  } else if (registryListeKlasse(stand.props) !== 'gueltig') {
    return { stand, versuch: null, grund: 'stand' }
  }
  if (!liste || !zielErlaubt(bild, liste)) return { stand, versuch: null, grund: 'ziel' }
  if (!gleich(aufruf.payload, slot.felder)) return { stand, versuch: null, grund: 'editor' }
  const beleg: RegistryBeleg = {
    id: ids.naechste(),
    aktion: bild.aktion,
    schluessel: aufruf.editor,
    editor: aufruf.editor,
    surface: bild.surface,
    epoche: slot.epoche,
    ziel: bild.ziel,
    payload: slot.felder,
    ausgang: 'offen',
    meldung: null,
    startStempel: registryListeStempel(liste),
    basisStempel: null,
  }
  return {
    stand: {
      ...ersetzeSlot(stand, { ...slot, hinweis: null }),
      belege: [...stand.belege, beleg],
      unterwegs: [...stand.unterwegs, bild.surface],
    },
    versuch: {
      id: beleg.id,
      aktion: beleg.aktion,
      editor: beleg.editor,
      surface: beleg.surface,
      epoche: beleg.epoche,
      ziel: beleg.ziel,
      payload: beleg.payload,
    },
    grund: null,
  }
}

function fokusNachErfolg(beleg: RegistryBeleg): RegistryFokus | null {
  if (beleg.aktion === 'traveller-aendern' && beleg.ziel.travellerId) {
    return { ziel: `aendern:${beleg.ziel.travellerId}`, bedingung: 'editor-oder-body', editor: beleg.editor }
  }
  if (beleg.aktion === 'traveller-loeschen' && beleg.ziel.travellerId) {
    return { ziel: `loeschen:${beleg.ziel.travellerId}`, bedingung: 'editor-oder-body', editor: beleg.editor }
  }
  if (beleg.aktion === 'citizenship-loeschen') {
    return { ziel: `staat-entfernen:${beleg.ziel.citizenshipId}`, bedingung: 'editor-oder-body', editor: beleg.editor }
  }
  if (beleg.aktion === 'document-loeschen') {
    return { ziel: `dokument-entfernen:${beleg.ziel.documentId}`, bedingung: 'editor-oder-body', editor: beleg.editor }
  }
  return null
}

export function registryAnwenden(stand: RegistryStand, versuchId: string, ausgang: RegistryAusgang): RegistryStand {
  const beleg = stand.belege.find((eintrag) => eintrag.id === versuchId)
  if (!beleg || beleg.ausgang !== 'offen') return stand
  const slot = registrySlot(stand, beleg.editor)
  const epochePasst = slot != null && slot.epoche === beleg.epoche
  const basis =
    ausgang.art === 'unbestaetigt' && registryListeKlasse(stand.props) === 'gueltig'
      ? registryListeStempel(stand.props.travellers ?? [])
      : null
  const ersetzt: RegistryBeleg = {
    ...beleg,
    ausgang: ausgang.art,
    meldung: ausgang.art === 'abgewiesen' ? ausgang.meldung : null,
    basisStempel: basis,
  }
  let naechster: RegistryStand = {
    ...stand,
    belege: stand.belege.map((eintrag) => (eintrag.id === versuchId ? ersetzt : eintrag)),
    unterwegs: stand.unterwegs.filter((surface) => surface !== beleg.surface),
    fokus: epochePasst && ausgang.art === 'gespeichert' ? fokusNachErfolg(beleg) : stand.fokus,
  }
  if (epochePasst && ausgang.art === 'gespeichert' && slot) {
    const geschlossen = beleg.aktion !== 'traveller-anlegen'
    const felder = anfangFelder(beleg.aktion, slot.felder)
    const gehoben = mitEpoche(naechster, beleg.editor)
    naechster = ersetzeSlot(gehoben.stand, {
      ...slot,
      epoche: gehoben.epoche,
      offen: !geschlossen,
      dirty: false,
      konflikt: false,
      felder,
      basisFelder: felder,
      neueFelder: felder,
      hinweis: null,
    })
  }
  const faellig = naechster.entferntNachAbschluss.filter((editor) => {
    const zielSlot = registrySlot(naechster, editor)
    if (!zielSlot) return false
    if (naechster.unterwegs.includes(zielSlot.surface)) return false
    const liste = gueltigeListe(naechster.props)
    return liste != null && editorWeg(editor, liste)
  })
  naechster = ohneSlots(naechster, faellig)
  return { ...naechster, entferntNachAbschluss: naechster.entferntNachAbschluss.filter((editor) => !faellig.includes(editor)) }
}

export function registryLesenAnfordern(stand: RegistryStand, jetzt: number): RegistryStand {
  if (stand.lesen.offen) return stand
  return { ...stand, lesen: { offen: true, seit: jetzt } }
}

export function registryLesenBeenden(stand: RegistryStand): RegistryStand {
  if (!stand.lesen.offen) return stand
  return { ...stand, lesen: { offen: false, seit: stand.lesen.seit } }
}

export function registryFristPruefen(stand: RegistryStand, jetzt: number): RegistryStand {
  if (!stand.lesen.offen || stand.lesen.seit == null || jetzt - stand.lesen.seit < 4000) return stand
  return registryLesenBeenden(stand)
}

export function registryFokusGelesen(stand: RegistryStand): RegistryStand {
  if (!stand.fokus) return stand
  return { ...stand, fokus: null }
}

export function registryListenBild(stand: RegistryStand, beleg: RegistryBeleg): ListenBild {
  const leer = { nichtGeladen: false, neu: false, fehlt: false }
  if (beleg.ausgang !== 'gespeichert') return leer
  if (registryListeKlasse(stand.props) !== 'gueltig') return { nichtGeladen: true, neu: false, fehlt: false }
  const liste = stand.props.travellers ?? []
  const stempel = registryListeStempel(liste)
  const neu = beleg.startStempel == null || stempel !== beleg.startStempel
  if (!neu) return { nichtGeladen: true, neu: false, fehlt: false }
  return { nichtGeladen: false, neu: true, fehlt: zielFehlt(beleg, liste) }
}

export function registryWiederholungBereit(stand: RegistryStand, beleg: RegistryBeleg): boolean {
  return registryAktuellerBlocker(stand, beleg.schluessel)?.id === beleg.id && qualifiziert(stand, beleg)
}

export function registryAusgangLesen(wert: unknown): RegistryAusgang {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return { art: 'unbestaetigt' }
  const eintrag = wert as { ok?: unknown; meldung?: unknown }
  if (eintrag.ok === true) return { art: 'gespeichert' }
  if (eintrag.ok === false && typeof eintrag.meldung === 'string') return { art: 'abgewiesen', meldung: eintrag.meldung }
  return { art: 'unbestaetigt' }
}
