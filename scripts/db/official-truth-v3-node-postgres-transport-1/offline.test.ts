// SOURCE_ONLY at delivery. Run separately with --experimental-test-module-mocks.
// This suite uses synthetic driver primitives or the private physical pair;
// neither fixture makes a native TLS, PostgreSQL or remote-absence claim.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { EventEmitter } from 'node:events'
import { test } from 'node:test'
import { performance } from 'node:perf_hooks'
import type { PgOwnedPair, PgOwnedReply, PgOwnedSession } from '../../../lib/readiness/official-truth-product-v3/transport/node-postgres-owned-session'
import type { M04FixedRequest } from '../../../lib/readiness/official-truth-product-v3/jobs/contract'
import type { Hrs1FixedRequest } from '../../../lib/readiness/official-truth-product-v3/result/contract'
import { V3_PG_LOGINS, selectedV3PgTarget, type V3PgLogin } from '../../../lib/readiness/official-truth-product-v3/transport/node-postgres-selection'

const SOURCE = new URL('../../../lib/readiness/official-truth-product-v3/transport/', import.meta.url)
const binding = { methodId: 'pg_transport_fixture', revision: 1, methodDigest: 'a'.repeat(64), packageDigest: 'b'.repeat(64) }
const signal = () => new AbortController().signal
const wait = (n: number) => new Promise<void>(r => setTimeout(r, n))
const budget = (milliseconds = 1000) => Object.freeze({ deadline: performance.now() + milliseconds })
const intakeStatement = 'SELECT official_v3_intake_api.capture_v1($1::jsonb,$2::text,$3::text) AS result'
const intakeBinding = { schema: 3, kind: 'proposal_intake_binding', operationId: 'op3_' + '1'.repeat(32),
  jobId: 'job3_' + '2'.repeat(32), contextKey: 'official-truth-context:v3:' + '3'.repeat(64),
  method: { methodId: binding.methodId, revision: 1 }, runnerId: 'runner3_' + '4'.repeat(32),
  deliveryId: 'delivery3_' + '5'.repeat(32), inputRevision: 'snapshot:' + '6'.repeat(64) }
