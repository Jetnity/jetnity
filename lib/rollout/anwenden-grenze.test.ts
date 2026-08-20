import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  PHASE31_VERSIONEN,
  PRODUCTION_AUSGANG_VERSION,
  PRODUCTION_GRENZE_VERSION,
  produktionsPlan,
  type MigrationDatei,
} from '@/lib/rollout/anwenden-grenze'
import { PHASE31_MIGRATIONEN } from '@/lib/rollout/befund'

const vier: MigrationDatei[] = PHASE31_MIGRATIONEN.map((datei) => {
  const [version, ...rest] = datei.replace(/\.sql$/, '').split('_')
  return { datei, version, name: rest.join('_') }
})

const spaeter: MigrationDatei = {
  datei: '20260820140000_hotels.sql',
  version: '20260820140000',
  name: 'hotels',
}

describe('Production-Migrationsgrenze', () => {
  test('Phase-3.1-Versionen enden bei 20260820130000', () => {
    assert.deepEqual(PHASE31_VERSIONEN, [
      '20260820100000',
      '20260820110000',
      '20260820120000',
      '20260820130000',
    ])
    assert.equal(PRODUCTION_AUSGANG_VERSION, '20260820080000')
    assert.equal(PRODUCTION_GRENZE_VERSION, '20260820130000')
  })

  test('vom Ausgang 20260820080000 öffnet genau die vier Playbook-Migrationen', () => {
    const plan = produktionsPlan({
      angewendet: [PRODUCTION_AUSGANG_VERSION],
      alle: [...vier, spaeter],
      bis: PRODUCTION_GRENZE_VERSION,
    })
    assert.deepEqual(
      plan.offen.map((datei) => datei.version),
      PHASE31_VERSIONEN,
    )
    assert.deepEqual(
      plan.spaeterAusgeschlossen.map((datei) => datei.version),
      ['20260820140000'],
    )
  })

  test('ein Teilstand setzt nur die fehlenden der vier auf', () => {
    const plan = produktionsPlan({
      angewendet: [PRODUCTION_AUSGANG_VERSION, '20260820100000', '20260820110000'],
      alle: [...vier, spaeter],
      bis: PRODUCTION_GRENZE_VERSION,
    })
    assert.deepEqual(
      plan.offen.map((datei) => datei.version),
      ['20260820120000', '20260820130000'],
    )
  })

  test('fehlender Ausgang, Drift hinter der Grenze oder falsches --bis brechen ab', () => {
    assert.throws(
      () =>
        produktionsPlan({
          angewendet: ['20260820070000'],
          alle: vier,
          bis: PRODUCTION_GRENZE_VERSION,
        }),
      /Ausgang fehlt/,
    )
    assert.throws(
      () =>
        produktionsPlan({
          angewendet: [PRODUCTION_AUSGANG_VERSION, '20260820140000'],
          alle: [...vier, spaeter],
          bis: PRODUCTION_GRENZE_VERSION,
        }),
      /hinter der Phase-3.1-Grenze/,
    )
    assert.throws(
      () =>
        produktionsPlan({
          angewendet: [PRODUCTION_AUSGANG_VERSION],
          alle: vier,
          bis: '20260820140000',
        }),
      /--bis 20260820130000/,
    )
    assert.throws(
      () =>
        produktionsPlan({
          angewendet: [PRODUCTION_AUSGANG_VERSION, '20260820105000'],
          alle: vier,
          bis: PRODUCTION_GRENZE_VERSION,
        }),
      /Unerwartete Production-Migration/,
    )
  })
})
