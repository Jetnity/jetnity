// lib/trips/gastspeicher.test.ts
//
// Der Gastspeicher trägt zwei Produktregeln, und beide sind teuer, wenn sie
// brechen:
//
//   · Ohne Konto gibt es genau eine aktive Gastreise.
//   · Was auf diesem Gerät liegt, geht bei einer Anmeldung vollständig ins
//     Konto – und wird erst gelöscht, wenn es dort bestätigt angekommen ist.
//
// Bis Phase 1.5 lagen bis zu zwanzig Entwürfe unter einem Schlüssel: Die erste
// Regel existierte, nur nicht im Code. Die Entwürfe zu verwerfen wäre der
// bequeme Weg gewesen und eine stille Datenlöschung – deshalb prüft dieser Test
// die Übernahme aus der alten Fassung Zeile für Zeile.
//
// Der `localStorage` wird gestellt. Das Modul liest ihn erst beim Aufruf
// (`verfuegbar()`), ein globaler Ersatz genügt also und braucht keinen Browser.

import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { OPTION_DIREKT } from '@/lib/flights/fixtures/optionen'
import { alsFlugMomentaufnahme } from '@/lib/flights/uebernahme'
import { istKommerziell } from '@/lib/reiseaenderung/geschuetzt'
import {
  GastreiseBestehtFehler,
  SCHLUESSEL,
  SpeicherFehler,
  gastFlugUebernehmen,
  gastPlanpunktAnlegen,
  gastPlanpunktEntfernen,
  gastreiseAendern,
  gastreiseAnlegen,
  gastreiseEntfernen,
  gastreiseLadenNach,
  gastreiseSpeichern,
  gastspeicherLaden,
  kennungErzeugen,
  uebernommenStreichen,
  VeralteteFassungFehler,
  zurUebernahme,
} from '@/lib/trips/gastspeicher'
import type { CreateTripInput } from '@/types/trips'
import type { Modelloperation } from '@/lib/reiseaenderung/schema'

/**
 * Ein `localStorage`, der sich wie einer verhält – inklusive der drei Arten,
 * auf die ein echter versagt:
 *
 *   · `sperren()`      – voller Speicher, `setItem` wirft (Quota).
 *   · `sperrenFuer()`  – nur ein Schlüssel scheitert. Genau so bricht eine
 *                        Übernahme zwischen zwei Schlüsseln ab.
 *   · `stummschalten()`– `setItem` wirft nicht und behält trotzdem nichts. So
 *                        verhält sich der private Modus mancher Browser, und
 *                        nur das Zurücklesen bemerkt es.
 */
