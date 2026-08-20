// lib/modell/konfiguration.test.ts
//
// Der Kill Switch ist die erste und wichtigste Schranke: Solange er zu ist, kann
// kein Aufruf entstehen, und keine der übrigen Prüfungen muss halten. Deshalb
// wird hier nicht nur geprüft, dass „true“ öffnet, sondern vor allem, dass alles
// andere schliesst – ein leerer Wert, ein Tippfehler, eine fehlende Variable.
//
// Für Production ist der geschlossene Zustand der Normalfall (Abschnitt 6 der
// Aufgabenstellung: keine Aktivierung in Production). Ein Test, der ihn belegt,
// ist damit kein Randfall, sondern die Prüfung des ausgelieferten Verhaltens.
//
// `modellZustand()` nimmt die Umgebung als Argument. Kein Test hier verändert
// `process.env` – das wäre globaler Zustand und machte die Reihenfolge der Tests
// zu einer Bedingung.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  AUFWAND_VORGABE,
  DENKAUFWAENDE,
  ERGEBNISKLASSEN,
  MODELL_GRENZEN,
  MODELL_VORGABE,
  SEITEN_DAUER_S,
  modellZustand,
  timeoutMsFuer,
  type Modellumgebung,
} from '@/lib/modell/konfiguration'
import { MODELLE } from '@/lib/modell/preise'

/** Eine Umgebung, in der der Modellweg offen ist. Jeder Test verändert einen Wert. */
function umgebung(abweichung: Modellumgebung = {}): Modellumgebung {
  return {
    JETNITY_MODELL_AKTIV: 'true',
    OPENAI_API_KEY: 'sk-test-nicht-echt',
    ...abweichung,
  }
}

describe('Ohne ausdrückliche Zustimmung läuft kein Modell', () => {
  test('eine leere Umgebung ist der geschlossene Zustand', () => {
    const zustand = modellZustand({})

    assert.equal(zustand.aktiv, false)
    if (!zustand.aktiv) assert.equal(zustand.grund, 'abgeschaltet')
  })

  test('nur true und 1 schalten ein', () => {
    assert.equal(modellZustand(umgebung({ JETNITY_MODELL_AKTIV: 'true' })).aktiv, true)
    assert.equal(modellZustand(umgebung({ JETNITY_MODELL_AKTIV: '1' })).aktiv, true)
  })

  test('alles andere lässt zu', () => {
    // Der Fall, der zählt: Jemand setzt die Variable auf „yes“, „on“ oder „ja“
    // und hält den Weg damit für offen. Er ist es nicht, und die Antwort sagt es.
    for (const wert of ['', ' ', '0', 'false', 'yes', 'on', 'ja', 'TRUE', 'True']) {
      const zustand = modellZustand(umgebung({ JETNITY_MODELL_AKTIV: wert }))

      assert.equal(zustand.aktiv, false, `„${wert}" darf nicht einschalten`)
      if (!zustand.aktiv) assert.equal(zustand.grund, 'abgeschaltet')
    }
  })
})

describe('Ohne Schlüssel läuft kein Modell', () => {
  test('ein fehlender Schlüssel ist ein eigener Grund', () => {
    // Nicht derselbe wie „abgeschaltet“: Der Unterschied entscheidet, ob jemand
    // den Kill Switch sucht oder das Secret.
    const zustand = modellZustand(umgebung({ OPENAI_API_KEY: undefined }))

    assert.equal(zustand.aktiv, false)
    if (!zustand.aktiv) assert.equal(zustand.grund, 'kein-schluessel')
  })

  test('ein Schlüssel aus Leerzeichen ist keiner', () => {
    const zustand = modellZustand(umgebung({ OPENAI_API_KEY: '   ' }))

    assert.equal(zustand.aktiv, false)
    if (!zustand.aktiv) assert.equal(zustand.grund, 'kein-schluessel')
  })

  test('der Schlüssel steht in keiner Rückgabe', () => {
    // Er wird nur auf Anwesenheit geprüft. Stünde er im Zustand, könnte er in
    // einem Protokoll oder in einer Fehlermeldung landen.
    const zustand = modellZustand(umgebung({ OPENAI_API_KEY: 'sk-geheim-42' }))

    assert.doesNotMatch(JSON.stringify(zustand), /sk-geheim-42/)
  })
})

