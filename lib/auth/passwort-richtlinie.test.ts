// lib/auth/passwort-richtlinie.test.ts
//
// Zwei Zusagen werden hier geprüft, und beide waren vorher gebrochen.
//
// Die erste: Was die Formulare anzeigen, muss der Auth-Server auch annehmen.
// Die Seite für das neue Passwort verlangte acht Zeichen, der Server zwölf aus
// vier Gruppen. Wer der Anzeige folgte, bekam eine Ablehnung.
//
// Die zweite: Eine Ablehnung muss sagen, was los ist. Seit der Branch gegen
// HaveIBeenPwned prüft, kommt eine zweite Art von Ablehnung – das Passwort
// erfüllt die Regel, steht aber in einem Datenleck. Beide gleich zu übersetzen
// führt in eine Sackgasse: Die angezeigte Liste ist ja erfüllt.
//
// Die Meldungen in diesen Tests sind wörtlich die des Development-Branches,
// nachgemessen über die Auth-API, nicht aus der Dokumentation abgeschrieben.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  GEFORDERTE_GRUPPEN,
  PASSWORT_RICHTLINIE,
  RICHTLINIE_PUNKTE,
  RICHTLINIE_TEXT,
  erfuelltRichtlinie,
  passwortAblehnung,
  passwortStaerke,
  staerkeText,
} from '@/lib/auth/passwort-richtlinie'

/** Wörtliche Antworten des Development-Branches auf `POST /auth/v1/signup`. */
const GOTRUE = {
  zuKurz: 'Password should be at least 12 characters.',
  gruppeFehlt:
    'Password should contain at least one character of each: abcdefghijklmnopqrstuvwxyz, ' +
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ, 0123456789, !@#$%^&*()_+-=[]{};\'\\:"|<>?,./`~.',
  geleakt: 'Password is known to be weak and easy to guess, please choose a different one.',
}

describe('Was die Regel verlangt', () => {
  test('zwölf Zeichen aus vier Gruppen', () => {
    assert.equal(PASSWORT_RICHTLINIE.mindestlaenge, 12)
    assert.equal(GEFORDERTE_GRUPPEN, 4)
  })

  test('ein Passwort, das die Anzeige erfüllt, gilt als erfüllt', () => {
    assert.equal(erfuelltRichtlinie('Reiseplanung1!'), true)
  })

  test('zu kurz genügt nicht, auch mit allen Gruppen', () => {
    assert.equal(erfuelltRichtlinie('Reise1!'), false)
  })

  test('lang genug genügt nicht ohne Gruppen', () => {
    // Genau der Fall, den die alte Seite für das neue Passwort durchgelassen
    // hätte: viele Zeichen, aber nur Kleinbuchstaben.
    assert.equal(erfuelltRichtlinie('reiseplanungreise'), false)
  })

  test('jede einzelne fehlende Gruppe fällt durch', () => {
    assert.equal(erfuelltRichtlinie('reiseplanung1!'), false, 'ohne Grossbuchstabe')
    assert.equal(erfuelltRichtlinie('REISEPLANUNG1!'), false, 'ohne Kleinbuchstabe')
    assert.equal(erfuelltRichtlinie('Reiseplanung!!'), false, 'ohne Zahl')
    assert.equal(erfuelltRichtlinie('Reiseplanung12'), false, 'ohne Symbol')
  })

  test('die Regel und ihre Beschreibung stammen aus derselben Quelle', () => {
    // Sonst driftet die Liste unter dem Feld von der Prüfung darüber weg.
    assert.equal(RICHTLINIE_PUNKTE.length, PASSWORT_RICHTLINIE.gruppen.length + 1)
    assert.match(RICHTLINIE_PUNKTE[0], new RegExp(String(PASSWORT_RICHTLINIE.mindestlaenge)))
    assert.match(RICHTLINIE_TEXT, new RegExp(String(PASSWORT_RICHTLINIE.mindestlaenge)))
  })
})

describe('Der Balken', () => {
  test('leeres Feld ist null', () => {
    assert.equal(passwortStaerke(''), 0)
  })

  test('ein Passwort, das die Regel gerade erfüllt, liegt nicht am Anschlag', () => {
    // Sonst gäbe es keinen Anreiz, länger zu wählen – und „Sehr stark" stünde
    // an einem Passwort mit genau der Mindestlänge.
    const punkte = passwortStaerke('Reiseplanung1!')

    assert.ok(punkte >= 4 && punkte < 5, String(punkte))
  })

  test('Länge über sechzehn Zeichen erreicht den Anschlag', () => {
    assert.equal(passwortStaerke('Reiseplanung nach Lissabon 1!'), 5)
  })

  test('die Bewertung übersteigt fünf nie', () => {
    assert.ok(passwortStaerke('A'.repeat(200) + 'a1!') <= 5)
  })

  test('jede Bewertung hat einen Text', () => {
    for (let i = 0; i <= 5; i++) {
      assert.ok(staerkeText(i).length > 0, String(i))
    }
  })
})

describe('Warum der Server abgelehnt hat', () => {
  test('ein Datenleck wird als Datenleck benannt', () => {
    const meldung = passwortAblehnung(GOTRUE.geleakt)

    assert.match(String(meldung), /Datenleck/)
  })

  test('ein Datenleck wird nicht mit der Regel verwechselt', () => {
    // Der eigentliche Defekt: Diese Meldung landete unter „Anforderungen nicht
    // erfüllt". Sie sind aber erfüllt – das Passwort ist nur bekannt.
    assert.notEqual(passwortAblehnung(GOTRUE.geleakt), RICHTLINIE_TEXT)
  })

  test('eine zu kurze Eingabe nennt die Regel', () => {
    assert.equal(passwortAblehnung(GOTRUE.zuKurz), RICHTLINIE_TEXT)
  })

  test('eine fehlende Zeichengruppe nennt die Regel, nicht die Zeichenliste', () => {
    const meldung = String(passwortAblehnung(GOTRUE.gruppeFehlt))

    assert.equal(meldung, RICHTLINIE_TEXT)
    // Die rohe Antwort enthält die volle Liste erlaubter Sonderzeichen. Sie
    // stand so in der Oberfläche und war nicht lesbar.
    assert.ok(!meldung.includes('abcdefghijklmnopqrstuvwxyz'))
  })

  test('keine Meldung ist keine Aussage', () => {
    assert.equal(passwortAblehnung(undefined), null)
    assert.equal(passwortAblehnung(null), null)
    assert.equal(passwortAblehnung(''), null)
  })

  test('eine fremde Meldung wird nicht zum Passwortfehler umgedeutet', () => {
    // Sonst würde „E-Mail bereits registriert" als Passwortproblem angezeigt.
    assert.equal(passwortAblehnung('User already registered'), null)
    assert.equal(passwortAblehnung('Email rate limit exceeded'), null)
  })

  test('deutschsprachige Begriffe für ein Leck werden ebenfalls erkannt', () => {
    // Die Formulierung von GoTrue kann sich ändern; „leaked" und „pwned" sind
    // die Begriffe, die Supabase in Dokumentation und Advisor benutzt.
    assert.match(String(passwortAblehnung('This password is leaked')), /Datenleck/)
    assert.match(String(passwortAblehnung('password found in a data breach')), /Datenleck/)
  })
})
