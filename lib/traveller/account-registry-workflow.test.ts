import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import type { AccountRegistryTraveller } from '@/lib/traveller/account-registry'
import {
  registryAnwenden,
  registryAktuellerBlocker,
  registryAusgangLesen,
  registryBeginnen,
  registryEditorOeffnen,
  registryEditorSchliessen,
  registryFeldSetzen,
  registryFristPruefen,
  registryLesenAnfordern,
  registryListeKlasse,
  registryListenBild,
  registryPropsBeobachten,
  registrySlot,
  registryWorkflowAnfang,
  type IdQuelle,
  type RegistryBeleg,
  type RegistryStand,
} from '@/lib/traveller/account-registry-workflow'

const ZEIT = '2026-01-01T00:00:00.000Z'

function ids(): IdQuelle {
  let n = 0
  return { naechste: () => `versuch-${++n}` }
}

function person(
  id: string,
  extra?: {
    label?: string | null
    citizenships?: AccountRegistryTraveller['facts']['citizenships']
    documents?: AccountRegistryTraveller['facts']['documents']
  },
): AccountRegistryTraveller {
  return {
    authority: 'account_registry',
    id,
    clientRef: `${id}-ref`,
    createdAt: ZEIT,
    updatedAt: ZEIT,
    facts: {
      label: extra?.label === undefined ? `Synthetische Person ${id}` : extra.label,
      residenceCountryCode: 'DE',
      citizenships: extra?.citizenships ?? [],
      documents: extra?.documents ?? [],
    },
  }
}

function staat(id: string, land: string) {
  return { id, clientRef: `${id}-ref`, countryCode: land, createdAt: ZEIT, updatedAt: ZEIT }
}

function dokument(id: string, citizenshipClientRef: string | null = null) {
  return {
    id,
    clientRef: `${id}-ref`,
    documentType: 'passport' as const,
    issuingCountryCode: 'DE',
    citizenshipClientRef,
    expiresOn: null,
    createdAt: ZEIT,
    updatedAt: ZEIT,
  }
}

function sehen(stand: RegistryStand, travellers: AccountRegistryTraveller[] | null, status?: 500 | 503) {
  return registryPropsBeobachten(stand, {
    problem: status ? { status, message: 'synthetisch' } : null,
    travellers,
  })
}

function oeffnen(stand: RegistryStand, editor: string, surface: string, felder: unknown) {
  return registryEditorOeffnen(stand, editor, surface, felder, 'basis')
}

function senden(stand: RegistryStand, editor: string, quelle = ids()) {
  const slot = registrySlot(stand, editor)
  return registryBeginnen(stand, { editor, payload: slot?.felder }, quelle)
}

