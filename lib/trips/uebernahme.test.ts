// lib/trips/uebernahme.test.ts
//
// Der Übergang vom Gast zum Konto ist die Stelle, an der Arbeit verloren gehen
// kann: Ein Entwurf, den der Browser löscht, ohne dass die Reise im Konto liegt,
// ist nicht wiederherstellbar. Umgekehrt ist eine Reise, die bei jedem Login ein
// zweites Mal entsteht, eine Liste voller Dubletten.
//
// Geprüft werden die acht Fälle, die im Betrieb wirklich auftreten:
//
//   · Gast ohne Reise            – der Normalfall bei jeder Anmeldung
//   · Gast mit Reise             – der Fall, um den es geht
//   · Login mit Reise            – Übernahme beim Anmelden
//   · Signup mit Reise           – derselbe Weg, andere Tür
//   · Retry nach einem Fehler    – der Entwurf muss noch da sein
//   · doppelter Request          – zwei Durchläufe gleichzeitig
//   · bereits übernommene Reise  – der zweite Durchlauf findet nichts mehr
//   · Manipulationsversuche      – was der Browser mitschickt und was nicht
//
// Die Server Action wird übergeben und hier durch eine Attrappe ersetzt. Was sie
// in der Datenbank auslöst, prüfen die Nachweise in `scripts/db/sicherheit.mjs`
// („reise_anlegen liefert bei zweitem Aufruf dieselbe Reise“ und die Fälle zu
// user_id und status). Hier geht es um die Reihenfolge im Browser.

import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import {
  itineraryAirportChange,
  itineraryDirekt,
  itineraryEinTransit,
  itineraryZweiTransits,
} from '@/lib/route/fixtures'
import { flugRouteItineraryLesen } from '@/lib/route/schema'
import { SCHLUESSEL, gastreiseAnlegen, kennungErzeugen } from '@/lib/trips/gastspeicher'
import { leereMobilitaet } from '@/lib/trips/mobilitaet-felder'
import { gastreisenUebernehmen, type Uebernahmeantwort } from '@/lib/trips/uebernahme'
import {
  GASTREISE_BRUECKE_TEXTE,
  GastreiseBrueckenAnzeige,
  gastreiseBrueckeKopie,
  gastreiseBrueckeStandAusBericht,
} from '@/components/trips/GastreiseBruecke'
import type { ReiseNutzlast } from '@/lib/trips/schema'
import type { CreateTripInput } from '@/types/trips'
import type { FlugRouteItinerary } from '@/lib/route/domain'

const LEERE_MOBILITAET_NUTZLAST = {
  mobility_mode: null,
  origin_place_id: null,
  destination_place_id: null,
  origin_name: null,
  destination_name: null,
  connection_ref: null,
  mobility_changes: null,
  route_itinerary: null,
  rental_supplier: null,
  vehicle_class: null,
  transmission: null,
} as const

