// lib/trips/guest-trip-read-recovery-1.test.ts
//
// Honest guest list and workspace reads. The loader contract stays compatible:
// these tests do not change gastspeicher assertions. They record raw bytes and
// write counts around the readonly reconciliation.

import { beforeEach, describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  gastArbeitsbereichAusListe,
  gastArbeitsbereichBeobachten,
  gastArbeitsbereichDarfErstellen,
  gastListeAusBeobachtung,
  gastListeBeobachten,
  gastListeDarfErstellen,
} from '@/components/trips/gast-reise-lesezustand'
import {
  SCHLUESSEL,
  gastreiseAnlegen,
  kennungErzeugen,
  type Gastspeicher,
} from '@/lib/trips/gastspeicher'
import type { GastCreateBelegung } from '@/lib/trips/create-entry'
import type { CreateTripInput, Trip } from '@/types/trips'

function speicherStellen() {
  const ablage = new Map<string, string>()
  let gesperrt = false
  let lesenWirft = false
  const werfendeSchluessel = new Set<string>()
  let aktiveLesungen = 0
  let nachErsterAktiv: string | null | undefined
  const schreibvorgaenge: Array<{ art: 'set' | 'remove'; schluessel: string }> = []

  const localStorage = {
    getItem: (schluessel: string) => {
      if (lesenWirft || werfendeSchluessel.has(schluessel)) throw new Error('SecurityError')
      if (schluessel === SCHLUESSEL.aktiv) {
        aktiveLesungen += 1
        if (aktiveLesungen > 1 && nachErsterAktiv !== undefined) return nachErsterAktiv
      }
      return ablage.get(schluessel) ?? null
    },
    setItem: (schluessel: string, wert: string) => {
      schreibvorgaenge.push({ art: 'set', schluessel })
      if (gesperrt) throw new Error('QuotaExceededError')
      ablage.set(schluessel, wert)
    },
    removeItem: (schluessel: string) => {
      schreibvorgaenge.push({ art: 'remove', schluessel })
      if (gesperrt) throw new Error('QuotaExceededError')
      ablage.delete(schluessel)
    },
  }

  Object.assign(globalThis, { window: { localStorage } })

  return {
    ablage,
    schreibvorgaenge,
    sperren: () => {
      gesperrt = true
    },
    lesenWerfen: () => {
      lesenWirft = true
    },
    lesenLassen: () => {
      lesenWirft = false
      werfendeSchluessel.clear()
    },
    werfenFuer: (schluessel: string) => werfendeSchluessel.add(schluessel),
    nachErsterAktivLesen: (wert: string | null) => {
      nachErsterAktiv = wert
    },
    roh: (schluessel: string) => ablage.get(schluessel) ?? null,
    setzen: (schluessel: string, wert: unknown) => {
      ablage.set(schluessel, typeof wert === 'string' ? wert : JSON.stringify(wert))
    },
    loeschen: (schluessel: string) => {
      ablage.delete(schluessel)
    },
    leerenZaehler: () => {
      schreibvorgaenge.length = 0
    },
  }
}

let speicher: ReturnType<typeof speicherStellen>

beforeEach(() => {
  speicher = speicherStellen()
})

function eingabe(abweichung: Partial<CreateTripInput> = {}): CreateTripInput {
  return {
    clientRef: kennungErzeugen('trip'),
    title: 'Japan im Herbst',
    destination: 'Japan',
    destinationPlaceId: 'geonames:1861060',
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: '2026-09-12',
    endDate: '2026-09-16',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 4200,
    pace: 'balanced',
    interests: ['culture'],
    travelWish: null,
    ...abweichung,
  }
}

function legacyEntwurf(abweichung: Record<string, unknown> = {}) {
  return {
    id: 'trip-alt-1',
    title: 'Barcelona',
    destination: 'Barcelona',
    origin: 'Zürich',
    startDate: '2026-09-12',
    endDate: '2026-09-14',
    travelers: 2,
    pace: 'ruhig',
    interests: ['Kultur', 'Kulinarik'],
    budget: 1800,
    travelWish: 'Zwei ruhige Tage.',
    days: [
      {
        id: 'day-2026-09-12',
        date: '2026-09-12',
        items: [{ id: 'item-1', title: 'Sagrada Família', time: '10:00', createdAt: '2026-08-01' }],
      },
      { id: 'day-2026-09-13', date: '2026-09-13', items: [] },
      { id: 'day-2026-09-14', date: '2026-09-14', items: [] },
    ],
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    ...abweichung,
  }
}

