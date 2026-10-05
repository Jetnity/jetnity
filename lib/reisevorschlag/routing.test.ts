import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { REISEIDEEN } from '@/lib/reisevorschlag/fixtures/reiseideen'
import { SOL_SCHWELLE, modellFuerReisevorschlag, planungspfad } from '@/lib/reisevorschlag/routing'

describe('Das Routing für eine komplette Reiseplanung', () => {
  test('einfache Fixtures gehen an Terra', () => {
    const einfach = [
      REISEIDEEN[0].text, // Thailand
      REISEIDEEN[4].text, // Wien
      REISEIDEEN[5].text, // Südtirol
      REISEIDEEN[6].text, // unbestimmt
      REISEIDEEN[2].text, // Japan, ein Land
    ]
    for (const text of einfach) {
      const wahl = planungspfad(text)
      assert.equal(wahl.pfad, 'terra', text)
      assert.equal(wahl.modell, 'gpt-5.6-terra')
    }
  })

  test('mehrere Ziele, Inseln, Roadtrip und Widerspruch gehen an Sol', () => {
    const komplex = [
      REISEIDEEN[1].text, // Portugal Lissabon Porto Algarve
      REISEIDEEN[7].text, // Rom widersprüchlich
      '10 Tage Kykladen ab Athen: Naxos, Santorin, Milos, zu zweit, mit Fähren.',
      'Zwei Wochen Vietnam von Hanoi nach Saigon, Kultur und Entspannung, nicht zu viele Ortswechsel.',
      '7 Tage Kalifornien: Los Angeles, Yosemite und San Francisco, Roadtrip.',
    ]
    for (const text of komplex) {
      const wahl = planungspfad(text)
      assert.equal(wahl.pfad, 'sol', text)
      assert.equal(wahl.modell, 'gpt-5.6-sol')
      assert.ok(wahl.gruende.length > 0, text)
    }
  })

  test('Luna wird für eine komplette Reise nie automatisch gewählt', () => {
    for (const idee of REISEIDEEN.filter((eintrag) => eintrag.erwartet === 'angenommen')) {
      assert.notEqual(planungspfad(idee.text).modell, 'gpt-5.6-luna', idee.name)
    }
  })

  test('ein gesetzter Name sticht den Pfad', () => {
    assert.equal(
      modellFuerReisevorschlag(REISEIDEEN[1].text, 'gpt-5.6-terra'),
      'gpt-5.6-terra',
    )
    assert.equal(modellFuerReisevorschlag(REISEIDEEN[0].text, 'gpt-5.6-sol'), 'gpt-5.6-sol')
    assert.equal(modellFuerReisevorschlag(REISEIDEEN[0].text, 'gpt-5.6-luna'), 'gpt-5.6-luna')
  })

  test('ein unbekannter Stift wird ignoriert', () => {
    assert.equal(modellFuerReisevorschlag(REISEIDEEN[0].text, 'gpt-4o'), 'gpt-5.6-terra')
  })

  test('ein einzelnes starkes Signal erreicht die Schwelle', () => {
    assert.equal(SOL_SCHWELLE, 2)
    assert.equal(planungspfad('Inselhopping auf den Kykladen mit Fähren.').pfad, 'sol')
  })
})