/** Ein `localStorage`, der sich wie einer verhält. */
function speicherStellen() {
  const ablage = new Map<string, string>()
  const schreibvorgaenge: Array<{ art: 'set' | 'remove'; schluessel: string }> = []
  let lesenWirft = false

  Object.assign(globalThis, {
    window: {
      localStorage: {
        getItem: (schluessel: string) => {
          if (lesenWirft) throw new Error('SecurityError')
          return ablage.get(schluessel) ?? null
        },
        setItem: (schluessel: string, wert: string) => {
          schreibvorgaenge.push({ art: 'set', schluessel })
          ablage.set(schluessel, wert)
        },
        removeItem: (schluessel: string) => {
          schreibvorgaenge.push({ art: 'remove', schluessel })
          ablage.delete(schluessel)
        },
      },
    },
  })

  return {
    schreibvorgaenge,
    lesenWerfen: () => {
      lesenWirft = true
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
    interests: ['culture', 'food'],
    travelWish: 'Wenig Hotelwechsel',
    ...abweichung,
  }
}

/**
 * Eine Attrappe der Server Action.
 *
 * Sie hält fest, was ankam, und antwortet nach Vorgabe. `kennungen` ist die
 * Antwort des Servers: dieselbe Kennung bei einem zweiten Aufruf mit derselben
 * `client_ref` – so verhält sich `public.reise_anlegen()`.
 */
function attrappe(
  antworten: (aufruf: number, nutzlast: ReiseNutzlast) => Uebernahmeantwort = () => ({
    ok: true,
    wert: 'uuid-1',
  }),
) {
  const empfangen: ReiseNutzlast[] = []
  const vergeben = new Map<string, string>()

  const senden = async (nutzlast: ReiseNutzlast): Promise<Uebernahmeantwort> => {
    empfangen.push(nutzlast)
    const antwort = antworten(empfangen.length, nutzlast)

    if (antwort.ok) {
      const bestehend = vergeben.get(nutzlast.client_ref)
      if (bestehend) return { ok: true, wert: bestehend }
      vergeben.set(nutzlast.client_ref, antwort.wert)
    }
    return antwort
  }

  return { senden, empfangen, vergeben }
}

describe('Gast ohne Reise', () => {
  test('es gibt nichts zu übernehmen und kein Aufruf geht hinaus', async () => {
    const server = attrappe()

    const bericht = await gastreisenUebernehmen(server.senden)

    assert.deepEqual(bericht, { art: 'nichts' })
    assert.equal(server.empfangen.length, 0)
  })

  test('der Beginn wird nicht gemeldet, wenn es nichts zu tun gibt', async () => {
    const server = attrappe()
    let gemeldet = 0

    await gastreisenUebernehmen(server.senden, () => {
      gemeldet += 1
    })

    // Sonst zeigte /reisen bei jedem Aufruf kurz „Deine Reise wird übernommen".
    assert.equal(gemeldet, 0)
  })
})

describe('Gast mit Reise – der Weg beim Login', () => {
  test('die Reise geht hinaus und der Entwurf verschwindet danach', async () => {
    const entwurf = gastreiseAnlegen(eingabe())
    const server = attrappe()

    const bericht = await gastreisenUebernehmen(server.senden)

    assert.deepEqual(bericht, { art: 'fertig', uebernommen: 1 })
    assert.equal(server.empfangen.length, 1)
    assert.equal(server.empfangen[0].client_ref, entwurf.clientRef)
    assert.equal(speicher.roh(SCHLUESSEL.aktiv), null)
  })

  test('der Beginn wird mit der Anzahl gemeldet', async () => {
    gastreiseAnlegen(eingabe())
    const server = attrappe()
    const gemeldet: number[] = []

    await gastreisenUebernehmen(server.senden, (anzahl) => gemeldet.push(anzahl))

    assert.deepEqual(gemeldet, [1])
  })

  test('die Nutzlast trägt den ganzen Reisegraphen', async () => {
    gastreiseAnlegen(eingabe())
    const server = attrappe()

    await gastreisenUebernehmen(server.senden)
    const nutzlast = server.empfangen[0]

    assert.equal(nutzlast.title, 'Japan im Herbst')
    assert.equal(nutzlast.origin, 'Zürich')
    assert.equal(nutzlast.start_date, '2026-09-12')
    assert.equal(nutzlast.end_date, '2026-09-16')
    assert.equal(nutzlast.travellers, 2)
    assert.equal(nutzlast.currency, 'CHF')
    assert.equal(nutzlast.budget_amount, 4200)
    assert.equal(nutzlast.pace, 'balanced')
    assert.deepEqual(nutzlast.interests, ['culture', 'food'])
    assert.equal(nutzlast.travel_wish, 'Wenig Hotelwechsel')
    // Ein Ziel ist eine Etappe, und die fünf Tage sind der Zeitraum.
    assert.deepEqual(
      nutzlast.stages.map((etappe) => etappe.name),
      ['Japan'],
    )
    assert.deepEqual(
      nutzlast.days.map((tag) => tag.day_date),
      ['2026-09-12', '2026-09-13', '2026-09-14', '2026-09-15', '2026-09-16'],
    )
  })

  test('Planpunkte gehen mit', async () => {
    const entwurf = gastreiseAnlegen(eingabe())
    speicher.setzen(SCHLUESSEL.aktiv, {
      ...entwurf,
      days: entwurf.days.map((tag, stelle) =>
        stelle === 1
          ? {
              ...tag,
              items: [
                {
                  id: 'item-1',
                  dayId: tag.id,
                  stageId: null,
                  kind: 'activity',
                  title: 'Fischmarkt',
                  note: 'früh dort sein',
                  position: 1,
                  startsOn: tag.dayDate,
                  startsAt: '06:30',
                  endsOn: null,
                  endsAt: null,
                  priceAmount: null,
                  priceCurrency: null,
                  provider: null,
                  externalRef: null,
                  bookingUrl: null,
                  bookingStatus: 'unconfirmed',
                  bookingSource: null,
                  bookingConfirmedAt: null,
                  ...leereMobilitaet(),
                },
              ],
            }
          : tag,
      ),
    })

    const server = attrappe()
    await gastreisenUebernehmen(server.senden)

    const punkte = server.empfangen[0].days.flatMap((tag) => tag.items)
    assert.deepEqual(punkte, [
      {
        kind: 'activity',
        title: 'Fischmarkt',
        note: 'früh dort sein',
        position: 1,
        starts_on: '2026-09-13',
        starts_at: '06:30',
        ends_on: null,
        ends_at: null,
        price_amount: null,
        price_currency: null,
        provider: null,
        external_ref: null,
        booking_url: null,
        booking_status: 'unconfirmed',
        booking_confirmed_at: null,
        ...LEERE_MOBILITAET_NUTZLAST,
      },
    ])
  })

  test('ungeplante Planpunkte bleiben ungeplant', async () => {
    const entwurf = gastreiseAnlegen(eingabe())
    speicher.setzen(SCHLUESSEL.aktiv, {
      ...entwurf,
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
          bookingStatus: 'unconfirmed',
          bookingSource: null,
          bookingConfirmedAt: null,
          ...leereMobilitaet(),
        },
      ],
    })

    const server = attrappe()
    await gastreisenUebernehmen(server.senden)

    assert.deepEqual(server.empfangen[0].ungeplante, [
      {
        kind: 'note',
        title: 'Noch offen',
        note: null,
        position: 1,
        starts_on: null,
        starts_at: null,
        ends_on: null,
        ends_at: null,
        price_amount: null,
        price_currency: null,
        provider: null,
        external_ref: null,
        booking_url: null,
        booking_status: 'unconfirmed',
        booking_confirmed_at: null,
        ...LEERE_MOBILITAET_NUTZLAST,
      },
    ])
    assert.equal(
      server.empfangen[0].days.every((tag) => tag.items.every((punkt) => punkt.title !== 'Noch offen')),
      true,
    )
  })

  test('eine manuelle Verbindung nimmt strukturierte Mobilitätsfakten mit', async () => {
    const entwurf = gastreiseAnlegen(eingabe())
    speicher.setzen(SCHLUESSEL.aktiv, {
      ...entwurf,
      ohneTag: [
        {
          id: 'item-zug',
          dayId: null,
          stageId: null,
          kind: 'transfer',
          title: 'Zürich → Lugano',
          note: null,
          position: 1,
          startsOn: '2026-09-12',
          startsAt: '08:10',
          endsOn: '2026-09-12',
          endsAt: '10:40',
          priceAmount: 42,
          priceCurrency: 'CHF',
          provider: null,
          externalRef: null,
          bookingUrl: null,
          bookingStatus: 'unconfirmed',
          bookingSource: null,
          bookingConfirmedAt: null,
          mobilityMode: 'rail',
          originPlaceId: 'geonames:2657896',
          destinationPlaceId: 'geonames:2659836',
          originName: 'Zürich',
          destinationName: 'Lugano',
          connectionRef: 'IC 890',
          mobilityChanges: 0,
          mobilityEvidence: 'user',
        },
      ],
    })

    const server = attrappe()
    await gastreisenUebernehmen(server.senden)

    assert.deepEqual(server.empfangen[0].ungeplante, [
      {
        kind: 'transfer',
        title: 'Zürich → Lugano',
        note: null,
        position: 1,
        starts_on: '2026-09-12',
        starts_at: '08:10',
        ends_on: '2026-09-12',
        ends_at: '10:40',
        price_amount: 42,
        price_currency: 'CHF',
        provider: null,
        external_ref: null,
        booking_url: null,
        booking_status: 'unconfirmed',
        booking_confirmed_at: null,
        mobility_mode: 'rail',
        origin_place_id: 'geonames:2657896',
        destination_place_id: 'geonames:2659836',
        origin_name: 'Zürich',
        destination_name: 'Lugano',
        connection_ref: 'IC 890',
        mobility_changes: 0,
        rental_supplier: null,
        vehicle_class: null,
        transmission: null,
        route_itinerary: null,
      },
    ])
  })

  test('ein manueller Mietwagen nimmt Abholung, Rückgabe und Nutzerfakten mit', async () => {
    const entwurf = gastreiseAnlegen(eingabe())
    speicher.setzen(SCHLUESSEL.aktiv, {
      ...entwurf,
      ohneTag: [
        {
          id: 'item-mietwagen',
          dayId: null,
          stageId: null,
          kind: 'rental_car',
          title: 'Mietwagen Zürich Flughafen → Lugano',
          note: null,
          position: 1,
          startsOn: '2026-09-12',
          startsAt: '09:00',
          endsOn: '2026-09-16',
          endsAt: '18:00',
          priceAmount: 280,
          priceCurrency: 'CHF',
          provider: null,
          externalRef: null,
          bookingUrl: null,
          bookingStatus: 'booked',
          bookingSource: 'user',
          bookingConfirmedAt: '2026-08-21T10:00:00.000Z',
          mobilityMode: null,
          originPlaceId: 'geonames:2657896',
          destinationPlaceId: 'geonames:2659836',
          originName: 'Zürich Flughafen',
          destinationName: 'Lugano',
          connectionRef: null,
          mobilityChanges: null,
          mobilityEvidence: null,
          rentalSupplier: 'Europcar',
          vehicleClass: 'compact',
          transmission: 'automatic',
          rentalEvidence: 'user',
        },
      ],
    })

    const server = attrappe()
    await gastreisenUebernehmen(server.senden)

    assert.deepEqual(server.empfangen[0].ungeplante, [
      {
        kind: 'rental_car',
        title: 'Mietwagen Zürich Flughafen → Lugano',
        note: null,
        position: 1,
        starts_on: '2026-09-12',
        starts_at: '09:00',
        ends_on: '2026-09-16',
        ends_at: '18:00',
        price_amount: 280,
        price_currency: 'CHF',
        provider: null,
        external_ref: null,
        booking_url: null,
        booking_status: 'booked',
        booking_confirmed_at: '2026-08-21T10:00:00.000Z',
        mobility_mode: null,
        origin_place_id: 'geonames:2657896',
        destination_place_id: 'geonames:2659836',
        origin_name: 'Zürich Flughafen',
        destination_name: 'Lugano',
        connection_ref: null,
        mobility_changes: null,
        rental_supplier: 'Europcar',
        vehicle_class: 'compact',
        transmission: 'automatic',
        route_itinerary: null,
      },
    ])
  })
})