const intakeParameters = [JSON.stringify(intakeBinding), '{"synthetic":true}', '7'.repeat(64)] as const
const resultText = '{ "status" : "recorded", "original" : "  exact text  ", "n" : 9007199254740993, "date" : "2026-11-12 10:00:00.123456+00", "missing" : null }'
function deferred() { let release!: () => void; const pending = new Promise<void>(r => { release = r }); return { pending, release } }
function job(milliseconds = 1000): M04FixedRequest {
  return { ...binding, operationText: '{"body":{},"operation":"queue_read","phase":"authorized"}', epoch: 1,
    budget: { deadline: performance.now() + milliseconds }, notAfter: new Date(Date.now() + milliseconds).toISOString() } as M04FixedRequest
}
function hrs(operation: string, body: Record<string, unknown>, channel: 'read' | 'execute' | 'attest'): Hrs1FixedRequest {
  return { ...binding, channel, bindingHash: 'c'.repeat(64), operationText: JSON.stringify({ schema: 1, operation, bindingHash: 'c'.repeat(64), body }),
    epoch: 1, budget: { deadline: performance.now() + 1000 }, notAfter: new Date(Date.now() + 1000).toISOString(), legalDate: '2026-11-12' } as Hrs1FixedRequest
}
function fakePair(kind: V3PgLogin, options: { closeGate?: ReturnType<typeof deferred>; lostCommit?: boolean; effectGate?: ReturnType<typeof deferred>; commitGate?: ReturnType<typeof deferred>;
  guardFailure?: boolean; noRemoteProof?: boolean; wrongLogin?: boolean;
  identityGates?: Partial<Record<'work' | 'control', ReturnType<typeof deferred>>>; identityFailure?: 'work' | 'control' } = {}) {
  const calls: { side: string; sql: string; values: readonly unknown[] }[] = []
  let workClosed = false, controlClosed = false, workIdle = true, controlIdle = true, role = V3_PG_LOGINS[kind].login as string
  let commits = 0, effectCalls = 0, guardFinish: ((value: PgOwnedReply) => void) | null = null
  let guardTimer: ReturnType<typeof setTimeout> | null = null
  let rejectedEffect: (() => void) | null = null, rejectedCommit: (() => void) | null = null
  const identities = { work: 0, control: 0 }
  const reply = (rows: readonly Readonly<Record<string, string | null>>[] = [], command = 'SELECT', ready: 'I' | 'T' = 'I'): PgOwnedReply => ({ rows, command, ready })
  function completeGuard() {
    if (guardTimer) { clearTimeout(guardTimer); guardTimer = null }
    controlIdle = true; guardFinish?.(reply([])); guardFinish = null
  }
  function identity(side: 'w' | 'c') { return { pid: side === 'w' ? '101' : '102', birth: '2026-11-12 00:00:00.123456+00',
    login: options.wrongLogin && side === 'w' ? 'postgres' : V3_PG_LOGINS[kind].login,
    role: V3_PG_LOGINS[kind].login, db_oid: '42', login_oid: '401', application_name: `fixture-${kind}-${side}`,
    backend_tls: 'true', server_major: '17', privileged: 'false', can_login: 'true', connection_limit: '2', unbounded_validity: 'true',
    transaction: side === 'w' && !workIdle ? '2026-11-12 00:00:01+00' : null } }
  const work: PgOwnedSession = {
    applicationName: `fixture-${kind}-w`, alive: () => !workClosed, idleAcknowledged: () => workIdle,
    forceLocalClose() { workClosed = true; rejectedEffect?.(); rejectedCommit?.() },
    async closeLocal() { await options.closeGate?.pending; workClosed = true },
    async query(sql, values = []) {
      calls.push({ side: 'work', sql, values })
      if (workClosed) throw Error('closed')
      if (sql.includes('AS server_major')) {
        if (++identities.work === 1) {
          workIdle = false
          await options.identityGates?.work?.pending
          workIdle = true
          if (options.identityFailure === 'work') throw Error('synthetic identity ErrorResponse followed by Idle')
        }
        return reply([identity('w')], 'SELECT', workIdle ? 'I' : 'T')
      }
      if (sql.startsWith('BEGIN')) { workIdle = false; return reply([], 'BEGIN', 'T') }
      if (sql.startsWith('SET LOCAL ROLE ')) { role = V3_PG_LOGINS[kind].role; return reply([], 'SET', 'T') }
      if (sql.includes('AS armed')) return reply([{ armed: 'true' }], 'SELECT', 'T')
      if (sql.includes('current_user::text AS role,pg_catalog')) return reply([{ login: V3_PG_LOGINS[kind].login, role, pid: '101' }], 'SELECT', 'T')
      if (sql.includes('official_v3_')) {
        effectCalls++
        if (options.effectGate) await new Promise<void>((resolve, reject) => {
          rejectedEffect = () => reject(Error('actual local query closed'))
          void options.effectGate!.pending.then(resolve)
        })
        if (workClosed) throw Error('closed')
        if (kind === 'method') return reply([{ status: 'absent', method_id: binding.methodId, revision: null, method_digest: null,
          package_digest: null, epoch: '0', approval_mode: null, approval_until: null,
          observed_at: '2026-11-12 10:00:00.123456+00', remaining_ms: '0' }], 'SELECT', 'T')
        return reply([{ result: resultText }], 'SELECT', 'T')
      }
      if (sql === 'COMMIT') {
        commits++
        if (options.commitGate) await new Promise<void>((resolve, reject) => {
          rejectedCommit = () => reject(Error('actual local COMMIT query closed'))
          void options.commitGate!.pending.then(resolve)
        })
        if (workClosed) throw Error('closed')
        workIdle = true; role = V3_PG_LOGINS[kind].login
        if (options.lostCommit) { workIdle = false; workClosed = true; throw Error('lost COMMIT response') }
        return reply([], 'COMMIT')
      }
      if (sql === 'ROLLBACK') { workIdle = true; role = V3_PG_LOGINS[kind].login; return reply([], 'ROLLBACK') }
      if (sql.includes('pg_cancel_backend')) { completeGuard(); return reply([{ sent: 'true' }]) }
      return reply([], 'SELECT', workIdle ? 'I' : 'T')
    },
  }
  const control: PgOwnedSession = {
    applicationName: `fixture-${kind}-c`, alive: () => !controlClosed, idleAcknowledged: () => controlIdle,
    forceLocalClose() { controlClosed = true; completeGuard() }, async closeLocal() { controlClosed = true },
    async query(sql, values = []) {
      calls.push({ side: 'control', sql, values })
      if (controlClosed) throw Error('closed')
      if (sql.includes('AS server_major')) {
        if (++identities.control === 1) {
          controlIdle = false
          await options.identityGates?.control?.pending
          controlIdle = true
          if (options.identityFailure === 'control') throw Error('synthetic identity ErrorResponse followed by Idle')
        }
        return reply([identity('c')])
      }
      if (sql.includes('AS observed_at')) return reply([{ birth: identity('w').birth, transaction: '2026-11-12 00:00:01+00',
        observed_at: new Date().toISOString().replace('Z', '000Z') }])
      if (sql.includes('pg_sleep(')) {
        if (options.guardFailure) throw Error('guard refused')
        controlIdle = false
        return new Promise<PgOwnedReply>(resolve => {
          guardFinish = resolve
          guardTimer = setTimeout(completeGuard, Math.max(0, Date.parse(String(values[5])) - Date.now()))
        })
      }
      if (sql.includes('AS absent')) return reply([{ absent: options.noRemoteProof ? 'false' : String(workClosed) }])
      if (sql.includes('pg_terminate_backend')) return reply([{ terminated: options.noRemoteProof ? 'false' : 'true' }])
      return reply([])
    },
  }
  return { pair: { work, control, async closeLocal() { await Promise.all([work.closeLocal(), control.closeLocal()]) } } satisfies PgOwnedPair,
    calls, stats: () => ({ commits, effectCalls, workClosed, controlClosed }), release() { options.effectGate?.release(); options.commitGate?.release(); options.closeGate?.release(); completeGuard() } }
}

