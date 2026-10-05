import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { AdminDenial } from '@/lib/auth/admin-access'
import { reachesDatabase } from '@/lib/auth/admin-access'
import type { ProviderOpsBoardBericht, ProviderOpsBoardItem } from '@/lib/admin/provider-ops-board/typen'
import { ladeModelUsageBericht, MODEL_USAGE_ACCESS_CAPABILITY, MODEL_USAGE_ACCESS_SURFACE } from './model-usage-laden'

const JETZT = Date.parse('2026-09-22T12:00:00.000Z')
const DENIALS: readonly AdminDenial[] = [
  'unauthenticated',
  'forbidden',
  'aal2-required',
  'lookup-failed',
  'aal-lookup-failed',
]

function modelUsageItem(status: ProviderOpsBoardItem['status'] = 'empty'): ProviderOpsBoardItem {
  return {
    id: 'model-usage',
    name: 'Modellnutzung',
    status,
    source: 'public.model_usage',
    checkedAt: new Date(JETZT).toISOString(),
    freshness: { state: 'fresh', ageMs: 0, ttlMs: 120_000 },
    summary: 'Synthetisch.',
    proves: 'Nur den Teststand.',
    doesNotProve: 'Produktion.',
  }
}

function board(): ProviderOpsBoardBericht {
  return {
    checkedAt: new Date(JETZT).toISOString(),
    writeActions: [],
    items: [modelUsageItem('available')],
  }
}

