// Mandatory C1 native proof, executed only in the existing isolated CI runtime.
// Fictional .example originals; no real AA qualification or accepted publication.
import assert from 'node:assert/strict'
import { promises as fs, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test, type TestContext } from 'node:test'
import { sha256Hex } from '../../../lib/readiness/digest'
import { startLocalProofCluster, type LocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection, pgText } from '../official-truth-integrated-pilot-1/pg-wire'
import { nativeExecutor } from '../official-truth-v3-intake-store-1/native-adapter'
import { createV3ResearchFileIngress } from '../../../lib/readiness/official-truth-product-v3/ingress/service-server'
import type { V3IngressRootPin } from '../../../lib/readiness/official-truth-product-v3/ingress/types'
import { createV3ProposalIntakeStore } from '../../../lib/readiness/official-truth-product-v3/storage/intake-server'
import type { V3IntakeSqlExecutor } from '../../../lib/readiness/official-truth-product-v3/storage/quarantine-postgres'
import { readV3RetainableProposal } from '../../../lib/readiness/official-truth-product-v3/storage/proposal-bytes'
import { createV3ImportCoordinator } from '../../../lib/readiness/official-truth-product-v3/import/service-server'
import { readV3ProposalUpload } from '../../../lib/readiness/official-truth-product-v3/import/interface'
import { assertC1NoPublication, assertC1Prepared, c1Fixture, c1InvalidShapes } from '../../../lib/readiness/official-truth-product-v3/global-conditions/test-support/fixture'

const CAPTURE = 'SELECT official_v3_intake_api.capture_v1($1::jsonb,$2::text,$3::text) AS result'
const READ = 'SELECT official_v3_intake_api.read_v1($1::jsonb,$2::text,$3::integer) AS result'
const FINISH = 'SELECT official_v3_intake_api.finish_v1($1::jsonb,$2::text,$3::integer,$4::integer,$5::uuid,$6::jsonb,$7::jsonb) AS result'