describe('Signup mit Reise', () => {
  // Registrierung und Login enden beide auf /reisen, und dort steht dieselbe
  // Brücke. Der Fall unterscheidet sich nur darin, dass das Konto noch keine
  // Reise hat – der Vorgang ist derselbe.
  test('die Reise landet im frischen Konto', async () => {
    gastreiseAnlegen(eingabe({ title: 'Erste Reise' }))
    const server = attrappe(() => ({ ok: true, wert: 'uuid-frisch' }))

    const bericht = await gastreisenUebernehmen(server.senden)

    assert.deepEqual(bericht, { art: 'fertig', uebernommen: 1 })
    assert.equal(server.empfangen[0].title, 'Erste Reise')
    assert.equal(speicher.roh(SCHLUESSEL.aktiv), null)
  })
})

describe('mehrere Entwürfe aus der Fassung vor Phase 1.5', () => {
  test('aktive Reise und Warteschlange gehen vollständig ins Konto', async () => {
    const aktiv = gastreiseAnlegen(eingabe({ title: 'Aktiv' }))
    speicher.setzen(SCHLUESSEL.warteschlange, [
      { ...aktiv, id: 'trip-warte-1', clientRef: 'trip-warte-1', title: 'Wartend eins' },
      { ...aktiv, id: 'trip-warte-2', clientRef: 'trip-warte-2', title: 'Wartend zwei' },
    ])

    const server = attrappe((nr) => ({ ok: true, wert: `uuid-${nr}` }))
    const bericht = await gastreisenUebernehmen(server.senden)

    assert.deepEqual(bericht, { art: 'fertig', uebernommen: 3 })
    assert.deepEqual(
      server.empfangen.map((nutzlast) => nutzlast.title),
      ['Aktiv', 'Wartend eins', 'Wartend zwei'],
    )
    assert.equal(speicher.roh(SCHLUESSEL.aktiv), null)
    assert.equal(speicher.roh(SCHLUESSEL.warteschlange), null)
  })

  test('die aktive Reise geht zuerst', async () => {
    const aktiv = gastreiseAnlegen(eingabe({ title: 'Aktiv' }))
    speicher.setzen(SCHLUESSEL.warteschlange, [
      { ...aktiv, id: 'trip-warte-1', clientRef: 'trip-warte-1', title: 'Wartend' },
    ])

    const server = attrappe((nr) => ({ ok: true, wert: `uuid-${nr}` }))
    await gastreisenUebernehmen(server.senden)

    // Scheitert der Rest, liegt wenigstens die Reise im Konto, an der jemand
    // gerade gearbeitet hat.
    assert.equal(server.empfangen[0].title, 'Aktiv')
  })
})

