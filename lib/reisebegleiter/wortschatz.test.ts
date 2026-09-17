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

import { BEREICHE_FUER_TEST } from '@/lib/reisebegleiter/pruefung'
import { ASSISTANT_WORTSTAEMME, unbelegteWoerter } from '@/lib/reisebegleiter/wortschatz'

function belegt(text: string): boolean {
  return unbelegteWoerter(text).length === 0
}

describe('Die Form der Erlaubnisliste', () => {
  test('gewöhnliche Wörter mit amtlichem Stamm sind nur als Form zulässig', () => {
    // `passt` ist erlaubt, `Pass` nicht – der Stamm wäre ein amtliches Wort.
    assert.ok(belegt('Der Zeitraum passt zu den Etappen.'))
    assert.equal(belegt('Pass'), false)
    assert.equal(belegt('Reisepass'), false)
  })

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

describe('Kein geführtes Wort benennt eine amtliche Anforderung', () => {
  // Das ist die eigentliche Zusicherung dieses Slice, und sie wird hier gegen
  // die Bereichsmuster selbst geprüft – nicht gegen eine Liste, die daneben
  // gepflegt werden müsste. Trifft ein geführtes Wort einen Anforderungsbereich,
  // könnte Prosa wieder eine amtliche Anforderung benennen.
  test('kein Wortstamm trifft einen Anforderungsbereich', () => {
    for (const stamm of ASSISTANT_WORTSTAEMME) {
      const bereich = BEREICHE_FUER_TEST.find((eintrag) => eintrag.muster.test(stamm))
      assert.equal(bereich, undefined, `„${stamm}" trifft den Bereich ${bereich?.name ?? ''}`)
    }
  })

  test('auch kein Paar aus zwei Wortstämmen trifft einen Bereich', () => {
    // Manche Bereichsmuster brauchen zwei Wörter, etwa „freie Seiten" oder
    // „finanzielle Mittel". Geprüft wird deshalb auch die Nachbarschaft – über
    // eine Vereinigung aller Bereichsmuster, damit die halbe Million Paare in
    // einem Durchgang und nicht in sechzehn geprüft wird.
    const vereinigung = new RegExp(
      BEREICHE_FUER_TEST.map((bereich) => `(?:${bereich.muster.source})`).join('|'),
      'i',
    )

    for (const links of ASSISTANT_WORTSTAEMME) {
      for (const rechts of ASSISTANT_WORTSTAEMME) {
        const satz = `${links} ${rechts}`
        assert.equal(vereinigung.test(satz), false, `„${satz}" trifft einen Anforderungsbereich`)
      }
    }
  })

  const AMTLICH = [
    'Visum',
    'Visa',
    'Transitvisum',
    'Reisegenehmigung',
    'Reisepass',
    'Pass',
    'Personalausweis',
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
    'notwendig',
    'nötig',
    'Pflicht',
  ]

  for (const begriff of AMTLICH) {
    test(`„${begriff}" ist nicht geführt`, () => {
      assert.equal(belegt(begriff), false, `geführt: ${begriff}`)
    })
  }
})

describe('Deutsche Flexion und Komposita lösen auf', () => {
  const FORMEN = [
    'geprüft',
    'geprüfte',
    'geprüften',
    'Prüfung',
    'ungeprüft',
    'Reisevorbereitung',
    'Staatsangehörigkeiten',
    'Zeitraum',
    'Reisedokumente',
    'ergänzen',
    'verlängern',
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

describe('Keine Eingabe erweitert den Wortschatz', () => {
  test('Eigennamen sind grundsätzlich nicht geführt', () => {
    // Bis Runde 7 brachte ein Etappenname seine Wörter selbst mit. Jetzt gibt
    // es keinen eingabeabhängigen Zusatz mehr: Eigennamen stehen in den
    // Bezügen, die Jetnity anzeigt, nicht in der Prosa.
    for (const name of ['Florenz', 'Timbuktu', 'Alex'])
      assert.equal(belegt(name), false, `geführt: ${name}`)
  })

  test('einzelne Buchstaben sind nicht geführt', () => {
    // `V I S U M ist P F L I C H T.` bestand aus lauter Einzelbuchstaben.
    assert.equal(belegt('V I S U M'), false)
    assert.equal(belegt('V.I.S.U.M'), false)
    assert.equal(belegt('P F L I C H T'), false)
  })

  test('Zahlen und Daten bleiben zulässig', () => {
    assert.ok(belegt('2027-04-03 bis 2027-04-10'))
    assert.ok(belegt('drei Tage, vier Nächte, 2 Etappen'))
  })
})
