import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'

import type { AdminDecision } from '@/lib/auth/admin-access'
import { requirementsProviderAus } from '@/lib/readiness/provider'

import {
  decideOfficialTruthFactEntryAuthority,
  loadOfficialTruthFactEntryAuthority,
  type OfficialTruthFactEntryAuthorityResult,
  type OfficialTruthFactEntryDatabaseRead,
} from './official-truth-fact-entry-authority-server'

const SERVER = 'lib/readiness/official-truth-fact-entry-authority-server.ts'
const CAPABILITY = 'official-truth-freigeben'
const RPC = ['darf', 'official', 'truth', 'freigeben'].join('_')

function quelle(): string {
  return readFileSync(SERVER, 'utf8')
}

function lader(text: string): string {
  const start = text.indexOf('export async function loadOfficialTruthFactEntryAuthority')
  assert.equal(start >= 0, true)
  return text.slice(start)
}

function roleAccess(): AdminDecision {
  return { allowed: true, grant: 'role', role: 'owner' }
}

function breakGlassAccess(): AdminDecision {
  return { allowed: true, grant: 'break-glass', role: null }
}

function leser(read: OfficialTruthFactEntryDatabaseRead | Error) {
  let calls = 0
  return {
    calls: () => calls,
    read: async (): Promise<OfficialTruthFactEntryDatabaseRead> => {
      calls += 1
      if (read instanceof Error) throw read
      return read
    },
  }
}

async function entschieden(
  access: AdminDecision,
  read: OfficialTruthFactEntryDatabaseRead | Error,
): Promise<{ result: OfficialTruthFactEntryAuthorityResult; calls: number }> {
  const probe = leser(read)
  const result = await decideOfficialTruthFactEntryAuthority(access, probe.read)
  return { result, calls: probe.calls() }
}