describe('Die Modellwahl', () => {
  test('ohne Angabe gilt die Vorgabe', () => {
    const zustand = modellZustand(umgebung())

    assert.equal(zustand.aktiv, true)
    if (zustand.aktiv) {
      assert.equal(zustand.modell, MODELL_VORGABE)
      assert.equal(zustand.aufwand, AUFWAND_VORGABE)
    }
  })

  test('jedes Modell mit bekanntem Preis ist wählbar', () => {
    for (const modell of MODELLE) {
      const zustand = modellZustand(umgebung({ JETNITY_MODELL_NAME: modell }))

      assert.equal(zustand.aktiv, true, modell)
      if (zustand.aktiv) assert.equal(zustand.modell, modell)
    }
  })

  test('ein unbekanntes Modell schliesst den Weg', () => {
    // Ohne Preis gibt es keinen Kostendeckel. Ein Tippfehler in dieser Variablen
    // darf nicht dazu führen, dass ungezählt Geld ausgegeben wird – und auch
    // nicht dazu, dass stillschweigend die Vorgabe läuft: Wer ein Modell nennt,
    // erwartet dieses.
    for (const wert of ['gpt-4o', 'gpt-5.6-mond', 'gpt-5.6-terra-preview', 'terra']) {
      const zustand = modellZustand(umgebung({ JETNITY_MODELL_NAME: wert }))

      assert.equal(zustand.aktiv, false, wert)
      if (!zustand.aktiv) assert.equal(zustand.grund, 'unbekanntes-modell')
    }
  })

  test('jeder zugelassene Denkaufwand ist wählbar', () => {
    for (const aufwand of DENKAUFWAENDE) {
      const zustand = modellZustand(umgebung({ JETNITY_MODELL_AUFWAND: aufwand }))

      assert.equal(zustand.aktiv, true, aufwand)
      if (zustand.aktiv) assert.equal(zustand.aufwand, aufwand)
    }
  })

  test('hoher Denkaufwand ist nicht zugelassen', () => {
    // `max_output_tokens` begrenzt die Ausgabe einschliesslich der Denk-Tokens.
    // Ein Aufruf, der sein ganzes Budget im Denken verbraucht, endet als
    // `incomplete` – bezahlt und ohne Vorschlag.
    for (const wert of ['high', 'xhigh', 'max']) {
      const zustand = modellZustand(umgebung({ JETNITY_MODELL_AUFWAND: wert }))

      assert.equal(zustand.aktiv, false, wert)
      if (!zustand.aktiv) assert.equal(zustand.grund, 'unbekanntes-modell')
    }
  })
})

describe('Die Grenzen sind in sich stimmig', () => {
  test('Terra und Luna enden nach 90 Sekunden, Sol nach 120', () => {
    // Die Seite muss Sol plus einen Terra-Fallback aushalten. Ein Timeout über
    // maxDuration wäre wirkungslos; eines darunter lässt den Fallback zu.
    assert.equal(MODELL_GRENZEN.timeoutMs, 90_000)
    assert.equal(MODELL_GRENZEN.timeoutMsSol, 120_000)
    assert.equal(timeoutMsFuer('gpt-5.6-terra'), 90_000)
    assert.equal(timeoutMsFuer('gpt-5.6-luna'), 90_000)
    assert.equal(timeoutMsFuer('gpt-5.6-sol'), 120_000)
    assert.equal(SEITEN_DAUER_S, 300)
    assert.ok(
      MODELL_GRENZEN.timeoutMsSol + MODELL_GRENZEN.timeoutMs < SEITEN_DAUER_S * 1000,
      'sonst stirbt der Terra-Fallback mit dem Sol-Timeout',
    )
    // Next.js akzeptiert bei maxDuration nur ein Literal. Die Zahl muss
    // trotzdem dieselbe sein wie `SEITEN_DAUER_S`.
    const seite = readFileSync(join(process.cwd(), 'app/(public)/planen/page.tsx'), 'utf8')
    assert.match(seite, new RegExp(`export const maxDuration = ${SEITEN_DAUER_S}\\b`))

    const reise = readFileSync(join(process.cwd(), 'app/(public)/reisen/[tripId]/page.tsx'), 'utf8')
    assert.match(reise, new RegExp(`export const maxDuration = ${SEITEN_DAUER_S}\\b`))
  })

  test('die Eingabeschätzung deckt die längste erlaubte Beschreibung', () => {
    // Die Reservierung rechnet mit `eingabeTokensSchaetzung`. Läge sie unter dem,
    // was Systemregeln plus längster Freitext ergeben, wäre der schlechteste Fall
    // unterschätzt. Grobe Rechnung: vier Zeichen je Token.
    const freitextTokens = MODELL_GRENZEN.eingabeZeichen / 4

    assert.ok(
      MODELL_GRENZEN.eingabeTokensSchaetzung > freitextTokens,
      'die Schätzung muss über dem Freitext liegen – die Systemregeln kommen dazu',
    )
  })

  test('die Kennungsgrenzen liegen unter den Tagesgrenzen', () => {
    // Sonst wäre eine einzelne Kennung nie die Schranke, und die Aufgabe der
    // Stufen wäre nur die letzte.
    assert.ok(MODELL_GRENZEN.jeKennungStunde <= MODELL_GRENZEN.jeKennungTag)
    assert.ok(MODELL_GRENZEN.jeKennungTag <= MODELL_GRENZEN.gaesteTag)
    assert.ok(MODELL_GRENZEN.gaesteTag < MODELL_GRENZEN.gesamtTag)
  })

  test('das Gastkontingent ist kleiner als das gesamte', () => {
    // Eine Gastkennung ist ein Cookie und damit wechselbar. Dass Gäste sich einen
    // kleineren Topf teilen, ist die Antwort darauf: Rotierende Kennungen können
    // das Kontingent der angemeldeten Konten nicht aufbrauchen (ADR-0052).
    assert.ok(MODELL_GRENZEN.gaesteTag < MODELL_GRENZEN.gesamtTag)
  })
})

describe('Die Ergebnisklassen', () => {
  test('erfolg ist eine davon, und die übrigen sind Fehler', () => {
    assert.ok(ERGEBNISKLASSEN.includes('erfolg'))
    assert.equal(new Set(ERGEBNISKLASSEN).size, ERGEBNISKLASSEN.length)
  })

  test('reserviert ist keine – das ist der Zustand vor dem Abschluss', () => {
    // `public.model_usage.ergebnis` kennt `reserviert` zusätzlich. Stünde es auch
    // hier, liesse sich eine Zeile mit ihrem Anfangszustand „abschliessen“.
    assert.equal((ERGEBNISKLASSEN as readonly string[]).includes('reserviert'), false)
  })
})
