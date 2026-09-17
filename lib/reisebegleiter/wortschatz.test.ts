// lib/reisebegleiter/wortschatz.test.ts
//
// Die Erlaubnisliste ist nur so gut wie zwei Eigenschaften: Sie muss den
// Register decken, den die Systemregeln verlangen, und sie darf nichts
// hereinlassen, was nicht deutsch ist.
//
// Die dritte, weniger offensichtliche Eigenschaft prüft dieser Test ebenfalls:
// Die amtlichen Begriffe **müssen** belegt sein. Wäre `Visum` unbelegt, fiele
// „Du brauchst ein Visum." schon an dieser Schranke – sicher, aber die
// inhaltliche Prüfung in `pruefung.ts` käme für diesen Bereich nie zum Zug und
// wäre stiller toter Code.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  ASSISTANT_WORTSTAEMME,
  kontextwortschatz,
  unbelegteWoerter,
} from '@/lib/reisebegleiter/wortschatz'

const LEER: ReadonlySet<string> = new Set()

function belegt(text: string, zusatz: ReadonlySet<string> = LEER): boolean {
  return unbelegteWoerter(text, zusatz).length === 0
}

describe('Die Form der Erlaubnisliste', () => {
  test('ist nicht leer und enthält keine Wiederholung', () => {
    assert.ok(ASSISTANT_WORTSTAEMME.length > 400)
    assert.equal(new Set(ASSISTANT_WORTSTAEMME).size, ASSISTANT_WORTSTAEMME.length)
  })

  test('führt nur kleingeschriebene Einzelwörter', () => {
    for (const eintrag of ASSISTANT_WORTSTAEMME) {
      assert.equal(eintrag, eintrag.toLowerCase(), `nicht kleingeschrieben: ${eintrag}`)
      assert.match(eintrag, /^\p{L}+$/u, `kein Einzelwort: ${eintrag}`)
    }
  })
})

describe('Die amtlichen Begriffe sind belegt', () => {
  // Sonst wäre die inhaltliche Prüfung für ihren Bereich unerreichbar.
  const AMTLICH = [
    'Visum',
    'Visa',
    'Transitvisum',
    'Reisegenehmigung',
    'Reisepass',
    'Pass',
    'Personalausweis',
    'Passgültigkeit',
    'Passseiten',
    'Impfung',
    'Gesundheitserklärung',
    'Attest',
    'Einreiseformular',
    'Reiseversicherung',
    'Rückflug',
    'Buchungsnachweis',
    'finanzielle Mittel',
    'Einreiseanforderung',
    'erforderlich',
    'vorgeschrieben',
  ]

  for (const begriff of AMTLICH) {
    test(`„${begriff}" ist belegt`, () => {
      assert.ok(belegt(begriff), `unbelegt: ${begriff}`)
    })
  }
})

describe('Deutsche Flexion und Komposita lösen auf', () => {
  const FORMEN = [
    'geprüft',
    'geprüfte',
    'geprüften',
    'Prüfung',
    'Prüfstand',
    'ungeprüft',
    'Reisevorbereitung',
    'Einreiseanforderungen',
    'Buchungsnachweis',
    'Staatsangehörigkeiten',
    'Passgültigkeit',
    'Zeitraum',
    'Reisedokumente',
    'ergänzen',
    'verlängern',
    'amtliche',
    'amtlichen',
  ]

  for (const form of FORMEN) {
    test(`„${form}" ist belegt`, () => assert.ok(belegt(form), `unbelegt: ${form}`))
  }

  test('Umlaut und Umschrift treffen denselben Stamm', () => {
    assert.ok(belegt('für'))
    assert.ok(belegt('fuer'))
    assert.ok(belegt('gültig'))
    assert.ok(belegt('gueltig'))
  })
})

describe('Was nicht deutsch ist, bleibt unbelegt', () => {
  const FREMD = [
    'vize',
    'gerekli',
    'için',
    'visado',
    'passaporto',
    'insurance',
    'obligatoire',
    'wizy',
    'viisumit',
    'vegabréfsáritun',
    'necesară',
  ]

  for (const wort of FREMD) {
    test(`„${wort}" ist unbelegt`, () => assert.equal(belegt(wort), false, `belegt: ${wort}`))
  }

  test('ein fremdes Wort lässt sich nicht aus deutschen Stämmen zusammensetzen', () => {
    // Jeder Teil eines Kompositums braucht mindestens vier Zeichen und einen
    // geführten Stamm. Damit fällt Silbenzerlegung als Umgehungsweg weg.
    for (const wort of ['gerekli', 'vizesi', 'pasaporte', 'ubezpieczenie'])
      assert.equal(belegt(wort), false, `belegt: ${wort}`)
  })
})

describe('Der Kontext erweitert den Wortschatz, das Modell nicht', () => {
  test('Eigennamen aus den Bezügen sind belegt', () => {
    const zusatz = kontextwortschatz(['Etappe 2 · Florenz, Italien', 'Alex'])
    assert.ok(belegt('Die Etappe Florenz passt zu Alex.', zusatz))
  })

  test('ein Eigenname ohne Kontextdeckung bleibt unbelegt', () => {
    assert.equal(belegt('Die Etappe Timbuktu passt.'), false)
  })

  test('der Kontext hilft einer fremdsprachigen Behauptung nicht', () => {
    // Der Zusatz trägt Eigennamen, keine Grammatik. „gerekli" bleibt unbelegt,
    // auch wenn „İtalya" über einen Etappennamen gedeckt wäre.
    const zusatz = kontextwortschatz(['Etappe 1 · İtalya'])
    assert.equal(belegt('İtalya için vize gerekli.', zusatz), false)
  })
})

describe('Zahlen, Daten und einzelne Buchstaben sind unbedenklich', () => {
  test('sie tragen keine Anforderung und bleiben zulässig', () => {
    assert.ok(belegt('2027-04-03 bis 2027-04-10'))
    assert.ok(belegt('drei Tage, vier Nächte, 2 Etappen'))
  })
})
