// lib/auth/oeffentliche-navigation.test.ts
//
// Die Leiste soll über die Sitzung nur sagen, was stimmt – und einen Ausweg
// anbieten, der nicht versehentlich benutzt wird.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  HAUPTNAVIGATION,
  sitzungseintraege,
  standAusSitzung,
  type Navigationseintrag,
} from '@/lib/auth/oeffentliche-navigation'

const beschriftungen = (eintraege: Navigationseintrag[]) => eintraege.map((e) => e.label)

describe('Ein Gast', () => {
  test('bekommt Anmelden angeboten', () => {
    assert.deepEqual(beschriftungen(sitzungseintraege('gast')), ['Anmelden'])
  })

  test('bekommt kein Abmelden und kein Konto angeboten', () => {
    // Ein Ausweg aus einer Sitzung, die es nicht gibt, wäre eine Sackgasse.
    assert.ok(!beschriftungen(sitzungseintraege('gast')).includes('Abmelden'))
    assert.ok(!beschriftungen(sitzungseintraege('gast')).includes('Konto'))
  })

  test('erreicht Anmelden als Ziel', () => {
    const [eintrag] = sitzungseintraege('gast')
    assert.equal(eintrag.art, 'link')
    assert.equal(eintrag.art === 'link' ? eintrag.href : null, '/login')
  })
})

describe('Ein angemeldetes Konto', () => {
  test('bekommt Konto und Abmelden angeboten', () => {
    assert.deepEqual(beschriftungen(sitzungseintraege('konto')), ['Konto', 'Abmelden'])
  })

  test('erreicht das Konto als Ziel', () => {
    const konto = sitzungseintraege('konto').find((eintrag) => eintrag.label === 'Konto')
    assert.equal(konto?.art, 'link')
    assert.equal(konto?.art === 'link' ? konto.href : null, '/account')
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
    assert.ok(!beschriftungen(sitzungseintraege('unbekannt')).includes('Konto'))
  })
})

describe('Nach einem Abmelden', () => {
  test('zeigt die Leiste wieder Anmelden, wenn keine Sitzung mehr vorliegt', () => {
    // `signOutAction()` löscht die Cookies und leitet weiter. Die Leiste liegt im
    // Layout und wird dabei nicht neu aufgebaut – ohne erneutes Lesen stünde dort
    // weiter „Abmelden“.
    const stand = standAusSitzung(false)
    assert.equal(stand, 'gast')
    assert.deepEqual(beschriftungen(sitzungseintraege(stand)), ['Anmelden'])
  })

  test('bleibt Abmelden stehen, wenn die Sitzung noch offen ist', () => {
    // Der gefährliche Fall und der Grund, weshalb der Stand aus der Sitzung
    // gelesen und nicht aus dem Klick geschlossen wird: Ein „Anmelden“ nach einem
    // gescheiterten Abmelden sagt, die Sitzung sei beendet, während sie offen ist.
    const stand = standAusSitzung(true)
    assert.equal(stand, 'konto')
    assert.deepEqual(beschriftungen(sitzungseintraege(stand)), ['Konto', 'Abmelden'])
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
