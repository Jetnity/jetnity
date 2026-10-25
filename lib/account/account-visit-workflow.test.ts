import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { BESUCH_MELDUNG } from '@/lib/account/besuche-eingabe'
import type { Besuch } from '@/lib/account/besuche'
import {
  visitAnwenden,
  visitAufnehmen,
  visitAusgangLesen,
  visitBestaetigungOeffnen,
  visitDispatchStart,
  visitEditorOeffnen,
  visitEditorSetzen,
  visitEntwurfVerwerfen,
  visitPropsBeobachten,
  visitPruefungBeenden,
  visitStempel,
  visitThunkBeenden,
  visitWorkflowAnfang,
  type VisitStand,
} from '@/lib/account/account-visit-workflow'

const hier = dirname(fileURLToPath(import.meta.url))

function id(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
}

function besuch(n: number, extra: Partial<Besuch> = {}): Besuch {
  return {
    id: id(n),
    placeId: 'geonames:2267057',
    placeLabel: 'Lissabon',
    countryCode: 'PT',
    latitude: 1,
    longitude: 2,
    jahr: 2020,
    monat: null,
    tag: null,
    erstelltAm: '2026-01-01T00:00:00.000Z',
    ...extra,
  }
}

function felder(jahr = '2020') {
  return {
    ort: { id: 'geonames:2267057', name: 'Lissabon' },
    countryCode: '',
    jahr,
    monat: '',
    tag: '',
  }
}

function liste(besuche: Besuch[]) {
  return { problem: null, besuche }
}

test('jede wohlgeformte Absage und jeder Bruch bleiben unbestätigt', () => {
  assert.deepEqual(visitAusgangLesen({ ok: true, wert: null }), { art: 'angenommen' })
  for (const meldung of [
    'Dieser Besuch konnte nicht gespeichert werden.',
    'Dein Besuch konnte gerade nicht gespeichert werden. Bitte versuche es in einem Moment erneut.',
    BESUCH_MELDUNG.ohneZiel,
    BESUCH_MELDUNG.nichtGefunden,
  ]) {
    assert.equal(visitAusgangLesen({ ok: false, meldung }).art, 'unbestaetigt')
  }
  assert.equal(visitAusgangLesen({ ok: true, wert: null, id: 'x' }).art, 'unbestaetigt')
  assert.equal(visitAusgangLesen({ ok: true, wert: { id: 'x' } }).art, 'unbestaetigt')
  assert.equal(visitAusgangLesen(undefined).art, 'unbestaetigt')
  assert.equal(visitAusgangLesen('nein').art, 'unbestaetigt')
})

test('dieselbe Runde startet den Thunk nur einmal und gibt die Sperre frei', async () => {
  let gehalten: string | null = null
  let aufrufe = 0
  function starten() {
    const entscheid = visitDispatchStart(gehalten, 'op-1')
    if (!entscheid.starten) return
    gehalten = entscheid.gehalten
    aufrufe += 1
  }
  starten()
  starten()
  assert.equal(aufrufe, 1)
  assert.equal(gehalten, 'op-1')
  let frei = false
  await visitThunkBeenden(
    async () => {
      throw new Error('synchron genug')
    },
    (ausgang) => {
      assert.equal(ausgang.art, 'unbestaetigt')
    },
    () => {
      frei = true
      gehalten = null
    },
  )
  assert.equal(frei, true)
})

test('Anlegen bekommt keine Zeile, auch bei gleichem Ort und Datum', () => {
  const quelle = readFileSync(join(hier, 'account-visit-workflow.ts'), 'utf8')
  assert.equal(quelle.includes('visitZeileZuordnen'), false)
  assert.equal(quelle.includes('korrelier'), false)
  const stand = visitWorkflowAnfang()
  const erste = visitAufnehmen(stand, 'a', { art: 'bestaetigen', felder: felder() }, liste([besuch(1)]))
  assert.equal(erste.ok, true)
  if (!erste.ok) return
  const angewandt = visitAnwenden(erste.stand, 'a', { art: 'angenommen' }, 10)
  assert.equal(angewandt.vorgaenge[0]?.ereignisId, null)
  assert.equal(angewandt.editor, null)
})