describe('Official Truth fact-entry authority guard', () => {
  test('role-backed capability and exact database true authorize', async () => {
    const { result, calls } = await entschieden(roleAccess(), { kind: 'value', data: true })
    assert.deepEqual(result, {
      status: 'authorized',
      grant: 'role',
      capability: CAPABILITY,
    })
    assert.deepEqual(Object.keys(result).sort(), ['capability', 'grant', 'status'])
    assert.equal(calls, 1)
  })

  test('break-glass with a database-true fixture is blocked before the RPC', async () => {
    const { result, calls } = await entschieden(breakGlassAccess(), { kind: 'value', data: true })
    assert.deepEqual(result, { status: 'role_grant_required' })
    assert.equal(calls, 0)
  })

  test('break-glass that already satisfied AAL2 cannot authorize', async () => {
    const access: AdminDecision = { allowed: true, grant: 'break-glass', role: 'owner' }
    const { result, calls } = await entschieden(access, { kind: 'value', data: true })
    assert.equal(result.status, 'role_grant_required')
    assert.equal(calls, 0)
  })

  test('access denial is blocked before the RPC', async () => {
    for (const denial of ['unauthenticated', 'forbidden', 'aal2-required'] as const) {
      const { result, calls } = await entschieden(
        { allowed: false, denial },
        { kind: 'value', data: true },
      )
      assert.deepEqual(result, { status: 'access_forbidden' })
      assert.equal(calls, 0)
    }
  })

  test('access lookup and AAL lookup failure fail closed before the RPC', async () => {
    for (const denial of ['lookup-failed', 'aal-lookup-failed'] as const) {
      const { result, calls } = await entschieden(
        { allowed: false, denial },
        { kind: 'value', data: true },
      )
      assert.deepEqual(result, { status: 'access_lookup_failed' })
      assert.equal(calls, 0)
    }
  })

  test('role-backed app access and database false stay blocked', async () => {
    const { result, calls } = await entschieden(roleAccess(), { kind: 'value', data: false })
    assert.deepEqual(result, { status: 'database_capability_denied' })
    assert.equal(calls, 1)
  })

  test('missing or unapplied RPC fails closed as unavailable', async () => {
    for (const code of ['42883', 'PGRST202']) {
      const { result } = await entschieden(roleAccess(), { kind: 'error', code, status: 404 })
      assert.deepEqual(result, { status: 'database_capability_unavailable' })
    }
  })

  test('RPC permission errors are blocked', async () => {
    for (const code of ['42501', '42503', 'PGRST301', 'PGRST302']) {
      const { result } = await entschieden(roleAccess(), {
        kind: 'error',
        code,
        status: 403,
      })
      assert.deepEqual(result, { status: 'database_capability_denied' })
      assert.equal(JSON.stringify(result).includes(code), false)
    }
    const http = await entschieden(roleAccess(), { kind: 'error', code: null, status: 401 })
    assert.deepEqual(http.result, { status: 'database_capability_denied' })
  })

  test('RPC exceptions and network-like failures are blocked', async () => {
    const thrown = await entschieden(roleAccess(), new Error('connect ECONNREFUSED 10.1.1.1'))
    assert.deepEqual(thrown.result, { status: 'database_capability_failed' })
    assert.equal(JSON.stringify(thrown.result).includes('ECONNREFUSED'), false)
    assert.equal(thrown.calls, 1)
    const network = await entschieden(roleAccess(), { kind: 'error', code: null, status: 0 })
    assert.deepEqual(network.result, { status: 'database_capability_failed' })
    const other = await entschieden(roleAccess(), { kind: 'error', code: '08006', status: 500 })
    assert.deepEqual(other.result, { status: 'database_capability_failed' })
  })

  test('malformed, null and non-boolean database data are blocked', async () => {
    for (const data of [null, undefined, 'true', 1, 0, [true], { ok: true }, new Boolean(true)]) {
      const { result } = await entschieden(roleAccess(), { kind: 'value', data })
      assert.equal(result.status, 'database_capability_failed')
    }
  })

  test('exact boolean true is the only database success', async () => {
    const wahr = await entschieden(roleAccess(), { kind: 'value', data: true })
    const falsch = await entschieden(roleAccess(), { kind: 'value', data: false })
    const text = await entschieden(roleAccess(), { kind: 'value', data: 'true' })
    assert.equal(wahr.result.status, 'authorized')
    assert.equal(falsch.result.status, 'database_capability_denied')
    assert.equal(text.result.status, 'database_capability_failed')
    const mitFehler = await entschieden(roleAccess(), { kind: 'error', code: null, status: 200 })
    assert.equal(mitFehler.result.status, 'database_capability_failed')
  })

  test('the live loader has no arguments and no caller dependency injection', () => {
    assert.equal(loadOfficialTruthFactEntryAuthority.length, 0)
    const koerper = lader(quelle())
    assert.match(koerper, /export async function loadOfficialTruthFactEntryAuthority\(\)/)
    assert.doesNotMatch(koerper, /loadOfficialTruthFactEntryAuthority\(\s*[^)]/)
    assert.doesNotMatch(koerper, /options|override|abhaengigkeiten|dependencies|env\?:/i)
  })

  test('the live loader calls evaluateAdminAccess with the exact capability', () => {
    const text = quelle()
    const aufrufe = [...text.matchAll(/evaluateAdminAccess\(\{[\s\S]*?\}\)/g)]
    assert.equal(aufrufe.length, 1)
    assert.match(aufrufe[0][0], /capability:\s*'official-truth-freigeben'/)
    assert.doesNotMatch(aufrufe[0][0], /grant|role|aal|email|user|surface/)
  })

  test('the live loader explicitly uses reachesDatabase before the user-scoped RPC', () => {
    const koerper = lader(quelle())
    const reichweite = koerper.indexOf('reachesDatabase(access)')
    const leser = koerper.indexOf('readUserScopedOfficialTruthCapability')
    assert.equal(reichweite >= 0, true)
    assert.equal(leser > reichweite, true)
    assert.match(koerper, /access\.grant === 'role'/)
  })

  test('the live loader uses the user-scoped server client and not a service-role client', () => {
    const text = quelle()
    assert.match(text, /createServerComponentClient\(/)
    assert.doesNotMatch(text, /createRouteHandlerClient|createServerActionClient|createAdminClient|createClient\(/)
    assert.doesNotMatch(text, /service[_-]?role|SUPABASE_SERVICE_ROLE_KEY/i)
    assert.equal((text.match(/createServerComponentClient\(/g) ?? []).length, 1)
  })

  test('the wrapper invokes only the Official Truth capability RPC', () => {
    const text = quelle()
    const aufrufe = [...text.matchAll(/\.rpc\(\s*(['"`])([\w.]+)\1/g)]
    assert.deepEqual(aufrufe.map((treffer) => treffer[2]), [RPC])
    assert.equal(RPC, 'darf_official_truth_freigeben')
    assert.doesNotMatch(text, /\.rpc\(\s*[A-Za-z_]/)
  })

  test('generated supabase types are unchanged and do not list the unapplied RPC', () => {
    const diff = execFileSync('git', ['diff', 'HEAD', '--', 'types/supabase.ts'], { encoding: 'utf8' })
    assert.equal(diff, '')
    const typen = readFileSync('types/supabase.ts', 'utf8')
    assert.equal(typen.includes(RPC), false)
  })

  test('no app file calls this guard yet', () => {
    const dateien = execFileSync('git', ['ls-files', 'app'], { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
    for (const datei of dateien) {
      const text = readFileSync(datei, 'utf8')
      assert.equal(text.includes('official-truth-fact-entry-authority-server'), false, datei)
      assert.equal(text.includes('loadOfficialTruthFactEntryAuthority'), false, datei)
      assert.equal(text.includes('decideOfficialTruthFactEntryAuthority'), false, datei)
    }
  })

  test('this module does not accept a rule or call the trusted store', () => {
    const text = quelle()
    assert.equal(text.includes('regelKandidatAkzeptieren'), false)
    assert.equal(text.includes('akzeptierteRegelClaimSpeichern'), false)
    assert.equal(text.includes('official_truth_store_accepted_v1'), false)
    assert.equal(text.includes('evidenceKandidatAkzeptieren'), false)
  })

  test('request body, user metadata and the email allowlist are not authority inputs', () => {
    const text = quelle()
    assert.doesNotMatch(text, /request\.json|ADMIN_ALLOWED_EMAILS|user\.email|auth\.getSession|localStorage/)
    const schmutzig = {
      allowed: true,
      grant: 'role',
      role: 'owner',
      email: 'person@example.com',
      userId: 'user-1',
    } as AdminDecision
    return entschieden(schmutzig, { kind: 'value', data: true }).then(({ result }) => {
      assert.equal(result.status, 'authorized')
      const json = JSON.stringify(result)
      assert.equal(json.includes('person@example.com'), false)
      assert.equal(json.includes('user-1'), false)
      assert.equal(json.includes('owner'), false)
    })
  })

  test('requirementsProviderAus stays null', () => {
    assert.equal(requirementsProviderAus(), null)
    const provider = readFileSync('lib/readiness/provider.ts', 'utf8')
    assert.match(
      provider,
      /export function requirementsProviderAus\(\): RequirementsProvider \| null \{\n  return null\n\}/,
    )
    assert.equal(provider.includes('official-truth-fact-entry-authority-server'), false)
  })

  test('the live loader fail-closes outside a request and does not authorize', async () => {
    const result = await loadOfficialTruthFactEntryAuthority()
    assert.notEqual(result.status, 'authorized')
    assert.equal(result.status, 'access_lookup_failed')
    assert.deepEqual(Object.keys(result), ['status'])
  })
})
