// Mandatory native composition; fictional research data, actual owned SQL.
// No hosted URL, production binding, source call or acceptance authority.
import assert from 'node:assert/strict'
import { promises as fs, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test, type TestContext } from 'node:test'
import { startLocalProofCluster, type LocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection, pgText } from '../official-truth-integrated-pilot-1/pg-wire'
import { s1Fixture } from '../official-truth-v3-intake-store-1/fixtures'
import { nativeExecutor, type NativeAdapterOptions } from '../official-truth-v3-intake-store-1/native-adapter'
import { createV3ProposalIntakeStore } from '../../../lib/readiness/official-truth-product-v3/storage/intake-server'
import type { V3IntakeSqlExecutor } from '../../../lib/readiness/official-truth-product-v3/storage/quarantine-postgres'
import type { V3IntakeBinding } from '../../../lib/readiness/official-truth-product-v3/storage/intake-contract'
import { createV3ResearchFileIngress } from '../../../lib/readiness/official-truth-product-v3/ingress/service-server'
import type { V3IngressRootPin } from '../../../lib/readiness/official-truth-product-v3/ingress/types'
import { createV3ImportCoordinator } from '../../../lib/readiness/official-truth-product-v3/import/service-server'
import { readV3ProposalUpload } from '../../../lib/readiness/official-truth-product-v3/import/interface'

const CAPTURE = 'SELECT official_v3_intake_api.capture_v1($1::jsonb,$2::text,$3::text) AS result'
const READ = 'SELECT official_v3_intake_api.read_v1($1::jsonb,$2::text,$3::integer) AS result'
const LOCK = 'SELECT pg_advisory_xact_lock($1::integer,$2::integer)'
const signal = () => new AbortController().signal
const delay = (milliseconds: number) => new Promise<void>(resolve => setTimeout(resolve, milliseconds))

async function fileFixture(t: TestContext, seed: string) {
  const f = s1Fixture(seed)
  // Fictional source/audit times only; PostgreSQL transaction clocks are real.
  f.synthetic.control.instant = Date.parse('2026-11-01T00:04:00.000Z')
  f.originals.control.retrievedAt = '2026-11-01T00:00:00.000Z'
  const parent = await fs.mkdtemp(join(tmpdir(), 'jetnity-in1-'))
  t.after(async () => { await fs.rm(parent, { recursive: true, force: true }) })
  const directory = join(parent, 'selected')
  await fs.mkdir(directory, { mode: 0o700 })
  const fileName = 'proposal.json', path = join(directory, fileName)
  await fs.writeFile(path, f.text, { mode: 0o600 })
  const stat = await fs.lstat(directory, { bigint: true })
  const root: V3IngressRootPin = Object.freeze({ directory, device: stat.dev.toString(), inode: stat.ino.toString() })
  return { ...f, parent, directory, fileName, path, root, delivery: { fileName, binding: f.binding } }
}
type FileFixture = Awaited<ReturnType<typeof fileFixture>>

function tracedNative(cluster: LocalProofCluster, options: NativeAdapterOptions = {}) {
  const native = nativeExecutor(cluster, options)
  const calls: string[] = [], signals: AbortSignal[] = []
  const events: Array<{ phase: 'start' | 'settled'; statement: string; drained: number }> = []
  const executor: V3IntakeSqlExecutor = {
    async execute(statement, parameters, requestSignal) {
      calls.push(statement); signals.push(requestSignal)
      events.push({ phase: 'start', statement, drained: native.evidence.drained })
      try { return await native.executor.execute(statement, parameters, requestSignal) }
      finally { events.push({ phase: 'settled', statement, drained: native.evidence.drained }) }
    },
  }
  return { ...native, executor, calls, signals, events }
}

function compose(f: FileFixture, executor: V3IntakeSqlExecutor) {
  const custody = createV3ProposalIntakeStore({ registry: f.originals.registry, executor, leaseMilliseconds: 30_000 })
  const ingress = createV3ResearchFileIngress({ root: f.root, registry: f.originals.registry, intake: custody.intake })
  return { custody, ingress }
}

function noPublication(f: FileFixture) {
  assert.equal(f.synthetic.heads.size, 0)
  assert.equal(f.synthetic.versions.size, 0)
  assert.equal(f.synthetic.versionOperations.size, 0)
  assert.equal(f.synthetic.publications.size, 0)
  assert.equal(f.synthetic.cache.size, 0)
  assert.equal(f.synthetic.outbox.size, 0)
}

