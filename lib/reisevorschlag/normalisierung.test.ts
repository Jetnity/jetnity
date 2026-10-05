// lib/reisevorschlag/normalisierung.test.ts
//
// „Keine erfundenen Live-Angebote“ ist strukturell schon beantwortet: Das
// Vorschlagsschema kennt kein Preisfeld, und `additionalProperties: false` macht
// eines unaussprechbar. Bleibt der Weg über den Freitext – ein Titel „Flug
// Zürich–Bangkok für CHF 412“ ist formgerecht und trotzdem genau die Behauptung,
// die Jetnity in dieser Phase nicht aufstellen darf.
//
// Diese Funktion schliesst diesen Weg, und dieser Test misst, wie weit sie
// reicht. Er prüft beide Richtungen, und die zweite ist die wichtigere: Eine
// Regel, die jede Zahl entfernt, macht aus „Markt mit 100 Ständen“ Kauderwelsch
// und wäre ein schlechterer Zustand als der, den sie verhindert.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  ohnePreisangabe,
  ohneSteuerzeichen,
  traegtPreisangabe,
} from '@/lib/reisevorschlag/normalisierung'

describe('Preisangaben verschwinden', () => {
  const faelle: [string, string][] = [
    ['Flug Zürich – Bangkok für CHF 412', 'Flug Zürich – Bangkok'],
    ['Thailand ab CHF 1’890 pro Person', 'Thailand pro Person'],
    ['Transfer (CHF 30)', 'Transfer'],
    ['Abendessen – EUR 40', 'Abendessen'],
    ['Hotel 89 EUR/Nacht', 'Hotel Nacht'],
    ['Eintritt ca. 25 Euro', 'Eintritt'],
    ['Zimmer ab rund 1200 Baht', 'Zimmer'],
    ['Tour für $50', 'Tour'],
    ['Ticket 12,50 €', 'Ticket'],
    ['Fähre ≈ THB 300', 'Fähre'],
    ['Budget etwa 3’000 Franken', 'Budget'],
    ['Menü 1.500 ¥', 'Menü'],
    ['Bootstour ab 45.- Fr.', 'Bootstour'],
  ]

  for (const [vorher, nachher] of faelle) {
    test(`„${vorher}"`, () => {
      assert.equal(ohnePreisangabe(vorher), nachher)
    })
  }

  test('nach dem Entfernen bleibt keine Preisangabe stehen', () => {
    // Die wichtigere Aussage: Nicht nur der Wortlaut stimmt, es ist auch nichts
    // übrig, was die Erkennung noch als Preis liest.
    for (const [vorher] of faelle) {
      assert.equal(
        traegtPreisangabe(ohnePreisangabe(vorher)),
        false,
        `„${vorher}" trägt nach der Bereinigung noch eine Preisangabe`,
      )
    }
  })

  test('mehrere Angaben in einem Satz', () => {
    assert.equal(
      ohnePreisangabe('Flug CHF 412, Hotel EUR 89 und Transfer für 30 Franken'),
      'Flug, Hotel und Transfer',
    )
  })
})

describe('Zahlen ohne Währung bleiben stehen', () => {
  const unberuehrt = [
    'Markt mit 100 Ständen',
    'Tempel aus dem 13. Jahrhundert',
    'Wanderung über 12 Kilometer',
    'Zug um 09:30',
    'Zimmer für 2 Personen',
    'Wat Pho und Wat Arun',
    'Bootsfahrt durch Thonburi',
    'Tagestour zu den Hong-Inseln',
    'Nacht in Bangkok, Riverside',
  ]

  for (const text of unberuehrt) {
    test(`„${text}"`, () => {
      assert.equal(ohnePreisangabe(text), text)
    })
  }
})

describe('Steuerzeichen und Leerraum', () => {
  test('ein Zeilenumbruch wird ein Leerzeichen', () => {
    // Titel und Notizen dieser Anwendung sind einzeilig. Ein `\n` in einem Titel
    // ist in der Oberfläche ein unsichtbares Rätsel.
    assert.equal(ohneSteuerzeichen('Tempel\nund\nMärkte'), 'Tempel und Märkte')
  })

  test('unsichtbare Zeichen verschwinden', () => {
    // Ein `\u200b` zwischen zwei Buchstaben macht aus einem Vergleich in der
    // Datenbank eine Ungleichheit, die niemand sieht.
    assert.equal(ohneSteuerzeichen('Bang\u200bkok\ufeff'), 'Bangkok')
    assert.equal(ohneSteuerzeichen('Rom\u0000\u001f'), 'Rom')
  })

  test('Ränder werden getrimmt und Leerraum vereinheitlicht', () => {
    assert.equal(ohneSteuerzeichen('   Rom    im   Juni  '), 'Rom im Juni')
    assert.equal(ohneSteuerzeichen('\t\tKrabi\r\n'), 'Krabi')
  })

  test('Umlaute werden zusammengesetzt, nicht zerlegt', () => {
    // NFC: „Zu\u0308rich" und „Zürich" sind danach dieselbe Zeichenkette. Ohne die
    // Normalisierung wäre die Länge unterschiedlich und die Grenzprüfung eine
    // andere.
    assert.equal(ohneSteuerzeichen('Zu\u0308rich'), 'Zürich')
    assert.equal(ohneSteuerzeichen('Zu\u0308rich').length, 6)
  })

  test('HTML bleibt Text', () => {
    // Nichts hier führt etwas aus, und nichts entfernt Markup. Das ist Absicht:
    // React setzt Text als Text, und ein halb entfernter Tag wäre eine neue
    // Fehlerquelle. Was der Vorschlag nicht enthalten darf, entfernt das Schema –
    // hier geht es nur um Steuerzeichen.
    assert.equal(
      ohneSteuerzeichen('<script>alert(1)</script> Barcelona'),
      '<script>alert(1)</script> Barcelona',
    )
  })
})

describe('Die Reihenfolge der beiden Schritte', () => {
  test('erst Steuerzeichen, dann Preise', () => {
    // Umgekehrt könnte ein Zeilenumbruch mitten in einer Preisangabe sie vor der
    // Erkennung verstecken: „CHF\n412" wäre ohne die Vereinheitlichung kein
    // Treffer.
    assert.equal(
      ohnePreisangabe(ohneSteuerzeichen('Flug für CHF\n412 nach Bangkok')),
      'Flug nach Bangkok',
    )
  })

  test('bleibt nach dem Entfernen nichts übrig, ist das Ergebnis leer', () => {
    // Der Fall entscheidet über `null` statt `''` in einer optionalen Notiz: ein
    // leeres Feld ist keine Notiz.
    assert.equal(ohnePreisangabe('CHF 412'), '')
    assert.equal(ohnePreisangabe('ab EUR 89'), '')
  })
})