test('ein sauberer Editor übernimmt, ein Widerruf nicht', () => {
  const original = besuch(1)
  const geaendert = besuch(1, { jahr: 2019 })
  let stand = visitEditorOeffnen(visitWorkflowAnfang(), original, felder())
  const vorEpoche = stand.editor?.epoche
  stand = visitPropsBeobachten(stand, liste([geaendert]))
  assert.equal(stand.editor?.felder.jahr, '2019')
  assert.notEqual(stand.editor?.epoche, vorEpoche)
  assert.equal(stand.editor?.dirty, false)
  let widerruf = visitBestaetigungOeffnen(visitWorkflowAnfang(), original, 'conf-alt')
  const alt = widerruf.bestaetigung?.id
  widerruf = visitPropsBeobachten(widerruf, liste([geaendert]))
  assert.equal(widerruf.bestaetigung?.id, alt)
  assert.equal(widerruf.bestaetigung?.konflikt, 'felder')
  assert.equal(widerruf.bestaetigung?.basis.jahr, 2020)
  const send = visitAufnehmen(
    widerruf,
    'w',
    { art: 'widerrufen', id: original.id, bestaetigung: widerruf.bestaetigung! },
    liste([geaendert]),
  )
  assert.equal(send.ok, false)
})

test('dieselbe Id unterwegs bleibt nach der Annahme offen', () => {
  const original = besuch(1)
  let stand = visitEditorOeffnen(visitWorkflowAnfang(), original, felder())
  stand = visitEditorSetzen(stand, felder('2018'))
  const aufgenommen = visitAufnehmen(
    stand,
    'edit-1',
    { art: 'aendern', id: original.id, felder: felder('2018') },
    liste([original]),
  )
  assert.equal(aufgenommen.ok, true)
  if (!aufgenommen.ok) return
  const epoche = aufgenommen.stand.vorgaenge[0]?.entwurfEpoche
  stand = visitPropsBeobachten(aufgenommen.stand, liste([besuch(1, { jahr: 2011 })]))
  assert.equal(stand.editor?.felder.jahr, '2018')
  assert.equal(stand.editor?.konflikt, 'felder')
  assert.notEqual(stand.editor?.epoche, epoche)
  stand = visitAnwenden(stand, 'edit-1', { art: 'angenommen' }, 20)
  assert.equal(stand.editor?.felder.jahr, '2018')
  assert.equal(stand.editor?.konflikt, 'felder')
  assert.equal(stand.vorgaenge[0]?.phase, 'angenommen')
})

test('Widerruf räumt nur dieselbe Absicht, Epoche und Ereignis-Id', () => {
  const original = besuch(1)
  const andere = besuch(2, { placeLabel: 'Porto', placeId: 'geonames:2735943' })
  let stand = visitBestaetigungOeffnen(visitWorkflowAnfang(), original, 'conf-a')
  const start = visitAufnehmen(
    stand,
    'alt',
    { art: 'widerrufen', id: original.id, bestaetigung: stand.bestaetigung! },
    liste([original, andere]),
  )
  assert.equal(start.ok, true)
  if (!start.ok) return
  stand = visitBestaetigungOeffnen(start.stand, andere, 'conf-b')
  stand = visitBestaetigungOeffnen(stand, original, 'conf-a-neu')
  assert.equal(stand.bestaetigung?.id, 'conf-a-neu')
  stand = visitAnwenden(stand, 'alt', { art: 'angenommen' }, 30)
  assert.equal(stand.bestaetigung?.id, 'conf-a-neu')
  assert.notEqual(stand.bestaetigung?.id, 'conf-b')
})

