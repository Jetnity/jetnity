// lib/admin/ladezustand.test.ts
//
// Die Serverseite trennt seit ADR-0037 drei Ausgänge; hier wird geprüft, dass
// die Oberfläche sie auch drei bleiben lässt. Der Fall, an dem `TransactionsCard`
// und `WebhooksCard` gescheitert sind, steht als eigener Test: Status 500 mit
// `{ rows: [] }` im Körper – die Antwort, die `data.rows ?? []` in eine
// vermeintlich leere Tabelle verwandelt hat.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  ausProblem,
  fortsetzung,
  lade,
  liste,
  type Antwortartig,
} from '@/lib/admin/ladezustand'
import { problemAus } from '@/lib/api/datenbank-lesen'

type Zeile = { id: string }

/** Baut die Antwort, die eine Route über `NextResponse.json` liefert. */
function antwort(status: number, koerper: unknown): Antwortartig {
  return { ok: status >= 200 && status < 300, status, json: async () => koerper }
}

/** Eine Antwort, deren Körper kein JSON ist – etwa eine Fehlerseite des Proxys. */
function unlesbar(status: number): Antwortartig {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      throw new SyntaxError('Unexpected token < in JSON')
    },
  }
}

const zeilen = (koerper: unknown) => liste<Zeile>(koerper, 'rows')

describe('Eine erfolgreiche Antwort ohne Zeilen bleibt leer', () => {
  test('null Zeilen sind ein Ergebnis, kein Fehler', async () => {
    const ergebnis = await lade(async () => antwort(200, { rows: [] }), zeilen)

    assert.equal(ergebnis.fehler, null)
    assert.deepEqual(ergebnis.daten, [])
  })

  test('Zeilen kommen unverändert durch', async () => {
    const ergebnis = await lade(async () => antwort(200, { rows: [{ id: 'a' }] }), zeilen)

    assert.equal(ergebnis.fehler, null)
    assert.deepEqual(ergebnis.daten, [{ id: 'a' }])
  })
})

describe('Ein Fehler wird kein leeres Ergebnis', () => {
  test('Status 500 mit leerer Liste im Körper ist ein Fehler', async () => {
    // Genau diese Antwort hat die zwei Karten getäuscht. Der Status entscheidet,
    // nicht der Körper.
    const ergebnis = await lade(async () => antwort(500, { rows: [] }), zeilen)

    assert.equal(ergebnis.daten, null)
    assert.ok(ergebnis.fehler)
  })

  test('die Meldung des Servers wird angezeigt, nicht ersetzt', async () => {
    const ergebnis = await lade(
      async () => antwort(500, { message: 'permission denied for table payments' }),
      zeilen,
    )

    assert.equal(ergebnis.fehler?.meldung, 'permission denied for table payments')
  })

  test('auch das Feld `error` wird gelesen', async () => {
    // `requireAdminApi` und die älteren Routen senden `error` statt `message`.
    const ergebnis = await lade(async () => antwort(403, { error: 'Rolle fehlt' }), zeilen)

    assert.equal(ergebnis.fehler?.meldung, 'Rolle fehlt')
  })

  test('ohne Meldung im Körper nennt der Fehler den Status', async () => {
    const ergebnis = await lade(async () => antwort(500, {}), zeilen)

    assert.match(ergebnis.fehler?.meldung ?? '', /500/)
  })

  test('401 und 403 werden benannt statt nur nummeriert', async () => {
    const nicht = await lade(async () => antwort(401, {}), zeilen)
    const verboten = await lade(async () => antwort(403, {}), zeilen)

    assert.equal(nicht.fehler?.meldung, 'Nicht angemeldet.')
    assert.equal(verboten.fehler?.meldung, 'Für diese Ansicht fehlt die Berechtigung.')
  })

  test('ein unlesbarer Fehlerkörper verdeckt den Status nicht', async () => {
    const ergebnis = await lade(async () => unlesbar(502), zeilen)

    assert.equal(ergebnis.daten, null)
    assert.match(ergebnis.fehler?.meldung ?? '', /502/)
  })

  test('ein unlesbarer Körper mit Status 200 ist ebenfalls ein Fehler', async () => {
    const ergebnis = await lade(async () => unlesbar(200), zeilen)

    assert.equal(ergebnis.daten, null)
    assert.ok(ergebnis.fehler)
  })
})

describe('Nur bei 503 lohnt der zweite Versuch', () => {
  test('503 ist wiederholbar', async () => {
    const ergebnis = await lade(async () => antwort(503, { message: 'too many connections' }), zeilen)

    assert.equal(ergebnis.fehler?.wiederholbar, true)
  })

  test('500 ist es nicht – die Datenbank hat geantwortet und abgelehnt', async () => {
    const ergebnis = await lade(async () => antwort(500, { message: 'permission denied' }), zeilen)

    assert.equal(ergebnis.fehler?.wiederholbar, false)
  })

  test('403 ist es nicht', async () => {
    const ergebnis = await lade(async () => antwort(403, {}), zeilen)

    assert.equal(ergebnis.fehler?.wiederholbar, false)
  })
})