function rohStand() {
  return {
    aktiv: speicher.roh(SCHLUESSEL.aktiv),
    warteschlange: speicher.roh(SCHLUESSEL.warteschlange),
    legacy: speicher.roh(SCHLUESSEL.legacy),
  }
}

describe('Gastliste liest ehrlich', () => {
  test('ein leerer Speicher ist Abwesenheit und kein Schreibvorgang', () => {
    const vorher = rohStand()
    const lese = gastListeBeobachten()
    assert.equal(lese.art, 'fehlend')
    assert.equal(lese.schrieb, false)
    assert.deepEqual(rohStand(), vorher)
    assert.deepEqual(speicher.schreibvorgaenge, [])
    assert.equal(gastListeDarfErstellen(lese), true)
  })

  test('eine gültige aktive Reise bleibt die Reise und schreibt nicht', () => {
    const reise = gastreiseAnlegen(eingabe({ clientRef: 'trip-fest', title: 'Japan im Herbst' }))
    const vorher = rohStand()
    speicher.leerenZaehler()

    const lese = gastListeBeobachten()

    assert.equal(lese.art, 'gueltig')
    if (lese.art !== 'gueltig') return
    assert.equal(lese.reise.id, reise.id)
    assert.equal(lese.reise.title, 'Japan im Herbst')
    assert.equal(lese.schrieb, false)
    assert.deepEqual(rohStand(), vorher)
    assert.deepEqual(speicher.schreibvorgaenge, [])
    assert.equal(gastListeDarfErstellen(lese), false)
    assert.equal(gastArbeitsbereichBeobachten(reise.id).art, 'passend')
    assert.equal(gastArbeitsbereichBeobachten('trip-andere').art, 'andere_reise')
  })

  test('ungültige aktive Bytes bleiben liegen und sind keine erste Reise', () => {
    speicher.setzen(SCHLUESSEL.aktiv, '{kein JSON')
    const vorher = rohStand()

    const lese = gastListeBeobachten()

    assert.equal(lese.art, 'ungueltig')
    assert.equal(lese.schrieb, false)
    assert.deepEqual(rohStand(), vorher)
    assert.deepEqual(speicher.schreibvorgaenge, [])
    assert.equal(gastListeDarfErstellen(lese), false)
    assert.equal(gastArbeitsbereichDarfErstellen(gastArbeitsbereichBeobachten('trip-fest')), false)
  })

  test('ein Lesefehler ist kein leerer Entwurf', () => {
    speicher.setzen(SCHLUESSEL.aktiv, '{kein JSON')
    const vorher = rohStand()
    speicher.lesenWerfen()

    const lese = gastListeBeobachten()

    assert.equal(lese.art, 'speicher_unlesbar')
    assert.equal(lese.schrieb, false)
    assert.deepEqual(speicher.schreibvorgaenge, [])
    assert.deepEqual(rohStand(), vorher)
    assert.equal(gastListeDarfErstellen(lese), false)
  })

  test('ein unlesbarer Legacy-Schlüssel bei fehlendem Aktivschlüssel ist kein freier Slot', () => {
    speicher.setzen(SCHLUESSEL.legacy, 'noch-da')
    speicher.werfenFuer(SCHLUESSEL.legacy)

    const lese = gastListeBeobachten()

    assert.equal(lese.art, 'speicher_unlesbar')
    assert.equal(speicher.roh(SCHLUESSEL.legacy), 'noch-da')
    assert.equal(speicher.roh(SCHLUESSEL.aktiv), null)
    assert.deepEqual(speicher.schreibvorgaenge, [])
  })

  test('wieder lesbarer Speicher zeigt die Reise nach einer erneuten Prüfung', () => {
    const reise = gastreiseAnlegen(eingabe({ clientRef: 'trip-fest' }))
    speicher.leerenZaehler()
    speicher.lesenWerfen()
    assert.equal(gastListeBeobachten().art, 'speicher_unlesbar')
    speicher.lesenLassen()

    const lese = gastListeBeobachten()
    assert.equal(lese.art, 'gueltig')
    if (lese.art !== 'gueltig') return
    assert.equal(lese.reise.id, reise.id)
    assert.deepEqual(speicher.schreibvorgaenge, [])
  })

  test('ungültig wird nach einer erneuten Prüfung gültig, ohne die alten Bytes vorher zu löschen', () => {
    const reise = gastreiseAnlegen(eingabe({ clientRef: 'trip-fest', title: 'Wieder da' }))
    const gueltig = speicher.roh(SCHLUESSEL.aktiv)
    speicher.loeschen(SCHLUESSEL.aktiv)
    speicher.setzen(SCHLUESSEL.aktiv, '{kein JSON')
    speicher.leerenZaehler()
    assert.equal(gastListeBeobachten().art, 'ungueltig')
    assert.equal(speicher.roh(SCHLUESSEL.aktiv), '{kein JSON')
    assert.deepEqual(speicher.schreibvorgaenge, [])

    speicher.setzen(SCHLUESSEL.aktiv, gueltig)
    const lese = gastListeBeobachten()
    assert.equal(lese.art, 'gueltig')
    if (lese.art !== 'gueltig') return
    assert.equal(lese.reise.id, reise.id)
    assert.equal(lese.reise.title, 'Wieder da')
    assert.equal(lese.schrieb, false)
  })

  test('ungültig wird nach einer erneuten Prüfung zu echter Abwesenheit', () => {
    speicher.setzen(SCHLUESSEL.aktiv, '{kein JSON')
    assert.equal(gastListeBeobachten().art, 'ungueltig')
    speicher.loeschen(SCHLUESSEL.aktiv)
    speicher.leerenZaehler()

    const lese = gastListeBeobachten()
    assert.equal(lese.art, 'fehlend')
    assert.equal(lese.schrieb, false)
    assert.equal(speicher.roh(SCHLUESSEL.aktiv), null)
    assert.deepEqual(speicher.schreibvorgaenge, [])
    assert.equal(gastListeDarfErstellen(lese), true)
  })

  test('ein Wechsel zwischen Vorprüfung und Laden ist kein leerer Entwurf', () => {
    speicher.setzen(SCHLUESSEL.aktiv, '{kein JSON')
    speicher.nachErsterAktivLesen(null)
    const vorher = rohStand()

    const lese = gastListeBeobachten()

    assert.equal(lese.art, 'abweichend')
    assert.equal(gastListeDarfErstellen(lese), false)
    assert.deepEqual(speicher.schreibvorgaenge, [])
    assert.equal(vorher.aktiv, '{kein JSON')
  })

  test('eine gültige Legacy-Reise wird übernommen und der Schreibvorgang gemeldet', () => {
    speicher.setzen(SCHLUESSEL.legacy, [legacyEntwurf()])
    const vorher = rohStand()

    const lese = gastListeBeobachten()

    assert.equal(lese.art, 'gueltig')
    if (lese.art !== 'gueltig') return
    assert.equal(lese.reise.id, 'trip-alt-1')
    assert.equal(lese.reise.title, 'Barcelona')
    assert.equal(lese.schrieb, true)
    assert.equal(speicher.roh(SCHLUESSEL.legacy), null)
    assert.ok(speicher.roh(SCHLUESSEL.aktiv)?.includes('trip-alt-1'))
    assert.notEqual(vorher.legacy, speicher.roh(SCHLUESSEL.legacy))
    assert.ok(speicher.schreibvorgaenge.length > 0)
    assert.equal(gastArbeitsbereichBeobachten('trip-alt-1').art, 'passend')
  })

  test('eine Legacy-Reise ohne Kennung erfindet bei fehlgeschlagenem Schreiben keinen Fortsetzen-Link', () => {
    const ohneKennung = legacyEntwurf()
    Reflect.deleteProperty(ohneKennung, 'id')
    speicher.setzen(SCHLUESSEL.legacy, [ohneKennung])
    speicher.sperren()
    const vorher = rohStand()

    const lese = gastListeBeobachten()
    const arbeitsbereich = gastArbeitsbereichBeobachten('irgendeine-kennung')

    assert.equal(lese.art, 'belegt_ohne_kennung')
    assert.equal(lese.schrieb, false)
    assert.equal(arbeitsbereich.art, 'belegt_ohne_kennung')
    assert.equal('id' in arbeitsbereich, false)
    assert.deepEqual(rohStand(), vorher)
    assert.equal(gastListeDarfErstellen(lese), false)
    assert.equal(gastArbeitsbereichDarfErstellen(arbeitsbereich), false)
  })

  test('eine gültige Warteschlange ohne aktive Reise bleibt gelistet und unverändert', () => {
    const reise = gastreiseAnlegen(eingabe({ clientRef: 'trip-queue', title: 'Wartende Reise' }))
    const roh = speicher.roh(SCHLUESSEL.aktiv)
    assert.ok(roh)
    speicher.loeschen(SCHLUESSEL.aktiv)
    speicher.setzen(SCHLUESSEL.warteschlange, [JSON.parse(roh) as Trip])
    const vorher = rohStand()
    speicher.leerenZaehler()

    const lese = gastListeBeobachten()

    assert.equal(lese.art, 'nur_warteschlange')
    if (lese.art !== 'nur_warteschlange') return
    assert.equal(lese.warteschlange[0]?.id, reise.id)
    assert.equal(lese.warteschlange[0]?.title, 'Wartende Reise')
    assert.equal(lese.schrieb, false)
    assert.deepEqual(rohStand(), vorher)
    assert.deepEqual(speicher.schreibvorgaenge, [])
    assert.equal(gastListeDarfErstellen(lese), true)
    assert.equal(gastArbeitsbereichBeobachten(reise.id).art, 'fehlend')
    assert.equal(gastArbeitsbereichDarfErstellen(gastArbeitsbereichBeobachten(reise.id)), true)
  })

  test('ungültige aktive Bytes verdecken eine gültige Warteschlange nicht und schreiben nicht', () => {
    const reise = gastreiseAnlegen(eingabe({ clientRef: 'trip-queue', title: 'Wartende Reise' }))
    const roh = speicher.roh(SCHLUESSEL.aktiv)
    speicher.loeschen(SCHLUESSEL.aktiv)
    speicher.setzen(SCHLUESSEL.warteschlange, [JSON.parse(roh ?? 'null') as Trip])
    speicher.setzen(SCHLUESSEL.aktiv, '{kein JSON')
    const vorher = rohStand()
    speicher.leerenZaehler()

    const lese = gastListeBeobachten()

    assert.equal(lese.art, 'ungueltig')
    if (lese.art !== 'ungueltig') return
    assert.equal(lese.warteschlange[0]?.id, reise.id)
    assert.equal(lese.warteschlange[0]?.title, 'Wartende Reise')
    assert.equal(lese.schrieb, false)
    assert.deepEqual(rohStand(), vorher)
    assert.deepEqual(speicher.schreibvorgaenge, [])
    assert.equal(gastListeDarfErstellen(lese), false)
  })
})

