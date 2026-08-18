// lib/modell/grenzen-datenbank.test.ts
//
// Die Kostenschranke steht zwangsläufig an zwei Orten. Durchgesetzt wird sie in
// `public.modell_kontingent_beanspruchen()`, weil nur die Datenbank alle Aufrufe
// sieht; gelesen wird sie in `lib/modell/konfiguration.ts`, weil die Anwendung
// den Aufruf formt und der Nutzer eine Meldung braucht. Zwei Orte für dieselbe
// Zahl sind zwei Gelegenheiten, sie auseinanderlaufen zu lassen – und eine
// Grenze, die in der Anwendung höher steht als in der Datenbank, ist keine.
//
// Dieselbe Doppelung gilt für die Preise: `public.modell_preis()` rechnet die
// Kosten, weil `/rest/v1/rpc/` mit dem öffentlichen anon-Key erreichbar ist und
// ein Deckel, der seinen Preis vom Aufrufer erfährt, keiner ist.
//
// Dieser Test vergleicht beide Seiten allein aus den Dateien. Er braucht keine
// Datenbank, keine Zugangsdaten und läuft deshalb in jeder CI.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { ERGEBNISKLASSEN, MODELL_GRENZEN, MODELL_VORGABE } from '@/lib/modell/konfiguration'
import { MODELLE, PREISE, reservierungMikroUsd } from '@/lib/modell/preise'

const MIGRATION = join(
  process.cwd(),
  'supabase',
  'migrations',
  '20260818040000_modellnutzung.sql',
)

const sql = readFileSync(MIGRATION, 'utf8')

/**
 * Liest eine `constant`-Deklaration aus `modell_kontingent_beanspruchen()`.
 *
 * Bewusst streng: Fehlt die Zeile oder heisst sie anders, ist das ein Fehler und
 * kein „0“. Ein Test, der eine fehlende Grenze als 0 liest, würde eine entfernte
 * Schranke für eine besonders strenge halten.
 */
function konstante(name: string): number {
  const treffer = sql.match(
    new RegExp(`_${name}\\s+constant\\s+(?:integer|bigint)\\s*:=\\s*(\\d+)\\s*;`),
  )

  assert.ok(treffer, `In der Migration fehlt die Konstante _${name}`)
  return Number(treffer[1])
}

describe('Die Grenzen stimmen auf beiden Seiten überein', () => {
  test('Aufrufe je Kennung und Stunde', () => {
    assert.equal(konstante('je_kennung_stunde'), MODELL_GRENZEN.jeKennungStunde)
  })

  test('Aufrufe je Kennung und Tag', () => {
    assert.equal(konstante('je_kennung_tag'), MODELL_GRENZEN.jeKennungTag)
  })

  test('Aufrufe aller Gäste und Tag', () => {
    assert.equal(konstante('gaeste_tag'), MODELL_GRENZEN.gaesteTag)
  })

  test('Aufrufe insgesamt und Tag', () => {
    assert.equal(konstante('gesamt_tag'), MODELL_GRENZEN.gesamtTag)
  })

  test('Kostendeckel je Tag', () => {
    assert.equal(konstante('kosten_tag'), MODELL_GRENZEN.kostenTagMikroUsd)
  })

  test('die Tokengrenzen der Reservierung', () => {
    // Sie bestimmen den reservierten Betrag. Stünde in der Datenbank eine
    // niedrigere Zahl als in `max_output_tokens` des Aufrufs, reservierte sie zu
    // wenig – und der Deckel wäre für die Differenz blind.
    assert.equal(konstante('max_eingabe_tokens'), MODELL_GRENZEN.eingabeTokensSchaetzung)
    assert.equal(konstante('max_ausgabe_tokens'), MODELL_GRENZEN.ausgabeTokens)
  })
})