describe('Account-Registry-Workflow', () => {
  test('klassifiziert nur eine gültige Liste als Beobachtung', () => {
    assert.equal(registryListeKlasse({ problem: null, travellers: [] }), 'gueltig')
    assert.equal(registryListeKlasse({ problem: { status: 500, message: 'x' }, travellers: [] }), 'fehler')
    assert.equal(registryListeKlasse({ problem: { status: 503, message: 'x' }, travellers: null }), 'fehler')
    assert.equal(registryListeKlasse({ problem: null, travellers: null }), 'ungueltig')
  })

  test('jede der acht Aktionen wird offen, gespeichert, abgewiesen und unbestätigt', () => {
    const anne = person('anne', {
      citizenships: [staat('staat-1', 'DE')],
      documents: [dokument('dok-1')],
    })
    const faelle = [
      ['anlegen', 'anlegen', { label: 'Neu', residenceCountryCode: '' }],
      [`reisender:anne:aendern`, 'reisender:anne', { label: 'Neu', residenceCountryCode: 'DE' }],
      [`reisender:anne:loeschen`, 'reisender:anne', { id: 'anne' }],
      [`reisender:anne:citizenship-anlegen`, 'reisender:anne', { countryCode: 'FR' }],
      [`citizenship:staat-1:loeschen`, 'reisender:anne', { id: 'staat-1' }],
      [`reisender:anne:document-anlegen`, 'reisender:anne', { documentType: 'passport', issuingCountryCode: 'DE', citizenshipId: '', expiresOn: '' }],
      [`document:dok-1:aendern`, 'reisender:anne', { documentType: 'passport', issuingCountryCode: 'DE', citizenshipId: '', expiresOn: '' }],
      [`document:dok-1:loeschen`, 'reisender:anne', { id: 'dok-1' }],
    ] as const
    for (const [editor, surface, felder] of faelle) {
      let stand = sehen(registryWorkflowAnfang(), [anne])
      stand = oeffnen(stand, editor, surface, felder)
      const quelle = ids()
      const begonnen = senden(stand, editor, quelle)
      assert.equal(begonnen.versuch?.id, 'versuch-1', editor)
      assert.equal(begonnen.stand.unterwegs.length, 1, editor)
      const abgewiesen = registryAnwenden(begonnen.stand, begonnen.versuch?.id ?? '', { art: 'abgewiesen', meldung: 'nein' })
      assert.equal(abgewiesen.belege[0]?.ausgang, 'abgewiesen')
      assert.equal(abgewiesen.belege[0]?.meldung, 'nein')
      assert.equal(JSON.stringify(registrySlot(abgewiesen, editor)?.felder), JSON.stringify(felder))
      const nochmal = senden(abgewiesen, editor, quelle)
      const unbekannt = registryAnwenden(nochmal.stand, nochmal.versuch?.id ?? '', { art: 'unbestaetigt' })
      assert.equal(unbekannt.belege.at(-1)?.ausgang, 'unbestaetigt', editor)
      assert.equal(registrySlot(unbekannt, editor) != null, true)
    }
  })

  test('zweiter Beginn in demselben Zustand sendet nicht noch einmal', () => {
    let stand = sehen(registryWorkflowAnfang(), [])
    stand = oeffnen(stand, 'anlegen', 'anlegen', { label: 'A', residenceCountryCode: '' })
    const quelle = ids()
    const erster = senden(stand, 'anlegen', quelle)
    const zweiter = senden(erster.stand, 'anlegen', quelle)
    assert.equal(zweiter.versuch, null)
    assert.equal(zweiter.grund, 'unterwegs')
    assert.equal(erster.stand.belege.length, 1)
  })

  test('ein später Erfolg von A setzt B nicht zurück', () => {
    const anne = person('anne')
    const bert = person('bert')
    let stand = sehen(registryWorkflowAnfang(), [anne, bert])
    stand = oeffnen(stand, 'reisender:anne:aendern', 'reisender:anne', { label: 'A', residenceCountryCode: 'DE' })
    const erster = senden(stand, 'reisender:anne:aendern', ids())
    stand = registryEditorSchliessen(erster.stand, 'reisender:anne:aendern')
    stand = oeffnen(stand, 'reisender:bert:aendern', 'reisender:bert', { label: 'B-neu', residenceCountryCode: 'DE' })
    const danach = registryAnwenden(stand, 'versuch-1', { art: 'gespeichert' })
    assert.equal(JSON.stringify(registrySlot(danach, 'reisender:bert:aendern')?.felder), JSON.stringify({ label: 'B-neu', residenceCountryCode: 'DE' }))
    assert.equal(danach.fokus, null)
    const abgewiesen = registryAnwenden(stand, 'versuch-1', { art: 'unbestaetigt' })
    assert.equal(abgewiesen.fokus, null)
    assert.equal(registryAktuellerBlocker(abgewiesen, 'reisender:anne:aendern')?.ausgang, 'unbestaetigt')
  })

  test('erneutes Öffnen liegt über der Epoche des Belegs und speichert nicht still', () => {
    let stand = sehen(registryWorkflowAnfang(), [person('anne')])
    stand = oeffnen(stand, 'reisender:anne:aendern', 'reisender:anne', { label: 'A', residenceCountryCode: 'DE' })
    const begonnen = senden(stand, 'reisender:anne:aendern', ids())
    stand = registryAnwenden(begonnen.stand, 'versuch-1', { art: 'unbestaetigt' })
    const belegEpoche = stand.belege[0]?.epoche ?? 0
    stand = registryEditorSchliessen(stand, 'reisender:anne:aendern')
    stand = oeffnen(stand, 'reisender:anne:aendern', 'reisender:anne', { label: 'A', residenceCountryCode: 'DE' })
    assert.ok((registrySlot(stand, 'reisender:anne:aendern')?.epoche ?? 0) > belegEpoche)
    assert.notEqual(registrySlot(stand, 'reisender:anne:aendern')?.epoche, belegEpoche)
    const nochmal = senden(stand, 'reisender:anne:aendern', ids())
    assert.equal(nochmal.versuch, null)
    assert.equal(nochmal.grund, 'anerkennung')
  })

  test('veraltete Anerkennung nach 503, ungültig oder unveränderter Liste schreibt nicht', () => {
    let stand = sehen(registryWorkflowAnfang(), [person('anne', { label: 'Alt' })])
    stand = oeffnen(stand, 'reisender:anne:aendern', 'reisender:anne', { label: 'Alt', residenceCountryCode: 'DE' })
    stand = registryAnwenden(senden(stand, 'reisender:anne:aendern', ids()).stand, 'versuch-1', { art: 'unbestaetigt' })
    const beleg = stand.belege[0] as RegistryBeleg
    const payload = registrySlot(stand, beleg.editor)?.felder
    for (const gesichtet of [
      sehen(stand, null, 503),
      registryPropsBeobachten(stand, { problem: null, travellers: null }),
      sehen(stand, [person('anne', { label: 'Alt' })]),
    ]) {
      const ergebnis = registryBeginnen(gesichtet, { editor: beleg.editor, payload, anerkennung: { belegId: beleg.id, schluessel: beleg.schluessel } }, ids())
      assert.equal(ergebnis.versuch, null)
      assert.equal(ergebnis.grund, 'stand')
      assert.equal(ergebnis.stand.belege.length, 1)
    }
  })

  test('unbestätigt A, anerkannte B, unbestätigt B, dann Anerkennung von A', () => {
    const quelle = ids()
    let stand = sehen(registryWorkflowAnfang(), [person('anne', { label: 'Eins' })])
    stand = oeffnen(stand, 'reisender:anne:aendern', 'reisender:anne', { label: 'Eins', residenceCountryCode: 'DE' })
    stand = registryAnwenden(senden(stand, 'reisender:anne:aendern', quelle).stand, 'versuch-1', { art: 'unbestaetigt' })
    const alt = stand.belege[0] as RegistryBeleg
    stand = sehen(stand, [person('anne', { label: 'Zwei' })])
    const zweiter = registryBeginnen(
      stand,
      { editor: alt.editor, payload: registrySlot(stand, alt.editor)?.felder, anerkennung: { belegId: alt.id, schluessel: alt.schluessel } },
      quelle,
    )
    assert.ok(zweiter.versuch)
    stand = registryAnwenden(zweiter.stand, zweiter.versuch?.id ?? '', { art: 'unbestaetigt' })
    const neu = registryAktuellerBlocker(stand, alt.schluessel)
    assert.equal(neu?.id, 'versuch-2')
    assert.equal(stand.belege[0], alt)
    const veraltet = registryBeginnen(
      stand,
      { editor: alt.editor, payload: registrySlot(stand, alt.editor)?.felder, anerkennung: { belegId: alt.id, schluessel: alt.schluessel } },
      ids(),
    )
    assert.equal(veraltet.versuch, null)
    assert.equal(veraltet.grund, 'anerkennung')
    assert.equal(veraltet.stand.belege.length, 2)
  })

  test('eine bekannte Wiederholung lässt den älteren unbekannten Beleg blockieren', () => {
    const quelle = ids()
    let stand = sehen(registryWorkflowAnfang(), [person('anne', { label: 'Eins' })])
    stand = oeffnen(stand, 'reisender:anne:aendern', 'reisender:anne', { label: 'Eins', residenceCountryCode: 'DE' })
    stand = registryAnwenden(senden(stand, 'reisender:anne:aendern', quelle).stand, 'versuch-1', { art: 'unbestaetigt' })
    const alt = stand.belege[0] as RegistryBeleg
    stand = sehen(stand, [person('anne', { label: 'Zwei' })])
    const zweiter = registryBeginnen(
      stand,
      { editor: alt.editor, payload: registrySlot(stand, alt.editor)?.felder, anerkennung: { belegId: alt.id, schluessel: alt.schluessel } },
      quelle,
    )
    stand = registryAnwenden(zweiter.stand, zweiter.versuch?.id ?? '', { art: 'gespeichert' })
    assert.equal(stand.belege[0], alt)
    assert.equal(registryAktuellerBlocker(stand, alt.schluessel)?.id, alt.id)
    stand = sehen(stand, [person('anne', { label: 'Drei' })])
    assert.equal(senden(stand, alt.editor, quelle).versuch, null)
    const passend = registryBeginnen(
      stand,
      { editor: alt.editor, payload: registrySlot(stand, alt.editor)?.felder, anerkennung: { belegId: alt.id, schluessel: alt.schluessel } },
      quelle,
    )
    assert.equal(passend.versuch?.id, 'versuch-3')
    assert.equal(passend.stand.belege[0], alt)
  })

  test('eine offene Ersetzung lässt die alte Anerkennung nicht durch', () => {
    let stand = sehen(registryWorkflowAnfang(), [person('anne', { label: 'Eins' })])
    stand = oeffnen(stand, 'anlegen', 'anlegen', { label: 'Eins', residenceCountryCode: '' })
    stand = registryAnwenden(senden(stand, 'anlegen', ids()).stand, 'versuch-1', { art: 'unbestaetigt' })
    const alt = stand.belege[0] as RegistryBeleg
    stand = sehen(stand, [person('anne', { label: 'Zwei' })])
    const zweiter = registryBeginnen(
      stand,
      { editor: 'anlegen', payload: registrySlot(stand, 'anlegen')?.felder, anerkennung: { belegId: alt.id, schluessel: alt.schluessel } },
      ids(),
    )
    const waehrend = registryBeginnen(
      zweiter.stand,
      { editor: 'anlegen', payload: registrySlot(zweiter.stand, 'anlegen')?.felder, anerkennung: { belegId: alt.id, schluessel: alt.schluessel } },
      ids(),
    )
    assert.equal(waehrend.versuch, null)
    assert.equal(waehrend.grund, 'unterwegs')
  })

  test('die anerkannte Wiederholung nimmt nur den Entwurf dieses Editors', () => {
    const anne = person('anne', { documents: [dokument('dok-d'), dokument('dok-e')] })
    let stand = sehen(registryWorkflowAnfang(), [anne])
    const felderD = { documentType: 'passport', issuingCountryCode: 'DE', citizenshipId: '', expiresOn: '' }
    const felderE = { documentType: 'national_id', issuingCountryCode: 'FR', citizenshipId: '', expiresOn: '2030-01-01' }
    stand = oeffnen(stand, 'document:dok-d:aendern', 'reisender:anne', felderD)
    stand = registryAnwenden(senden(stand, 'document:dok-d:aendern', ids()).stand, 'versuch-1', { art: 'unbestaetigt' })
    stand = oeffnen(stand, 'document:dok-e:aendern', 'reisender:anne', felderE)
    stand = sehen(stand, [person('anne', { label: 'Neu', documents: [dokument('dok-d'), dokument('dok-e')] })])
    const falsch = registryBeginnen(
      stand,
      { editor: 'document:dok-d:aendern', payload: felderE, anerkennung: { belegId: 'versuch-1', schluessel: 'document:dok-d:aendern' } },
      ids(),
    )
    assert.equal(falsch.versuch, null)
    assert.equal(falsch.grund, 'editor')
    const richtig = registryBeginnen(
      stand,
      { editor: 'document:dok-d:aendern', payload: felderD, anerkennung: { belegId: 'versuch-1', schluessel: 'document:dok-d:aendern' } },
      ids(),
    )
    assert.equal(richtig.versuch?.payload && JSON.stringify(richtig.versuch.payload), JSON.stringify(felderD))
    assert.equal(richtig.versuch?.ziel.documentId, 'dok-d')
  })

  test('eine saubere Übernahme nimmt dem alten Abschluss die Oberfläche', () => {
    let stand = sehen(registryWorkflowAnfang(), [person('anne', { label: 'Alt' })])
    stand = oeffnen(stand, 'reisender:anne:aendern', 'reisender:anne', { label: 'Alt', residenceCountryCode: 'DE' })
    const begonnen = senden(stand, 'reisender:anne:aendern', ids())
    stand = sehen(begonnen.stand, [person('anne', { label: 'Neu' })])
    assert.equal(JSON.stringify(registrySlot(stand, 'reisender:anne:aendern')?.felder), JSON.stringify({ label: 'Neu', residenceCountryCode: 'DE' }))
    assert.ok((registrySlot(stand, 'reisender:anne:aendern')?.epoche ?? 0) > (begonnen.versuch?.epoche ?? 0))
    const danach = registryAnwenden(stand, 'versuch-1', { art: 'gespeichert' })
    assert.equal(registrySlot(danach, 'reisender:anne:aendern')?.offen, true)
    assert.equal(JSON.stringify(registrySlot(danach, 'reisender:anne:aendern')?.felder), JSON.stringify({ label: 'Neu', residenceCountryCode: 'DE' }))
    assert.equal(danach.fokus, null)
  })

  test('ein schmutziger Editor behält die Eingabe und zeigt den Konflikt', () => {
    let stand = sehen(registryWorkflowAnfang(), [person('anne', { label: 'Alt' })])
    stand = oeffnen(stand, 'reisender:anne:aendern', 'reisender:anne', { label: 'Alt', residenceCountryCode: 'DE' })
    stand = registryFeldSetzen(stand, 'reisender:anne:aendern', { label: 'Getippt', residenceCountryCode: 'DE' })
    const begonnen = senden(stand, 'reisender:anne:aendern', ids())
    stand = sehen(begonnen.stand, [person('anne', { label: 'Neu' })])
    assert.equal(registrySlot(stand, 'reisender:anne:aendern')?.konflikt, true)
    assert.equal(JSON.stringify(registrySlot(stand, 'reisender:anne:aendern')?.felder), JSON.stringify({ label: 'Getippt', residenceCountryCode: 'DE' }))
    const danach = registryAnwenden(stand, 'versuch-1', { art: 'unbestaetigt' })
    assert.equal(danach.fokus, null)
    assert.equal(JSON.stringify(registrySlot(danach, 'reisender:anne:aendern')?.felder), JSON.stringify({ label: 'Getippt', residenceCountryCode: 'DE' }))
  })

  test('fehlende Personen, Staatsbürgerschaften und Dokumente gelten nur in einer gültigen Liste', () => {
    const anne = person('anne', { citizenships: [staat('staat-1', 'DE')], documents: [dokument('dok-1')] })
    let stand = sehen(registryWorkflowAnfang(), [anne])
    stand = oeffnen(stand, 'reisender:anne:aendern', 'reisender:anne', { label: 'A', residenceCountryCode: 'DE' })
    stand = oeffnen(stand, 'citizenship:staat-1:loeschen', 'reisender:anne', { id: 'staat-1' })
    stand = oeffnen(stand, 'document:dok-1:aendern', 'reisender:anne', { documentType: 'passport', issuingCountryCode: 'DE', citizenshipId: '', expiresOn: '' })
    const fehler = sehen(stand, null, 500)
    assert.equal(registrySlot(fehler, 'reisender:anne:aendern') != null, true)
    assert.equal(fehler.fokus, null)
    const weg = registryPropsBeobachten(
      sehen(registryWorkflowAnfang(), [anne]),
      { problem: null, travellers: [] },
      { innen: 'reisender:anne', traeger: 'anne', aufBody: true },
    )
    const vorbereitet = oeffnen(sehen(registryWorkflowAnfang(), [anne]), 'reisender:anne:aendern', 'reisender:anne', { label: 'A', residenceCountryCode: 'DE' })
    const entfernt = registryPropsBeobachten(vorbereitet, { problem: null, travellers: [] }, { innen: 'reisender:anne', traeger: 'anne', aufBody: true })
    assert.equal(registrySlot(entfernt, 'reisender:anne:aendern'), null)
    assert.equal(entfernt.fokus?.ziel, 'anlegen-knopf')
    const bleibt = registryPropsBeobachten(vorbereitet, { problem: null, travellers: [] }, { innen: 'reisender:anne', traeger: 'anne', aufBody: false })
    assert.equal(bleibt.fokus, null)
    const staatWeg = registryPropsBeobachten(
      oeffnen(sehen(registryWorkflowAnfang(), [anne]), 'citizenship:staat-1:loeschen', 'reisender:anne', { id: 'staat-1' }),
      { problem: null, travellers: [person('anne')] },
      { innen: 'citizenship:staat-1', traeger: 'anne', aufBody: true },
    )
    assert.equal(registrySlot(staatWeg, 'citizenship:staat-1:loeschen'), null)
    assert.equal(staatWeg.fokus?.ziel, 'verwalten:anne')
    const dokumentWeg = registryPropsBeobachten(
      oeffnen(sehen(registryWorkflowAnfang(), [anne]), 'document:dok-1:aendern', 'reisender:anne', { documentType: 'passport', issuingCountryCode: 'DE', citizenshipId: '', expiresOn: '' }),
      { problem: null, travellers: [person('anne')] },
      { innen: 'document:dok-1', traeger: 'anne', aufBody: true },
    )
    assert.equal(registrySlot(dokumentWeg, 'document:dok-1:aendern'), null)
    assert.equal(dokumentWeg.fokus?.ziel, 'verwalten:anne')
    assert.equal(weg.fokus?.ziel, 'anlegen-knopf')
  })

  test('Grenzen blockieren nur das Anlegen, eine leere Zuordnung bleibt leer', () => {
    const citizenships = Array.from({ length: 8 }, (_, index) => staat(`staat-${index}`, `A${index}`))
    const documents = Array.from({ length: 12 }, (_, index) => dokument(`dok-${index}`))
    const voll = person('anne', { citizenships, documents })
    let stand = sehen(registryWorkflowAnfang(), [voll])
    stand = oeffnen(stand, 'reisender:anne:citizenship-anlegen', 'reisender:anne', { countryCode: 'ZZ' })
    assert.equal(senden(stand, 'reisender:anne:citizenship-anlegen', ids()).grund, 'ziel')
    stand = oeffnen(stand, 'reisender:anne:aendern', 'reisender:anne', { label: 'A', residenceCountryCode: 'DE' })
    assert.ok(senden(stand, 'reisender:anne:aendern', ids()).versuch)
    stand = oeffnen(sehen(registryWorkflowAnfang(), [voll]), 'document:dok-0:aendern', 'reisender:anne', {
      documentType: 'passport',
      issuingCountryCode: 'DE',
      citizenshipId: '',
      expiresOn: '',
    })
    const geaendert = senden(stand, 'document:dok-0:aendern', ids())
    assert.equal(geaendert.versuch?.ziel.documentId, 'dok-0')
    assert.equal(JSON.parse(JSON.stringify(geaendert.versuch?.payload)).citizenshipId, '')
    stand = oeffnen(sehen(registryWorkflowAnfang(), [voll]), 'reisender:anne:document-anlegen', 'reisender:anne', {
      documentType: 'passport',
      issuingCountryCode: 'DE',
      citizenshipId: '',
      expiresOn: '',
    })
    assert.equal(senden(stand, 'reisender:anne:document-anlegen', ids()).grund, 'ziel')
  })

  test('ein bestätigtes Speichern ist noch keine neue Liste, und Lesen schreibt nicht', () => {
    let stand = sehen(registryWorkflowAnfang(), [])
    stand = oeffnen(stand, 'anlegen', 'anlegen', { label: 'A', residenceCountryCode: '' })
    stand = registryAnwenden(senden(stand, 'anlegen', ids()).stand, 'versuch-1', { art: 'gespeichert' })
    assert.equal(registryListenBild(stand, stand.belege[0] as RegistryBeleg).nichtGeladen, true)
    stand = sehen(stand, [person('neu', { label: 'A' })])
    assert.equal(registryListenBild(stand, stand.belege[0] as RegistryBeleg).neu, true)
    const gelesen = registryLesenAnfordern(stand, 1000)
    assert.equal(gelesen.belege.length, stand.belege.length)
    assert.equal(registryFristPruefen(gelesen, 4999).lesen.offen, true)
    assert.equal(registryFristPruefen(gelesen, 5000).lesen.offen, false)
  })

  test('wert mit einer Id wird nicht gelesen und ein boolesches Kennzeichen reicht nicht', () => {
    assert.deepEqual(registryAusgangLesen({ ok: true, wert: { id: 'server-id' } }), { art: 'gespeichert' })
    assert.deepEqual(registryAusgangLesen({ ok: false, meldung: 'nein' }), { art: 'abgewiesen', meldung: 'nein' })
    assert.deepEqual(registryAusgangLesen({ ok: true, wert: null }), { art: 'gespeichert' })
    assert.equal(registryAusgangLesen(null).art, 'unbestaetigt')
    let stand = sehen(registryWorkflowAnfang(), [])
    stand = oeffnen(stand, 'anlegen', 'anlegen', { label: 'A', residenceCountryCode: '' })
    stand = registryAnwenden(senden(stand, 'anlegen', ids()).stand, 'versuch-1', { art: 'unbestaetigt' })
    stand = sehen(stand, [person('neu')])
    const boolesch = registryBeginnen(
      stand,
      { editor: 'anlegen', payload: registrySlot(stand, 'anlegen')?.felder, anerkennung: true as never },
      ids(),
    )
    assert.equal(boolesch.versuch, null)
    assert.equal(boolesch.grund, 'anerkennung')
  })

  test('eine andere Fläche bleibt unabhängig', () => {
    let stand = sehen(registryWorkflowAnfang(), [person('anne')])
    stand = oeffnen(stand, 'anlegen', 'anlegen', { label: 'Neu', residenceCountryCode: '' })
    stand = oeffnen(stand, 'reisender:anne:aendern', 'reisender:anne', { label: 'A', residenceCountryCode: 'DE' })
    const erste = senden(stand, 'anlegen', ids())
    const zweite = senden(erste.stand, 'reisender:anne:aendern', ids())
    assert.ok(zweite.versuch)
    assert.equal(zweite.stand.unterwegs.length, 2)
  })
})