function speicherStellen() {
  const ablage = new Map<string, string>()
  let gesperrt = false
  let stumm = false
  let loeschenGesperrt = false
  const gesperrteSchluessel = new Set<string>()

  const localStorage = {
    getItem: (schluessel: string) => ablage.get(schluessel) ?? null,
    setItem: (schluessel: string, wert: string) => {
      if (gesperrt || gesperrteSchluessel.has(schluessel)) throw new Error('QuotaExceededError')
      if (stumm) return
      ablage.set(schluessel, wert)
    },
    removeItem: (schluessel: string) => {
      if (loeschenGesperrt) throw new Error('SecurityError')
      ablage.delete(schluessel)
    },
  }

  // `globalThis.window` existiert im Test nicht. Das Modul prüft genau darauf.
  Object.assign(globalThis, { window: { localStorage } })

  return {
    ablage,
    sperren: () => {
      gesperrt = true
    },
    entsperren: () => {
      gesperrt = false
      stumm = false
      loeschenGesperrt = false
      gesperrteSchluessel.clear()
    },
    sperrenFuer: (schluessel: string) => gesperrteSchluessel.add(schluessel),
    stummschalten: () => {
      stumm = true
    },
    loeschenSperren: () => {
      loeschenGesperrt = true
    },
    roh: (schluessel: string) => ablage.get(schluessel) ?? null,
    setzen: (schluessel: string, wert: unknown) =>
      ablage.set(schluessel, typeof wert === 'string' ? wert : JSON.stringify(wert)),
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

function leerOp(teil: Partial<Modelloperation> & Pick<Modelloperation, 'art'>): Modelloperation {
  return {
    etappeId: null,
    tagId: null,
    punktId: null,
    nachEtappeId: null,
    nachTagId: null,
    name: null,
    laendercode: null,
    titel: null,
    notiz: null,
    beginn: null,
    punktArt: null,
    tageDelta: null,
    tage: null,
    reisende: null,
    budgetziel: null,
    tempo: null,
    interessen: null,
    reisewunsch: null,
    abreiseort: null,
    startdatum: null,
    ...teil,
  }
}

describe('Ein Gast ohne Reise', () => {
  test('der Speicher ist leer und kein Fehler', () => {
    const stand = gastspeicherLaden()

    assert.equal(stand.aktiv, null)
    assert.deepEqual(stand.warteschlange, [])
  })

  test('es gibt nichts zu übernehmen', () => {
    assert.deepEqual(zurUebernahme(), [])
  })

  test('ein unlesbarer Eintrag bricht das Laden nicht ab', () => {
    speicher.setzen(SCHLUESSEL.aktiv, '{kein JSON')

    assert.equal(gastspeicherLaden().aktiv, null)
  })

  test('ein Eintrag, der keine gültige Reise ist, wird verworfen statt halb geladen', () => {
    // Eine Reise mit einem Tag ohne Nummer wäre in der Oberfläche ein Rätsel
    // und in der Übernahme eine Ablehnung.
    speicher.setzen(SCHLUESSEL.aktiv, { id: 'trip-1', title: 'Halb' })

    assert.equal(gastspeicherLaden().aktiv, null)
  })
})

describe('Genau eine aktive Gastreise', () => {
  test('die erste Reise entsteht', () => {
    const reise = gastreiseAnlegen(eingabe())

    assert.equal(reise.title, 'Japan im Herbst')
    assert.equal(reise.days.length, 5, 'die Tage entstehen aus dem Zeitraum')
    assert.equal(reise.stages[0].name, 'Japan', 'das Ziel wird die erste Etappe')
    assert.equal(reise.stages[0].placeId, 'geonames:1861060')
    assert.equal(reise.originPlaceId, 'geonames:2657896')
    assert.equal(gastspeicherLaden().aktiv?.id, reise.id)
  })

  test('die Kennung des Formulars wird die Kennung des Entwurfs', () => {
    // Sie trägt die Idempotenz weiter: Bei der Übernahme prüft dieselbe Kennung
    // in der Datenbank `unique (user_id, client_ref)`.
    const angaben = eingabe({ clientRef: 'trip-fest' })
    const reise = gastreiseAnlegen(angaben)

    assert.equal(reise.id, 'trip-fest')
    assert.equal(reise.clientRef, 'trip-fest')
  })

  test('eine zweite Reise wird abgelehnt und nennt die bestehende', () => {
    const erste = gastreiseAnlegen(eingabe())

    assert.throws(
      () => gastreiseAnlegen(eingabe()),
      (fehler: unknown) => {
        assert.ok(fehler instanceof GastreiseBestehtFehler)
        assert.equal(fehler.bestehendeId, erste.id)
        assert.match(fehler.message, /Konto/)
        return true
      },
    )
  })

  test('die abgelehnte zweite Reise überschreibt die erste nicht', () => {
    const erste = gastreiseAnlegen(eingabe({ title: 'Erste Reise' }))

    try {
      gastreiseAnlegen(eingabe({ title: 'Zweite Reise' }))
    } catch {
      // erwartet
    }

    assert.equal(gastspeicherLaden().aktiv?.title, 'Erste Reise')
    assert.equal(gastspeicherLaden().aktiv?.id, erste.id)
  })

  test('nach dem Verwerfen ist wieder Platz', () => {
    gastreiseAnlegen(eingabe())
    gastreiseEntfernen()

    assert.equal(gastspeicherLaden().aktiv, null)
    assert.doesNotThrow(() => gastreiseAnlegen(eingabe()))
  })
})

describe('Bearbeiten einer Gastreise', () => {
  test('ein Planpunkt landet am gewählten Tag', () => {
    const reise = gastreiseAnlegen(eingabe())
    const tag = reise.days[1]

    const danach = gastPlanpunktAnlegen(reise, {
      dayId: tag.id,
      kind: 'activity',
      title: 'Tsukiji Outer Market',
      note: null,
      startsAt: '09:30',
    })

    assert.equal(danach.days[1].items.length, 1)
    assert.equal(danach.days[1].items[0].title, 'Tsukiji Outer Market')
    assert.equal(danach.days[1].items[0].dayId, tag.id)
    assert.equal(danach.days[0].items.length, 0)
    assert.equal(gastspeicherLaden().aktiv?.days[1].items.length, 1, 'und ist gespeichert')
  })

  test('ein übernommener Flug bleibt kommerziell gespeichert', () => {
    const reise = gastreiseAnlegen(eingabe())
    const aufnahme = alsFlugMomentaufnahme(OPTION_DIREKT)
    assert.ok(aufnahme)
    const danach = gastFlugUebernehmen(reise, aufnahme, reise.days[0]!.id)
    const flug = danach.days[0]?.items.find((punkt) => punkt.kind === 'flight')
    assert.ok(flug)
    assert.equal(istKommerziell(flug), true)
    assert.equal(flug.priceAmount, 892.5)
    assert.equal(flug.provider, 'duffel')
    assert.equal(flug.bookingUrl, null)
    assert.equal(gastspeicherLaden().aktiv?.days[0]?.items[0]?.provider, 'duffel')
  })

  test('ein Punkt an einem fremden Tag wird abgelehnt', () => {
    const reise = gastreiseAnlegen(eingabe())

    assert.throws(() =>
      gastPlanpunktAnlegen(reise, {
        dayId: 'day-gibt-es-nicht',
        kind: 'note',
        title: 'Irgendwas',
        note: null,
        startsAt: null,
      }),
    )
  })

  test('nach dem Entfernen sind die Reihenfolgen wieder lückenlos', () => {
    // Eine Lücke in `position` wäre in der Datenbank erlaubt und in der Anzeige
    // eine Reihenfolge, die niemand erklären kann.
    let reise = gastreiseAnlegen(eingabe())
    const tag = reise.days[0].id

    for (const titel of ['Erster', 'Zweiter', 'Dritter']) {
      reise = gastPlanpunktAnlegen(reise, {
        dayId: tag,
        kind: 'note',
        title: titel,
        note: null,
        startsAt: null,
      })
    }

    const zweiter = reise.days[0].items[1].id
    reise = gastPlanpunktEntfernen(reise, zweiter)

    assert.deepEqual(
      reise.days[0].items.map((punkt) => [punkt.title, punkt.position]),
      [
        ['Erster', 1],
        ['Dritter', 2],
      ],
    )
  })

  test('updatedAt zieht bei jedem Schreiben nach', () => {
    const reise = gastreiseAnlegen(eingabe())
    const danach = gastreiseSpeichern({ ...reise, title: 'Neuer Titel' })

    assert.equal(danach.title, 'Neuer Titel')
    assert.ok(danach.updatedAt >= reise.updatedAt)
  })

  test('eine Änderung, die keine gültige Reise ergibt, wird nicht gespeichert', () => {
    const reise = gastreiseAnlegen(eingabe())

    assert.throws(() => gastreiseSpeichern({ ...reise, title: '   ' }))
    assert.equal(gastspeicherLaden().aktiv?.title, 'Japan im Herbst')
  })

  test('die Reise wird nur unter ihrer eigenen Kennung geliefert', () => {
    const reise = gastreiseAnlegen(eingabe())

    assert.equal(gastreiseLadenNach(reise.id)?.id, reise.id)
    assert.equal(gastreiseLadenNach('trip-fremd'), null)
  })
})

describe('Sprachänderung im Gastspeicher', () => {
  test('Reisende werden übernommen und die Revision steigt', () => {
    gastreiseAnlegen(eingabe())
    const danach = gastreiseAendern({
      mutationId: 'mut-1',
      basisRevision: 1,
      operationen: [
        {
          art: 'stammdaten',
          etappeId: null,
          tagId: null,
          punktId: null,
          nachEtappeId: null,
          nachTagId: null,
          name: null,
          laendercode: null,
          titel: null,
          notiz: null,
          beginn: null,
          punktArt: null,
          tageDelta: null,
          tage: null,
          reisende: 3,
          budgetziel: null,
          tempo: null,
          interessen: null,
          reisewunsch: null,
          abreiseort: null,
          startdatum: null,
        },
      ],
    })

    assert.equal(danach.travellers, 3)
    assert.equal(danach.revision, 2)
    assert.equal(danach.lastMutationId, 'mut-1')
    assert.equal(gastspeicherLaden().aktiv?.travellers, 3)
  })

  test('derselbe Retry ändert nichts zweimal', () => {
    gastreiseAnlegen(eingabe())
    const op = {
      art: 'dauer_aendern' as const,
      etappeId: null,
      tagId: null,
      punktId: null,
      nachEtappeId: null,
      nachTagId: null,
      name: null,
      laendercode: null,
      titel: null,
      notiz: null,
      beginn: null,
      punktArt: null,
      tageDelta: 2,
      tage: null,
      reisende: null,
      budgetziel: null,
      tempo: null,
      interessen: null,
      reisewunsch: null,
      abreiseort: null,
      startdatum: null,
    }
    const einmal = gastreiseAendern({ mutationId: 'mut-idem', basisRevision: 1, operationen: [op] })
    const nochmal = gastreiseAendern({ mutationId: 'mut-idem', basisRevision: 1, operationen: [op] })

    assert.equal(einmal.days.length, 7)
    assert.equal(nochmal.days.length, 7)
    assert.equal(nochmal.revision, einmal.revision)
  })

  test('eine veraltete Fassung wird abgelehnt', () => {
    gastreiseAnlegen(eingabe())
    gastreiseAendern({
      mutationId: 'mut-a',
      basisRevision: 1,
      operationen: [
        {
          art: 'stammdaten',
          etappeId: null,
          tagId: null,
          punktId: null,
          nachEtappeId: null,
          nachTagId: null,
          name: null,
          laendercode: null,
          titel: null,
          notiz: null,
          beginn: null,
          punktArt: null,
          tageDelta: null,
          tage: null,
          reisende: 3,
          budgetziel: null,
          tempo: null,
          interessen: null,
          reisewunsch: null,
          abreiseort: null,
          startdatum: null,
        },
      ],
    })

    assert.throws(
      () =>
        gastreiseAendern({
          mutationId: 'mut-b',
          basisRevision: 1,
          operationen: [
            {
              art: 'stammdaten',
              etappeId: null,
              tagId: null,
              punktId: null,
              nachEtappeId: null,
              nachTagId: null,
              name: null,
              laendercode: null,
              titel: null,
              notiz: null,
              beginn: null,
              punktArt: null,
              tageDelta: null,
              tage: null,
              reisende: 4,
              budgetziel: null,
              tempo: null,
              interessen: null,
              reisewunsch: null,
              abreiseort: null,
              startdatum: null,
            },
          ],
        }),
      VeralteteFassungFehler,
    )
    assert.equal(gastspeicherLaden().aktiv?.travellers, 3)
  })
})

describe('Ungeplante Planpunkte im Gastspeicher', () => {
  test('ein ungeplanter Punkt bleibt nach Reload ungeplant', () => {
    const reise = gastreiseAnlegen(eingabe())
    gastreiseSpeichern({
      ...reise,
      ohneTag: [
        {
          id: 'item-offen',
          dayId: null,
          stageId: null,
          kind: 'note',
          title: 'Noch offen',
          note: null,
          position: 1,
          startsOn: null,
          startsAt: null,
          endsOn: null,
          endsAt: null,
          priceAmount: null,
          priceCurrency: null,
          provider: null,
          externalRef: null,
          bookingUrl: null,
        },
      ],
    })

    const erneut = gastreiseLadenNach(reise.id)
    assert.equal(erneut?.ohneTag[0]?.title, 'Noch offen')
    assert.equal(erneut?.days.every((tag) => tag.items.length === 0), true)
  })

  test('eine Sprachänderung hängt ungeplante Punkte nicht an den letzten Tag', () => {
    const reise = gastreiseAnlegen(eingabe())
    gastreiseSpeichern({
      ...reise,
      ohneTag: [
        {
          id: 'item-offen',
          dayId: null,
          stageId: null,
          kind: 'note',
          title: 'Noch offen',
          note: null,
          position: 1,
          startsOn: null,
          startsAt: null,
          endsOn: null,
          endsAt: null,
          priceAmount: null,
          priceCurrency: null,
          provider: null,
          externalRef: null,
          bookingUrl: null,
        },
      ],
    })

    const danach = gastreiseAendern({
      mutationId: 'mut-ohne-tag',
      basisRevision: 1,
      operationen: [leerOp({ art: 'stammdaten', reisende: 3 })],
    })

    assert.equal(danach.travellers, 3)
    assert.equal(danach.ohneTag[0]?.title, 'Noch offen')
    assert.equal(danach.days.every((tag) => tag.items.length === 0), true)
  })

  test('ein gekürzter Zeitraum bewahrt den kommerziellen Punkt ungeplant', () => {
    const reise = gastreiseAnlegen(eingabe())
    const letzter = reise.days[reise.days.length - 1]
    if (!letzter) throw new Error('Die Vorlage braucht mindestens einen Tag.')
    gastreiseSpeichern({
      ...reise,
      days: reise.days.map((tag) =>
        tag.id === letzter.id
          ? {
              ...tag,
              items: [
                {
                  id: 'item-dom',
                  dayId: letzter.id,
                  stageId: letzter.stageId,
                  kind: 'activity',
                  title: 'Dom',
                  note: null,
                  position: 1,
                  startsOn: letzter.dayDate,
                  startsAt: null,
                  endsOn: null,
                  endsAt: null,
                  priceAmount: 18,
                  priceCurrency: 'EUR',
                  provider: 'getyourguide',
                  externalRef: 'gyg-1',
                  bookingUrl: 'https://example.com/dom',
                },
              ],
            }
          : tag,
      ),
    })

    const danach = gastreiseAendern({
      mutationId: 'mut-kuerzen',
      basisRevision: 1,
      operationen: [leerOp({ art: 'dauer_aendern', tageDelta: -2 })],
    })

    const dom = danach.ohneTag.find((punkt) => punkt.id === 'item-dom')
    assert.equal(dom?.provider, 'getyourguide')
    assert.equal(dom?.title, 'Dom')
    assert.equal(dom?.startsOn, letzter.dayDate)
    assert.equal(dom?.dayId, null)
    assert.equal(dom?.stageId, null)
    assert.equal(danach.days.some((tag) => tag.items.some((punkt) => punkt.id === 'item-dom')), false)
  })

  test('ein manueller Planpunkt macht einen älteren Änderungsvorschlag ungültig', () => {
    const reise = gastreiseAnlegen(eingabe())
    const tag = reise.days[0]
    if (!tag) throw new Error('Die Vorlage braucht mindestens einen Tag.')

    const danach = gastPlanpunktAnlegen(reise, {
      dayId: tag.id,
      kind: 'note',
      title: 'Zwischenstopp',
      note: null,
      startsAt: null,
    })

    assert.equal(danach.revision, 2)
    assert.throws(
      () =>
        gastreiseAendern({
          mutationId: 'mut-stale',
          basisRevision: 1,
          operationen: [leerOp({ art: 'stammdaten', reisende: 4 })],
        }),
      VeralteteFassungFehler,
    )
    assert.equal(gastspeicherLaden().aktiv?.travellers, 2)
  })

  test('derselbe Retry nach Reload ändert nichts zweimal', () => {
    gastreiseAnlegen(eingabe())
    const einmal = gastreiseAendern({
      mutationId: 'mut-reload',
      basisRevision: 1,
      operationen: [leerOp({ art: 'stammdaten', reisende: 3 })],
    })
    const nachReload = gastreiseLadenNach(einmal.id)
    assert.equal(nachReload?.revision, 2)

    const nochmal = gastreiseAendern({
      mutationId: 'mut-reload',
      basisRevision: 1,
      operationen: [leerOp({ art: 'stammdaten', reisende: 5 })],
    })
    assert.equal(nochmal.travellers, 3)
    assert.equal(nochmal.revision, 2)
  })
})

describe('Übernahme der Entwürfe aus der Fassung vor Phase 1.5', () => {
  /** Ein Entwurf, wie ihn `jetnity:guest-trips:v2` enthielt. */
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

  test('ein einzelner Entwurf wird die aktive Gastreise', () => {
    speicher.setzen(SCHLUESSEL.legacy, [legacyEntwurf()])

    const stand = gastspeicherLaden()

    assert.equal(stand.aktiv?.title, 'Barcelona')
    assert.deepEqual(stand.warteschlange, [])
  })

  test('alle Angaben bleiben erhalten – auch die deutschen Werte', () => {
    speicher.setzen(SCHLUESSEL.legacy, [legacyEntwurf()])

    const reise = gastspeicherLaden().aktiv

    assert.equal(reise?.pace, 'calm', 'ruhig wird calm')
    assert.deepEqual(reise?.interests, ['culture', 'food'])
    assert.equal(reise?.travellers, 2)
    assert.equal(reise?.budgetAmount, 1800)
    assert.equal(reise?.currency, 'CHF')
    assert.equal(reise?.travelWish, 'Zwei ruhige Tage.')
    assert.equal(reise?.origin, 'Zürich')
  })

  test('das Ziel wird eine Etappe', () => {
    // `destination` war ein einzelnes Feld. Im neuen Modell ist ein Ziel eine
    // Etappe – so bleibt die Angabe erhalten und ist gleichzeitig erweiterbar.
    speicher.setzen(SCHLUESSEL.legacy, [legacyEntwurf()])

    assert.equal(gastspeicherLaden().aktiv?.stages[0].name, 'Barcelona')
  })

  test('Tage und Planpunkte kommen vollständig mit', () => {
    speicher.setzen(SCHLUESSEL.legacy, [legacyEntwurf()])

    const reise = gastspeicherLaden().aktiv

    assert.equal(reise?.days.length, 3)
    assert.deepEqual(
      reise?.days.map((tag) => [tag.dayIndex, tag.dayDate]),
      [
        [1, '2026-09-12'],
        [2, '2026-09-13'],
        [3, '2026-09-14'],
      ],
    )
    assert.equal(reise?.days[0].items[0].title, 'Sagrada Família')
    assert.equal(reise?.days[0].items[0].startsAt, '10:00')
    assert.equal(reise?.days[0].items[0].kind, 'note', 'die alte Fassung kannte keine Arten')
  })

  test('mehrere Entwürfe: der neueste wird aktiv, die übrigen warten', () => {
    speicher.setzen(SCHLUESSEL.legacy, [
      legacyEntwurf({ id: 'trip-alt', title: 'Alt', updatedAt: '2026-08-01T10:00:00.000Z' }),
      legacyEntwurf({ id: 'trip-neu', title: 'Neu', updatedAt: '2026-08-10T10:00:00.000Z' }),
    ])

    const stand = gastspeicherLaden()

    assert.equal(stand.aktiv?.title, 'Neu')
    assert.deepEqual(
      stand.warteschlange.map((reise) => reise.title),
      ['Alt'],
    )
  })

  test('nichts wird verworfen: alle Entwürfe stehen zur Übernahme bereit', () => {
    speicher.setzen(SCHLUESSEL.legacy, [
      legacyEntwurf({ id: 'trip-a', title: 'A', updatedAt: '2026-08-01T10:00:00.000Z' }),
      legacyEntwurf({ id: 'trip-b', title: 'B', updatedAt: '2026-08-02T10:00:00.000Z' }),
      legacyEntwurf({ id: 'trip-c', title: 'C', updatedAt: '2026-08-03T10:00:00.000Z' }),
    ])

    gastspeicherLaden()

    assert.deepEqual(
      zurUebernahme().map((reise) => reise.title),
      ['C', 'B', 'A'],
      'die aktive Reise steht vorn, damit sie zuerst im Konto liegt',
    )
  })

  test('die Übernahme läuft genau einmal', () => {
    speicher.setzen(SCHLUESSEL.legacy, [legacyEntwurf()])

    gastspeicherLaden()
    assert.equal(speicher.roh(SCHLUESSEL.legacy), null, 'der alte Schlüssel fällt weg')

    // Der zweite Aufruf darf die Warteschlange nicht erneut füllen.
    const zweiterStand = gastspeicherLaden()
    assert.equal(zweiterStand.aktiv?.title, 'Barcelona')
    assert.deepEqual(zweiterStand.warteschlange, [])
  })

  test('eine Reise dieser Fassung gewinnt gegen einen alten Entwurf', () => {
    // Sie wird gerade bearbeitet. Der alte Entwurf wandert in die
    // Warteschlange, statt sie zu überschreiben.
    const aktuell = gastreiseAnlegen(eingabe({ title: 'Diese Fassung' }))
    speicher.setzen(SCHLUESSEL.legacy, [legacyEntwurf()])

    const stand = gastspeicherLaden()

    assert.equal(stand.aktiv?.id, aktuell.id)
    assert.deepEqual(
      stand.warteschlange.map((reise) => reise.title),
      ['Barcelona'],
    )
  })

  test('ein unbrauchbarer alter Eintrag fällt heraus, die übrigen bleiben', () => {
    speicher.setzen(SCHLUESSEL.legacy, [{ id: 'kaputt' }, legacyEntwurf()])

    assert.equal(gastspeicherLaden().aktiv?.title, 'Barcelona')
  })

  test('ein alter Schlüssel ohne Liste bleibt liegen, statt gelöscht zu werden', () => {
    // Zu löschen gäbe es nichts, wohin geschrieben wurde. Das Laden bleibt
    // trotzdem ruhig: kein Fehler, keine halbe Reise.
    speicher.setzen(SCHLUESSEL.legacy, { nicht: 'eine Liste' })

    assert.equal(gastspeicherLaden().aktiv, null)
    assert.ok(speicher.roh(SCHLUESSEL.legacy), 'nichts geschrieben, also nichts gelöscht')
  })
})

describe('Aufräumen erst nach bestätigter Übernahme', () => {
  test('eine bestätigte Reise wird gestrichen', () => {
    const reise = gastreiseAnlegen(eingabe({ clientRef: 'trip-bestaetigt' }))

    uebernommenStreichen(reise.clientRef ?? reise.id)

    assert.equal(gastspeicherLaden().aktiv, null)
  })

  test('eine fremde Kennung streicht nichts', () => {
    // Der Aufrufer räumt je Reise einzeln auf, nachdem der Server ihre Kennung
    // gemeldet hat. Eine unbekannte Kennung darf nichts löschen – sonst wäre
    // ein Tippfehler ein Datenverlust.
    const reise = gastreiseAnlegen(eingabe())

    uebernommenStreichen('trip-eine-andere')

    assert.equal(gastspeicherLaden().aktiv?.id, reise.id)
  })

  test('aus der Warteschlange wird genau ein Eintrag gestrichen', () => {
    speicher.setzen(SCHLUESSEL.aktiv, null)
    const entwuerfe = ['A', 'B', 'C'].map((titel, nr) => ({
      id: `trip-${titel}`,
      clientRef: `trip-${titel}`,
      title: titel,
      origin: null,
      startDate: null,
      endDate: null,
      travellers: 1,
      currency: 'CHF',
      budgetAmount: null,
      status: 'draft',
      pace: 'balanced',
      interests: [],
      travelWish: null,
      stages: [],
      days: [{ id: `day-${nr}`, dayIndex: 1, dayDate: null, title: null, items: [] }],
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
    }))

    speicher.setzen(SCHLUESSEL.warteschlange, entwuerfe)

    uebernommenStreichen('trip-B')

    assert.deepEqual(
      gastspeicherLaden().warteschlange.map((reise) => reise.title),
      ['A', 'C'],
    )
  })

  test('ein Abbruch mitten in der Übernahme lässt den Rest liegen', () => {
    // Der Fall, für den die einzelne Streichung existiert: Reise 1 ist im
    // Konto, Reise 2 scheiterte. Nur Reise 1 verschwindet.
    speicher.setzen(SCHLUESSEL.legacy, [
      legacyMini('trip-1', 'Erste', '2026-08-02T10:00:00.000Z'),
      legacyMini('trip-2', 'Zweite', '2026-08-01T10:00:00.000Z'),
    ])

    gastspeicherLaden()
    uebernommenStreichen('trip-1')

    assert.deepEqual(
      zurUebernahme().map((reise) => reise.title),
      ['Zweite'],
      'der Rest bleibt für den nächsten Versuch liegen',
    )
  })
})

describe('Ein Schreibfehler gilt nie als Erfolg', () => {
  // Bis zum Nachtrag dieser Phase erwartete der Test an dieser Stelle „kein
  // Throw": Das Anlegen meldete Erfolg, die Oberfläche wechselte in den
  // Arbeitsbereich, und im Browser lag nichts. Für eine Reise, die es nur hier
  // gibt, ist das die falsche Semantik – der Fehler ist die Auskunft.

  test('ein gesperrter Speicher lässt keine Reise entstehen', () => {
    speicher.sperren()

    assert.throws(() => gastreiseAnlegen(eingabe()), SpeicherFehler)
    assert.equal(gastspeicherLaden().aktiv, null, 'und es liegt auch nichts halb da')
  })

  test('ein stummer Speicher fällt trotz fehlender Ausnahme auf', () => {
    // `setItem` wirft nicht und behält nichts. Ohne das Zurücklesen wäre das
    // der Fall, der als Erfolg durchgeht.
    speicher.stummschalten()

    assert.throws(() => gastreiseAnlegen(eingabe()), SpeicherFehler)
  })

  test('nach einem gescheiterten Anlegen bleibt der Weg frei', () => {
    speicher.sperren()
    assert.throws(() => gastreiseAnlegen(eingabe()))

    // Kein Phantom: Der zweite Versuch scheitert nicht an einer „bestehenden"
    // Gastreise, die niemand sehen kann.
    speicher.entsperren()
    assert.equal(gastreiseAnlegen(eingabe({ title: 'Zweiter Versuch' })).title, 'Zweiter Versuch')
  })

  test('eine Bearbeitung ohne Ablage wirft und lässt den alten Stand stehen', () => {
    const reise = gastreiseAnlegen(eingabe())
    speicher.sperren()

    assert.throws(() => gastreiseSpeichern({ ...reise, title: 'Nur im Speicher des Fensters' }), SpeicherFehler)

    speicher.entsperren()
    assert.equal(gastspeicherLaden().aktiv?.title, 'Japan im Herbst', 'der letzte gute Stand bleibt')
  })

  test('ein Planpunkt, der nicht abgelegt werden kann, gilt nicht als angelegt', () => {
    const reise = gastreiseAnlegen(eingabe())
    speicher.sperren()

    assert.throws(
      () =>
        gastPlanpunktAnlegen(reise, {
          dayId: reise.days[0].id,
          kind: 'activity',
          title: 'Fischmarkt',
          note: null,
          startsAt: null,
        }),
      SpeicherFehler,
    )

    speicher.entsperren()
    assert.equal(gastspeicherLaden().aktiv?.days[0].items.length, 0)
  })

  test('ein Entwurf gilt nur als verworfen, wenn er wirklich weg ist', () => {
    const reise = gastreiseAnlegen(eingabe())
    speicher.loeschenSperren()

    assert.throws(() => gastreiseEntfernen(), SpeicherFehler)

    speicher.entsperren()
    assert.equal(
      gastspeicherLaden().aktiv?.id,
      reise.id,
      'der Entwurf ist noch da – und die Oberfläche leitet nicht weiter',
    )
  })
})

describe('Die Übernahme aus der alten Fassung löscht nichts auf Verdacht', () => {
  test('scheitert das Schreiben, bleibt der alte Schlüssel vollständig liegen', () => {
    speicher.setzen(SCHLUESSEL.legacy, [
      legacyMini('trip-1', 'Erste', '2026-08-02T10:00:00.000Z'),
      legacyMini('trip-2', 'Zweite', '2026-08-01T10:00:00.000Z'),
    ])
    const vorher = speicher.roh(SCHLUESSEL.legacy)

    speicher.sperren()
    const stand = gastspeicherLaden()

    assert.equal(stand.aktiv?.title, 'Erste', 'die Entwürfe sind in dieser Sitzung sichtbar')
    assert.equal(speicher.roh(SCHLUESSEL.legacy), vorher, 'und im Speicher unverändert vorhanden')
  })

  test('scheitert nur die Warteschlange, bleibt der alte Schlüssel liegen', () => {
    // Der teure Fall: Der erste Schlüssel ist geschrieben, der zweite nicht.
    // Ein `removeItem` an dieser Stelle hätte alle wartenden Entwürfe gekostet.
    speicher.setzen(SCHLUESSEL.legacy, [
      legacyMini('trip-1', 'Erste', '2026-08-02T10:00:00.000Z'),
      legacyMini('trip-2', 'Zweite', '2026-08-01T10:00:00.000Z'),
    ])

    speicher.sperrenFuer(SCHLUESSEL.warteschlange)
    gastspeicherLaden()

    assert.ok(speicher.roh(SCHLUESSEL.legacy), 'der alte Schlüssel ist noch da')
    assert.ok(speicher.roh(SCHLUESSEL.aktiv), 'die aktive Reise ist geschrieben')
  })

  test('der nächste Lauf holt alles nach, ohne etwas zu verdoppeln', () => {
    speicher.setzen(SCHLUESSEL.legacy, [
      legacyMini('trip-1', 'Erste', '2026-08-02T10:00:00.000Z'),
      legacyMini('trip-2', 'Zweite', '2026-08-01T10:00:00.000Z'),
    ])

    speicher.sperrenFuer(SCHLUESSEL.warteschlange)
    gastspeicherLaden()

    speicher.entsperren()
    const stand = gastspeicherLaden()

    assert.equal(speicher.roh(SCHLUESSEL.legacy), null, 'jetzt darf der alte Schlüssel weg')
    assert.deepEqual(
      zurUebernahme().map((reise) => reise.title),
      ['Erste', 'Zweite'],
      'jede Reise genau einmal – die aktive steht nicht zusätzlich in der Warteschlange',
    )
    assert.equal(stand.aktiv?.title, 'Erste')
  })
})

/** Ein minimaler Entwurf der alten Fassung, nur mit dem, was der Test braucht. */
function legacyMini(id: string, title: string, updatedAt: string) {
  return {
    id,
    title,
    destination: title,
    origin: 'Zürich',
    startDate: '2026-09-12',
    endDate: '2026-09-12',
    travelers: 1,
    pace: 'ausgewogen',
    interests: [],
    days: [{ id: 'day-1', date: '2026-09-12', items: [] }],
    createdAt: updatedAt,
    updatedAt,
  }
}
