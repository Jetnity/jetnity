// lib/auth/oeffentliche-navigation.test.ts
//
// Die Leiste soll über die Sitzung nur sagen, was stimmt – und einen Ausweg
// anbieten, der nicht versehentlich benutzt wird.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  HAUPTNAVIGATION,
  sitzungseintraege,
  type Navigationseintrag,
} from '@/lib/auth/oeffentliche-navigation'

const beschriftungen = (eintraege: Navigationseintrag[]) => eintraege.map((e) => e.label)

describe('Ein Gast', () => {
  test('bekommt Anmelden angeboten', () => {
    assert.deepEqual(beschriftungen(sitzungseintraege('gast')), ['Anmelden'])
  })

  test('bekommt kein Abmelden angeboten', () => {
    // Ein Ausweg aus einer Sitzung, die es nicht gibt, wäre eine Sackgasse.
    assert.ok(!beschriftungen(sitzungseintraege('gast')).includes('Abmelden'))
  })

  test('erreicht Anmelden als Ziel', () => {
    const [eintrag] = sitzungseintraege('gast')
    assert.equal(eintrag.art, 'link')
    assert.equal(eintrag.art === 'link' ? eintrag.href : null, '/login')
  })
})

describe('Ein angemeldetes Konto', () => {
  test('bekommt Abmelden angeboten', () => {
    assert.deepEqual(beschriftungen(sitzungseintraege('konto')), ['Abmelden'])
  })

  test('bekommt kein Anmelden mehr angeboten', () => {
    // Der Befund, der diesen Nachtrag ausgelöst hat: Die Leiste zeigte auch mit
    // offener Sitzung „Anmelden“ – und keinen Weg heraus.
    assert.ok(!beschriftungen(sitzungseintraege('konto')).includes('Anmelden'))
  })

  test('bekommt Abmelden nie als Link', () => {
    // Next.js lädt Links voraus. Eine Adresse, die beim Aufruf abmeldet, würde
    // die Sitzung beenden, ohne dass jemand geklickt hat – deshalb ein Vorgang.
    for (const eintrag of sitzungseintraege('konto')) {
      if (eintrag.label === 'Abmelden') assert.equal(eintrag.art, 'aktion')
    }
  })
})

describe('Solange die Sitzung unbekannt ist', () => {
  test('behauptet die Leiste nichts', () => {
    // Das Layout wird statisch ausgeliefert; die Sitzung liest der Browser
    // nach. In diesem Moment ist jede der beiden Aussagen möglicherweise falsch.
    assert.deepEqual(sitzungseintraege('unbekannt'), [])
  })
})

describe('Die Ziele für alle', () => {
  test('bleiben unabhängig von der Sitzung dieselben', () => {
    // Meine Reisen gilt auch ohne Konto: Dort liegt der Gastentwurf.
    assert.deepEqual(
      HAUPTNAVIGATION.map((eintrag) => eintrag.href),
      ['/#entdecken', '/reisen', '/#pro'],
    )
  })
})