describe('Eine Anfrage, die nicht ankommt', () => {
  test('meldet die fehlende Verbindung und lädt zum zweiten Versuch ein', async () => {
    const ergebnis = await lade(async () => {
      throw new TypeError('Failed to fetch')
    }, zeilen)

    assert.equal(ergebnis.daten, null)
    assert.equal(ergebnis.fehler?.wiederholbar, true)
    // Die Meldung des Browsers sagt der Bedienerin nichts und wird nicht
    // durchgereicht.
    assert.doesNotMatch(ergebnis.fehler?.meldung ?? '', /fetch/i)
  })
})

describe('Ein fehlendes Feld ist keine leere Liste', () => {
  test('fehlt `rows`, ist die Antwort unbrauchbar', async () => {
    // `data.rows ?? []` machte daraus null Zeilen. Der Unterschied zählt: Eine
    // Route, die ihr Feld nicht mehr sendet, soll auffallen.
    const ergebnis = await lade(async () => antwort(200, { zeilen: [] }), zeilen)

    assert.equal(ergebnis.daten, null)
    assert.ok(ergebnis.fehler)
  })

  test('ein Feld, das keine Liste ist, gilt nicht als eine', async () => {
    const ergebnis = await lade(async () => antwort(200, { rows: null }), zeilen)

    assert.equal(ergebnis.daten, null)
    assert.ok(ergebnis.fehler)
  })

  test('ein Körper, der kein Objekt ist, ebenso', async () => {
    const ergebnis = await lade(async () => antwort(200, 'ok'), zeilen)

    assert.equal(ergebnis.daten, null)
    assert.ok(ergebnis.fehler)
  })

  test('eine unlesbare Antwort ist nicht wiederholbar, wenn der Körper nicht passt', async () => {
    const ergebnis = await lade(async () => antwort(200, { rows: 5 }), zeilen)

    assert.equal(ergebnis.fehler?.wiederholbar, false)
  })
})

describe('Serverseitige Ansichten benutzen dieselbe Einordnung', () => {
  // Die Startseite der Administration und die Benutzerverwaltung lesen ohne
  // Route dazwischen. Ihre Anzeige darf deshalb nicht anders ausfallen als
  // hinter einer Route.
  test('ein fehlendes Recht ist nicht wiederholbar', () => {
    const fehler = ausProblem(
      problemAus({ data: null, error: null, status: 403 }, { message: 'permission denied', code: '42501' }),
    )

    assert.equal(fehler.meldung, 'permission denied')
    assert.equal(fehler.wiederholbar, false)
  })

  test('eine erschöpfte Verbindung ist wiederholbar', () => {
    const fehler = ausProblem(
      problemAus({ data: null, error: null, status: 500 }, { message: 'too many connections', code: '53300' }),
    )

    assert.equal(fehler.wiederholbar, true)
  })

  test('eine Zählabfrage ohne Körper nennt wenigstens den Status', () => {
    // `head: true` schickt HEAD, und eine HEAD-Antwort hat keinen Körper.
    // `postgrest-js` liefert dann `{ message: '' }` – eine leere Zeile in der
    // Fehlerfläche wäre das Ergebnis.
    const fehler = ausProblem(problemAus({ data: null, error: null, status: 403 }, { message: '' }))

    assert.match(fehler.meldung, /403/)
    assert.ok(fehler.meldung.length > 20)
  })

  test('eine Anfrage, die die Datenbank nicht erreicht hat, ebenso', () => {
    // `postgrest-js` fängt einen gescheiterten `fetch` selbst ab und baut daraus
    // eine Antwort mit `status: 0`.
    const fehler = ausProblem(problemAus({ data: null, error: null, status: 0 }, { message: 'fetch failed' }))

    assert.equal(fehler.wiederholbar, true)
  })
})

describe('Die Fortsetzung', () => {
  test('wird gelesen, wenn eine da ist', () => {
    assert.equal(fortsetzung({ rows: [], next_cursor: '2026-08-17' }), '2026-08-17')
  })

  test('ist null, wenn das Feld fehlt, leer oder kein Text ist', () => {
    assert.equal(fortsetzung({ rows: [] }), null)
    assert.equal(fortsetzung({ next_cursor: '' }), null)
    assert.equal(fortsetzung({ next_cursor: 5 }), null)
    assert.equal(fortsetzung(null), null)
  })
})