async function fileFixture(t: TestContext, seed: string, approved: boolean) {
  // c1Fixture checks full context/key/job against Root's independent IN1 fixture.
  const f = c1Fixture(seed, approved)
  const parent = await fs.mkdtemp(join(tmpdir(), 'jetnity-c1-'))
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

function tracedNative(cluster: LocalProofCluster) {
  const native = nativeExecutor(cluster), calls: string[] = []
  const executor: V3IntakeSqlExecutor = {
    async execute(statement, parameters, signal) {
      calls.push(statement)
      return native.executor.execute(statement, parameters, signal)
    },
  }
  return { ...native, executor, calls }
}
function assertCommitted(io: ReturnType<typeof tracedNative>) {
  assert.ok(io.calls.length > 0)
  assert.equal(io.evidence.dispatched, io.calls.length)
  // The unchanged native executor increments acknowledged only after its actual
  // owned COMMIT has been acknowledged, and drains the exact backend before return.
  assert.equal(io.evidence.acknowledged, io.calls.length)
  assert.equal(io.evidence.drained, io.calls.length)
  assert.equal(io.evidence.rolledBack, 0); assert.equal(io.evidence.aborted, 0)
  assert.deepEqual(io.evidence.sqlCodes, [])
}
function compose(f: FileFixture, executor: V3IntakeSqlExecutor) {
  const custody = createV3ProposalIntakeStore({ registry: f.originals.registry, executor, leaseMilliseconds: 30_000 })
  const ingress = createV3ResearchFileIngress({ root: f.root, registry: f.originals.registry, intake: custody.intake })
  return { custody, ingress }
}

test('C1 mandatory native PostgreSQL: revision2 original and complete nested outcome survive real custody', { timeout: 150_000 }, async t => {
  const cluster = startLocalProofCluster(), connections = new Set<LocalPgConnection>()
  const connect = async () => { const connection = await LocalPgConnection.connect(cluster); connections.add(connection); return connection }
  const stop = () => { for (const connection of connections) connection.close(); cluster.stop() }
  t.signal.addEventListener('abort', stop, { once: true })
  try {
    const owner = await connect()
    await owner.query(readFileSync(new URL('../official-truth-v3-intake-store-1/intake-candidate.sql', import.meta.url), 'utf8'))
    await owner.query('CREATE ROLE ot_s1_test_runner LOGIN INHERIT; GRANT ot_v3_intake_caller TO ot_s1_test_runner')
    assert.deepEqual(await owner.query("SELECT official_v3_intake_private.proposal_shape_v1()->>'revision' AS revision"), [{ revision: '2' }])

    const counts = async (operation: string) => (await owner.query(`SELECT
      (SELECT count(*)::text FROM official_v3_intake_private.operations_v1 WHERE operation_id=$1::text) AS originals,
      (SELECT count(*)::text FROM official_v3_intake_private.reservations_v1 WHERE operation_id=$1::text) AS reservations,
      (SELECT count(*)::text FROM official_v3_intake_private.completions_v1 WHERE operation_id=$1::text) AS completions`, [pgText(operation)]))[0]
    const original = async (operation: string) => (await owner.query("SELECT encode(original_bytes,'hex') AS bytes,proposal_digest,binding::text FROM official_v3_intake_private.operations_v1 WHERE operation_id=$1::text", [pgText(operation)]))[0]
    const completion = async (operation: string) => (await owner.query('SELECT outcome::text,audit::text FROM official_v3_intake_private.completions_v1 WHERE operation_id=$1::text', [pgText(operation)]))[0]
    const empty = { originals: '0', reservations: '0', completions: '0' }
    const capturedOnly = { originals: '1', reservations: '0', completions: '0' }
    const completedOnce = { originals: '1', reservations: '1', completions: '1' }

    // Separate fixtures/ports: the positive synthetic grant cannot enable the
    // unapproved case. Neither fixture can write Accepted/cache/publication state.
    for (const approved of [false, true]) await t.test(approved
      ? 'synthetic approved method: full prepared nested outcome commits, reopens and replays without acceptance'
      : 'unapproved method: actual file capture, fresh SQL original and honest unavailable completion', async child => {
      const f = await fileFixture(child, `c1-native-${approved ? 'prepared' : 'unapproved'}`, approved)
      const captureIo = tracedNative(cluster), first = compose(f, captureIo.executor)
      assert.notEqual(f.text, JSON.stringify(f.proposal), 'original whitespace is part of retained bytes')
      assert.equal(f.synthetic.control.methodEnabled, approved)
      assert.equal(f.originals.control.extracts, 0)
      assert.deepEqual(await first.ingress.deliver(f.delivery, child.signal), { status: 'recorded', reference: f.reference })
      assert.deepEqual(captureIo.calls, [CAPTURE]); assertCommitted(captureIo)
      assert.deepEqual(await counts(f.binding.operationId), capturedOnly)
      const retained = await original(f.binding.operationId)
      assert.ok(retained?.bytes && retained.binding)
      assert.ok(Buffer.from(retained.bytes, 'hex').equals(Buffer.from(f.text, 'utf8')))
      assert.equal(retained.proposal_digest, f.reference.proposalDigest)
      assert.deepEqual(JSON.parse(retained.binding), f.binding)
      assert.equal(f.originals.control.extracts, 0, 'custody is not source extraction')
      assertC1NoPublication(f)

      // Remove the real input before constructing fresh custody. Only original
      // bytes reopened from SQL, never a cached file/proposal, are submitted to I1.
      await fs.rm(f.directory, { recursive: true })
      const importIo = tracedNative(cluster), fresh = compose(f, importIo.executor)
      assert.deepEqual(await fresh.ingress.confirm(f.reference, child.signal), { status: 'recorded', reference: f.reference })
      assert.deepEqual(importIo.calls, [READ], 'confirmation cannot reopen the deleted directory')
      const opened = await fresh.custody.open(f.reference, child.signal)
      if (opened.status !== 'recorded') assert.fail('revision2 original must reopen from SQL')
      assert.equal(opened.record.text, f.text)
      assert.deepEqual(opened.record.reference, f.reference)
      assert.deepEqual(opened.record.upload.proposal.context, f.context)
      assert.equal(opened.record.completion, null)
      const imported = await createV3ImportCoordinator({ ...f.synthetic.importPorts,
        quarantine: fresh.custody.forImport(opened.record.reference.binding) }).submit(opened.record.text, child.signal)
      if (imported.status !== 'completed') assert.fail(`actual I1 must complete, received ${imported.status}`)
      assert.equal(imported.replayed, false)
      const audit = f.auditFor(imported.outcome)
      if (approved) {
        assertC1Prepared(f, imported.outcome, audit)
        assert.ok(f.originals.control.extracts >= 2, 'actual fictional primary and counter observations were inspected')
      } else {
        assert.deepEqual(imported.outcome, { status: 'unavailable', reason: 'method_not_approved' })
        assert.equal(f.originals.control.extracts, 0)
        assert.equal(audit.contextKey, f.identity.contextKey)
      }
      assert.equal(importIo.calls.filter(statement => statement === FINISH).length, 1)
      assertCommitted(importIo)
      assert.notEqual(importIo.evidence.pids[0], captureIo.evidence.pids[0], 'fresh custody uses a fresh owned connection')
      assert.deepEqual(await counts(f.binding.operationId), completedOnce)

      // Inspect the actual persisted row as well as the canonical custody reader.
      // Positive R1 coverage includes decision/primary/counter/version contexts.
      const persisted = await completion(f.binding.operationId)
      assert.ok(persisted?.outcome && persisted.audit)
      const persistedOutcome = JSON.parse(persisted.outcome), persistedAudit = JSON.parse(persisted.audit)
      assert.deepEqual(persistedOutcome, imported.outcome); assert.deepEqual(persistedAudit, audit)
      if (approved) assertC1Prepared(f, persistedOutcome, persistedAudit)
      assertC1NoPublication(f)

      // Fresh importer/custody/native executor; no previous instance provides the
      // answer. The unchanged executor opens and drains a new SQL connection on
      // every call, so a retained full completion is the only replay source.
      const replayIo = tracedNative(cluster), reopened = compose(f, replayIo.executor)
      const replayOriginal = await reopened.custody.open(f.reference, child.signal)
      if (replayOriginal.status !== 'recorded' || !replayOriginal.record.completion) assert.fail('full completion must reopen')
      assert.equal(replayOriginal.record.text, f.text)
      assert.deepEqual(replayOriginal.record.reference, f.reference)
      assert.deepEqual(replayOriginal.record.upload.proposal.context, f.context)
      assert.deepEqual(replayOriginal.record.completion, { outcome: imported.outcome, audit })
      if (approved) assertC1Prepared(f, replayOriginal.record.completion.outcome, replayOriginal.record.completion.audit)
      assert.deepEqual(await reopened.custody.confirmImport(f.reference, child.signal), { status: 'completed', outcome: imported.outcome, audit })
      const beforeReplayExtracts = f.originals.control.extracts
      const replay = await createV3ImportCoordinator({ ...f.synthetic.importPorts,
        quarantine: reopened.custody.forImport(f.binding) }).submit(replayOriginal.record.text, child.signal)
      assert.deepEqual(replay, { status: 'completed', replayed: true, outcome: imported.outcome })
      assert.equal(f.originals.control.extracts, beforeReplayExtracts, 'replay does not recreate a result through extraction')
      assert.equal(replayIo.calls.includes(FINISH), false)
      assertCommitted(replayIo)
      assert.notEqual(replayIo.evidence.pids[0], importIo.evidence.pids[0])
      assert.deepEqual(await counts(f.binding.operationId), completedOnce)
      assert.deepEqual(await original(f.binding.operationId), retained)
      assertC1NoPublication(f)
    })

    await t.test('actual SQL rejects the new closed-subtree negatives and exposes its shape-only boundary', async child => {
      const f = c1Fixture('c1-native-sql-shape', false), io = tracedNative(cluster)
      const invalid = c1InvalidShapes(f.proposal)
      for (const { label, value } of invalid) {
        const text = JSON.stringify(value)
        const result = await io.executor.execute(CAPTURE, [JSON.stringify(f.binding), text, sha256Hex(text)], child.signal)
        if (result.status !== 'acknowledged') assert.fail(`direct SQL shape case did not settle: ${label}`)
        assert.equal(result.rows.length, 1)
        assert.deepEqual(JSON.parse(result.rows[0]!.result!), { status: 'invalid' }, label)
        assert.deepEqual(await counts(f.binding.operationId), empty, label)
      }
      const valid = await io.executor.execute(CAPTURE, [JSON.stringify(f.binding), f.text, f.reference.proposalDigest], child.signal)
      if (valid.status !== 'acknowledged') assert.fail('direct valid revision2 SQL capture')
      const captured = JSON.parse(valid.rows[0]!.result!)
      assert.equal(captured.status, 'recorded')
      assert.deepEqual(captured.record.reference, f.reference)
      assert.equal(captured.record.text, f.text)
      assert.deepEqual(JSON.parse(captured.record.text).context, f.context)
      assert.deepEqual(await counts(f.binding.operationId), capturedOnly)
      assertCommitted(io)

      const reversed = { ...f.proposal, context: { ...f.context, application: { ...f.context.application,
        tripStartAndEndWindow: { from: '2026-11-14', through: '2026-11-13' } } } }
      const changedUnderOldKey = { ...f.proposal, context: { ...f.context, application: { ...f.context.application,
        tripStartAndEndWindow: { from: '2026-11-08', through: '2026-11-13' } } } }
      for (const value of [reversed, changedUnderOldKey]) {
        // Read the descriptor predicate only. No invalid original is captured:
        // SQL shape is not ordering, complete-identity or source authority proof.
        const text = JSON.stringify(value)
        assert.deepEqual(await owner.query('SELECT official_v3_intake_private.proposal_retainable_v1($1::jsonb)::text AS matches', [pgText(text)]), [{ matches: 'true' }])
        assert.equal(readV3RetainableProposal(text, f.originals.registry).ok, false)
      }
      assert.deepEqual(await counts(f.binding.operationId), capturedOnly)
      assert.equal(f.originals.control.extracts, 0); assertC1NoPublication(f)
      child.diagnostic(`${invalid.length} direct SQL shape negatives left zero originals/reservations/completions; separate valid capture retained complete revision2`)
    })

    await t.test('duplicate purpose/from including escaped names are rejected before any original SQL retention', async child => {
      const f = await fileFixture(child, 'c1-native-duplicates', false), io = tracedNative(cluster), { ingress } = compose(f, io.executor)
      const variants = [
        f.text.replace('"purpose":', '"purpose":"PRIVATE_CANARY","purpose":'),
        f.text.replace('"from":', '"from":"PRIVATE_CANARY","from":'),
        f.text.replace('"purpose":', '"\\u0070urpose":"PRIVATE_CANARY","purpose":'),
        f.text.replace('"from":', '"\\u0066rom":"PRIVATE_CANARY","from":'),
      ]
      for (const text of variants) {
        assert.notEqual(text, f.text)
        assert.equal(readV3ProposalUpload(text, f.originals.registry).ok, true, 'ordinary JSON parsing hides the earlier member')
        await fs.writeFile(f.path, text)
        assert.deepEqual(await ingress.deliver(f.delivery, child.signal), { status: 'rejected', reason: 'invalid_upload' })
        assert.deepEqual(io.calls, [])
        assert.deepEqual(await counts(f.binding.operationId), empty)
      }
      assert.equal(io.evidence.dispatched, 0)
      assert.equal(f.originals.control.extracts, 0); assertC1NoPublication(f)
    })
  } finally {
    t.signal.removeEventListener('abort', stop)
    stop()
  }
})