describe('Model-Usage-Loader (synthetic spies)', () => {
  test('T-gate-before-load: betrieb-lesen+surface vor dem Board-Loader; Denial = 0 Loads', async () => {
    const aufrufe: string[] = []
    let loads = 0
    const bericht = await ladeModelUsageBericht({
      evaluateAccess: async () => {
        aufrufe.push('evaluate')
        return { allowed: false, denial: 'forbidden' }
      },
      ladeBoard: async () => {
        aufrufe.push('load')
        loads += 1
        return board()
      },
      nowMs: () => JETZT,
    })
    assert.deepEqual(aufrufe, ['evaluate'])
    assert.equal(loads, 0)
    assert.equal(bericht.observationScope, 'none')
    assert.equal(bericht.insights[0]?.observed, 'access_denied')
    assert.equal(bericht.insights[0]?.next, null)
    const quelle = readFileSync(join(process.cwd(), 'lib/admin/analyst/model-usage-laden.ts'), 'utf8')
    assert.match(quelle, /capability: MODEL_USAGE_ACCESS_CAPABILITY/)
    assert.match(quelle, /surface: MODEL_USAGE_ACCESS_SURFACE/)
    assert.equal(MODEL_USAGE_ACCESS_CAPABILITY, 'betrieb-lesen')
    assert.equal(MODEL_USAGE_ACCESS_SURFACE, 'admin-home-model-usage')
    const ui = readFileSync(join(process.cwd(), 'components/admin/home/AdminModellnutzungHinweis.tsx'), 'utf8')
    assert.match(ui, /ladeModelUsageBericht/)
    const seite = readFileSync(join(process.cwd(), 'app/(admin)/admin/page.tsx'), 'utf8')
    assert.match(seite, /AdminModellnutzungHinweis/)
    assert.match(seite, /AdminLagehinweise/)
  })

  test('T-five-denials: jede AdminDenial ruft den Board-Loader nicht und liefert exakte Denial', async () => {
    let loads = 0
    const ladeBoard = async () => {
      loads += 1
      return board()
    }
    for (const denial of DENIALS) {
      const bericht = await ladeModelUsageBericht({
        evaluateAccess: async () => ({ allowed: false, denial }),
        ladeBoard,
        nowMs: () => JETZT,
      })
      assert.equal(loads, 0, denial)
      assert.equal(bericht.access.status, 'denied')
      if (bericht.access.status === 'denied') assert.equal(bericht.access.denial, denial)
      assert.equal(bericht.sourceCheckedAt, null)
      assert.equal(bericht.observationScope, 'none')
      assert.equal(bericht.insights[0]?.next, null)
      assert.equal(bericht.insights[0]?.checkedAt, null)
      assert.deepEqual(bericht.coverage, {
        evidenced: [],
        notConfigured: [],
        unknown: [],
        failed: [],
        notAttributed: [],
      })
      assert.doesNotMatch(JSON.stringify(bericht), /available|empty|unavailable/)
    }
  })

  test('T-break-glass-zero-load: reachesDatabase false, kein Cache-Fakt, kein Hop', async () => {
    let loads = 0
    const zugang = { allowed: true as const, grant: 'break-glass' as const, role: null }
    assert.equal(reachesDatabase(zugang), false)
    const bericht = await ladeModelUsageBericht({
      evaluateAccess: async () => zugang,
      ladeBoard: async () => {
        loads += 1
        return board()
      },
      nowMs: () => JETZT,
    })
    assert.equal(loads, 0)
    assert.equal(bericht.access.status, 'allowed')
    if (bericht.access.status === 'allowed') assert.equal(bericht.access.grant, 'break-glass')
    assert.equal(bericht.observationScope, 'none')
    assert.equal(bericht.insights[0]?.attribution, 'not_attributed')
    assert.equal(bericht.insights[0]?.next, null)
    assert.equal(bericht.insights[0]?.checkedAt, null)
    assert.deepEqual(bericht.coverage.notAttributed, ['model-usage'])
    assert.equal(bericht.coverage.evidenced.length, 0)
    assert.doesNotMatch(JSON.stringify(bericht), /"observed":"available"|"observed":"empty"|"observed":"unavailable"/)
  })

  test('T-role-then-break-glass-then-denied: Sequenz bleibt isoliert, Loader nur einmal', async () => {
    let loads = 0
    const ladeBoard = async () => {
      loads += 1
      return board()
    }
    const rolle = await ladeModelUsageBericht({
      evaluateAccess: async () => ({ allowed: true, grant: 'role', role: 'operator' }),
      ladeBoard,
      nowMs: () => JETZT,
    })
    assert.equal(loads, 1)
    assert.equal(rolle.insights[0]?.observed, 'available')
    assert.equal(rolle.observationScope, 'process-recent')

    const glas = await ladeModelUsageBericht({
      evaluateAccess: async () => ({ allowed: true, grant: 'break-glass', role: null }),
      ladeBoard,
      nowMs: () => JETZT,
    })
    assert.equal(loads, 1)
    assert.equal(glas.insights[0]?.attribution, 'not_attributed')
    assert.notEqual(glas.insights[0]?.observed, 'available')
    assert.equal(glas.sourceCheckedAt, null)

    const gesperrt = await ladeModelUsageBericht({
      evaluateAccess: async () => ({ allowed: false, denial: 'forbidden' }),
      ladeBoard,
      nowMs: () => JETZT,
    })
    assert.equal(loads, 1)
    assert.equal(gesperrt.access.status, 'denied')
    if (gesperrt.access.status === 'denied') assert.equal(gesperrt.access.denial, 'forbidden')
    assert.equal(gesperrt.insights[0]?.next, null)
    assert.notEqual(gesperrt.insights[0]?.id, rolle.insights[0]?.id)
  })

  test('erlaubter Rollenpfad setzt process-recent nach dem Gate und nutzt die Quelle', async () => {
    let loads = 0
    const bericht = await ladeModelUsageBericht({
      evaluateAccess: async () => ({ allowed: true, grant: 'role', role: 'moderator' }),
      ladeBoard: async () => {
        loads += 1
        return board()
      },
      nowMs: () => JETZT,
    })
    assert.equal(loads, 1)
    assert.equal(bericht.observationScope, 'process-recent')
    assert.equal(bericht.modelExplanation.enabled, false)
    assert.deepEqual(bericht.writeActions, [])
    assert.equal(bericht.insights[0]?.next?.href, '/admin/provider-ops')
  })

  test('Loader-Throw ist source_failed, nicht empty', async () => {
    const bericht = await ladeModelUsageBericht({
      evaluateAccess: async () => ({ allowed: true, grant: 'role', role: 'operator' }),
      ladeBoard: async () => {
        throw new Error('synthetic timeout RAW detail admin@jetnity.test')
      },
      nowMs: () => JETZT,
    })
    assert.equal(bericht.insights[0]?.observed, 'source_failed')
    assert.notEqual(bericht.insights[0]?.observed, 'empty')
    assert.equal(bericht.sourceCheckedAt, null)
    assert.doesNotMatch(JSON.stringify(bericht), /synthetic timeout|admin@jetnity\.test|RAW detail/)
  })
})