describe('Die Zählgrenze allein hält den Kostendeckel ein', () => {
  // Das ist der Kern der Zusage. Der Kostendeckel ist die weichere der beiden
  // Schranken: `modell_nutzung_abschliessen()` ist für `anon` ausführbar – ein
  // Gast muss seinen eigenen Aufruf abschliessen können –, und wer den Endpunkt
  // direkt anspricht, kann seine Reservierung mit 0 Tokens abschliessen und den
  // Deckel damit entlasten. Die Zählgrenze wirkt dagegen auf der Reservierung
  // und lässt sich durch nichts, was danach geschieht, zurücknehmen.

  test('das vorgegebene Modell bleibt im Rahmen', () => {
    const schlechtesterFall = reservierungMikroUsd(
      MODELL_VORGABE,
      MODELL_GRENZEN.eingabeTokensSchaetzung,
      MODELL_GRENZEN.ausgabeTokens,
    )

    assert.ok(
      MODELL_GRENZEN.gesamtTag * schlechtesterFall <= MODELL_GRENZEN.kostenTagMikroUsd,
      `${MODELL_GRENZEN.gesamtTag} Aufrufe × ${schlechtesterFall} µ$ überschreiten den Deckel ` +
        `von ${MODELL_GRENZEN.kostenTagMikroUsd} µ$`,
    )
  })

  test('wird ein teureres Modell gewählt, greift der Deckel vor der Zählgrenze', () => {
    // `gpt-5.6-sol` ist zugelassen und würde die Zählgrenze sprengen:
    // 38 × 193 000 µ$ = 7 334 000 µ$. Das ist kein Defekt, sondern die Aufgabe
    // des Deckels – er ist die Schranke für genau diesen Fall. Der Test hält
    // fest, dass er dann wirklich früher greift, und nicht erst danach.
    const teuer = reservierungMikroUsd(
      'gpt-5.6-sol',
      MODELL_GRENZEN.eingabeTokensSchaetzung,
      MODELL_GRENZEN.ausgabeTokens,
    )

    assert.ok(
      MODELL_GRENZEN.kostenTagMikroUsd / teuer < MODELL_GRENZEN.gesamtTag,
      'sonst wäre der Deckel bei diesem Modell wirkungslos',
    )
  })

  test('ein einzelner Aufruf passt unter den Tagesdeckel', () => {
    // Sonst käme auf einem leeren Tag kein einziger Vorschlag zustande, und die
    // Funktion wäre abgeschaltet, ohne dass es jemand so gemeint hätte.
    for (const modell of MODELLE) {
      const einer = reservierungMikroUsd(
        modell,
        MODELL_GRENZEN.eingabeTokensSchaetzung,
        MODELL_GRENZEN.ausgabeTokens,
      )

      assert.ok(einer <= MODELL_GRENZEN.kostenTagMikroUsd, modell)
    }
  })
})

describe('Die Preise stimmen auf beiden Seiten überein', () => {
  /** Liest die Preistabelle aus `public.modell_preis()`. */
  function preiseAusDerDatenbank(): Map<string, [number, number, number]> {
    const gefunden = new Map<string, [number, number, number]>()

    for (const treffer of sql.matchAll(
      /\('([a-z0-9.\-]+)',\s*(\d+)::bigint,\s*(\d+)::bigint,\s*(\d+)::bigint\)/g,
    )) {
      const [, modell, eingabe, gecacht, ausgabe] = treffer
      gefunden.set(modell, [Number(eingabe), Number(gecacht), Number(ausgabe)])
    }

    return gefunden
  }

  test('jedes Modell aus TypeScript hat denselben Preis in der Datenbank', () => {
    const ausDb = preiseAusDerDatenbank()

    for (const modell of MODELLE) {
      const eintrag = ausDb.get(modell)
      assert.ok(eintrag, `In public.modell_preis() fehlt ${modell}`)
      assert.deepEqual(
        eintrag,
        [PREISE[modell].eingabe, PREISE[modell].eingabeGecacht, PREISE[modell].ausgabe],
        `${modell}: Preise laufen auseinander`,
      )
    }
  })

  test('die Datenbank kennt kein Modell, das TypeScript nicht kennt', () => {
    // Ein Modell, das nur die Datenbank kennt, wäre über
    // `JETNITY_MODELL_NAME` nicht wählbar – und ein Preis, den niemand prüft.
    assert.deepEqual([...preiseAusDerDatenbank().keys()].sort(), [...MODELLE].sort())
  })
})

describe('Die Ergebnisklassen stimmen auf beiden Seiten überein', () => {
  test('die Prüfbedingung kennt genau die Klassen aus TypeScript und reserviert', () => {
    // Eine Klasse, die TypeScript kennt und die Datenbank nicht, wäre ein
    // fehlgeschlagener Abschluss – der Aufruf hätte Geld gekostet und stünde
    // dauerhaft als `reserviert` im Protokoll.
    const treffer = sql.match(/model_usage_ergebnis_werte check \(\s*ergebnis in \(([\s\S]*?)\)/)
    assert.ok(treffer, 'die Prüfbedingung model_usage_ergebnis_werte fehlt')

    const ausDb = [...treffer[1].matchAll(/'([a-z0-9\-]+)'/g)].map((eintrag) => eintrag[1])

    assert.deepEqual(ausDb.sort(), ['reserviert', ...ERGEBNISKLASSEN].sort())
  })
})