test('IN1 mandatory native PostgreSQL: real file to durable custody to reopened-original import', { timeout: 150_000 }, async t => {
  const cluster = startLocalProofCluster(), connections = new Set<LocalPgConnection>()
  const connect = async () => { const connection = await LocalPgConnection.connect(cluster); connections.add(connection); return connection }
  const close = (connection: LocalPgConnection) => { connections.delete(connection); connection.close() }
  const stop = () => { for (const connection of connections) connection.close(); cluster.stop() }
  t.signal.addEventListener('abort', stop, { once: true })
  try {
    const owner = await connect()
    await owner.query(readFileSync(new URL('../official-truth-v3-intake-store-1/intake-candidate.sql', import.meta.url), 'utf8'))
    await owner.query('CREATE ROLE ot_s1_test_runner LOGIN INHERIT; GRANT ot_v3_intake_caller TO ot_s1_test_runner')

    const counts = async (operation: string) => (await owner.query(`SELECT
      (SELECT count(*)::text FROM official_v3_intake_private.operations_v1 WHERE operation_id=$1::text) AS originals,
      (SELECT count(*)::text FROM official_v3_intake_private.reservations_v1 WHERE operation_id=$1::text) AS reservations,
      (SELECT count(*)::text FROM official_v3_intake_private.completions_v1 WHERE operation_id=$1::text) AS completions`, [pgText(operation)]))[0]
    const original = async (operation: string) => (await owner.query('SELECT encode(original_bytes,\'hex\') AS bytes,proposal_digest,binding::text FROM official_v3_intake_private.operations_v1 WHERE operation_id=$1::text', [pgText(operation)]))[0]
    const empty = { originals: '0', reservations: '0', completions: '0' }
    const capturedOnly = { originals: '1', reservations: '0', completions: '0' }
    const completedOnce = { originals: '1', reservations: '1', completions: '1' }

    await t.test('real file bytes survive file removal; only reopened SQL bytes feed I1 and full replay', async child => {
      const f = await fileFixture(child, 'in1-stored-original'), io = tracedNative(cluster), first = compose(f, io.executor)
      assert.notEqual(f.text, JSON.stringify(f.proposal), 'fixture must contain original whitespace')
      assert.equal(f.originals.control.extracts, 0)
      assert.deepEqual(await first.ingress.deliver(f.delivery), { status: 'recorded', reference: f.reference })
      assert.deepEqual(io.calls, [CAPTURE])
      assert.equal(io.evidence.acknowledged, 1); assert.equal(io.evidence.drained, 1)
      assert.deepEqual(await counts(f.binding.operationId), capturedOnly)
      assert.equal(f.originals.control.extracts, 0, 'custody does not extract or authorize a source')
      noPublication(f)
      const sqlOriginal = await original(f.binding.operationId)
      assert.ok(sqlOriginal?.bytes && sqlOriginal.binding)
      assert.ok(Buffer.from(sqlOriginal.bytes, 'hex').equals(Buffer.from(f.text, 'utf8')))
      assert.equal(sqlOriginal.proposal_digest, f.reference.proposalDigest)
      assert.deepEqual(JSON.parse(sqlOriginal.binding), f.binding)

      await fs.rm(f.directory, { recursive: true })
      const freshIo = tracedNative(cluster), fresh = compose(f, freshIo.executor)
      assert.deepEqual(await fresh.ingress.confirm(f.reference), { status: 'recorded', reference: f.reference })
      assert.deepEqual(freshIo.calls, [READ], 'explicit confirmation cannot reopen the deleted directory')
      const opened = await fresh.custody.open(f.reference, signal())
      if (opened.status !== 'recorded') assert.fail('stored original must reopen')
      assert.equal(opened.record.text, f.text)
      assert.equal(opened.record.completion, null)
      const importer = createV3ImportCoordinator({ ...f.synthetic.importPorts, quarantine: fresh.custody.forImport(opened.record.reference.binding) })
      const imported = await importer.submit(opened.record.text)
      if (imported.status !== 'completed' || imported.outcome.status !== 'prepared') assert.fail('actual I1 must prepare from SQL original')
      assert.equal(imported.replayed, false)
      assert.equal(imported.outcome.value.acceptance, 'not_committed')
      assert.equal(imported.outcome.value.reproof, 'required_before_commit')
      assert.ok(f.originals.control.extracts > 0)
      assert.deepEqual(await counts(f.binding.operationId), completedOnce)
      const confirmed = await compose(f, tracedNative(cluster).executor).custody.confirmImport(f.reference)
      assert.deepEqual(confirmed, { status: 'completed', outcome: imported.outcome, audit: f.auditFor(imported.outcome) })
      assert.deepEqual(await importer.submit(opened.record.text), { status: 'completed', replayed: true, outcome: imported.outcome })
      assert.deepEqual(await counts(f.binding.operationId), completedOnce)
      noPublication(f)
    })

    await t.test('duplicate original members and unsafe file are refused before any intake SQL or retention', async child => {
      const f = await fileFixture(child, 'in1-reject-original'), io = tracedNative(cluster), { ingress } = compose(f, io.executor)
      const variants = [
        f.text.replace('"jobId":', '"jobId":"PII_CANARY","jobId":'),
        f.text.replace('"factKind":', '"factKind":"PII_CANARY","factKind":'),
        f.text.replace('"jobId":', '"\\u006aobId":"PII_CANARY","jobId":'),
        f.text.replace('"factKind":', '"\\u0066actKind":"PII_CANARY","factKind":'),
      ]
      for (const text of variants) {
        assert.notEqual(text, f.text)
        assert.equal(readV3ProposalUpload(text, f.originals.registry).ok, true, 'ordinary parsing hides the earlier member')
        await fs.writeFile(f.path, text)
        assert.deepEqual(await ingress.deliver(f.delivery), { status: 'rejected', reason: 'invalid_upload' })
        assert.deepEqual(io.calls, [])
        assert.deepEqual(await counts(f.binding.operationId), empty)
      }
      await fs.unlink(f.path); await fs.symlink('nonexistent-synthetic.json', f.path)
      assert.deepEqual(await ingress.deliver(f.delivery), { status: 'rejected', reason: 'unsafe_file' })
      assert.deepEqual(io.calls, []); assert.equal(io.evidence.dispatched, 0)
      assert.deepEqual(await counts(f.binding.operationId), empty)
      assert.equal(f.originals.control.extracts, 0); noPublication(f)
    })

    await t.test('concurrent real deliveries converge; different bytes or runner binding cannot mutate custody', async child => {
      const f = await fileFixture(child, 'in1-concurrent'), observer = await connect()
      await observer.query("SET statement_timeout='2s'")
      let first: Readonly<{ pid: string; birth: string }> | undefined
      let second: Readonly<{ pid: string; birth: string }> | undefined
      let releaseFirst!: () => void
      const held = new Promise<void>(resolve => { releaseFirst = resolve })
      const leftAbort = new AbortController(), rightAbort = new AbortController()
      child.signal.addEventListener('abort', releaseFirst, { once: true })
      const leftIo = tracedNative(cluster, { async beforeCommit(statement, connection, rows) {
        assert.equal(statement, CAPTURE)
        const captured = JSON.parse(rows[0]!.result!)
        assert.equal(captured.status, 'recorded')
        assert.deepEqual(captured.record.reference, f.reference)
        const identity = (await connection.query('SELECT pg_backend_pid()::text AS pid,backend_start::text AS birth FROM pg_stat_activity WHERE pid=pg_backend_pid()'))[0]
        assert.ok(identity?.pid && identity.birth)
        first = { pid: identity.pid, birth: identity.birth }
        await held // Existing test-only hook; the actual INSERT remains uncommitted.
      } })
      const rightIo = tracedNative(cluster, { async beforeQuery(statement, connection) {
        assert.equal(statement, CAPTURE)
        const identity = (await connection.query('SELECT pg_backend_pid()::text AS pid,backend_start::text AS birth FROM pg_stat_activity WHERE pid=pg_backend_pid()'))[0]
        assert.ok(identity?.pid && identity.birth)
        second = { pid: identity.pid, birth: identity.birth }
      } })
      const pending = [compose(f, leftIo.executor).ingress.deliver(f.delivery, leftAbort.signal)]
      const expected = { status: 'recorded', reference: f.reference }
      try {
        const observationDeadline = performance.now() + 4000
        while (!first && performance.now() < observationDeadline) await delay(20)
        assert.ok(first, 'first actual INSERT must be held before COMMIT')
        pending.push(compose(f, rightIo.executor).ingress.deliver(f.delivery, rightAbort.signal))
        let observedContending = false
        while (performance.now() < observationDeadline) {
          if (second && rightIo.evidence.dispatched === 1) {
            const observed = await observer.query("SELECT count(*)::text AS n FROM pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz AND state='active' AND wait_event_type='Lock' AND query=$3::text AND $4::integer=ANY(pg_blocking_pids(pid)) AND EXISTS (SELECT 1 FROM pg_stat_activity blocker WHERE blocker.pid=$4::integer AND blocker.backend_start=$5::timestamptz AND blocker.state='idle in transaction')",
              [pgText(second.pid, 23), pgText(second.birth), pgText(CAPTURE), pgText(first.pid, 23), pgText(first.birth)])
            if (observed[0]?.n === '1') { observedContending = true; break }
          }
          await delay(20)
        }
        assert.equal(observedContending, true, 'independent second SQL capture must actually wait on the first transaction')
        assert.ok(second && leftIo.evidence.pids.includes(first.pid) && rightIo.evidence.pids.includes(second.pid))
        assert.notEqual(first.pid, second.pid)
        assert.equal(leftIo.signals[0]?.aborted, false); assert.equal(rightIo.signals[0]?.aborted, false)
        assert.equal(leftIo.evidence.acknowledged, 0); assert.equal(rightIo.evidence.acknowledged, 0)
        releaseFirst()
        assert.deepEqual(await Promise.all(pending), [expected, expected])
        for (const io of [leftIo, rightIo]) {
          assert.deepEqual(io.calls, [CAPTURE])
          assert.equal(io.evidence.acknowledged, 1); assert.equal(io.evidence.drained, 1)
        }
      } finally {
        // Every failure releases the owned hook, cancels both calls and joins
        // their terminal cleanup; no transaction/latch survives this test.
        releaseFirst(); leftAbort.abort(); rightAbort.abort()
        try { await Promise.allSettled(pending) }
        finally { child.signal.removeEventListener('abort', releaseFirst); close(observer) }
      }
      assert.deepEqual(await counts(f.binding.operationId), capturedOnly)
      const before = await original(f.binding.operationId)
      const ordinary = compose(f, tracedNative(cluster).executor)
      await fs.writeFile(f.path, f.text + '\n')
      assert.deepEqual(await ordinary.ingress.deliver(f.delivery), { status: 'collision' })
      await fs.writeFile(f.path, f.text)
      const changed: V3IntakeBinding[] = [
        { ...f.binding, runnerId: `runner3_${'d'.repeat(32)}` },
        { ...f.binding, deliveryId: `delivery3_${'e'.repeat(32)}` },
        { ...f.binding, inputRevision: `snapshot:${'f'.repeat(64)}` },
      ]
      for (const binding of changed) {
        assert.notDeepEqual(binding, f.binding)
        assert.deepEqual(await ordinary.ingress.deliver({ ...f.delivery, binding }), { status: 'collision' })
        assert.deepEqual(await original(f.binding.operationId), before)
        assert.deepEqual(await counts(f.binding.operationId), capturedOnly)
      }
      noPublication(f)
    })

    await t.test('actual lost capture ACK is confirmed only after drain; lost confirm stays uncertain across file removal', async child => {
      for (const loseConfirm of [false, true]) {
        const f = await fileFixture(child, `in1-lost-ack-${loseConfirm}`)
        const io = tracedNative(cluster, { loseAcknowledgement: statement => statement === CAPTURE || loseConfirm && statement === READ })
        const { ingress } = compose(f, io.executor)
        const result = await ingress.deliver(f.delivery)
        assert.deepEqual(result, { status: loseConfirm ? 'unconfirmed' : 'recorded', reference: f.reference })
        assert.deepEqual(io.calls, [CAPTURE, READ])
        assert.deepEqual(io.events, [
          { phase: 'start', statement: CAPTURE, drained: 0 }, { phase: 'settled', statement: CAPTURE, drained: 1 },
          { phase: 'start', statement: READ, drained: 1 }, { phase: 'settled', statement: READ, drained: 2 },
        ])
        assert.equal(io.evidence.acknowledged, 2, 'real COMMIT acknowledgements existed before deliberate response loss')
        assert.deepEqual(await counts(f.binding.operationId), capturedOnly)
        await fs.rm(f.directory, { recursive: true })
        const fresh = compose(f, tracedNative(cluster).executor)
        assert.deepEqual(await fresh.ingress.confirm(f.reference), { status: 'recorded', reference: f.reference })
        assert.deepEqual(await counts(f.binding.operationId), capturedOnly)
        noPublication(f)
      }
    })

    for (const [mode, lockKey] of [['external_abort', 1], ['deadline', 2]] as const) {
      await t.test(`actual precommit SQL lock wait propagates ${mode}, drains and leaves no custody`, async child => {
        const f = await fileFixture(child, `in1-${mode}`), observer = await connect()
        const blockerPid = (await owner.query('SELECT pg_backend_pid()::text AS pid'))[0]!.pid!
        await observer.query("SET statement_timeout='2s'")
        await owner.query('BEGIN')
        await owner.query(LOCK, [pgText('7301', 23), pgText(String(lockKey), 23)])
        let target: Readonly<{ pid: string; birth: string }> | undefined, reachedPrecommit = false
        const controller = new AbortController()
        const io = tracedNative(cluster, { async beforeCommit(statement, connection, rows) {
          assert.equal(statement, CAPTURE)
          assert.equal(JSON.parse(rows[0]!.result!).status, 'recorded', 'actual capture returned its inserted original before COMMIT')
          reachedPrecommit = true
          const identity = (await connection.query('SELECT pg_backend_pid()::text AS pid,backend_start::text AS birth FROM pg_stat_activity WHERE pid=pg_backend_pid()'))[0]
          assert.ok(identity?.pid && identity.birth)
          target = { pid: identity.pid, birth: identity.birth }
          await connection.query(LOCK, [pgText('7301', 23), pgText(String(lockKey), 23)])
        } })
        const pending = compose(f, io.executor).ingress.deliver(f.delivery, controller.signal)
        try {
          let observedBlocked = false
          const observationDeadline = performance.now() + 4000
          while (performance.now() < observationDeadline) {
            if (target && io.evidence.dispatched === 1) {
              const observed = await observer.query("SELECT count(*)::text AS n FROM pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz AND state='active' AND wait_event_type='Lock' AND query=$3::text AND $4::integer=ANY(pg_blocking_pids(pid))",
                [pgText(target.pid, 23), pgText(target.birth), pgText(LOCK), pgText(blockerPid, 23)])
              if (observed[0]?.n === '1') { observedBlocked = true; break }
            }
            await delay(20)
          }
          assert.equal(observedBlocked, true, 'exact written transaction must reach the actual lock wait before cancellation')
          assert.equal(reachedPrecommit, true)
          assert.ok(target && io.evidence.pids.includes(target.pid))
          assert.equal(io.signals[0]?.aborted, false)
          if (mode === 'external_abort') controller.abort()
          // In deadline mode N1's unchanged default 5000 ms budget aborts the
          // owned signal. We await its real terminal drain, not a detached race.
          assert.deepEqual(await pending, { status: 'unconfirmed', reference: f.reference })
          assert.equal(io.signals[0]?.aborted, true)
          assert.deepEqual(io.calls, [CAPTURE], 'no post-abort/expiry confirmation may start')
          assert.equal(io.evidence.acknowledged, 0)
          assert.equal(io.evidence.aborted, 1); assert.equal(io.evidence.drained, 1)
          assert.equal((await observer.query('SELECT count(*)::text AS n FROM pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz',
            [pgText(target.pid, 23), pgText(target.birth)]))[0]?.n, '0', 'target is gone while blocker still holds its transaction lock')
        } finally {
          controller.abort()
          try { await owner.query('ROLLBACK') }
          finally { try { await pending } finally { close(observer) } }
        }
        assert.deepEqual(await counts(f.binding.operationId), empty, 'the actual uncommitted capture was rolled back')
        assert.deepEqual(await compose(f, tracedNative(cluster).executor).ingress.confirm(f.reference), { status: 'not_attempted' })
        noPublication(f)
      })
    }

    await t.test('untrusted custody cannot approve a method; actual I1 persists method_not_approved', async child => {
      const f = await fileFixture(child, 'in1-method-unapproved'), { custody, ingress } = compose(f, tracedNative(cluster).executor)
      f.synthetic.control.methodEnabled = false
      assert.deepEqual(await ingress.deliver(f.delivery), { status: 'recorded', reference: f.reference })
      assert.deepEqual(await counts(f.binding.operationId), capturedOnly)
      await fs.rm(f.directory, { recursive: true })
      const opened = await custody.open(f.reference, signal())
      if (opened.status !== 'recorded') assert.fail('untrusted original must reopen')
      const importer = createV3ImportCoordinator({ ...f.synthetic.importPorts, quarantine: custody.forImport(opened.record.reference.binding) })
      const imported = await importer.submit(opened.record.text)
      const outcome = { status: 'unavailable', reason: 'method_not_approved' } as const
      assert.deepEqual(imported, { status: 'completed', replayed: false, outcome })
      assert.deepEqual(await compose(f, tracedNative(cluster).executor).custody.confirmImport(f.reference),
        { status: 'completed', outcome, audit: f.auditFor(outcome) })
      assert.deepEqual(await counts(f.binding.operationId), completedOnce)
      assert.equal(f.originals.control.extracts, 0)
      noPublication(f)
    })
    t.diagnostic(JSON.stringify({ schema: 'in1-native-v1', database: cluster.version, realFilesystem: true,
      realSqlTransactions: true, sourceCalls: 0, acceptedWrites: 0, hosted: false, mandatory: true,
      processRestartEvidence: 'inherited S1 suite only; these fresh connections are not process restarts' }))
  } finally { t.signal.removeEventListener('abort', stop); stop() }
})