describe('Arbeitsbereich unterscheidet die angeforderte Reise', () => {
  test('eine andere gültige Reise wird nicht eingesetzt', () => {
    const liste = {
      art: 'gueltig' as const,
      reise: { id: 'trip-a', title: '  Alpha  ' } as Trip,
      warteschlange: [],
      schrieb: false,
    }
    const andere = gastArbeitsbereichAusListe('trip-b', liste)
    assert.deepEqual(andere, { art: 'andere_reise', id: 'trip-a', titel: 'Alpha' })
    assert.equal(gastArbeitsbereichDarfErstellen(andere), false)
    const passend = gastArbeitsbereichAusListe('trip-a', liste)
    assert.equal(passend.art, 'passend')
  })

  test('Vorprüfung gültig und Laden leer ist kein Fehlen', () => {
    const belegt: GastCreateBelegung = { art: 'gueltig', id: 'trip-a', titel: 'Alpha' }
    const ladung = { aktiv: null, warteschlange: [] } satisfies Gastspeicher
    const danach: GastCreateBelegung = { art: 'fehlend' }
    const lese = gastListeAusBeobachtung(belegt, ladung, danach, false)
    assert.equal(lese.art, 'abweichend')
    assert.equal(gastArbeitsbereichAusListe('trip-a', lese).art, 'abweichend')
    assert.equal(gastListeDarfErstellen(lese), false)
  })
})
