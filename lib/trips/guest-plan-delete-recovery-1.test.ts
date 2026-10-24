import assert from 'node:assert/strict'
import { beforeEach, describe, test } from 'node:test'

import {
  GastspeicherUnlesbarFehler,
  SCHLUESSEL,
  SpeicherFehler,
  VeralteteFassungFehler,
  gastPlanpunktAnlegen,
  gastPlanpunktEntfernen,
  gastreiseAnlegen,
  gastreiseLadenNach,
  kennungErzeugen,
} from '@/lib/trips/gastspeicher'
import { reiseLesen } from '@/lib/trips/schema'
import { tageEtappenZuordnen } from '@/lib/trips/zuordnung'
import {
  gastLoeschBasisGleich,
  sichtbaresZielUrteil,
} from '@/lib/trips/trip-plan-editing-placement-recovery-1'
import type { CreateTripInput, Trip } from '@/types/trips'

function speicherStellen() {
  const ablage = new Map<string, string>()
  const schreibvorgaenge: string[] = []
  let lesenWirft = false
  let schreibenWirft = false
  let readbackFalsch = false
  const localStorage = {
    getItem: (schluessel: string) => {
      if (lesenWirft) throw new Error('SecurityError')
      return ablage.get(schluessel) ?? null
    },
    setItem: (schluessel: string, wert: string) => {
      schreibvorgaenge.push(schluessel)
      if (schreibenWirft) throw new Error('QuotaExceededError')
      ablage.set(schluessel, readbackFalsch && schluessel === SCHLUESSEL.aktiv ? `${wert} ` : wert)
    },
    removeItem: (schluessel: string) => {
      schreibvorgaenge.push(`remove:${schluessel}`)
      ablage.delete(schluessel)
    },
  }
  Object.assign(globalThis, { window: { localStorage } })
  return {
    ablage,
    schreibvorgaenge,
    lesenWerfen: () => {
      lesenWirft = true
    },
    schreibenWerfen: () => {
      schreibenWirft = true
    },
    readbackFalsch: () => {
      readbackFalsch = true
    },
    roh: (schluessel: string) => ablage.get(schluessel) ?? null,
    setzen: (schluessel: string, wert: unknown) => {
      ablage.set(schluessel, typeof wert === 'string' ? wert : JSON.stringify(wert))
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
    endDate: '2026-09-14',
    travellers: 1,
    currency: 'CHF',
    budgetAmount: null,
    pace: 'balanced',
    interests: [],
    travelWish: 'Ruhe',
    ...abweichung,
  }
}

function reiseMitZweiPunkten() {
  let reise = gastreiseAnlegen(eingabe())
  const tag = reise.days[0]!.id
  reise = gastPlanpunktAnlegen(reise, { dayId: tag, kind: 'note', title: 'Bleibt', note: 'Notiz', startsAt: '09:30' })
  reise = gastPlanpunktAnlegen(reise, { dayId: tag, kind: 'note', title: 'Weg', note: null, startsAt: null })
  return reise
}

function bytes() {
  return speicher.roh(SCHLUESSEL.aktiv)
}

function schriebeVorher() {
  const vorher = speicher.schreibvorgaenge.length
  return () => speicher.schreibvorgaenge.slice(vorher)
}

describe('Gastlöschung prüft die gespeicherte Basis', () => {
  test('eine gültige Löschung entfernt nur das Ziel und liest den Stand zurück', () => {
    const reise = reiseMitZweiPunkten()
    const ziel = reise.days[0]!.items[1]!.id
    const bleibt = reise.days[0]!.items[0]!
    const danach = gastPlanpunktEntfernen(reise, ziel)
    const geladen = gastreiseLadenNach(reise.id)
    assert.equal(danach.days[0]!.items.some((punkt) => punkt.id === ziel), false)
    assert.deepEqual(
      danach.days[0]!.items.map((punkt) => [punkt.title, punkt.position]),
      [['Bleibt', 1]],
    )
    assert.equal(danach.revision, reise.revision + 1)
    assert.equal(geladen?.revision, danach.revision)
    assert.equal(geladen?.days[0]?.items[0]?.id, bleibt.id)
    assert.equal(geladen?.days[0]?.items[0]?.note, 'Notiz')
    assert.equal(geladen?.days[0]?.items[0]?.startsAt, '09:30')
    assert.equal(geladen?.days[0]?.items[0]?.stageId, bleibt.stageId)
    assert.equal(geladen?.title, reise.title)
    assert.equal(geladen?.travelWish, reise.travelWish)
  })

  test('eine projizierte Aufrufer-Fassung löscht, ohne die Projektion zu speichern', () => {
    reiseMitZweiPunkten()
    const roh = JSON.parse(bytes()!) as Trip
    for (const tag of roh.days) {
      tag.stageId = null
      for (const punkt of tag.items) punkt.stageId = null
    }
    speicher.setzen(SCHLUESSEL.aktiv, roh)
    const aktuell = reiseLesen(roh)
    assert.ok(aktuell)
    const aufrufer = tageEtappenZuordnen(aktuell)
    assert.notEqual(aufrufer.days[0]?.stageId, null)
    const ziel = aufrufer.days[0]!.items[1]!.id
    const danach = gastPlanpunktEntfernen(aufrufer, ziel)
    const gespeichert = JSON.parse(bytes()!) as Trip
    assert.equal(danach.days[0]?.items.length, 1)
    assert.equal(gespeichert.days[0]?.stageId, null)
    assert.equal(gespeichert.days[0]?.items[0]?.stageId, null)
    assert.equal(gespeichert.days[0]?.items[0]?.note, 'Notiz')
    assert.equal(gespeichert.title, roh.title)
    assert.equal(gespeichert.travelWish, roh.travelWish)
    assert.equal(gespeichert.revision, roh.revision + 1)
  })

  test('gleiche Kennung und Revision mit einer abweichenden Fassung schreiben nicht', () => {
    const reise = reiseMitZweiPunkten()
    const ziel = reise.days[0]!.items[1]!.id
    const faelle: Array<(kopie: Trip) => void> = [
      (kopie) => {
        kopie.title = 'Andere Reise'
      },
      (kopie) => {
        kopie.travelWish = 'Andere Wunsch'
      },
      (kopie) => {
        kopie.days[0]!.items[0]!.note = 'verändert'
      },
      (kopie) => {
        const punkt = kopie.days[0]!.items[1]!
        kopie.days[0]!.items.splice(1, 1)
        kopie.ohneTag.push({ ...punkt, dayId: null })
      },
      (kopie) => {
        kopie.updatedAt = '2020-01-01T00:00:00.000Z'
      },
      (kopie) => {
        const zweite = { ...kopie.stages[0]!, id: 'stage-zwei', position: 2, name: 'Osaka' }
        kopie.stages = [...kopie.stages, zweite]
        kopie.days[0]!.stageId = zweite.id
        for (const punkt of kopie.days[0]!.items) punkt.stageId = zweite.id
      },
      (kopie) => {
        kopie.readinessItems = [
          {
            id: 'ready-1',
            clientRef: 'ready-1',
            kind: 'entry_check',
            userStatus: 'open',
            evidence: 'user',
            countryCode: null,
            tripItemId: null,
            title: null,
            contextFingerprint: 'fp-drift',
            travellerClientRef: null,
            createdAt: '2026-10-24T12:00:00.000Z',
            updatedAt: '2026-10-24T12:00:00.000Z',
          },
        ]
      },
      (kopie) => {
        kopie.party = [
          {
            id: 'traveller-drift',
            clientRef: 'traveller:drift',
            label: null,
            residenceCountryCode: 'CH',
            citizenships: [],
            documents: [],
            createdAt: '2026-10-24T12:00:00.000Z',
            updatedAt: '2026-10-24T12:00:00.000Z',
          },
        ]
      },
    ]
    for (const aendern of faelle) {
      const vorher = bytes()
      const kopie = JSON.parse(vorher!) as Trip
      aendern(kopie)
      const aufrufer = reiseLesen(kopie)
      assert.ok(aufrufer, 'die abweichende Fassung bleibt eine lesbare Reise')
      assert.equal(aufrufer.id, reise.id)
      assert.equal(aufrufer.revision, reise.revision)
      const schreibt = schriebeVorher()
      assert.throws(() => gastPlanpunktEntfernen(aufrufer, ziel), VeralteteFassungFehler)
      assert.equal(bytes(), vorher)
      assert.deepEqual(schreibt(), [])
    }
  })

  test('eine andere aktive Reise und eine neuere Revision bleiben bytegleich', () => {
    const reise = reiseMitZweiPunkten()
    const vorher = bytes()!
    const andere = reiseLesen(JSON.parse(vorher) as Trip)
    assert.ok(andere)
    andere.id = kennungErzeugen('trip')
    const neuere = reiseLesen(JSON.parse(vorher) as Trip)
    assert.ok(neuere)
    neuere.revision += 1
    speicher.setzen(SCHLUESSEL.legacy, '{"legacy":true}')
    speicher.setzen(SCHLUESSEL.warteschlange, '{"queue":true}')
    assert.throws(() => gastPlanpunktEntfernen(andere, reise.days[0]!.items[0]!.id), VeralteteFassungFehler)
    speicher.setzen(SCHLUESSEL.aktiv, JSON.parse(vorher) as Trip)
    const gespeichert = reiseLesen(JSON.parse(bytes()!) as Trip)
    assert.ok(gespeichert)
    gespeichert.revision += 1
    speicher.setzen(SCHLUESSEL.aktiv, gespeichert)
    const stand = bytes()
    assert.throws(() => gastPlanpunktEntfernen(reise, reise.days[0]!.items[0]!.id), VeralteteFassungFehler)
    assert.equal(bytes(), stand)
    assert.equal(speicher.roh(SCHLUESSEL.legacy), '{"legacy":true}')
    assert.equal(speicher.roh(SCHLUESSEL.warteschlange), '{"queue":true}')
  })

  test('fehlender, unlesbarer oder ungültiger Speicher schreibt nicht', () => {
    const reise = reiseMitZweiPunkten()
    const ziel = reise.days[0]!.items[0]!.id
    speicher.setzen(SCHLUESSEL.legacy, 'legacy')
    speicher.setzen(SCHLUESSEL.warteschlange, 'queue')

    speicher.ablage.delete(SCHLUESSEL.aktiv)
    assert.throws(() => gastPlanpunktEntfernen(reise, ziel), /keine aktive Gastreise/)
    assert.equal(speicher.roh(SCHLUESSEL.aktiv), null)

    speicher.setzen(SCHLUESSEL.aktiv, '{kein json')
    assert.throws(() => gastPlanpunktEntfernen(reise, ziel), /nicht lesen/)
    assert.equal(speicher.roh(SCHLUESSEL.aktiv), '{kein json')

    speicher.setzen(SCHLUESSEL.aktiv, { id: 'halb' })
    assert.throws(() => gastPlanpunktEntfernen(reise, ziel), /ungültig/)
    assert.equal(speicher.roh(SCHLUESSEL.aktiv), JSON.stringify({ id: 'halb' }))

    speicher.setzen(SCHLUESSEL.aktiv, JSON.parse(JSON.stringify(reise)) as Trip)
    assert.throws(
      () => gastPlanpunktEntfernen({ ...reise, title: '   ' } as Trip, ziel),
      /vorgelegte Reise ist ungültig/,
    )

    const schriebe = speicher.schreibvorgaenge.length
    speicher.lesenWerfen()
    assert.throws(() => gastPlanpunktEntfernen(reise, ziel), GastspeicherUnlesbarFehler)
    assert.equal(speicher.roh(SCHLUESSEL.legacy), 'legacy')
    assert.equal(speicher.roh(SCHLUESSEL.warteschlange), 'queue')
    assert.equal(speicher.schreibvorgaenge.length, schriebe)
  })

  test('ein fehlendes oder doppeltes Ziel erhöht die Revision nicht', () => {
    const reise = reiseMitZweiPunkten()
    const vorher = bytes()
    assert.throws(() => gastPlanpunktEntfernen(reise, 'item-fehlt'), /nicht genau einmal/)
    assert.equal(bytes(), vorher)
    const doppelt = JSON.parse(vorher!) as Trip
    doppelt.ohneTag.push({ ...doppelt.days[0]!.items[0]!, dayId: null })
    speicher.setzen(SCHLUESSEL.aktiv, doppelt)
    const aufrufer = reiseLesen(doppelt)
    assert.ok(aufrufer)
    const stand = bytes()
    assert.throws(() => gastPlanpunktEntfernen(aufrufer, doppelt.days[0]!.items[0]!.id), /nicht genau einmal/)
    assert.equal(bytes(), stand)
    assert.equal(JSON.parse(stand!).revision, reise.revision)
  })

  test('Schreib- und Readback-Fehler sind kein Erfolg und kein Rollback', () => {
    const reise = reiseMitZweiPunkten()
    const vorher = bytes()
    speicher.schreibenWerfen()
    assert.throws(() => gastPlanpunktEntfernen(reise, reise.days[0]!.items[1]!.id), SpeicherFehler)
    assert.equal(bytes(), vorher)

    speicher = speicherStellen()
    const erneut = reiseMitZweiPunkten()
    speicher.readbackFalsch()
    assert.throws(() => gastPlanpunktEntfernen(erneut, erneut.days[0]!.items[1]!.id), SpeicherFehler)
    const hinterlassen = bytes()
    assert.notEqual(hinterlassen, null)
    assert.notEqual(hinterlassen, JSON.stringify(erneut))
  })

  test('eine zweite Löschung mit der alten Fassung schreibt nicht noch einmal', () => {
    const reise = reiseMitZweiPunkten()
    const ziel = reise.days[0]!.items[1]!.id
    const danach = gastPlanpunktEntfernen(reise, ziel)
    const stand = bytes()
    assert.throws(() => gastPlanpunktEntfernen(reise, ziel), VeralteteFassungFehler)
    assert.equal(bytes(), stand)
    assert.throws(() => gastPlanpunktEntfernen(danach, ziel), /nicht genau einmal/)
    assert.equal(bytes(), stand)
    assert.equal(JSON.parse(stand!).revision, danach.revision)
  })

  test('ohne Browser schreibt die Funktion nicht', () => {
    const reise = reiseMitZweiPunkten()
    const vorher = bytes()
    Object.assign(globalThis, { window: undefined })
    assert.throws(() => gastPlanpunktEntfernen(reise, reise.days[0]!.items[0]!.id), GastspeicherUnlesbarFehler)
    Object.assign(globalThis, { window: { localStorage: speicher } })
    assert.equal(speicher.roh(SCHLUESSEL.aktiv), vorher)
  })
})

describe('gastLoeschBasisGleich', () => {
  test('projizierte Kopien sind gleich, Drift nicht, und die Eingaben bleiben', () => {
    reiseMitZweiPunkten()
    const roh = JSON.parse(bytes()!) as Trip
    for (const tag of roh.days) {
      tag.stageId = null
      for (const punkt of tag.items) punkt.stageId = null
    }
    const aktuell = reiseLesen(roh)
    assert.ok(aktuell)
    const projiziert = tageEtappenZuordnen(aktuell)
    const vorherAktuell = JSON.stringify(aktuell)
    const vorherProjiziert = JSON.stringify(projiziert)
    assert.equal(gastLoeschBasisGleich(projiziert, aktuell), true)
    assert.equal(JSON.stringify(aktuell), vorherAktuell)
    assert.equal(JSON.stringify(projiziert), vorherProjiziert)
    const titel = { ...projiziert, title: 'Anders' }
    const wunsch = { ...projiziert, travelWish: 'Anders' }
    const notiz = {
      ...projiziert,
      days: projiziert.days.map((tag, index) =>
        index === 0
          ? { ...tag, items: tag.items.map((punkt, stelle) => (stelle === 0 ? { ...punkt, note: 'anders' } : punkt)) }
          : tag,
      ),
    }
    assert.equal(gastLoeschBasisGleich(titel, aktuell), false)
    assert.equal(gastLoeschBasisGleich(wunsch, aktuell), false)
    assert.equal(gastLoeschBasisGleich(notiz, aktuell), false)
  })
})

describe('sichtbares Ziel', () => {
  test('unterscheidet eigene Rückmeldung, No-Op und versionsgleiche Abweichung', () => {
    const reise = reiseMitZweiPunkten()
    const original = reise.days[0]!.items[0]!
    const erwartet = { ...original, title: 'Neu' }
    const gleicheVersion = { ...erwartet }
    const neueVersion = { ...erwartet, rowVersion: '2026-10-24T16:00:00.000Z' }
    const noop = { ...original }
    const versionNur = { ...original, rowVersion: '2026-10-24T16:00:00.000Z' }
    assert.equal(sichtbaresZielUrteil([gleicheVersion], original, erwartet), 'erwartet')
    assert.equal(sichtbaresZielUrteil([neueVersion], original, erwartet), 'erwartet')
    assert.equal(sichtbaresZielUrteil([noop], original, noop), 'erwartet')
    assert.equal(sichtbaresZielUrteil([original], original, erwartet), 'original')
    assert.equal(sichtbaresZielUrteil([versionNur], original, erwartet), 'version')
    assert.equal(sichtbaresZielUrteil([], original, erwartet), 'fremd')
    assert.equal(sichtbaresZielUrteil([original, { ...original }], original, erwartet), 'fremd')
    assert.equal(sichtbaresZielUrteil([{ ...erwartet, note: 'fremd' }], original, erwartet), 'fremd')
  })
})
