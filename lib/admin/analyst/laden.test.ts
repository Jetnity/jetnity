import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  bewerteApp,
  bewerteSupabaseAppZugriff,
  githubNichtKonfiguriert,
  infomaniakNichtKonfiguriert,
  vercelNichtKonfiguriert,
} from '@/lib/admin/system-health/bewertung'
import type { SystemHealthBericht } from '@/lib/admin/system-health/typen'
import { ANALYST_ACCESS_CAPABILITY, ANALYST_ACCESS_SURFACE, ladeAnalystBericht } from './laden'

const JETZT = Date.parse('2026-09-21T12:00:00.000Z')

function synthetisch(): SystemHealthBericht {
  return {
    checkedAt: new Date(JETZT).toISOString(),
    writeActions: [],
    items: [
      bewerteApp({ vercelEnv: 'preview', commitSha: 'aaa', deploymentId: 'dpl', region: 'fra1' }, JETZT),
      vercelNichtKonfiguriert(JETZT),
      bewerteSupabaseAppZugriff({ configured: true, ping: { ok: true }, nowMs: JETZT }),
      githubNichtKonfiguriert(JETZT),
      infomaniakNichtKonfiguriert(JETZT),
    ],
  }
}

describe('Analyst-Loader (synthetic spies)', () => {
  test('T-gate-before-load: evaluate mit betrieb-lesen vor dem Loader; Denial = 0 Loads', async () => {
    const aufrufe: string[] = []
    let loads = 0
    const bericht = await ladeAnalystBericht({
      evaluateAccess: async () => {
        aufrufe.push('evaluate')
        return { allowed: false, denial: 'forbidden' }
      },
      ladeBericht: async () => {
        aufrufe.push('load')
        loads += 1
        return synthetisch()
      },
      nowMs: () => JETZT,
    })
    assert.deepEqual(aufrufe, ['evaluate'])
    assert.equal(loads, 0)
    assert.equal(bericht.observationScope, 'none')
    assert.equal(bericht.insights[0]?.observed, 'access_denied')
    const quelle = readFileSync(join(process.cwd(), 'lib/admin/analyst/laden.ts'), 'utf8')
    assert.match(quelle, /capability: ANALYST_ACCESS_CAPABILITY/)
    assert.match(quelle, /surface: ANALYST_ACCESS_SURFACE/)
    assert.equal(ANALYST_ACCESS_CAPABILITY, 'betrieb-lesen')
    assert.equal(ANALYST_ACCESS_SURFACE, 'admin-home-analyst')
    const ui = readFileSync(join(process.cwd(), 'components/admin/home/AdminLagehinweise.tsx'), 'utf8')
    assert.match(ui, /ladeAnalystBericht/)
  })

  test('T-allowed-to-denied: spätere Denials rufen den Loader nicht', async () => {
    let loads = 0
    const ladeBericht = async () => {
      loads += 1
      return synthetisch()
    }
    const erlaubt = await ladeAnalystBericht({
      evaluateAccess: async () => ({ allowed: true, grant: 'role', role: 'operator' }),
      ladeBericht,
      nowMs: () => JETZT,
    })
    assert.equal(erlaubt.access.status, 'allowed')
    assert.equal(loads, 1)

    for (const denial of ['forbidden', 'lookup-failed', 'aal-lookup-failed'] as const) {
      const gesperrt = await ladeAnalystBericht({
        evaluateAccess: async () => ({ allowed: false, denial }),
        ladeBericht,
        nowMs: () => JETZT,
      })
      assert.equal(loads, 1)
      assert.equal(gesperrt.observationScope, 'none')
      assert.equal(gesperrt.access.status, 'denied')
      if (gesperrt.access.status === 'denied') assert.equal(gesperrt.access.denial, denial)
      assert.equal(gesperrt.insights[0]?.next, null)
      assert.equal(
        gesperrt.insights.some((insight) => insight.observed === 'healthy' && insight.materiality === 'none'),
        false,
      )
    }
  })

  test('erlaubter Pfad setzt process-recent nach dem Gate', async () => {
    const bericht = await ladeAnalystBericht({
      evaluateAccess: async () => ({ allowed: true, grant: 'role', role: 'moderator' }),
      ladeBericht: async () => synthetisch(),
      nowMs: () => JETZT,
    })
    assert.equal(bericht.observationScope, 'process-recent')
    assert.equal(bericht.modelExplanation.enabled, false)
    assert.deepEqual(bericht.writeActions, [])
  })
})
