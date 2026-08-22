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

import { itineraryDirekt, itineraryEinTransit, itineraryZweiTransits } from '@/lib/route/fixtures'
import { SCHLUESSEL, gastreiseAnlegen, kennungErzeugen } from '@/lib/trips/gastspeicher'
import { leereMobilitaet } from '@/lib/trips/mobilitaet-felder'
import { gastreisenUebernehmen, type Uebernahmeantwort } from '@/lib/trips/uebernahme'
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

  Object.assign(globalThis, {
    window: {
      localStorage: {
        getItem: (schluessel: string) => ablage.get(schluessel) ?? null,
        setItem: (schluessel: string, wert: string) => ablage.set(schluessel, wert),
        removeItem: (schluessel: string) => ablage.delete(schluessel),
      },
    },
  })

  return {
    roh: (schluessel: string) => ablage.get(schluessel) ?? null,
    setzen: (schluessel: string, wert: unknown) =>
      ablage.set(schluessel, JSON.stringify(wert)),
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

  test('ein Transit geht vollständig mit', async () => {
    const entwurf = gastreiseAnlegen(eingabe())
    speicher.setzen(SCHLUESSEL.aktiv, { ...entwurf, ohneTag: [gastflug(itineraryEinTransit())] })
    const server = attrappe()
    await gastreisenUebernehmen(server.senden)
    assert.equal(server.empfangen[0]?.ungeplante[0]?.route_itinerary?.legs[0]?.segments.length, 2)
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
    speicher.setzen(SCHLUESSEL.aktiv, '{kaputt')

    const server = attrappe()
    const bericht = await gastreisenUebernehmen(server.senden)

    assert.deepEqual(bericht, { art: 'nichts' })
    assert.equal(server.empfangen.length, 0)
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

    const server = attrappe()
    const bericht = await gastreisenUebernehmen(server.senden)

    // Das Schema in lib/trips/schema.ts filtert ihn beim Lesen. Ihn zu schicken
    // hiesse, die Ablehnung von der Datenbank zu holen – als SQLSTATE.
    assert.deepEqual(bericht, { art: 'nichts' })
    assert.equal(server.empfangen.length, 0)
  })
})