test('ein gesehener Stempel wird nicht zum neuen Inhalt und ein Lesefehler nicht zur Abwesenheit', () => {
  const original = besuch(1)
  let stand: VisitStand = visitWorkflowAnfang()
  const start = visitAufnehmen(stand, 'c', { art: 'bestaetigen', felder: felder() }, liste([original]))
  assert.equal(start.ok, true)
  if (!start.ok) return
  stand = visitPropsBeobachten(start.stand, liste([besuch(3, { placeLabel: 'Rom', placeId: 'geonames:3169070' })]))
  stand = visitAnwenden(stand, 'c', { art: 'angenommen' }, 40)
  stand = visitPropsBeobachten(stand, liste([besuch(3, { placeLabel: 'Rom', placeId: 'geonames:3169070' })]))
  assert.equal(stand.vorgaenge[0]?.inhaltBeobachtet, 'gleich')
  stand = visitPropsBeobachten(stand, liste([original, besuch(4)]))
  assert.equal(stand.vorgaenge[0]?.inhaltBeobachtet, 'anders')
  const fehler = visitPropsBeobachten(stand, { problem: { status: 503, message: 'x' }, besuche: [] })
  assert.equal(fehler.vorgaenge[0]?.inhaltBeobachtet, 'lesefehler')
  assert.equal(visitStempel([original]) === visitStempel([besuch(1)]), true)
})

test('Prüfung beendet behauptet keinen neuen Stand und Verwerfen unterwegs bleibt', () => {
  const original = besuch(1)
  let stand = visitEditorOeffnen(visitWorkflowAnfang(), original, felder())
  const start = visitAufnehmen(
    stand,
    'p',
    { art: 'aendern', id: original.id, felder: felder() },
    liste([original]),
  )
  assert.equal(start.ok, true)
  if (!start.ok) return
  stand = visitAnwenden(start.stand, 'p', { art: 'angenommen' }, 50)
  assert.equal(stand.vorgaenge[0]?.pruefung, 'offen')
  stand = visitPruefungBeenden(stand, 'p')
  assert.equal(stand.vorgaenge[0]?.pruefung, 'beendet')
  assert.equal(stand.vorgaenge[0]?.phase, 'angenommen')
  assert.equal(stand.vorgaenge[0]?.inhaltBeobachtet, 'ausstehend')
  const unterwegs = visitAufnehmen(
    visitEditorOeffnen(visitWorkflowAnfang(), original, felder()),
    'u',
    { art: 'aendern', id: original.id, felder: felder() },
    liste([original]),
  )
  assert.equal(unterwegs.ok, true)
  if (!unterwegs.ok) return
  assert.equal(visitEntwurfVerwerfen(unterwegs.stand, `ereignis:${original.id}`), unterwegs.stand)
})

test('die Aufrufe im Produkt bleiben die bestehenden Nutzlasten', () => {
  const besuche = readFileSync(join(hier, '../../components/account/AccountBesuche.tsx'), 'utf8')
  const formular = readFileSync(join(hier, '../../components/account/AccountBesuchFormular.tsx'), 'utf8')
  assert.equal((besuche.match(/<AccountBesuchFormular/g) ?? []).length, 2)
  assert.match(besuche, /onWert=\{setNeu\}/)
  assert.match(besuche, /onWert=\{\(wert\) => onBearbeiten\(\{ id: bearbeitet\.id, wert \}\)\}/)
  assert.match(besuche, /besuchBestaetigen\(besuchEingabeAus\(neu\)\)/)
  assert.match(besuche, /besuchAendern\(\{\s*id: bearbeitet\.id,\s*\.\.\.besuchEingabeAus\(bearbeitet\.wert\),/s)
  assert.match(besuche, /besuchWiderrufen\(\{ id \}\)/)
  assert.match(formular, /disabled=\{laeuft \|\| wert\.ort !== null\}/)
  assert.equal(besuche.includes('einer Zeile zugeordnet'), false)
  assert.equal(besuche.includes('neu gelesen'), false)
  assert.equal(besuche.includes('scrollIntoView'), true)
  assert.equal(besuche.includes('statusKnoten'), false)
})
