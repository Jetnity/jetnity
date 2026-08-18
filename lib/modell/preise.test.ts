// lib/modell/preise.test.ts
//
// Diese Rechnung ist die Grundlage des Kostendeckels. Läuft sie zu tief, greift
// der Deckel zu spät und Jetnity gibt mehr aus als zugesagt; läuft sie zu hoch,
// schaltet er die Funktion früher ab als nötig. Beide Richtungen sind Fehler,
// und beide fallen ohne Test niemandem auf – eine Zahl in einem Protokoll sieht
// immer plausibel aus.
//
// Geprüft wird gegen die Preisliste von OpenAI (Stand 18. August 2026) und gegen
// die zweite Umsetzung derselben Rechnung in
// `supabase/migrations/20260818040000_modellnutzung.sql`. Der Vergleich beider
// Seiten steht in `lib/modell/grenzen-datenbank.test.ts`.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  MODELLE,
  PREISE,
  alsUsd,
  kostenMikroUsd,
  reservierungMikroUsd,
} from '@/lib/modell/preise'
import { MODELL_GRENZEN } from '@/lib/modell/konfiguration'

describe('Jedes zugelassene Modell hat einen Preis', () => {
  test('die Liste der Modelle und die der Preise decken sich', () => {
    // Ein Modell ohne Preis wäre ein Aufruf ohne Kostendeckel. Der Typ verhindert
    // das beim Übersetzen; dieser Test verhindert, dass jemand `Record` gegen
    // `Partial<Record>` tauscht und den Schutz dabei verliert.
    assert.deepEqual(Object.keys(PREISE).sort(), [...MODELLE].sort())
  })

  test('kein Preis ist null oder negativ', () => {
    for (const modell of MODELLE) {
      const preis = PREISE[modell]
      assert.ok(preis.eingabe > 0, `${modell}: Eingabepreis`)
      assert.ok(preis.ausgabe > 0, `${modell}: Ausgabepreis`)
      assert.ok(preis.eingabeGecacht > 0, `${modell}: Cache-Preis`)
    }
  })

  test('ein gecachtes Token ist billiger als ein frisches', () => {
    // Wäre es umgekehrt, wäre der Abzug unten eine Erhöhung.
    for (const modell of MODELLE) {
      assert.ok(PREISE[modell].eingabeGecacht < PREISE[modell].eingabe, modell)
    }
  })
})

describe('Was ein Aufruf gekostet hat', () => {
  test('eine Million frische Eingabetokens kosten genau den Listenpreis', () => {
    // Die Einheit der Tabelle ist µ$ je 1 000 000 Tokens. Damit ist dieser Test
    // die Prüfung, dass ein Eintrag eine Umschrift und keine Umrechnung ist.
    assert.equal(
      kostenMikroUsd('gpt-5.6-terra', {
        eingabeTokens: 1_000_000,
        gecachteTokens: 0,
        ausgabeTokens: 0,
      }),
      PREISE['gpt-5.6-terra'].eingabe,
    )
  })

  test('eine Million Ausgabetokens ebenso', () => {
    assert.equal(
      kostenMikroUsd('gpt-5.6-terra', {
        eingabeTokens: 0,
        gecachteTokens: 0,
        ausgabeTokens: 1_000_000,
      }),
      PREISE['gpt-5.6-terra'].ausgabe,
    )
  })

  test('gecachte Tokens werden abgezogen und zum Cache-Preis gerechnet', () => {
    // 1000 Eingabetokens, davon 800 aus dem Cache:
    // 200 × 2.00 $/M + 800 × 0.20 $/M = 400 µ$ + 160 µ$ = 560 µ$.
    assert.equal(
      kostenMikroUsd('gpt-5.6-terra', {
        eingabeTokens: 1000,
        gecachteTokens: 800,
        ausgabeTokens: 0,
      }),
      560,
    )
  })

  test('gecachte Tokens werden nicht doppelt gezählt', () => {
    // `gecachteTokens` ist eine Teilmenge von `eingabeTokens`. Würde die Summe
    // beide addieren, wäre der Betrag bei gleichbleibenden Systemregeln – also
    // im Normalfall – dauerhaft zu hoch.
    const ohneCache = kostenMikroUsd('gpt-5.6-terra', {
      eingabeTokens: 2000,
      gecachteTokens: 0,
      ausgabeTokens: 0,
    })
    const mitCache = kostenMikroUsd('gpt-5.6-terra', {
      eingabeTokens: 2000,
      gecachteTokens: 2000,
      ausgabeTokens: 0,
    })

    assert.ok(mitCache < ohneCache)
    assert.equal(mitCache, 2000 * (PREISE['gpt-5.6-terra'].eingabeGecacht / 1_000_000))
  })

  test('mehr Cache als Eingabe wird auf die Eingabe gekappt', () => {
    // Eine Antwort mit `cached_tokens > input_tokens` widerspricht dem Vertrag
    // der API. Ohne die Kappung ergäbe sie einen negativen Frischanteil und
    // damit einen zu niedrigen Betrag – ein Kostendeckel, der sich durch eine
    // unsinnige Zahl aushebeln lässt, ist keiner.
    assert.equal(
      kostenMikroUsd('gpt-5.6-terra', {
        eingabeTokens: 100,
        gecachteTokens: 5000,
        ausgabeTokens: 0,
      }),
      kostenMikroUsd('gpt-5.6-terra', {
        eingabeTokens: 100,
        gecachteTokens: 100,
        ausgabeTokens: 0,
      }),
    )
  })

  test('negative Zahlen senken den Betrag nicht', () => {
    assert.equal(
      kostenMikroUsd('gpt-5.6-terra', {
        eingabeTokens: -1000,
        gecachteTokens: -1000,
        ausgabeTokens: 1000,
      }),
      kostenMikroUsd('gpt-5.6-terra', { eingabeTokens: 0, gecachteTokens: 0, ausgabeTokens: 1000 }),
    )
  })

  test('aufgerundet, nicht gerundet', () => {
    // Ein Token auf `gpt-5.6-luna` kostet 0.2 µ$. Abgerundet wäre das 0, und
    // eine Summe aus Nullen ist kein Kostenprotokoll.
    assert.equal(
      kostenMikroUsd('gpt-5.6-luna', { eingabeTokens: 1, gecachteTokens: 0, ausgabeTokens: 0 }),
      1,
    )
  })

  test('ein Aufruf ohne Tokens kostet nichts', () => {
    assert.equal(
      kostenMikroUsd('gpt-5.6-terra', { eingabeTokens: 0, gecachteTokens: 0, ausgabeTokens: 0 }),
      0,
    )
  })
})

