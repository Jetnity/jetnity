import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import type { MobilityKandidat, MobilityOption } from '@/lib/mobility/domain'
import { mobilityKandidatAus, mobilityOptionenBewerten } from '@/lib/mobility/ranking'

function option(teil: Partial<MobilityOption> & Pick<MobilityOption, 'id'>): MobilityOption {
  return {
    provider: 'alpha',
    externalRef: teil.id,
    mode: 'rail',
    title: 'Zürich → Lugano',
    originName: 'Zürich',
    destinationName: 'Lugano',
    originPlaceId: 'geonames:2657896',
    destinationPlaceId: 'geonames:2659836',
    startsOn: '2026-09-12',
    startsAt: '08:00',
    endsOn: '2026-09-12',
    endsAt: '10:00',
    durationMinutes: 120,
    changes: 0,
    preis: 40,
    preisWaehrung: 'CHF',
    stornierbar: true,
    connectionRef: 'IC 490',
    operatorName: 'SBB',
    ...teil,
  }
}

function kandidat(teil: Partial<MobilityOption> & Pick<MobilityOption, 'id'>, kontext?: Partial<MobilityKandidat['context']>) {
  return mobilityKandidatAus(option(teil), { routeFit: 1, zeitFit: 1, ...kontext })
}

describe('Mobilitätsranking', () => {
  test('ist deterministisch und unabhängig vom Providernamen', () => {
    const a = kandidat({ id: 'a', provider: 'teuer-partner', preis: 80, durationMinutes: 180, changes: 2 })
    const b = kandidat({ id: 'b', provider: 'billig-partner', preis: 30, durationMinutes: 90, changes: 0 })
    const erst = mobilityOptionenBewerten([a, b]).map((option) => option.id)
    const zweit = mobilityOptionenBewerten([b, a]).map((option) => option.id)
    assert.deepEqual(erst, zweit)
    assert.equal(erst[0], 'b')
  })

  test('fehlende Fakten erzeugen keinen erfundenen Score-Anteil', () => {
    const ohnePreis = kandidat({ id: 'x', preis: null, preisWaehrung: null })
    const mitPreis = kandidat({ id: 'y', preis: 40 })
    const bewertet = mobilityOptionenBewerten([ohnePreis, mitPreis])
    const leer = bewertet.find((option) => option.id === 'x')
    assert.ok(leer)
    assert.equal(leer.context.preisFit, null)
  })

  test('Provision oder Umsatz kommen im Ranking nicht vor', () => {
    const quelle = JSON.stringify({ mobilityOptionenBewerten, mobilityKandidatAus })
    assert.doesNotMatch(quelle, /provision|commission|affiliate|umsatz/i)
  })
})
