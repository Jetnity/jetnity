// lib/api/datenbank-lesen.test.ts
//
// Der Unterschied zwischen „nichts gefunden“ und „nicht ermittelbar“ ist der
// ganze Zweck dieses Moduls. Beide Seiten werden hier gegeneinander geprüft:
// Eine leere Antwort muss eine leere Liste bleiben, ein Fehler darf niemals
// eine werden.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { lese, type Leseantwort } from '@/lib/api/datenbank-lesen'

type Zeile = { id: string }

/** Baut die Antwort, die `postgrest-js` bei einem Treffer liefert. */
function erfolg(zeilen: Zeile[]): Leseantwort<Zeile> {
  return { data: zeilen, error: null, status: 200 }
}

/** Baut die Antwort, die `postgrest-js` bei einer Ablehnung der Datenbank liefert. */
function abgelehnt(code: string, message: string, status = 400): Leseantwort<Zeile> {
  return { data: null, error: { message, code }, status }
}

describe('Eine leere Abfrage bleibt eine leere Liste', () => {
  test('keine Zeile ist ein Ergebnis, kein Problem', async () => {
    const ergebnis = await lese<Zeile>(async () => erfolg([]))

    assert.equal(ergebnis.problem, null)
    assert.deepEqual(ergebnis.zeilen, [])
  })

  test('Zeilen kommen unverändert durch', async () => {
    const ergebnis = await lese<Zeile>(async () => erfolg([{ id: 'a' }, { id: 'b' }]))

    assert.equal(ergebnis.problem, null)
    assert.deepEqual(ergebnis.zeilen, [{ id: 'a' }, { id: 'b' }])
  })

  test('von RLS weggefilterte Zeilen sind kein Fehler', async () => {
    // Ein Konto ohne die nötige Rolle bekommt von PostgREST keine Ablehnung,
    // sondern null Zeilen. Genau das sieht eine Notzugangs-Sitzung
    // (ADR-0036), und genau deshalb erklärt die Oberfläche es dort mit einem
    // Hinweis, statt hier einen Fehler zu erfinden.
    const ergebnis = await lese<Zeile>(async () => erfolg([]))

    assert.equal(ergebnis.problem, null)
  })
})

describe('Ein Fehler wird ein Fehler', () => {
  test('fehlendes Tabellenrecht meldet 500', async () => {
    const ergebnis = await lese<Zeile>(async () =>
      abgelehnt('42501', 'permission denied for table payments', 403),
    )

    assert.equal(ergebnis.zeilen, null)
    assert.equal(ergebnis.problem?.status, 500)
  })

  test('fehlende Relation meldet 500', async () => {
    // Der Fall aus ADR-0034: Vier Routen sprachen `ip_blocklist` an, die es
    // nicht gibt. Sichtbar wurde davon nichts.
    const ergebnis = await lese<Zeile>(async () =>
      abgelehnt('42P01', 'relation "public.ip_blocklist" does not exist', 404),
    )

    assert.equal(ergebnis.zeilen, null)
    assert.equal(ergebnis.problem?.status, 500)
  })

  test('die Meldung der Datenbank wird durchgereicht, nicht ersetzt', async () => {
    const ergebnis = await lese<Zeile>(async () =>
      abgelehnt('42501', 'permission denied for table payments', 403),
    )

    assert.equal(ergebnis.problem?.message, 'permission denied for table payments')
  })

  test('eine Antwort ohne Daten und ohne Fehler wird gemeldet', async () => {
    // Nach dem Vertrag von PostgREST unmöglich. Ein stillschweigend als leer
    // behandelter „unmöglicher“ Zweig ist der Ursprung jeder der stillen
    // Entwarnungen, die Phase 1.4 gefunden hat.
    const ergebnis = await lese<Zeile>(async () => ({ data: null, error: null, status: 200 }))

    assert.equal(ergebnis.zeilen, null)
    assert.equal(ergebnis.problem?.status, 500)
  })

  test('eine geworfene Ausnahme wird zur Antwort, nicht zum Absturz', async () => {
    const ergebnis = await lese<Zeile>(async () => {
      throw new Error('cookies() ausserhalb einer Anfrage')
    })

    assert.equal(ergebnis.zeilen, null)
    assert.equal(ergebnis.problem?.status, 500)
    assert.equal(ergebnis.problem?.message, 'cookies() ausserhalb einer Anfrage')
  })
})

describe('Ein Ausfall ist kein Defekt', () => {
  // 503 heisst: Ob es Daten gäbe, ist unbekannt, ein zweiter Versuch kann
  // helfen. 500 heisst: Die Datenbank hat geantwortet und abgelehnt.

  test('unerreichbare Datenbank meldet 503', async () => {
    // `postgrest-js` fängt einen gescheiterten `fetch` selbst ab und setzt
    // `status` auf 0. Der Fehlercode ist dann leer, das Feld allein trägt die
    // Unterscheidung.
    const ergebnis = await lese<Zeile>(async () => ({
      data: null,
      error: { message: 'TypeError: fetch failed', code: '' },
      status: 0,
    }))

    assert.equal(ergebnis.problem?.status, 503)
  })

  test('abgebrochene Verbindung meldet 503', async () => {
    const ergebnis = await lese<Zeile>(async () =>
      abgelehnt('08006', 'connection failure', 500),
    )

    assert.equal(ergebnis.problem?.status, 503)
  })

  test('Zeitüberschreitung der Abfrage meldet 503', async () => {
    const ergebnis = await lese<Zeile>(async () =>
      abgelehnt('57014', 'canceling statement due to statement timeout', 500),
    )

    assert.equal(ergebnis.problem?.status, 503)
  })

  test('erschöpfte Verbindungen melden 503', async () => {
    const ergebnis = await lese<Zeile>(async () =>
      abgelehnt('53300', 'too many connections for role', 500),
    )

    assert.equal(ergebnis.problem?.status, 503)
  })

  test('ein fehlerhafter Eingabewert bleibt 500', async () => {
    // Ein Defekt der Anfrage. Ein zweiter Versuch ändert daran nichts.
    const ergebnis = await lese<Zeile>(async () =>
      abgelehnt('22P02', 'invalid input syntax for type uuid', 400),
    )

    assert.equal(ergebnis.problem?.status, 500)
  })

  test('ein fehlender Code fällt nicht auf 503 zurück', async () => {
    // Ohne Code und ohne `status: 0` ist nichts über einen Ausfall bekannt.
    // Dann gilt der Fehler als Defekt – die vorsichtigere der beiden Lesarten,
    // weil sie niemanden zum Wiederholen einlädt.
    const ergebnis = await lese<Zeile>(async () => ({
      data: null,
      error: { message: 'unbekannt' },
      status: 500,
    }))

    assert.equal(ergebnis.problem?.status, 500)
  })
})