describe('Die Reservierung vor dem Aufruf', () => {
  test('sie rechnet ohne Cache – die teurere Annahme', () => {
    const reserviert = reservierungMikroUsd('gpt-5.6-terra', 2600, 6000)
    const mitCache = kostenMikroUsd('gpt-5.6-terra', {
      eingabeTokens: 2600,
      gecachteTokens: 2048,
      ausgabeTokens: 6000,
    })

    assert.ok(reserviert > mitCache, 'sonst wäre die Reservierung eine Unterschätzung')
  })

  test('der schlechteste Fall auf dem vorgegebenen Modell', () => {
    // 2600 × 2.00 $/M + 6000 × 12.00 $/M = 5200 µ$ + 72 000 µ$ = 77 200 µ$.
    // Diese Zahl trägt die Rechnung des Tagesdeckels und steht als Kommentar in
    // `lib/modell/konfiguration.ts` und in der Migration.
    assert.equal(
      reservierungMikroUsd(
        'gpt-5.6-terra',
        MODELL_GRENZEN.eingabeTokensSchaetzung,
        MODELL_GRENZEN.ausgabeTokens,
      ),
      77_200,
    )
  })

  test('kein Aufruf kann teurer werden als seine Reservierung', () => {
    // Die Grenzen des Aufrufs sind `eingabeZeichen` (und damit die geschätzten
    // Eingabetokens) und `ausgabeTokens` als `max_output_tokens`. Ein Aufruf, der
    // seine Reservierung überschreiten könnte, würde den Deckel blind machen.
    for (const modell of MODELLE) {
      const reserviert = reservierungMikroUsd(
        modell,
        MODELL_GRENZEN.eingabeTokensSchaetzung,
        MODELL_GRENZEN.ausgabeTokens,
      )
      const gemessen = kostenMikroUsd(modell, {
        eingabeTokens: MODELL_GRENZEN.eingabeTokensSchaetzung,
        gecachteTokens: 0,
        ausgabeTokens: MODELL_GRENZEN.ausgabeTokens,
      })

      assert.equal(gemessen, reserviert, modell)
    }
  })
})

describe('Die Anzeige in USD', () => {
  test('Mikrodollar werden zu einem Betrag', () => {
    assert.equal(alsUsd(77_200), '0.0772')
    assert.equal(alsUsd(3_000_000), '3.0000')
    assert.equal(alsUsd(0), '0.0000')
  })
})