describe('Fehler und Retry', () => {
  test('ein Fehler lässt den Entwurf im Browser', async () => {
    const entwurf = gastreiseAnlegen(eingabe())
    const server = attrappe(() => ({ ok: false, meldung: 'Die Datenbank ist nicht erreichbar.' }))

    const bericht = await gastreisenUebernehmen(server.senden)

    assert.deepEqual(bericht, {
      art: 'fehler',
      meldung: 'Die Datenbank ist nicht erreichbar.',
      uebernommen: 0,
      offen: 1,
    })
    const geblieben = JSON.parse(speicher.roh(SCHLUESSEL.aktiv) ?? 'null')
    assert.equal(geblieben.clientRef, entwurf.clientRef)
  })

  test('der zweite Anlauf schickt dieselbe Kennung', async () => {
    const entwurf = gastreiseAnlegen(eingabe())
    let scheitern = true
    const server = attrappe(() =>
      scheitern ? { ok: false, meldung: 'gerade nicht' } : { ok: true, wert: 'uuid-1' },
    )

    await gastreisenUebernehmen(server.senden)
    scheitern = false
    const zweiter = await gastreisenUebernehmen(server.senden)

    assert.deepEqual(zweiter, { art: 'fertig', uebernommen: 1 })
    // Dieselbe Kennung beide Male: Nur so ergibt der Retry über
    // `unique (user_id, client_ref)` keine zweite Reise.
    assert.deepEqual(
      server.empfangen.map((nutzlast) => nutzlast.client_ref),
      [entwurf.clientRef, entwurf.clientRef],
    )
    assert.equal(speicher.roh(SCHLUESSEL.aktiv), null)
  })

  test('nach dem ersten Fehler wird kein weiterer Entwurf geschickt', async () => {
    const aktiv = gastreiseAnlegen(eingabe({ title: 'Aktiv' }))
    speicher.setzen(SCHLUESSEL.warteschlange, [
      { ...aktiv, id: 'trip-warte-1', clientRef: 'trip-warte-1', title: 'Wartend' },
    ])

    const server = attrappe(() => ({ ok: false, meldung: 'Sitzung abgelaufen' }))
    const bericht = await gastreisenUebernehmen(server.senden)

    // Ist die Sitzung weg, scheitert jeder weitere Aufruf genauso. Zwei
    // Fehlermeldungen sagen nicht mehr als eine.
    assert.equal(server.empfangen.length, 1)
    assert.deepEqual(bericht, {
      art: 'fehler',
      meldung: 'Sitzung abgelaufen',
      uebernommen: 0,
      offen: 2,
    })
  })

  test('ein Teilerfolg bleibt erhalten und wird gemeldet', async () => {
    const aktiv = gastreiseAnlegen(eingabe({ title: 'Aktiv' }))
    speicher.setzen(SCHLUESSEL.warteschlange, [
      { ...aktiv, id: 'trip-warte-1', clientRef: 'trip-warte-1', title: 'Wartend' },
    ])

    const server = attrappe((nr) =>
      nr === 1 ? { ok: true, wert: 'uuid-1' } : { ok: false, meldung: 'abgebrochen' },
    )
    const bericht = await gastreisenUebernehmen(server.senden)

    assert.deepEqual(bericht, {
      art: 'fehler',
      meldung: 'abgebrochen',
      uebernommen: 1,
      offen: 1,
    })
    // Die erste ist weg, weil der Server sie bestätigt hat. Die zweite bleibt.
    assert.equal(speicher.roh(SCHLUESSEL.aktiv), null)
    const warteschlange = JSON.parse(speicher.roh(SCHLUESSEL.warteschlange) ?? 'null')
    assert.equal(warteschlange.length, 1)
    assert.equal(warteschlange[0].clientRef, 'trip-warte-1')
  })

  test('eine geworfene Ausnahme sperrt den nächsten Anlauf nicht', async () => {
    gastreiseAnlegen(eingabe())
    const werfen = async () => {
      throw new Error('Netz weg')
    }

    await assert.rejects(() => gastreisenUebernehmen(werfen))

    // Ohne das Zurücksetzen des Riegels bliebe „Erneut versuchen" wirkungslos.
    const server = attrappe()
    assert.deepEqual(await gastreisenUebernehmen(server.senden), {
      art: 'fertig',
      uebernommen: 1,
    })
  })
})

describe('doppelter Request', () => {
  test('zwei gleichzeitige Durchläufe ergeben einen Aufruf je Entwurf', async () => {
    gastreiseAnlegen(eingabe())

    let freigeben: () => void = () => {}
    const warten = new Promise<void>((auflösen) => {
      freigeben = auflösen
    })

    const empfangen: ReiseNutzlast[] = []
    const senden = async (nutzlast: ReiseNutzlast): Promise<Uebernahmeantwort> => {
      empfangen.push(nutzlast)
      await warten
      return { ok: true, wert: 'uuid-1' }
    }

    const erster = gastreisenUebernehmen(senden)
    const zweiter = gastreisenUebernehmen(senden)

    freigeben()
    const [a, b] = await Promise.all([erster, zweiter])

    // Der zweite Durchlauf prallt am Riegel ab. Nicht wegen der Datenbank – die
    // Übernahme ist idempotent –, sondern damit sich beide nicht beim Aufräumen
    // des Browserspeichers gegenseitig die Liste wegziehen.
    assert.equal(empfangen.length, 1)
    assert.deepEqual([a, b].filter((bericht) => bericht.art === 'laeuft').length, 1)
    assert.deepEqual([a, b].filter((bericht) => bericht.art === 'fertig').length, 1)
  })

  test('nach dem Durchlauf ist der Riegel wieder offen', async () => {
    gastreiseAnlegen(eingabe())
    const server = attrappe()

    await gastreisenUebernehmen(server.senden)
    gastreiseAnlegen(eingabe({ title: 'Zweite Reise' }))
    const zweiter = await gastreisenUebernehmen(server.senden)

    assert.deepEqual(zweiter, { art: 'fertig', uebernommen: 1 })
    assert.equal(server.empfangen.length, 2)
  })
})

describe('bereits übernommene Reise', () => {
  test('ein zweiter Durchlauf findet nichts mehr', async () => {
    gastreiseAnlegen(eingabe())
    const server = attrappe()

    await gastreisenUebernehmen(server.senden)
    const zweiter = await gastreisenUebernehmen(server.senden)

    assert.deepEqual(zweiter, { art: 'nichts' })
    assert.equal(server.empfangen.length, 1)
  })

  test('mehrfacher Login legt keine zweite Reise an', async () => {
    const entwurf = gastreiseAnlegen(eingabe())
    const server = attrappe(() => ({ ok: true, wert: 'uuid-1' }))

    // Drei Anmeldungen hintereinander im selben Browser.
    await gastreisenUebernehmen(server.senden)
    await gastreisenUebernehmen(server.senden)
    await gastreisenUebernehmen(server.senden)

    assert.equal(server.empfangen.length, 1)
    assert.equal(server.vergeben.get(entwurf.clientRef ?? ''), 'uuid-1')
  })
})

function gastpunkt(teil: {
  kind: 'stay' | 'activity'
  title: string
  note: string | null
  startsOn: string | null
  startsAt: string | null
  endsOn: string | null
  endsAt: string | null
  priceAmount: number | null
  priceCurrency: string | null
  provider: string | null
  externalRef: string | null
  bookingUrl: string | null
}) {
  return {
    id: `item-${teil.kind}`,
    dayId: null,
    stageId: null,
    kind: teil.kind,
    title: teil.title,
    note: teil.note,
    position: 1,
    startsOn: teil.startsOn,
    startsAt: teil.startsAt,
    endsOn: teil.endsOn,
    endsAt: teil.endsAt,
    priceAmount: teil.priceAmount,
    priceCurrency: teil.priceCurrency,
    provider: teil.provider,
    externalRef: teil.externalRef,
    bookingUrl: teil.bookingUrl,
    bookingStatus: 'unconfirmed' as const,
    bookingSource: null,
    bookingConfirmedAt: null,
    ...leereMobilitaet(),
  }
}