test('owned pair joins both synthetic handshakes and their actual local continuations', { timeout: 10000 }, async t => {
  type Side = 'control' | 'work'
  type Options = { fail?: Side; authGates?: Partial<Record<Side, ReturnType<typeof deferred>>>;
    endGates?: Partial<Record<Side, ReturnType<typeof deferred>>> }
  type Configuration = { application_name: string; stream(): SyntheticSocket; connectionTimeoutMillis: number }
  let options: Options = {}, queryCalls = 0, authActive = 0, dnsCalls = 0, socketCalls = 0
  const clients: SyntheticClient[] = []
  class SyntheticSocket extends EventEmitter {
    destroyed = false
    constructor() { super(); socketCalls++ }
    destroy() { if (!this.destroyed) { this.destroyed = true; queueMicrotask(() => this.emit('close')) }; return this }
  }
  class SyntheticTls extends SyntheticSocket {
    authorized = true
    getPeerCertificate() { return {} }
  }
  class SyntheticClient extends EventEmitter {
    readonly binary = false; readonly pipeline = false
    readonly connectionParameters = { replication: 'false', sslnegotiation: 'postgres', query_timeout: 0 }
    readonly connection: EventEmitter & { stream: SyntheticSocket }
    readonly raw: SyntheticSocket; readonly side: Side; readonly options: Options
    connected = false; connecting = false; ended = false; secure: SyntheticTls | null = null
    constructor(readonly configuration: Configuration) {
      super(); this.raw = configuration.stream(); this.options = options
      this.side = configuration.application_name.includes(':c:') ? 'control' : 'work'
      this.connection = Object.assign(new EventEmitter(), { stream: this.raw }); clients.push(this)
    }
    getTransactionStatus() { return this.connected ? 'I' : null }
    async _handleAuthSASLContinue() {
      authActive++
      try { await this.options.authGates?.[this.side]?.pending } finally { authActive-- }
    }
    _handleAuthMD5Password() { assert.fail('not used by this synthetic fixture') }
    _handleAuthCleartextPassword() { assert.fail('not used by this synthetic fixture') }
    connect() {
      this.connecting = true
      return new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => this.raw.destroy(), this.configuration.connectionTimeoutMillis)
        this.raw.once('close', () => {
          clearTimeout(timer); this.connecting = false; this.connection.emit('end'); this.emit('end')
          reject(Error('synthetic socket closed'))
        })
        queueMicrotask(() => {
          if (this.options.fail === this.side || this.raw.destroyed) { this.raw.destroy(); return }
          this.secure = new SyntheticTls(); this.secure.on('data', () => {})
          this.connection.stream = this.secure; this.connection.emit('sslconnect'); this.secure.emit('secureConnect')
          void this._handleAuthSASLContinue().then(() => {
            if (this.raw.destroyed) return
            this.connected = true; this.connecting = false
            this.connection.emit('readyForQuery', { status: 'I' }); clearTimeout(timer); resolve()
          }, () => this.raw.destroy())
        })
      })
    }
    query() { queryCalls++; assert.fail('pair acquisition must not issue SQL') }
    async end() {
      this.raw.destroy(); this.secure?.destroy()
      await this.options.endGates?.[this.side]?.pending; this.ended = true
    }
  }
  class SyntheticResolver {
    async resolve4() { dnsCalls++; return ['127.0.0.1'] }
    async resolve6() { return [] }
    cancel() {}
  }
  // These are deliberately synthetic primitives. The real adapter below owns
  // the two promises, auth tracking and close joins; Hosted tests own real TLS.
  t.mock.module('node:net', { namedExports: { Socket: SyntheticSocket, isIP: (value: string) => value === '127.0.0.1' ? 4 : 0 } })
  t.mock.module('node:tls', { namedExports: { TLSSocket: SyntheticTls, checkServerIdentity: () => undefined } })
  t.mock.module('node:dns/promises', { namedExports: { Resolver: SyntheticResolver } })
  // pg 8.23.1 exposes separate import/require entries; tsx uses the latter for
  // this repository's TS modules. Both resolve only to this same synthetic pair.
  const driver = { Client: SyntheticClient, Query: EventEmitter }
  t.mock.module('pg', { cache: true, defaultExport: driver, namedExports: driver })
  t.mock.module('pg/lib/index.js', { cache: true, defaultExport: driver, namedExports: driver })
  const environment = { VERCEL_ENV: 'preview', VERCEL_PROJECT_ID: 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM',
    VERCEL_GIT_REPO_OWNER: 'Jetnity', VERCEL_GIT_REPO_SLUG: 'jetnity',
    VERCEL_GIT_COMMIT_REF: 'feat/official-truth-human-method-ui-1-20261112',
    JETNITY_V3_PG_JOBS_PASSWORD: 'synthetic-offline-password-only' }
  const previous = new Map(Object.keys(environment).map(key => [key, process.env[key]]))
  Object.assign(process.env, environment)
  assert.ok(selectedV3PgTarget())
  const { openOwnedV3PgPair } = await import('../../../lib/readiness/official-truth-product-v3/transport/node-postgres-owned-session')
  const start = (controller = new AbortController(), milliseconds = 1000) => {
    const deadline = performance.now() + milliseconds
    return { deadline, pending: openOwnedV3PgPair('jobs', deadline, deadline + 1000, controller.signal) }
  }
  const entered = async () => {
    for (let attempt = 0; attempt < 100 && clients.length !== 2; attempt++) await wait(1)
    assert.equal(clients.length, 2, `the reserved pair starts exactly two clients; dns=${dnsCalls}, sockets=${socketCalls}`)
    await wait(1)
  }
  const drained = () => {
    assert.equal(queryCalls, 0); assert.equal(authActive, 0)
    assert.equal(clients.length, 2)
    assert.ok(clients.every(client => client.ended && client.raw.destroyed && (!client.secure || client.secure.destroyed)))
    clients.length = 0; options = {}
  }
  try {
    await t.test('both connect before either finishes; no port before both verify', async () => {
      const control = deferred(), work = deferred(); options = { authGates: { control, work } }
      const { pending } = start(); let settled = false; void pending.then(() => { settled = true })
      try {
        await entered(); assert.equal(authActive, 2); assert.equal(settled, false)
        control.release(); await wait(1); assert.equal(settled, false)
        assert.equal(clients.filter(client => client.connected).length, 1)
        work.release(); const pair = await pending; assert.ok(pair)
        assert.equal(pair.work.idleAcknowledged(), true); assert.equal(pair.control.idleAcknowledged(), true)
        await pair.closeLocal(); drained()
      } finally { control.release(); work.release() }
    })
    for (const failed of ['control', 'work'] as const) await t.test(`${failed} failure still joins the other auth and both closes`, async () => {
      const auth = deferred(), close = deferred(), other = failed === 'work' ? 'control' : 'work'
      options = { fail: failed, authGates: { [other]: auth }, endGates: { [failed]: close } }
      const { pending } = start(); let settled = false; void pending.then(() => { settled = true })
      try {
        await entered(); assert.equal(authActive, 1); assert.equal(settled, false)
        auth.release(); await wait(1); assert.equal(settled, false, 'failed-side local close is still owned')
        close.release(); assert.equal(await pending, null); drained()
      } finally { auth.release(); close.release() }
    })
    await t.test('abort closes both sockets but waits for outstanding authentication and end', async () => {
      const auth = deferred(), close = deferred(), controller = new AbortController()
      options = { authGates: { work: auth }, endGates: { work: close } }
      const { pending } = start(controller); let settled = false; void pending.then(() => { settled = true })
      try {
        await entered(); controller.abort(); await wait(1)
        assert.ok(clients.every(client => client.raw.destroyed)); assert.equal(settled, false)
        close.release(); await wait(1); assert.equal(settled, false, 'socket end does not substitute for auth join')
        auth.release(); assert.equal(await pending, null); drained()
      } finally { auth.release(); close.release() }
    })
    await t.test('the original acquisition deadline cannot be renewed by a late auth completion', async () => {
      const auth = deferred(); options = { authGates: { work: auth } }
      const { pending, deadline } = start(undefined, 30); let settled = false; void pending.then(() => { settled = true })
      try {
        await entered(); assert.ok(clients.every(client => client.configuration.connectionTimeoutMillis <= 30))
        await wait(40); assert.ok(performance.now() >= deadline); assert.equal(settled, false)
        auth.release(); assert.equal(await pending, null); drained()
      } finally { auth.release() }
    })
  } finally {
    for (const [key, value] of previous) { if (value === undefined) delete process.env[key]; else process.env[key] = value }
  }
})

