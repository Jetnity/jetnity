import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { namensArt, namensRangMitWortanfang } from '@/lib/suche/relevanz'

describe('Namensrelevanz', () => {
  test('exakter Name steht über Präfix und späterem Wort', () => {
    assert.equal(namensArt('Peru', 'Peru'), 'exact')
    assert.equal(namensArt('Zürich', 'Zurich'), 'exact')
    assert.equal(namensArt('Zürich Airport', 'Zürich'), 'qualified')
    assert.equal(namensArt('Zürich Kreis 1', 'Zürich'), 'admin')
    assert.equal(namensArt('Lake Zurich', 'Zurich'), 'later')
    assert.ok(namensRangMitWortanfang('Peru', 'Peru') > namensRangMitWortanfang('Zürich Airport', 'Zürich'))
    assert.ok(namensRangMitWortanfang('Zürich', 'Zur') > namensRangMitWortanfang('Lake Zurich', 'Zur'))
  })

  test('gleiche Regeln gelten weltweit, nicht nur für einzelne Beispiele', () => {
    assert.equal(namensArt('France', 'France'), 'exact')
    assert.equal(namensArt('Paris 15th Arrondissement', 'Paris'), 'admin')
    assert.equal(namensArt('Lake Como', 'Como'), 'later')
    assert.equal(namensArt('Tokyo Airport', 'Tokyo'), 'qualified')
  })
})