function gastflug(itinerary: FlugRouteItinerary) {
  return {
    id: 'item-flug',
    dayId: null,
    stageId: null,
    kind: 'flight' as const,
    title: 'ZRH → BKK · SWISS',
    note: null,
    position: 1,
    startsOn: '2026-11-01',
    startsAt: '09:15',
    endsOn: '2026-11-01',
    endsAt: '21:40',
    priceAmount: 890,
    priceCurrency: 'CHF',
    provider: 'duffel',
    externalRef: 'off_1',
    bookingUrl: null,
    bookingStatus: 'unconfirmed' as const,
    bookingSource: null,
    bookingConfirmedAt: null,
    ...leereMobilitaet(),
    routeItinerary: itinerary,
  }
}

describe('Guest → Account behält die Flugroute', () => {
  test('Direktflug geht als route_itinerary mit', async () => {
    const entwurf = gastreiseAnlegen(eingabe())
    speicher.setzen(SCHLUESSEL.aktiv, { ...entwurf, ohneTag: [gastflug(itineraryDirekt())] })
    const server = attrappe()
    await gastreisenUebernehmen(server.senden)
    assert.deepEqual(server.empfangen[0]?.ungeplante[0]?.route_itinerary, itineraryDirekt())
  })

  test('unbewiesene kommerzielle Flugfelder werden nicht ins Konto hochgestuft', async () => {
    const entwurf = gastreiseAnlegen(eingabe())
    speicher.setzen(SCHLUESSEL.aktiv, { ...entwurf, ohneTag: [gastflug(itineraryDirekt())] })
    const server = attrappe()
    await gastreisenUebernehmen(server.senden)
    const flug = server.empfangen[0]?.ungeplante[0]
    assert.equal(flug?.kind, 'flight')
    assert.equal(flug?.price_amount, null)
    assert.equal(flug?.price_currency, null)
    assert.equal(flug?.provider, null)
    assert.equal(flug?.external_ref, null)
    assert.equal(flug?.booking_url, null)
  })

  test('ein Transit geht vollständig mit', async () => {
    const entwurf = gastreiseAnlegen(eingabe())
    speicher.setzen(SCHLUESSEL.aktiv, { ...entwurf, ohneTag: [gastflug(itineraryEinTransit())] })
    const server = attrappe()
    await gastreisenUebernehmen(server.senden)
    assert.equal(server.empfangen[0]?.ungeplante[0]?.route_itinerary?.legs[0]?.segments.length, 2)
  })

  test('Airport-Change-Itinerary geht strukturell mit; Client-Surface wird beim Parse verworfen', async () => {
    const entwurf = gastreiseAnlegen(eingabe())
    speicher.setzen(SCHLUESSEL.aktiv, { ...entwurf, ohneTag: [gastflug(itineraryAirportChange('ORY'))] })
    const server = attrappe()
    await gastreisenUebernehmen(server.senden)
    const gesendet = server.empfangen[0]?.ungeplante[0]?.route_itinerary
    assert.equal(gesendet?.legs[0]?.segments[0]?.origin.airportCode, 'ZRH')
    assert.equal(gesendet?.legs[0]?.segments[0]?.destination.airportCode, 'CDG')
    assert.equal(gesendet?.legs[0]?.segments[1]?.origin.airportCode, 'ORY')
    assert.equal(gesendet?.legs[0]?.segments[1]?.destination.airportCode, 'BKK')
    const gelesen = flugRouteItineraryLesen(gesendet)
    assert.ok(gelesen)
    assert.equal(gelesen.legs[0]?.segments[1]?.surfaceFromAirportCode, undefined)
  })

  test('zwei Transits gehen vollständig mit', async () => {
    const entwurf = gastreiseAnlegen(eingabe())
    speicher.setzen(SCHLUESSEL.aktiv, { ...entwurf, ohneTag: [gastflug(itineraryZweiTransits())] })
    const server = attrappe()
    await gastreisenUebernehmen(server.senden)
    assert.equal(server.empfangen[0]?.ungeplante[0]?.route_itinerary?.legs[0]?.segments.length, 3)
  })

  test('Retry nach fehlgeschlagener Route sendet dieselbe client_ref erneut', async () => {
    const entwurf = gastreiseAnlegen(eingabe())
    speicher.setzen(SCHLUESSEL.aktiv, { ...entwurf, ohneTag: [gastflug(itineraryEinTransit())] })
    const server = attrappe(() => ({
      ok: false,
      meldung: 'Die Reise liegt im Konto, aber die Flugroute konnte nicht übernommen werden. Bitte versuche es erneut – es entsteht keine zweite Reise.',
    }))
    const erst = await gastreisenUebernehmen(server.senden)
    const retry = await gastreisenUebernehmen(server.senden)
    assert.equal(erst.art, 'fehler')
    assert.equal(retry.art, 'fehler')
    assert.equal(server.empfangen.length, 2)
    assert.equal(server.empfangen[0]?.client_ref, server.empfangen[1]?.client_ref)
    assert.deepEqual(server.empfangen[0]?.ungeplante[0]?.route_itinerary, itineraryEinTransit())
  })
})