test('PG transport offline contracts and reserved terminal ownership', { timeout: 15000 }, async t => {
  await t.test('literal Dev target requires every exact Vercel guard and ignores target overrides', () => {
    const guards = { VERCEL_ENV: 'preview', VERCEL_PROJECT_ID: 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM',
      VERCEL_GIT_REPO_OWNER: 'Jetnity', VERCEL_GIT_REPO_SLUG: 'jetnity',
      VERCEL_GIT_COMMIT_REF: 'feat/official-truth-human-method-ui-1-20261112' }
    const overrides = { PGHOST: 'unselected.invalid', PGPORT: '6543', PGDATABASE: 'unselected',
      PGUSER: 'unselected', PGSSLMODE: 'disable', PGSSLROOTCERT: '/unselected/ca.pem',
      DATABASE_URL: 'postgresql://unselected.invalid/unselected' }
    const previous = new Map<string, string | undefined>(
      Object.keys({ ...guards, ...overrides }).map(key => [key, process.env[key]]))
    try {
      for (const key of previous.keys()) delete process.env[key]
      assert.equal(selectedV3PgTarget(), null)
      Object.assign(process.env, guards)
      const target = selectedV3PgTarget(); assert.ok(target)
      const { certificateAuthorityPem, ...identity } = target
      assert.deepEqual(identity, { connectHost: 'db.yfvbxvijcorffwxbxahl.supabase.co',
        tlsHostname: 'db.yfvbxvijcorffwxbxahl.supabase.co', port: 5432, database: 'postgres',
        usernameSuffix: '',
        certificateAuthoritySha256: '700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7',
        expectedServerMajor: 17, requireBackendTls: true })
      assert.equal(Buffer.byteLength(certificateAuthorityPem, 'utf8'), 1367)
      assert.equal(createHash('sha256').update(certificateAuthorityPem, 'utf8').digest('hex'), target.certificateAuthoritySha256)
      assert.equal(Object.isFrozen(target), true)
      for (const [key, value] of Object.entries(guards)) {
        delete process.env[key]
        assert.equal(selectedV3PgTarget(), null, key + ' missing refuses the target')
        process.env[key] = value + '-unselected'
        assert.equal(selectedV3PgTarget(), null, key + ' mismatch refuses the target')
        process.env[key] = value
      }
      for (const environment of ['production', 'development']) {
        process.env.VERCEL_ENV = environment
        assert.equal(selectedV3PgTarget(), null, environment + ' never selects the Dev target')
      }
      process.env.VERCEL_ENV = guards.VERCEL_ENV
      Object.assign(process.env, overrides)
      assert.equal(selectedV3PgTarget(), target, 'environment target/URL/TLS overrides cannot replace the literal selection')
      const productionGuards = { ...guards, VERCEL_ENV: 'production', VERCEL_GIT_COMMIT_REF: 'main' }
      Object.assign(process.env, productionGuards)
      const production = selectedV3PgTarget(); assert.ok(production)
      assert.notEqual(production, target)
      assert.deepEqual(production, { ...target, connectHost: 'db.qscbgcdmivbbnzrcyegn.supabase.co',
        tlsHostname: 'db.qscbgcdmivbbnzrcyegn.supabase.co' })
      assert.equal(Object.isFrozen(production), true)
      assert.equal(createHash('sha256').update(production.certificateAuthorityPem, 'utf8').digest('hex'), production.certificateAuthoritySha256)
      for (const [key, value] of Object.entries(productionGuards)) {
        delete process.env[key]
        assert.equal(selectedV3PgTarget(), null, key + ' missing refuses Production')
        process.env[key] = value + '-unselected'
        assert.equal(selectedV3PgTarget(), null, key + ' mismatch refuses Production')
        process.env[key] = value
      }
      process.env.VERCEL_ENV = 'preview'
      assert.equal(selectedV3PgTarget(), null, 'Preview main never selects Production')
      process.env.VERCEL_ENV = 'production'
      process.env.VERCEL_GIT_COMMIT_REF = guards.VERCEL_GIT_COMMIT_REF
      assert.equal(selectedV3PgTarget(), null, 'Production metadata on the Dev branch cannot select either target')
      Object.assign(process.env, productionGuards, overrides)
      assert.equal(selectedV3PgTarget(), production, 'PG variables cannot redirect Production or weaken TLS')
      delete process.env.VERCEL_PROJECT_ID
      assert.equal(selectedV3PgTarget(), null, 'overrides cannot bypass a missing guard')
    } finally {
      for (const [key, value] of previous) {
        if (value === undefined) delete process.env[key]
        else process.env[key] = value
      }
    }
  })
  assert.deepEqual(Object.values(V3_PG_LOGINS).map(x => x.login), ['ot_v3_method_transport_login','ot_v3_intake_transport_login',
    'ot_v3_jobs_transport_login','ot_v3_result_writer','ot_v3_result_reader','ot_v3_result_verifier'])
  let count = 0, options: Parameters<typeof fakePair>[1] = {}, last: ReturnType<typeof fakePair> | null = null
  const acquired: { kind: V3PgLogin; operationDeadline: number; cleanupDeadline: number }[] = []
  t.mock.module(new URL('node-postgres-owned-session.ts', SOURCE), { cache: true, namedExports: {
    async openOwnedV3PgPair(kind: V3PgLogin, operationDeadline: number, cleanupDeadline: number) {
      count++; acquired.push({ kind, operationDeadline, cleanupDeadline }); last = fakePair(kind, options); return last.pair
    },
  } })
  const { V3_NODE_POSTGRES_EXECUTORS: port, readV3NodePostgresTerminalState: state } = await import(
    '../../../lib/readiness/official-truth-product-v3/transport/node-postgres-executors')
  await t.test('fixed statements and channels reject before physical acquisition', async () => {
    assert.deepEqual(await port.intake.execute('SELECT 1', [], signal(), budget()), { status: 'unavailable' })
    assert.deepEqual(await port.intake.execute('SELECT official_v3_intake_api.read_v1($1::jsonb,$2::text,$3::integer) AS result ', [], signal(), budget()), { status: 'unavailable' })
    assert.deepEqual(await port.jobs.executeFixed({ ...job(), sql: 'COMMIT' } as M04FixedRequest, signal()), { status: 'unavailable' })
    const malicious = { ...job() }; Object.defineProperty(malicious, 'epoch', { enumerable: true, get() { throw Error('getter invoked') } })
    assert.deepEqual(await port.jobs.executeFixed(malicious, signal()), { status: 'unavailable' })
    assert.deepEqual(await port.verifier.executeFixed(hrs('history', { contextKey: 'x', factKind: 'requirement_effect' }, 'read'), signal()), { status: 'unavailable' })
    assert.deepEqual(await port.reader.executeFixed(hrs('head', { contextKey: 'x', factKind: 'requirement_effect' }, 'read'), signal()), { status: 'unavailable' })
    assert.deepEqual(await port.writer.executeFixed(hrs('coverage', { destinationCountryCode: 'DE', citizenshipCountryCode: 'CH' }, 'read'), signal()), { status: 'unavailable' })
    assert.deepEqual(await port.writer.executeFixed(hrs('ch_de_snapshot', {}, 'read'), signal()), { status: 'unavailable' })
    assert.deepEqual(await port.verifier.executeFixed(hrs('ch_de_snapshot', {}, 'read'), signal()), { status: 'unavailable' })
    assert.equal(count, 0)
  })
  await t.test('MA1/S1 require the shared cap before physical acquisition', async () => {
    const request = { ...binding, checkedAt: new Date().toISOString() }
    let getterCalls = 0
    const accessor = Object.defineProperty({}, 'deadline', { enumerable: true, get() { getterCalls++; return performance.now() + 1000 } })
    for (const cap of [undefined, { deadline: NaN }, { deadline: Infinity }, { deadline: -1 },
      { deadline: performance.now() - 1 }, { deadline: performance.now() + 1000, extension: true }, accessor]) {
      assert.deepEqual(await port.method.readCurrent(request, signal(), cap as Readonly<{ deadline: number }> | undefined), { status: 'unavailable' })
      assert.deepEqual(await port.intake.execute(intakeStatement, intakeParameters, signal(), cap as Readonly<{ deadline: number }> | undefined), { status: 'unavailable' })
    }
    assert.equal(getterCalls, 0); assert.equal(count, 0)
  })
  await t.test('one consumed MA1/S1 cap reaches physical acquisition unchanged', async () => {
    const cap = budget(500), request = { ...binding, checkedAt: new Date().toISOString() }
    await wait(10)
    assert.equal((await port.method.readCurrent(request, signal(), cap)).status, 'rows')
    assert.equal(acquired.at(-1)!.operationDeadline, cap.deadline)
    assert.equal((await port.intake.execute(intakeStatement, intakeParameters, signal(), cap)).status, 'acknowledged')
    assert.equal(acquired.at(-1)!.operationDeadline, cap.deadline)
    const expired = budget(5), before = count
    await wait(10)
    assert.deepEqual(await port.intake.execute(intakeStatement, intakeParameters, signal(), expired), { status: 'unavailable' })
    assert.deepEqual(await port.method.readCurrent(request, signal(), expired), { status: 'unavailable' })
    assert.equal(count, before)
  })
  await t.test('fixed CH→DE snapshot uses only the existing reader physical pair and joins it', async () => {
    const before = count
    assert.equal((await port.reader.executeFixed(hrs('ch_de_snapshot', {}, 'read'), signal())).status, 'acknowledged')
    assert.equal(count, before + 1); assert.equal(acquired.at(-1)!.kind, 'reader')
    assert.equal(state().reader, 'idle'); assert.equal(last!.stats().effectCalls, 1)
  })
  await t.test('S1 cannot renew the shared cap while COMMIT is awaiting its real reply', async () => {
    const commitGate = deferred(); options = { commitGate }
    try {
      const cap = budget(100)
      const pending = port.intake.execute(intakeStatement, intakeParameters, signal(), cap)
      assert.deepEqual(await pending, { status: 'unconfirmed' })
      assert.equal(last!.stats().commits, 1); assert.equal(last!.stats().effectCalls, 1)
      assert.equal(acquired.at(-1)!.operationDeadline, cap.deadline)
      assert.equal(state().intake, 'idle')
    } finally { commitGate.release(); options = {} }
  })
  await t.test('both initial identity reads run together while BEGIN and slot reuse wait for their join', async () => {
    const control = deferred(), work = deferred(); options = { identityGates: { control, work } }
    const pending = port.jobs.executeFixed(job(), signal()); let settled = false
    void pending.then(() => { settled = true })
    try {
      await wait(1)
      assert.deepEqual(last!.calls.map(call => call.side), ['control', 'work'])
      assert.ok(last!.calls.every(call => call.sql.includes('AS server_major')))
      const before = count
      assert.deepEqual(await port.jobs.executeFixed(job(), signal()), { status: 'unavailable' })
      assert.equal(count, before, 'the existing two slots cannot be reacquired during either identity read')
      control.release(); await wait(1); assert.equal(settled, false)
      assert.equal(last!.calls.some(call => call.sql.startsWith('BEGIN')), false)
      work.release(); assert.equal((await pending).status, 'acknowledged')
      assert.equal(last!.stats().effectCalls, 1); assert.equal(state().jobs, 'idle')
    } finally { control.release(); work.release(); await pending; options = {} }
  })
  for (const failed of ['control', 'work'] as const) await t.test(`${failed} identity error joins the other read before cleanup and never begins`, async () => {
    const held = deferred(), other = failed === 'work' ? 'control' : 'work'
    options = { identityFailure: failed, identityGates: { [other]: held } }
    const pending = port.jobs.executeFixed(job(), signal()); let settled = false
    void pending.then(() => { settled = true })
    try {
      await wait(1); assert.equal(last!.calls.length, 2); assert.equal(settled, false)
      assert.equal(last!.stats().workClosed, false); assert.equal(last!.stats().controlClosed, false)
      held.release(); assert.deepEqual(await pending, { status: 'unavailable' })
      assert.equal(last!.calls.some(call => call.sql.startsWith('BEGIN')), false)
      assert.equal(last!.stats().effectCalls, 0); assert.equal(state().jobs, 'idle')
      assert.equal(last!.stats().workClosed, true); assert.equal(last!.stats().controlClosed, true)
    } finally { held.release(); await pending; options = {} }
  })
  await t.test('abort joins the still-pending initial control identity without beginning a transaction', async () => {
    const held = deferred(), controller = new AbortController(); options = { identityGates: { control: held } }
    const pending = port.jobs.executeFixed(job(), controller.signal); let settled = false
    void pending.then(() => { settled = true })
    try {
      await wait(1); assert.equal(last!.calls.length, 2); controller.abort(); await wait(1)
      assert.equal(settled, false); assert.equal(last!.stats().workClosed, true)
      held.release(); assert.deepEqual(await pending, { status: 'unavailable' })
      assert.equal(last!.calls.some(call => call.sql.startsWith('BEGIN')), false)
      assert.equal(last!.stats().effectCalls, 0); assert.equal(state().jobs, 'idle')
    } finally { held.release(); await pending; options = {} }
  })
  await t.test('identity join consumes the original effect deadline without a fresh BEGIN budget', async () => {
    const held = deferred(); options = { identityGates: { control: held } }
    const request = job(30), pending = port.jobs.executeFixed(request, signal()); let settled = false
    void pending.then(() => { settled = true })
    try {
      await wait(40); assert.equal(settled, false); assert.equal(last!.stats().workClosed, true)
      assert.equal(acquired.at(-1)!.operationDeadline, request.budget.deadline)
      held.release(); assert.deepEqual(await pending, { status: 'unavailable' })
      assert.equal(last!.calls.some(call => call.sql.startsWith('BEGIN')), false)
      assert.equal(last!.stats().effectCalls, 0); assert.equal(state().jobs, 'idle')
    } finally { held.release(); await pending; options = {} }
  })
  await t.test('actual COMMIT reply, same narrow controls and exact unchanged text', async () => {
    const result = await port.jobs.executeFixed(job(), signal())
    assert.deepEqual(result, { status: 'acknowledged', rows: [{ result: resultText }] })
    assert.ok(last)
    assert.deepEqual(last.stats(), { commits: 1, effectCalls: 1, workClosed: true, controlClosed: true })
    const idAt = last.calls.findIndex(x => x.side === 'work' && x.sql.includes('AS server_major'))
    const roleAt = last.calls.findIndex(x => x.sql === 'SET LOCAL ROLE ot_v3_jobs_caller')
    const guardAt = last.calls.findIndex(x => x.sql.includes('pg_sleep('))
    const commitAt = last.calls.findIndex(x => x.sql === 'COMMIT')
    assert.ok(idAt >= 0 && guardAt > idAt && roleAt > guardAt && commitAt > roleAt)
    assert.ok(last.calls.filter(x => x.side === 'control').every(x => !x.sql.includes('SET ROLE')))
    assert.equal(state().jobs, 'idle')
  })
  await t.test('lost COMMIT acknowledgement remains unconfirmed without replay', async () => {
    options = { lostCommit: true }
    assert.deepEqual(await port.jobs.executeFixed(job(100), signal()), { status: 'unconfirmed' })
    assert.equal(last!.stats().commits, 1); assert.equal(last!.stats().effectCalls, 1)
    assert.equal(state().jobs, 'idle'); options = {}
  })
  await t.test('local cleanup must finish before either reserved slot is reusable', async () => {
    const closeGate = deferred(); options = { closeGate }
    let resolved = false
    const pending = port.jobs.executeFixed(job(), signal()).then(r => { resolved = true; return r })
    for (let i = 0; i < 100 && state().jobs !== 'draining'; i++) await wait(1)
    assert.equal(state().jobs, 'draining'); assert.equal(resolved, false)
    const before = count
    assert.deepEqual(await port.jobs.executeFixed(job(), signal()), { status: 'unavailable' })
    assert.equal(count, before)
    closeGate.release(); await pending; assert.equal(state().jobs, 'idle'); options = {}
  })
  await t.test('abort joins the effect and watchdog before unconfirmed settlement', async () => {
    const effectGate = deferred(), controller = new AbortController(); options = { effectGate }
    const pending = port.jobs.executeFixed(job(100), controller.signal)
    for (let i = 0; i < 100 && !last?.stats().effectCalls; i++) await wait(1)
    controller.abort()
    assert.deepEqual(await pending, { status: 'unconfirmed' })
    effectGate.release(); assert.equal(last!.stats().commits, 0); assert.equal(state().jobs, 'idle'); options = {}
  })
  await t.test('wrong actual login never reaches a role change or effect', async () => {
    options = { wrongLogin: true }
    assert.deepEqual(await port.jobs.executeFixed(job(), signal()), { status: 'unavailable' })
    assert.equal(last!.stats().effectCalls, 0); options = {}
  })
  await t.test('missing remote proof returns only its explicit negative after local joins', async () => {
    const closeGate = deferred(); options = { noRemoteProof: true, closeGate }
    let settled = false
    const pending = port.verifier.executeFixed(hrs('attest', { kind: 'source', verification: {} }, 'attest'), signal())
    void pending.then(() => { settled = true }, () => { settled = true })
    for (let i = 0; i < 100 && state().verifier !== 'draining'; i++) await wait(1)
    assert.equal(state().verifier, 'draining'); assert.equal(settled, false)
    assert.equal(last!.stats().workClosed, false, 'local work close is still genuinely gated')
    closeGate.release()
    assert.deepEqual(await pending, { status: 'blocked_remote_unknown' })
    for (let i = 0; i < 800 && state().verifier !== 'blocked_terminal'; i++) await wait(1)
    assert.equal(state().verifier, 'blocked_terminal'); assert.equal(settled, true)
    assert.equal(last!.stats().workClosed, true); assert.equal(last!.stats().controlClosed, true)
    const before = count
    assert.deepEqual(await port.verifier.executeFixed(hrs('attest', { kind: 'source', verification: {} }, 'attest'), signal()), { status: 'blocked_remote_unknown' })
    assert.equal(count, before)
    last!.release() // Test owns no real backend or detached timer.
    options = {}
  })
  await t.test('MA1 and S1 preserve the explicit poisoned outcome without another acquisition', async () => {
    options = { noRemoteProof: true }
    const request = { ...binding, checkedAt: new Date().toISOString() }
    assert.deepEqual(await port.method.readCurrent(request, signal(), budget()), { status: 'blocked_remote_unknown' })
    assert.equal(state().method, 'blocked_terminal')
    const methodCount = count
    assert.deepEqual(await port.method.readCurrent(request, signal(), budget()), { status: 'blocked_remote_unknown' })
    assert.equal(count, methodCount)
    assert.deepEqual(await port.intake.execute(intakeStatement, intakeParameters, signal(), budget()), { status: 'blocked_remote_unknown' })
    assert.equal(state().intake, 'blocked_terminal')
    const intakeCount = count
    assert.deepEqual(await port.intake.execute(intakeStatement, intakeParameters, signal(), budget()), { status: 'blocked_remote_unknown' })
    assert.equal(count, intakeCount)
    assert.equal(last!.stats().workClosed, true); assert.equal(last!.stats().controlClosed, true)
    last!.release(); options = {}
  })
})
