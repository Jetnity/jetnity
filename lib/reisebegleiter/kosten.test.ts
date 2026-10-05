// lib/reisebegleiter/kosten.test.ts
//
// Der Reisebegleiter teilt Kontingent und Tagesdeckel mit den beiden anderen
// Modellfunktionen. Diese Datei rechnet nach, dass das Teilen erlaubt ist.
//
// ---------------------------------------------------------------------------
// Woran die belastbare Zusage hängt
// ---------------------------------------------------------------------------
//
// Reserviert wird in `public.modell_kontingent_beanspruchen()` ein fester
// schlechtester Fall: 2600 Eingabe- und 6000 Ausgabetokens. Die Zusage über die
// Tageskosten ist die Zählgrenze auf dieser Reservierung –
// 38 × 77 200 µ$ < 3 000 000 µ$ – und `lib/modell/grenzen-datenbank.test.ts`
// prüft diese Rechnung.
//
// Sie gilt aber nur, solange ein tatsächlicher Aufruf nicht mehr kostet als
// seine Reservierung. Bei Reisevorschlag und Reiseänderung sorgt dafür die
// Freitextgrenze. Beim Reisebegleiter geht zusätzlich der Reisekontext in die
// Eingabe, und der wächst mit der Reise – die Reservierung nicht.
//
// Die Antwort darauf sind zwei Zahlen in `BEGLEITER_GRENZEN`:
//
//   · `eingabeZeichen` begrenzt Systemregeln plus Frage;
//   · `ausgabeTokens` liegt weit unter dem reservierten Ausgabebudget.
//
// Diese Datei prüft, dass beide zusammen für **jedes** zugelassene Modell unter
// der Reservierung bleiben – und zwar mit einer pessimistischen Annahme über
// die Tokenisierung, damit die Rechnung keine Tokenizer-Abhängigkeit braucht.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { MODELL_GRENZEN } from '@/lib/modell/konfiguration'
import { MODELLE, kostenMikroUsd, reservierungMikroUsd } from '@/lib/modell/preise'
import { BEGLEITER_GRENZEN } from '@/lib/reisebegleiter/schema'

/**
 * Pessimistische Zeichen je Token.
 *
 * Deutsche Prosa liegt bei etwa 3, JSON mit kurzen englischen Feldnamen
 * darüber. 2.2 ist deutlich darunter und damit die sichere Richtung: Die
 * Rechnung unten nimmt mehr Eingabetokens an, als real entstehen.
 */
const ZEICHEN_JE_TOKEN = 2.2

const MAX_EINGABE_TOKENS = Math.ceil(BEGLEITER_GRENZEN.eingabeZeichen / ZEICHEN_JE_TOKEN)

describe('Der Reisebegleiter bleibt unter seiner Reservierung', () => {
  for (const modell of MODELLE) {
    test(`${modell}: schlechtester tatsächlicher Fall < reservierter Fall`, () => {
      const reserviert = reservierungMikroUsd(
        modell,
        MODELL_GRENZEN.eingabeTokensSchaetzung,
        MODELL_GRENZEN.ausgabeTokens,
      )
      const schlechtester = kostenMikroUsd(modell, {
        eingabeTokens: MAX_EINGABE_TOKENS,
        gecachteTokens: 0,
        ausgabeTokens: BEGLEITER_GRENZEN.ausgabeTokens,
      })

      assert.ok(
        schlechtester < reserviert,
        `${modell}: ${schlechtester} µ$ tatsächlich gegen ${reserviert} µ$ reserviert`,
      )
    })
  }

  test('das Ausgabebudget liegt unter dem reservierten', () => {
    assert.ok(BEGLEITER_GRENZEN.ausgabeTokens < MODELL_GRENZEN.ausgabeTokens)
  })

  test('die Eingabegrenze ist eine echte Grenze und kein Vielfaches der Reservierung', () => {
    // Ohne diese Prüfung könnte `eingabeZeichen` beliebig wachsen, solange
    // `ausgabeTokens` den Unterschied auffängt – bis es ihn nicht mehr auffängt.
    // Der Test oben würde das melden; dieser sagt, wo die Grenze liegt.
    assert.ok(MAX_EINGABE_TOKENS > MODELL_GRENZEN.eingabeTokensSchaetzung)
    assert.ok(MAX_EINGABE_TOKENS < 20_000)
  })
})

describe('Der Tagesdeckel bleibt eine Obergrenze', () => {
  test('die Zählgrenze trägt den Deckel weiterhin allein', () => {
    // Dieselbe Rechnung wie in `lib/modell/grenzen-datenbank.test.ts`, hier
    // aus dem Blickwinkel der dritten Funktion: Weil ein Reisebegleiter-Aufruf
    // nie mehr kostet als seine Reservierung, ändert sich an der Zusage
    // nichts – egal, wie sich die 38 Aufrufe eines Tages auf die drei
    // Funktionen verteilen.
    const teuerste = Math.max(
      ...MODELLE.map((modell) =>
        reservierungMikroUsd(
          modell,
          MODELL_GRENZEN.eingabeTokensSchaetzung,
          MODELL_GRENZEN.ausgabeTokens,
        ),
      ),
    )
    const vorgabe = reservierungMikroUsd(
      'gpt-5.6-terra',
      MODELL_GRENZEN.eingabeTokensSchaetzung,
      MODELL_GRENZEN.ausgabeTokens,
    )

    assert.ok(
      MODELL_GRENZEN.gesamtTag * vorgabe <= MODELL_GRENZEN.kostenTagMikroUsd,
      'die Zählgrenze hält den Deckel auf der Vorgabe nicht mehr ein',
    )
    // Sol ist teurer als die Vorgabe; dort trägt der Deckel selbst, und das ist
    // der dokumentierte Zustand aus `lib/modell/konfiguration.ts`.
    assert.ok(teuerste > vorgabe)
  })
})