describe('Guest → Account streicht unbewiesene Stay-/Activity-Handelsfelder', () => {
  test('manipuliertes Stay wird nicht zur Account-Truth', async () => {
    const entwurf = gastreiseAnlegen(eingabe())
    speicher.setzen(SCHLUESSEL.aktiv, {
      ...entwurf,
      ohneTag: [
        gastpunkt({
          kind: 'stay',
          title: 'Uferhotel',
          note: 'am Fluss',
          startsOn: '2026-11-01',
          startsAt: null,
          endsOn: '2026-11-08',
          endsAt: null,
          priceAmount: 9999,
          priceCurrency: 'CHF',
          provider: 'evil-hotel',
          externalRef: 'hack-stay',
          bookingUrl: 'https://evil.example/book',
        }),
      ],
    })
    const server = attrappe()
    const bericht = await gastreisenUebernehmen(server.senden)
    const stay = server.empfangen[0]?.ungeplante[0]
    assert.equal(bericht.art, 'fertig')
    assert.equal(stay?.kind, 'stay')
    assert.equal(stay?.title, 'Uferhotel')
    assert.equal(stay?.note, 'am Fluss')
    assert.equal(stay?.starts_on, '2026-11-01')
    assert.equal(stay?.ends_on, '2026-11-08')
    assert.equal(stay?.price_amount, null)
    assert.equal(stay?.price_currency, null)
    assert.equal(stay?.provider, null)
    assert.equal(stay?.external_ref, null)
    assert.equal(stay?.booking_url, null)
    assert.equal(speicher.roh(SCHLUESSEL.aktiv), null)
  })

  test('manipulierte Activity wird nicht zur Account-Truth', async () => {
    const entwurf = gastreiseAnlegen(eingabe())
    speicher.setzen(SCHLUESSEL.aktiv, {
      ...entwurf,
      ohneTag: [
        gastpunkt({
          kind: 'activity',
          title: 'Bootsfahrt',
          note: 'früh da sein',
          startsOn: '2026-11-02',
          startsAt: '10:00',
          endsOn: null,
          endsAt: null,
          priceAmount: 8888,
          priceCurrency: 'CHF',
          provider: 'evil-activity',
          externalRef: 'hack-act',
          bookingUrl: 'https://evil.example/act',
        }),
      ],
    })
    const server = attrappe()
    await gastreisenUebernehmen(server.senden)
    const activity = server.empfangen[0]?.ungeplante[0]
    assert.equal(activity?.kind, 'activity')
    assert.equal(activity?.title, 'Bootsfahrt')
    assert.equal(activity?.note, 'früh da sein')
    assert.equal(activity?.starts_at, '10:00')
    assert.equal(activity?.price_amount, null)
    assert.equal(activity?.provider, null)
    assert.equal(activity?.external_ref, null)
    assert.equal(activity?.booking_url, null)
  })

  test('Stay-Retry nach Serverfehler löscht LocalStorage nicht und sendet dieselbe client_ref', async () => {
    const entwurf = gastreiseAnlegen(eingabe())
    speicher.setzen(SCHLUESSEL.aktiv, {
      ...entwurf,
      ohneTag: [
        gastpunkt({
          kind: 'stay',
          title: 'Uferhotel',
          note: null,
          startsOn: '2026-11-01',
          startsAt: null,
          endsOn: '2026-11-08',
          endsAt: null,
          priceAmount: 9999,
          priceCurrency: 'CHF',
          provider: 'evil-hotel',
          externalRef: 'hack-stay',
          bookingUrl: 'https://evil.example/book',
        }),
      ],
    })
    let scheitern = true
    const server = attrappe(() =>
      scheitern ? { ok: false, meldung: 'gerade nicht' } : { ok: true, wert: 'uuid-1' },
    )
    const erst = await gastreisenUebernehmen(server.senden)
    assert.equal(erst.art, 'fehler')
    assert.equal(JSON.parse(speicher.roh(SCHLUESSEL.aktiv) ?? 'null').clientRef, entwurf.clientRef)
    scheitern = false
    const retry = await gastreisenUebernehmen(server.senden)
    assert.equal(retry.art, 'fertig')
    assert.deepEqual(
      server.empfangen.map((nutzlast) => nutzlast.client_ref),
      [entwurf.clientRef, entwurf.clientRef],
    )
    assert.equal(server.empfangen[1]?.ungeplante[0]?.price_amount, null)
    assert.equal(speicher.roh(SCHLUESSEL.aktiv), null)
  })
})

describe('Manipulationsversuche', () => {
  test('eine untergeschobene user_id verlässt den Browser nicht', async () => {
    const entwurf = gastreiseAnlegen(eingabe())
    speicher.setzen(SCHLUESSEL.aktiv, {
      ...entwurf,
      user_id: '11111111-1111-1111-1111-111111111111',
      userId: '11111111-1111-1111-1111-111111111111',
    })

    const server = attrappe()
    await gastreisenUebernehmen(server.senden)

    // Das Feld steht nicht in der Nutzlast. Selbst wenn es dort stünde, läse
    // `public.reise_anlegen()` es nicht – die Nachweise in
    // scripts/db/sicherheit.mjs zeigen das.
    assert.equal('user_id' in server.empfangen[0], false)
    assert.equal('userId' in server.empfangen[0], false)
  })

  test('ein untergeschobener Status verlässt den Browser nicht', async () => {
    const entwurf = gastreiseAnlegen(eingabe())
    speicher.setzen(SCHLUESSEL.aktiv, { ...entwurf, status: 'booked' })

    const server = attrappe()
    await gastreisenUebernehmen(server.senden)

    assert.equal('status' in server.empfangen[0], false)
  })

  test('eine untergeschobene Kennung einer Reise im Konto geht nicht mit', async () => {
    const entwurf = gastreiseAnlegen(eingabe())
    speicher.setzen(SCHLUESSEL.aktiv, {
      ...entwurf,
      days: entwurf.days.map((tag) => ({ ...tag, id: 'day-untergeschoben' })),
    })

    const server = attrappe()
    await gastreisenUebernehmen(server.senden)

    // Die lokalen Kennungen der Tage sind in der Datenbank ohne Bedeutung. Die
    // Zuordnung eines Planpunkts läuft über `day_index`.
    const felder = new Set(server.empfangen[0].days.flatMap((tag) => Object.keys(tag)))
    assert.deepEqual([...felder].sort(), ['day_date', 'day_index', 'items', 'stage_position', 'title'])
  })

  test('ein unlesbarer Eintrag führt nicht zu einem Aufruf', async () => {
    const roh = '{kaputt'
    speicher.setzen(SCHLUESSEL.aktiv, roh)

    const server = attrappe()
    const bericht = await gastreisenUebernehmen(server.senden)

    assert.deepEqual(bericht, { art: 'ungueltig' })
    assert.equal(server.empfangen.length, 0)
    assert.equal(speicher.roh(SCHLUESSEL.aktiv), roh)
    assert.equal(speicher.schreibvorgaenge.length, 0)
  })

  test('ein 0-Stage-Entwurf wird fail-closed nicht ins Konto geschickt', async () => {
    speicher.setzen(SCHLUESSEL.aktiv, {
      id: 'trip-1',
      clientRef: 'trip-1',
      title: 'Ohne Ziel',
      origin: null,
      startDate: '2026-09-12',
      endDate: '2026-09-16',
      travellers: 1,
      currency: 'CHF',
      budgetAmount: null,
      status: 'draft',
      pace: 'balanced',
      interests: [],
      travelWish: null,
      stages: [],
      days: [{ id: 'day-1', dayIndex: 1, dayDate: '2026-09-12', title: null, items: [] }],
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    })

    const server = attrappe()
    const bericht = await gastreisenUebernehmen(server.senden)

    assert.deepEqual(bericht, {
      art: 'fehler',
      meldung: 'Die Tageszuordnung ist ungültig.',
      uebernommen: 0,
      offen: 1,
    })
    assert.equal(server.empfangen.length, 0)
    assert.equal(JSON.parse(speicher.roh(SCHLUESSEL.aktiv) ?? 'null')?.id, 'trip-1')
  })

  test('ein Entwurf mit unmöglichen Werten wird verworfen, nicht geschickt', async () => {
    speicher.setzen(SCHLUESSEL.aktiv, {
      id: 'trip-1',
      clientRef: 'trip-1',
      title: 'x'.repeat(400),
      travellers: 999,
      currency: 'Franken',
      status: 'draft',
      pace: 'balanced',
      interests: [],
      stages: [],
      days: [],
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    })

    const rohVorher = speicher.roh(SCHLUESSEL.aktiv)
    const server = attrappe()
    const bericht = await gastreisenUebernehmen(server.senden)

    // Das Schema in lib/trips/schema.ts weist ihn beim Lesen ab. Die Übernahme
    // darf das nicht als „kein Entwurf“ verschweigen und nicht an den Server
    // reichen.
    assert.deepEqual(bericht, { art: 'ungueltig' })
    assert.equal(server.empfangen.length, 0)
    assert.equal(speicher.roh(SCHLUESSEL.aktiv), rohVorher)
    assert.equal(speicher.schreibvorgaenge.length, 0)
  })
})

describe('Honesty der aktiven Gastreise vor der Übernahme', () => {
  function legacyMini(id: string, title: string) {
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
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
    }
  }

  test('leerer Speicher bleibt still und ohne Serveraufruf', async () => {
    const server = attrappe()
    let gemeldet = 0
    const bericht = await gastreisenUebernehmen(server.senden, () => {
      gemeldet += 1
    })

    assert.deepEqual(bericht, { art: 'nichts' })
    assert.equal(server.empfangen.length, 0)
    assert.equal(gemeldet, 0)
    assert.equal('uebernommen' in bericht, false)
  })

  test('leerer String, Primitive und JSON-null sind ungültig und bleiben liegen', async () => {
    for (const roh of ['', 'null', '0', 'false', '"text"']) {
      speicher.setzen(SCHLUESSEL.aktiv, roh)
      const server = attrappe()
      const bericht = await gastreisenUebernehmen(server.senden)

      assert.deepEqual(bericht, { art: 'ungueltig' })
      assert.equal(server.empfangen.length, 0)
      assert.equal(speicher.roh(SCHLUESSEL.aktiv), roh)
      assert.equal(speicher.schreibvorgaenge.length, 0)
    }
  })

  test('ungültig aktiv plus gültiges Legacy wird nicht normalisiert und nicht gesendet', async () => {
    const aktivRoh = '{kein JSON'
    speicher.setzen(SCHLUESSEL.aktiv, aktivRoh)
    speicher.setzen(SCHLUESSEL.legacy, [legacyMini('trip-alt', 'Barcelona')])
    const legacyRoh = speicher.roh(SCHLUESSEL.legacy)
    const server = attrappe()
    let gemeldet = 0

    const bericht = await gastreisenUebernehmen(server.senden, () => {
      gemeldet += 1
    })

    assert.deepEqual(bericht, { art: 'ungueltig' })
    assert.equal(server.empfangen.length, 0)
    assert.equal(gemeldet, 0)
    assert.equal(speicher.roh(SCHLUESSEL.aktiv), aktivRoh)
    assert.equal(speicher.roh(SCHLUESSEL.legacy), legacyRoh)
    assert.equal(speicher.schreibvorgaenge.length, 0)
  })

  test('ungültig aktiv plus gültige Warteschlange wird nicht gesendet und nicht gelöscht', async () => {
    const aktiv = gastreiseAnlegen(eingabe({ title: 'Aktiv' }))
    speicher.setzen(SCHLUESSEL.warteschlange, [
      { ...aktiv, id: 'trip-warte-1', clientRef: 'trip-warte-1', title: 'Wartend' },
    ])
    const warteschlangeRoh = speicher.roh(SCHLUESSEL.warteschlange)
    speicher.setzen(SCHLUESSEL.aktiv, '{kein JSON')
    speicher.schreibvorgaenge.length = 0
    const server = attrappe()

    const bericht = await gastreisenUebernehmen(server.senden)

    assert.deepEqual(bericht, { art: 'ungueltig' })
    assert.equal(server.empfangen.length, 0)
    assert.equal(speicher.roh(SCHLUESSEL.aktiv), '{kein JSON')
    assert.equal(speicher.roh(SCHLUESSEL.warteschlange), warteschlangeRoh)
    assert.equal(speicher.schreibvorgaenge.length, 0)
  })

  test('fehlend aktiv plus gültiges Legacy übernimmt weiter wie bisher', async () => {
    speicher.setzen(SCHLUESSEL.legacy, [legacyMini('trip-alt', 'Barcelona')])
    const server = attrappe()

    const bericht = await gastreisenUebernehmen(server.senden)

    assert.deepEqual(bericht, { art: 'fertig', uebernommen: 1 })
    assert.equal(server.empfangen[0]?.title, 'Barcelona')
    assert.equal(speicher.roh(SCHLUESSEL.aktiv), null)
    assert.equal(speicher.roh(SCHLUESSEL.legacy), null)
  })

  test('getItem-Wurf ist speicher_unlesbar und schreibt nichts', async () => {
    speicher.setzen(SCHLUESSEL.aktiv, '{kein JSON')
    speicher.setzen(SCHLUESSEL.legacy, [legacyMini('trip-alt', 'Barcelona')])
    const aktivRoh = speicher.roh(SCHLUESSEL.aktiv)
    const legacyRoh = speicher.roh(SCHLUESSEL.legacy)
    speicher.lesenWerfen()
    const server = attrappe()
    let gemeldet = 0

    const bericht = await gastreisenUebernehmen(server.senden, () => {
      gemeldet += 1
    })

    assert.deepEqual(bericht, { art: 'speicher_unlesbar' })
    assert.equal(server.empfangen.length, 0)
    assert.equal(gemeldet, 0)
    assert.equal('uebernommen' in bericht, false)
    assert.equal(speicher.roh(SCHLUESSEL.aktiv), aktivRoh)
    assert.equal(speicher.roh(SCHLUESSEL.legacy), legacyRoh)
    assert.equal(speicher.schreibvorgaenge.length, 0)
  })

  test('ein werfender localStorage-Getter ist speicher_unlesbar', async () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {},
    })
    Object.defineProperty(globalThis.window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('SecurityError')
      },
    })
    const server = attrappe()

    const bericht = await gastreisenUebernehmen(server.senden)

    assert.deepEqual(bericht, { art: 'speicher_unlesbar' })
    assert.equal(server.empfangen.length, 0)
  })

  test('ohne window bleibt die Übernahme still, kein Speicherfehler', async () => {
    const vorher = Object.getOwnPropertyDescriptor(globalThis, 'window')
    Reflect.deleteProperty(globalThis, 'window')
    const server = attrappe()

    try {
      const bericht = await gastreisenUebernehmen(server.senden)
      assert.deepEqual(bericht, { art: 'nichts' })
      assert.equal(server.empfangen.length, 0)
    } finally {
      if (vorher) Object.defineProperty(globalThis, 'window', vorher)
    }
  })

  test('Retry nach Korrektur liest frisch und übernimmt', async () => {
    speicher.setzen(SCHLUESSEL.aktiv, '{kein JSON')
    const server = attrappe()

    const erst = await gastreisenUebernehmen(server.senden)
    assert.deepEqual(erst, { art: 'ungueltig' })
    assert.equal(server.empfangen.length, 0)

    const entwurf = gastreiseAnlegen(eingabe({ title: 'Korrigiert' }))
    const retry = await gastreisenUebernehmen(server.senden)

    assert.deepEqual(retry, { art: 'fertig', uebernommen: 1 })
    assert.equal(server.empfangen[0]?.client_ref, entwurf.clientRef)
    assert.equal(speicher.roh(SCHLUESSEL.aktiv), null)
  })

  test('Retry nach wiederhergestelltem Speicher liest frisch', async () => {
    speicher.lesenWerfen()
    const server = attrappe()
    const erst = await gastreisenUebernehmen(server.senden)
    assert.deepEqual(erst, { art: 'speicher_unlesbar' })

    speicherStellen()
    const entwurf = gastreiseAnlegen(eingabe({ title: 'Wieder da' }))
    const retry = await gastreisenUebernehmen(server.senden)

    assert.deepEqual(retry, { art: 'fertig', uebernommen: 1 })
    assert.equal(server.empfangen[0]?.title, 'Wieder da')
    assert.equal(server.empfangen[0]?.client_ref, entwurf.clientRef)
  })

  test('ungültig und unlesbar erfinden keine Zählung', async () => {
    speicher.setzen(SCHLUESSEL.aktiv, '{kein JSON')
    const ungueltig = await gastreisenUebernehmen(attrappe().senden)
    assert.deepEqual(ungueltig, { art: 'ungueltig' })
    assert.equal('uebernommen' in ungueltig, false)
    assert.equal('offen' in ungueltig, false)

    speicher = speicherStellen()
    speicher.lesenWerfen()
    const unlesbar = await gastreisenUebernehmen(attrappe().senden)
    assert.deepEqual(unlesbar, { art: 'speicher_unlesbar' })
    assert.equal('uebernommen' in unlesbar, false)
    assert.equal('offen' in unlesbar, false)
  })
})

describe('Brücke unterscheidet leer, ungültig und unlesbar', () => {
  test('nichts bleibt still', () => {
    const stand = gastreiseBrueckeStandAusBericht({ art: 'nichts' })
    const kopie = gastreiseBrueckeKopie(stand)
    assert.deepEqual(stand, { art: 'ruht' })
    assert.equal(kopie.sichtbar, false)
    assert.equal(renderToStaticMarkup(createElement(GastreiseBrueckenAnzeige, { stand })), '')
  })

  test('ungültig ist ein Alert ohne Erfolgszählung und ohne Verlustbehauptung', () => {
    const stand = gastreiseBrueckeStandAusBericht({ art: 'ungueltig' })
    const kopie = gastreiseBrueckeKopie(stand)
    const html = renderToStaticMarkup(createElement(GastreiseBrueckenAnzeige, { stand }))

    assert.deepEqual(stand, { art: 'ungueltig' })
    assert.equal(kopie.rolle, 'alert')
    assert.equal(kopie.erneut, true)
    assert.equal(kopie.haupt, GASTREISE_BRUECKE_TEXTE.ungueltigHaupt)
    assert.equal(kopie.neben, GASTREISE_BRUECKE_TEXTE.ungueltigNeben)
    assert.match(html, /role="alert"/)
    assert.match(html, /konnte nicht übernommen werden/)
    assert.match(html, /nicht verändert/)
    assert.match(html, /Erneut versuchen/)
    assert.equal(html.includes('ist nicht verloren'), false)
    assert.equal(html.includes('uebernommen'), false)
  })

  test('unlesbarer Speicher behauptet weder Leere noch sichere Erhaltung', () => {
    const stand = gastreiseBrueckeStandAusBericht({ art: 'speicher_unlesbar' })
    const kopie = gastreiseBrueckeKopie(stand)
    const html = renderToStaticMarkup(createElement(GastreiseBrueckenAnzeige, { stand }))

    assert.deepEqual(stand, { art: 'speicher_unlesbar' })
    assert.equal(kopie.rolle, 'alert')
    assert.equal(kopie.haupt, GASTREISE_BRUECKE_TEXTE.speicherHaupt)
    assert.equal(kopie.neben, GASTREISE_BRUECKE_TEXTE.speicherNeben)
    assert.match(html, /role="alert"/)
    assert.match(html, /konnte nicht gelesen werden/)
    assert.match(html, /konnte nicht geprüft werden/)
    assert.equal(html.includes('ist nicht verloren'), false)
    assert.equal(html.includes('kein gültiger Reiseentwurf'), false)
  })

  test('bestehender Serverfehler behält die Verlustwarnung', () => {
    const stand = gastreiseBrueckeStandAusBericht({
      art: 'fehler',
      meldung: 'Die Datenbank ist nicht erreichbar.',
      uebernommen: 0,
      offen: 1,
    })
    const kopie = gastreiseBrueckeKopie(stand)
    const html = renderToStaticMarkup(createElement(GastreiseBrueckenAnzeige, { stand }))

    assert.equal(stand.art, 'fehler')
    assert.equal(kopie.neben, GASTREISE_BRUECKE_TEXTE.fehlerNeben)
    assert.match(html, /ist nicht verloren/)
    assert.match(html, /Die Datenbank ist nicht erreichbar/)
  })

  test('gültige Übernahme und Lauf bleiben unverändert sichtbar', () => {
    const fertig = gastreiseBrueckeKopie(gastreiseBrueckeStandAusBericht({ art: 'fertig', uebernommen: 1 }))
    assert.equal(fertig.rolle, 'status')
    assert.match(fertig.haupt, /liegt jetzt in deinem Konto/)

    const laeuftHtml = renderToStaticMarkup(
      createElement(GastreiseBrueckenAnzeige, { stand: { art: 'laeuft', anzahl: 2 } }),
    )
    assert.match(laeuftHtml, /role="status"/)
    assert.match(laeuftHtml, /2 Reisen werden in dein Konto übernommen/)
  })
})
