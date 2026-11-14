import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { Resolver } from 'node:dns/promises'
import type { ClientRequest, IncomingMessage } from 'node:http'
import https from 'node:https'
import { performance } from 'node:perf_hooks'
import { test, mock } from 'node:test'
import { Parser, type DefaultTreeAdapterMap } from 'parse5'
import { sha256Hex } from '@/lib/readiness/digest'
import { hrs1Canonical, hrs1Clock, hrs1Hash, hrs1OriginalEvidence, hrs1Ref, type Hrs1Binding, type Hrs1FixedOperation, type Hrs1Verification } from '../result/contract'
import { readV3SourceDecisionRecord } from '../contract'
import { createHrs1SourceConsumer, type Hrs1SourceChallenge } from '../result/source-proof'
import { composeHrs1Invocation } from '../result/composition'
import { createM04InvocationScope, createM04LanePool } from '../jobs/owned-scope'
import { readM04Command, type M04Authority, type M04Config, type M04FixedOperation } from '../jobs/contract'
import type { V3ManagedJobRecord, V3QueueCommit } from '../monitor/queue'
import { readV3RetainableProposal } from '../storage/proposal-bytes'
import { AA_CH_DE_DELIVERY_PRODUCER } from './aa-ch-de-delivery-producer'
import { AA_CH_DE_PUBLICATION, BERN_CH_DE_PUBLICATION, selectedAaChDeQualification,
  type AaChDeSourceRole } from './aa-ch-de-definition'
import { readAaChDeOwnedSource, readBernChDeOwnedSource, readAaChDeOwnedSources,
  inspectAaChDeOwnedOriginal, inspectAaChDeOwnedAttempt, type AaChDeOwnedOriginal } from './aa-ch-de-owned-read'
import { qualifyAaChDeOriginal, selectedAaChDeProgramForBinding } from './aa-ch-de-qualification'
import { AA_CH_DE_SOURCE_CUSTODY_ISSUER as issuer } from './aa-ch-de-issuer'

type WireOptions = Readonly<{ status?: number; headers?: readonly string[]; body?: string | Buffer;
  complete?: boolean; hangBody?: boolean; holdClose?: boolean }>
type WireRequestOptions = https.RequestOptions & { autoSelectFamily?: boolean }
function syntheticWire(options: WireOptions = {}, counterOptions: WireOptions = options) {
  let active = 0
  const requests: WireRequestOptions[] = [], dns: string[] = []
  const releases = new Map<AaChDeSourceRole, () => void>()
  mock.method(Resolver.prototype, 'resolve4', (async (hostname: string) => { dns.push(hostname); return ['1.1.1.1'] }) as Resolver['resolve4'])
  mock.method(Resolver.prototype, 'resolve6', (async (hostname: string) => { dns.push(hostname); return [] }) as Resolver['resolve6'])
  mock.method(Resolver.prototype, 'cancel', () => undefined)
  const implementation = ((configuration: WireRequestOptions, callback: (response: IncomingMessage) => void) => {
    assert.ok(([AA_CH_DE_PUBLICATION.hostname, BERN_CH_DE_PUBLICATION.hostname] as readonly string[]).includes(String(configuration.hostname)))
    const role = configuration.hostname === AA_CH_DE_PUBLICATION.hostname ? 'primary' : 'counter'
    const selected = role === 'primary' ? options : counterOptions
    const body = selected.body ?? '<html><body>synthetic transport fixture</body></html>'
    active++; requests.push(configuration)
    const request = new EventEmitter() as EventEmitter & { end(): void; destroy(): void }
    const response = new EventEmitter() as EventEmitter & { statusCode: number; rawHeaders: string[]; complete: boolean; destroy(): void }
    const socket = new EventEmitter() as EventEmitter & { destroy(): void }
    let closed = false
    const close = () => {
      if (closed) return
      closed = true; active--
      response.emit('close'); request.emit('close'); socket.emit('close')
    }
    releases.set(role, close)
    const destroy = () => { if (!selected.holdClose) queueMicrotask(close) }
    request.destroy = response.destroy = socket.destroy = destroy
    response.statusCode = selected.status ?? 200
    response.rawHeaders = [...(selected.headers ?? ['Content-Type', 'text/html;charset=UTF-8', 'Content-Length', String(Buffer.byteLength(body))])]
    response.complete = selected.complete ?? true
    request.end = () => {
      request.emit('socket', socket)
      queueMicrotask(() => {
        callback(response as unknown as IncomingMessage)
        if (selected.hangBody) return
        queueMicrotask(() => {
          response.emit('data', Buffer.from(body))
          response.emit('end')
          if (!selected.holdClose) queueMicrotask(close)
        })
      })
    }
    return request as unknown as ClientRequest
  }) as typeof https.request
  mock.method(https, 'request', implementation)
  return { requests, dns, get calls() { return requests.length }, get active() { return active },
    release(role: AaChDeSourceRole) { releases.get(role)?.() }, releaseAll() { for (const release of releases.values()) release() } }
}
const tick = () => new Promise<void>(resolve => setImmediate(resolve))
const readerFor = (role: AaChDeSourceRole) => role === 'primary' ? readAaChDeOwnedSource : readBernChDeOwnedSource
const publicationFor = (role: AaChDeSourceRole) => role === 'primary' ? AA_CH_DE_PUBLICATION : BERN_CH_DE_PUBLICATION
function sourceChallenge(at: string): Hrs1SourceChallenge {
  const program = selectedAaChDeQualification(); assert.ok(program)
  const clock = hrs1Clock(at, program.legalTimeZone); assert.ok(clock)
  const history = { pointer: { revision: 0, state: 'missing' as const, versionRef: null }, version: null,
    decision: null, decisionPredecessor: null, decisionArchiveAppend: null, invalidatedProjectionRefs: [] }
  return { binding: program.binding, history, stickyDecision: null, suppressionEpoch: 0,
    request: { context: program.context, contextKey: program.contextKey, factKind: 'requirement_effect',
      references: [program.source, program.counter.source].map(source => ({ sourceId: source.sourceId,
        contentItemId: source.contentItemId, representationId: source.representationId })),
      method: program.method, clock, previousDecision: null, decisionRef: hrs1Ref('source-decision', { test: 'private-custody', at }) } }
}

test('AA/Bern source: finalized private custody reuses only its immutable original qualification', async t => {
  const start = Date.parse('2026-11-14T10:00:00.000Z')
  t.mock.timers.enable({ apis: ['Date'], now: start })
  const wire = syntheticWire()
  let parseStarts = 0
  const onStartTag = Parser.prototype.onStartTag
  mock.method(Parser.prototype, 'onStartTag', function(this: Parser<DefaultTreeAdapterMap>, token: Parameters<typeof onStartTag>[0]) {
    parseStarts++; return onStartTag.call(this, token)
  })
  try {
    const signal = new AbortController().signal, challenge = sourceChallenge(new Date().toISOString())
    const inspected = await issuer.inspect(challenge, signal); assert.ok(inspected)
    assert.equal(wire.calls, 2); assert.equal(wire.active, 0)
    const initialParses = parseStarts; assert.ok(initialParses > 0, 'real selected parser must qualify the owned fixture bytes first')
    assert.equal(inspected.verification.decision.conclusion, 'primary_unclear', 'invented wire bytes are never an official clear rule')
    t.mock.timers.setTime(start + 10)
    const at = hrs1Clock(new Date().toISOString(), challenge.binding.legalTimeZone); assert.ok(at)
    const decision = { ...inspected.verification.decision, evaluatedAt: at.now, legalAsOfDate: at.legalDate }
    const finalized = await issuer.finalize(inspected.receipt, inspected.verification, decision, null, at, signal); assert.ok(finalized)
    for (let index = 0; index < 3; index++) assert.deepEqual(await issuer.reprove(finalized.receipt, finalized.verification, at, signal), finalized.verification)
    assert.equal(parseStarts, initialParses, 'unchanged private qualification must not parse the same original again')
    assert.equal(wire.calls, 2, 'reproof does not invent a new source read')

    assert.equal(await issuer.reprove({ ...finalized.receipt }, finalized.verification, at, signal), null)
    const alteredOriginal = { ...finalized.verification, originals: finalized.verification.originals.map((original, index) => index
      ? original : { ...original, bodyText: '<html>foreign original</html>' }) }
    assert.equal(await issuer.reprove(finalized.receipt, alteredOriginal, at, signal), null)
    const alteredClock = { ...finalized.verification, originals: finalized.verification.originals.map((original, index) => index
      ? original : { ...original, qualification: { ...original.qualification, checkedAt: at.now } }) }
    assert.equal(await issuer.reprove(finalized.receipt, alteredClock, at, signal), null)
    assert.equal(await issuer.finalize(inspected.receipt, inspected.verification,
      { ...decision, evaluatedAt: new Date(start + 11).toISOString() }, null, at, signal), null)
    const aborted = new AbortController(); aborted.abort()
    assert.equal(await issuer.reprove(finalized.receipt, finalized.verification, at, aborted.signal), null)

    t.mock.timers.setTime(Date.parse('2026-11-15T00:00:00.000Z'))
    assert.equal(await issuer.reprove(finalized.receipt, finalized.verification, at, signal), null, 'old legal date cannot survive a current-day change')
    t.mock.timers.setTime(Date.parse(finalized.verification.validUntilExclusive))
    const expired = hrs1Clock(new Date().toISOString(), challenge.binding.legalTimeZone); assert.ok(expired)
    assert.equal(await issuer.reprove(finalized.receipt, finalized.verification, expired, signal), null, 'the original expiry never renews')
    assert.equal(parseStarts, initialParses)
  } finally { wire.releaseAll(); mock.restoreAll(); t.mock.timers.reset() }
})

test('AA/Bern source: reopen qualifies new native receipts even for identical stored bytes', async t => {
  const start = Date.parse('2026-11-14T10:00:00.000Z')
  t.mock.timers.enable({ apis: ['Date'], now: start })
  const primary = { body: '<html><body>synthetic primary ambiguity</body></html>' }
  const wire = syntheticWire(primary, { body: '<html><body>synthetic counter ambiguity</body></html>' })
  let parseStarts = 0
  const onStartTag = Parser.prototype.onStartTag
  mock.method(Parser.prototype, 'onStartTag', function(this: Parser<DefaultTreeAdapterMap>, token: Parameters<typeof onStartTag>[0]) {
    parseStarts++; return onStartTag.call(this, token)
  })
  try {
    const signal = new AbortController().signal, challenge = sourceChallenge(new Date().toISOString())
    const inspected = await issuer.inspect(challenge, signal); assert.ok(inspected)
    const initialParses = parseStarts; assert.ok(initialParses > 0)
    t.mock.timers.setTime(start + 1000)
    const reopened = await issuer.reopen(inspected.verification, signal); assert.ok(reopened)
    assert.notEqual(reopened.receipt, inspected.receipt); assert.equal(wire.calls, 4)
    assert.ok(parseStarts > initialParses, 'new native custody must perform its own first qualification')
    assert.deepEqual(reopened.verification, inspected.verification, 'historical timestamps and absolute expiry are unchanged')
    const reopenedParses = parseStarts
    const at = hrs1Clock(new Date().toISOString(), challenge.binding.legalTimeZone); assert.ok(at)
    assert.deepEqual(await issuer.reprove(reopened.receipt, reopened.verification, at, signal), reopened.verification)
    assert.equal(parseStarts, reopenedParses)
    primary.body = '<html><body>changed actual primary bytes</body></html>'
    t.mock.timers.setTime(start + 2000)
    assert.equal(await issuer.reopen(inspected.verification, signal), null, 'a matching DTO cannot reuse old custody across a changed read')
    assert.equal(wire.calls, 6); assert.equal(wire.active, 0)
  } finally { wire.releaseAll(); mock.restoreAll(); t.mock.timers.reset() }
})

test('AA/Bern source: selected snapshot transfer has no fallback while the generic consumer still reads history', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-11-14T10:00:00.000Z') })
  try {
    for (const mode of ['generic', 'selected', 'missing', 'foreign', 'aborted'] as const) {
      const wire = syntheticWire(), challenge = sourceChallenge(new Date().toISOString())
      const program = selectedAaChDeQualification(); assert.ok(program)
      let reads = 0, transfers = 0
      const snapshot = { history: challenge.history,
        head: { pointer: challenge.history.pointer, sourceDecisionRef: null, historyArchive: null },
        stickyDecision: null, suppressionEpoch: 0, generation: 0, suppression: null }
      const controller = new AbortController()
      const consumer = createHrs1SourceConsumer({ binding: program.binding, registry: program.registry,
        clock: () => challenge.request.clock,
        fixed: async command => { reads++; assert.equal(command.operation, 'history'); return { status: 'snapshot', value: snapshot } },
        ...(mode === 'generic' ? {} : { takeInitialHistory(request, signal) {
          transfers++; assert.equal(signal, controller.signal); assert.deepEqual(request, challenge.request)
          if (mode === 'aborted') controller.abort()
          if (mode === 'missing') return null
          return mode === 'foreign' ? { ...snapshot, history: { ...snapshot.history, decision: {} as never } } : snapshot
        } }),
      })
      try {
        const result = await consumer.evidence.inspect(challenge.request, controller.signal)
        assert.equal(result.status, mode === 'generic' || mode === 'selected' ? 'inspected' : 'unavailable', mode)
        assert.equal(reads, mode === 'generic' ? 1 : 0, 'selected failure must never start a replacement history read')
        assert.equal(transfers, mode === 'generic' ? 0 : 1)
        assert.equal(wire.calls, mode === 'generic' || mode === 'selected' ? 2 : 0)
        assert.equal(wire.active, 0)
      } finally { wire.releaseAll(); mock.restoreAll() }
    }
  } finally { t.mock.timers.reset() }
})

test('selected I1 composition binds its original signal before distinct owned history and source callbacks', async t => {
  // Actual HRS/jobs/I1/issuer composition over finite SQL and HTTP doubles.
  // The fixture deliberately remains ambiguous and stops before result commit.
  const at = '2026-11-14T10:00:00.000Z'
  t.mock.timers.enable({ apis: ['Date'], now: Date.parse(at) })
  const program = selectedAaChDeQualification(); assert.ok(program)
  const clock = hrs1Clock(at, program.legalTimeZone); assert.ok(clock)
  const wire = syntheticWire(), outer = new AbortController()
  const owned = createM04InvocationScope(createM04LanePool(), 30000, outer.signal); assert.ok(owned)
  const callbacks: { parent: AbortSignal | undefined; child: AbortSignal }[] = []
  const scope = { ...owned, callback: ((group, run, signal) => owned.callback(group, child => {
    callbacks.push({ parent: signal, child }); return run(child)
  }, signal)) as typeof owned.callback }
  const events: string[] = [], historySignals: AbortSignal[] = []
  const operations = new Map<string, V3QueueCommit>()
  const records = new Map<string, { reference: unknown; text: string; outcome: unknown; audit: unknown }>()
  let job: V3ManagedJobRecord | null = null, verification: unknown = null
  const authority: M04Authority = {
    async resolveCurrent() { events.push('method'); return { status: 'approved', receipt: Object.freeze({}) } },
    async reproveAtCommit() { events.push('method'); return { status: 'current' } },
  }
  const fixed: M04FixedOperation = async operation => {
    const q = JSON.parse(hrs1Canonical(operation)), b = q.body
    let reply: unknown
    if (q.operation === 'queue_confirm') {
      const command = readM04Command(b.command); assert.ok(command)
      const prior = operations.get(command.operationId)
      reply = !prior ? { status: 'not_attempted' } : { status: 'committed', operationId: command.operationId,
        commandKey: command.commandKey, commandText: command.commandText, envelopeText: hrs1Canonical(prior), record: prior.next }
    } else if (q.operation === 'queue_read') reply = job ? { status: 'present', record: job } : { status: 'absent' }
    else if (q.operation === 'queue_cas') {
      const commit = b.commit as V3QueueCommit; job = commit.next; operations.set(commit.operationId, commit)
      reply = { status: 'committed', record: job }
    } else if (q.operation === 'execution_read') reply = { status: 'absent' }
    else if (q.operation === 'execution_start') reply = { status: 'reserved', claim: b.claim, leasedJob: b.leasedJob,
      attemptKey: 'execution-attempt:v3:' + 'e'.repeat(64), token: 'f'.repeat(64) }
    else { assert.equal(q.operation, 'execution_prepare'); reply = { status: 'unavailable' } }
    return reply as Awaited<ReturnType<M04FixedOperation>>
  }
  const config: M04Config = { binding: { ...program.method, methodDigest: program.binding.methodDigest, packageDigest: program.binding.packageDigest },
    registry: program.registry, clock: () => clock, producer: AA_CH_DE_DELIVERY_PRODUCER,
    methodExecutor: { async readCurrent() { assert.fail('standalone composition uses its supplied authority') } },
    jobsExecutor: { async executeFixed() { assert.fail('standalone composition uses its supplied fixed port') } },
    evidence: { async inspect() { assert.fail('selected source must be composed') }, async reprove() { assert.fail('selected source must be composed') } },
    history: { async read() { assert.fail('selected history must be composed') }, async reprove() { assert.fail('selected history must be composed') } },
    intakeExecutor: { async execute(statement, params) {
      const binding = JSON.parse(String(params[0])), old = records.get(binding.operationId)
      let reply: unknown
      if (statement.includes('.capture_v1(')) {
        const text = String(params[1]), parsed = readV3RetainableProposal(text, program.registry); assert.ok(parsed.ok)
        const record = { reference: { binding, proposalDigest: parsed.value.digest, bytes: parsed.value.bytes }, text, outcome: null, audit: null }
        records.set(binding.operationId, record); reply = { status: 'recorded', record }
      } else if (statement.includes('.read_v1(')) { events.push('intake_read'); reply = old ? { status: 'recorded', record: old } : { status: 'not_attempted' } }
      else if (statement.includes('.reserve_v1(')) {
        events.push('reserve'); assert.ok(old)
        reply = { status: 'acquired', generation: 1, leaseToken: '11111111-1111-4111-8111-111111111111',
          acquiredAt: at, expiresAt: new Date(Date.parse(at) + Number(params[3])).toISOString(), record: old }
      } else {
        assert.ok(statement.includes('.finish_v1(') && old); events.push('finish')
        old.outcome = JSON.parse(String(params[5])); old.audit = JSON.parse(String(params[6])); reply = { status: 'recorded' }
      }
      return { status: 'acknowledged', rows: [{ result: JSON.stringify(reply) }] }
    } },
  }
  const challenge = sourceChallenge(at)
  const snapshot = { history: challenge.history, head: { pointer: challenge.history.pointer, sourceDecisionRef: null, historyArchive: null },
    stickyDecision: null, suppressionEpoch: 0, generation: 0, suppression: null }
  const resultFixed: Hrs1FixedOperation = async (command, signal) => {
    events.push(command.operation)
    if (command.operation === 'history') { historySignals.push(signal); return { status: 'snapshot', value: snapshot } }
    if (command.operation === 'attest') {
      verification = command.body.verification
      return { status: 'recorded', value: { reference: (verification as { reference: string }).reference, digest: hrs1Hash(verification) } }
    }
    assert.equal(command.operation, 'evidence'); assert.ok(verification)
    return { status: 'inspected', value: verification }
  }
  const closed = { async executeFixed() { assert.fail('standalone composition uses its supplied HRS fixed port') } }
  let assembly: ReturnType<typeof composeHrs1Invocation> | null = null
  try {
    assembly = composeHrs1Invocation({ config, binding: program.binding, scope, callDeadline: owned.deadline, authority, processingAuthority: authority,
      fixed, processingFixed: fixed, resultFixed, processingResultFixed: resultFixed,
      result: { binding: program.binding, writerExecutor: closed, readerExecutor: closed, verifierExecutor: closed,
        ids: () => ({ jobId: 'job3_' + '4'.repeat(32), operationId: 'op3_' + '5'.repeat(32) }) } })
    const queued = await assembly.enqueueRule({ context: program.context, method: program.method, factKind: 'requirement_effect',
      researchReason: { status: 'missing' }, operationId: 'op3_' + '1'.repeat(32), jobId: 'job3_' + '2'.repeat(32), attemptLimit: 4 }, outer.signal)
    assert.equal(queued.status, 'confirmed'); assert.ok(job)
    const result = await assembly.workOnce({ operationId: 'op3_' + '3'.repeat(32), jobKey: (job as V3ManagedJobRecord & { jobKey: string }).jobKey,
      leaseId: 'lease3_' + '4'.repeat(32), leaseMilliseconds: 30000 }, outer.signal)
    await assembly.drain(); assert.notEqual(result.status, 'processed')
    const reserveAt = events.indexOf('reserve'), finishAt = events.indexOf('finish'); assert.ok(reserveAt > 0 && finishAt > reserveAt)
    assert.deepEqual(events.slice(reserveAt - 1, finishAt + 1),
      ['intake_read', 'reserve', 'method', 'history', 'attest', 'history', 'method', 'finish'])
    assert.equal(wire.calls, 2); assert.equal(wire.active, 0)
    assert.equal((records.values().next().value?.outcome as { status: string }).status, 'escalation')
    const first = callbacks.findIndex(entry => entry.child === historySignals[0]); assert.ok(first >= 0)
    const read = callbacks[first]!, inspect = callbacks[first + 1]!
    assert.equal(read.parent, inspect.parent, 'actual I1 identity must survive both admission wrappers')
    assert.notEqual(read.child, inspect.child, 'each real scope.callback creates its own child')
    assert.notEqual(read.child, read.parent); assert.notEqual(inspect.child, inspect.parent)
    assert.ok(read.parent?.aborted, 'the completed I1 coordinator closes its original signal')
    assert.notEqual(historySignals[0], historySignals[1], 'final history remains its own fresh callback/read')
  } finally { outer.abort(); await assembly?.drain(); await owned.finish(); wire.releaseAll(); mock.restoreAll(); t.mock.timers.reset() }
})

test('genuine finalized source custody transfers once within its invocation without renewing originals or skipping fresh SQL', async t => {
  const start = Date.parse('2026-11-14T10:00:00.000Z')
  t.mock.timers.enable({ apis: ['Date'], now: start })
  const wire = syntheticWire(), owner = new AbortController(), i1 = new AbortController()
  const program = selectedAaChDeQualification(); assert.ok(program)
  const challenge = sourceChallenge(new Date().toISOString()), scope = Object.freeze({ key: Object.freeze({}), signal: owner.signal })
  const clock = () => { const value = hrs1Clock(new Date().toISOString(), program.legalTimeZone); assert.ok(value); return value }
  let stored: Hrs1Verification | null = null, evidenceReads = 0, attests = 0, transferredAck = false
  const methodReceipt = Object.freeze({}), methods: Array<object | undefined> = []
  const fixed: Hrs1FixedOperation = async (command, signal, method) => {
    assert.equal(signal.aborted, false)
    if (command.operation === 'attest') {
      attests++; stored = command.body.verification as Hrs1Verification
      return { status: 'recorded', value: { reference: stored.reference, digest: hrs1Hash(stored) } }
    }
    assert.equal(command.operation, 'evidence'); evidenceReads++; methods.push(method); assert.ok(stored)
    return { status: 'inspected', value: stored }
  }
  const local = createHrs1SourceConsumer({ binding: program.binding, registry: program.registry, fixed, clock, custodyScope: scope,
    takeInitialHistory: () => ({ history: challenge.history, head: { pointer: challenge.history.pointer, sourceDecisionRef: null, historyArchive: null },
      stickyDecision: null, suppressionEpoch: 0, generation: 0, suppression: null }),
    takeAttestedVerification(value) { assert.ok(stored); assert.deepEqual(value, stored); assert.equal(transferredAck, false); transferredAck = true; return true } })
  const consumer = (custodyScope = scope) => createHrs1SourceConsumer({ binding: program.binding, registry: program.registry, fixed, clock, custodyScope })
  try {
    const inspected = await local.evidence.inspect(challenge.request, i1.signal)
    assert.equal(inspected.status, 'inspected'); if (inspected.status !== 'inspected') assert.fail('actual source custody')
    const decision = readV3SourceDecisionRecord({ schema: 3, kind: 'source_decision_record', reference: challenge.request.decisionRef,
      predecessor: null, method: program.method, context: program.context, contextKey: program.contextKey,
      factKind: program.binding.factKind, evaluatedAt: clock().now, legalAsOfDate: clock().legalDate,
      ...inspected.parts, conclusion: 'primary_unclear' }, program.registry, null, null)
    assert.ok(decision.ok)
    assert.deepEqual(await local.evidence.reprove(inspected.receipt, challenge.request, decision.value, null, clock(), i1.signal), { status: 'current' })
    assert.equal(attests, 1); assert.equal(evidenceReads, 0); assert.equal(wire.calls, 2)
    i1.abort() // I1 success always closes its short-lived signal; the real owner remains alive.
    const transferred = local.exportCustody(decision.value, owner.signal); assert.equal(transferred.status, 'issued')
    if (transferred.status !== 'issued') assert.fail('custody transfer')
    assert.equal(consumer().importCustody({ ...transferred.receipt }, owner.signal), false)
    const outer = consumer(); assert.equal(outer.importCustody(transferred.receipt, owner.signal), true)
    assert.equal(consumer().importCustody(transferred.receipt, owner.signal), false, 'one-use handoff')
    assert.equal(local.exportCustody(decision.value, owner.signal).status, 'unavailable')
    const before = stored as Hrs1Verification | null; assert.ok(before)
    for (let n = 0; n < 2; n++) {
      const opened = await outer.openVerification(hrs1Ref('hrs1-decision-custody', decision.value), owner.signal, methodReceipt)
      assert.ok(opened); assert.equal(await outer.takeOpenedVerification(opened, clock(), owner.signal), 'current')
      assert.equal(await outer.takeOpenedVerification(opened, clock(), owner.signal), 'unavailable')
      assert.deepEqual(opened.verification, before)
    }
    assert.equal(wire.calls, 2, 'both later phases retain the genuine native originals')
    assert.equal(evidenceReads, 2, 'each phase still obtains one actual fresh evidence SQL reply')
    assert.deepEqual(methods, [methodReceipt, methodReceipt])
    t.mock.timers.setTime(Date.parse(before.validUntilExclusive))
    assert.equal(await outer.openVerification(hrs1Ref('hrs1-decision-custody', decision.value), owner.signal, methodReceipt), null)
    assert.equal(evidenceReads, 2, 'absolute expiry does not restart qualification or SQL')
    assert.equal(wire.calls, 2); assert.equal(wire.active, 0)
  } finally { owner.abort(); wire.releaseAll(); mock.restoreAll(); t.mock.timers.reset() }
})

test('explicit source handoff refuses a foreign owner/key, owner abort and foreign reference without SQL or HTTP fallback', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-11-14T10:00:00.000Z') })
  try {
    for (const mode of ['foreign-key', 'foreign-owner', 'owner-abort', 'reference'] as const) {
      const wire = syntheticWire(), owner = new AbortController(), foreign = new AbortController()
      const scope = Object.freeze({ key: Object.freeze({}), signal: owner.signal }), challenge = sourceChallenge(new Date().toISOString())
      const program = selectedAaChDeQualification(); assert.ok(program)
      let reads = 0
      const fixed: Hrs1FixedOperation = async command => {
        reads++; assert.equal(command.operation, 'attest')
        const value = command.body.verification as Hrs1Verification
        return { status: 'recorded', value: { reference: value.reference, digest: hrs1Hash(value) } }
      }
      const local = createHrs1SourceConsumer({ binding: program.binding, registry: program.registry, clock: () => challenge.request.clock,
        fixed, custodyScope: scope, takeAttestedVerification: () => true,
        takeInitialHistory: () => ({ history: challenge.history, head: null, stickyDecision: null, suppressionEpoch: 0, generation: 0, suppression: null }) })
      try {
        const inspection = await local.evidence.inspect(challenge.request, owner.signal)
        assert.equal(inspection.status, 'inspected'); if (inspection.status !== 'inspected') assert.fail('source')
        const decision = readV3SourceDecisionRecord({ schema: 3, kind: 'source_decision_record', reference: challenge.request.decisionRef,
          predecessor: null, method: program.method, context: program.context, contextKey: program.contextKey, factKind: program.binding.factKind,
          evaluatedAt: challenge.request.clock.now, legalAsOfDate: challenge.request.clock.legalDate, ...inspection.parts, conclusion: 'primary_unclear' },
        program.registry, null, null); assert.ok(decision.ok)
        assert.equal((await local.evidence.reprove(inspection.receipt, challenge.request, decision.value, null, challenge.request.clock, owner.signal)).status, 'current')
        const token = local.exportCustody(decision.value, owner.signal); assert.equal(token.status, 'issued')
        if (token.status !== 'issued') assert.fail('transfer')
        const outer = createHrs1SourceConsumer({ binding: program.binding, registry: program.registry, clock: () => challenge.request.clock, fixed,
          custodyScope: mode === 'foreign-key' ? { ...scope, key: Object.freeze({}) }
            : mode === 'foreign-owner' ? { ...scope, signal: foreign.signal } : scope })
        assert.equal(outer.importCustody(token.receipt, foreign.signal), mode === 'owner-abort' || mode === 'reference')
        if (mode === 'owner-abort') owner.abort()
        const reference = mode === 'reference' ? hrs1Ref('hrs1-decision-custody', 'foreign') : hrs1Ref('hrs1-decision-custody', decision.value)
        assert.equal(await outer.openVerification(reference, foreign.signal), null)
        assert.equal(reads, 1, 'only the original committed attest; no replacement evidence read')
        assert.equal(wire.calls, 2, 'no new source retrieval after a failed explicit handoff')
        assert.equal(wire.active, 0)
      } finally { owner.abort(); foreign.abort(); wire.releaseAll(); mock.restoreAll() }
    }
  } finally { t.mock.timers.reset() }
})

test('AA/Bern source: malformed requests and copied issuer receipts cannot create authority or perform I/O', async () => {
  const fail = () => { assert.fail('invalid issuer input attempted DNS/HTTP') }
  mock.method(Resolver.prototype, 'resolve4', fail as Resolver['resolve4'])
  mock.method(Resolver.prototype, 'resolve6', fail as Resolver['resolve6'])
  mock.method(https, 'request', fail as typeof https.request)
  try {
    const signal = new AbortController().signal, bad = {} as never
    assert.equal(await issuer.inspect(bad, signal), null)
    assert.equal(await issuer.finalize({}, bad, bad, null, bad, signal), null)
    assert.equal(await issuer.reprove({}, bad, bad, signal), null)
    assert.equal(await issuer.reopen(bad, signal), null)
    assert.deepEqual(await issuer.observe(bad, bad, signal), { status: 'unavailable' })
    assert.equal(await issuer.reproveObservation({}, bad, bad, signal), null)
    assert.equal(inspectAaChDeOwnedOriginal({ bodyText: 'copied', rawDigest: 'forged' }), null)
    assert.equal(inspectAaChDeOwnedAttempt({ status: 'unavailable', reason: 'dns_failed' }), null)
  } finally { mock.restoreAll() }
})

test('AA/Bern source: each complete fixed read joins resources and retains exact role-bound original and attempt', async () => {
  for (const role of ['primary','counter'] as const) {
    const wire = syntheticWire()
    try {
      const read = await readerFor(role)(new AbortController().signal, performance.now() + 2000)
      assert.equal(read.status, 'read'); assert.equal(wire.calls, 1); assert.equal(wire.active, 0)
      if (read.status !== 'read') assert.fail('synthetic read')
      const original = inspectAaChDeOwnedOriginal(read.receipt), attempt = inspectAaChDeOwnedAttempt(read.receipt)
      assert.ok(original); assert.ok(attempt)
      assert.equal(original.bodyText, '<html><body>synthetic transport fixture</body></html>')
      assert.equal(original.bytes, Buffer.byteLength(original.bodyText)); assert.equal(original.role, role)
      assert.equal(original.requestUrl, publicationFor(role).url); assert.equal(original.redirectCount, 0)
      assert.equal(original.rawDigest, sha256Hex(original.bodyText)); assert.equal(Object.isFrozen(original), true)
      assert.equal(attempt.role, role); assert.equal(attempt.startedAt, original.startedAt)
      assert.equal(attempt.completedAt, original.retrievedAt); assert.equal(attempt.status, 'read'); assert.equal(attempt.reason, null)
      assert.equal(Object.isFrozen(attempt), true)
      assert.equal(inspectAaChDeOwnedOriginal({ ...read.receipt }), null)
      assert.equal(inspectAaChDeOwnedOriginal({ ...original }), null)
      assert.equal(inspectAaChDeOwnedAttempt({ ...attempt }), null)
      const sent = wire.requests[0]!
      assert.equal(sent.hostname, publicationFor(role).hostname); assert.equal(sent.servername, publicationFor(role).hostname)
      assert.equal(sent.rejectUnauthorized, true); assert.equal(sent.method, 'GET'); assert.equal(sent.path, publicationFor(role).path)
      assert.equal(sent.port, 443); assert.equal(sent.autoSelectFamily, false)
      assert.deepEqual(wire.dns, [publicationFor(role).hostname, publicationFor(role).hostname])
    } finally { wire.releaseAll(); mock.restoreAll() }
  }
})

test('AA/Bern source: digest completion must remain inside the original monotonic deadline before custody', async () => {
  const body = '<html><body>synthetic digest deadline fixture</body></html>'
  const expectedDigest = sha256Hex(body)
  for (const role of ['primary','counter'] as const) for (const atDeadline of [false, true]) {
    let monotonic = 1000, digestCalls = 0
    const deadline = monotonic + publicationFor(role).maximumMilliseconds
    const encode = TextEncoder.prototype.encode
    const wire = syntheticWire({ body })
    try {
      mock.method(performance, 'now', () => monotonic)
      mock.method(TextEncoder.prototype, 'encode', function(this: TextEncoder, input?: string) {
        const encoded = encode.call(this, input)
        if (input === body) { digestCalls++; monotonic = deadline - (atDeadline ? 0 : 1) }
        return encoded
      })
      const read = await readerFor(role)(new AbortController().signal, deadline)
      assert.equal(digestCalls, 1); assert.equal(wire.calls, 1); assert.equal(wire.active, 0)
      assert.deepEqual(wire.dns, [publicationFor(role).hostname, publicationFor(role).hostname])
      if (atDeadline) {
        assert.equal(read.status, 'unavailable')
        if (read.status !== 'unavailable') assert.fail('digest reached the original deadline')
        assert.equal(read.reason, 'clock'); assert.ok(read.attempt)
        const attempt = inspectAaChDeOwnedAttempt(read.attempt)
        assert.ok(attempt); assert.equal(attempt.role, role)
        assert.equal(attempt.status, 'unavailable'); assert.equal(attempt.reason, 'clock')
        assert.equal(inspectAaChDeOwnedOriginal(read.attempt), null)
      } else {
        assert.equal(read.status, 'read')
        if (read.status !== 'read') assert.fail('digest completed before the original deadline')
        const original = inspectAaChDeOwnedOriginal(read.receipt)
        assert.ok(original); assert.equal(original.role, role)
        assert.equal(original.bodyText, body); assert.equal(original.rawDigest, expectedDigest)
      }
    } finally { wire.releaseAll(); mock.restoreAll() }
  }
})

test('AA/Bern source: one paired operation makes exactly two distinct publication attempts and preserves both receipts', async () => {
  const wire = syntheticWire({ body: '<html>primary transport bytes</html>' }, { body: '<html>counter transport bytes</html>' })
  try {
    const reads = await readAaChDeOwnedSources(new AbortController().signal, performance.now() + 2000)
    assert.equal(reads.primary.status, 'read'); assert.equal(reads.counter.status, 'read')
    assert.equal(wire.calls, 2); assert.equal(wire.dns.length, 4); assert.equal(wire.active, 0)
    if (reads.primary.status !== 'read' || reads.counter.status !== 'read') assert.fail('paired fixture')
    assert.notEqual(reads.primary.receipt, reads.counter.receipt)
    const aa = inspectAaChDeOwnedOriginal(reads.primary.receipt), bern = inspectAaChDeOwnedOriginal(reads.counter.receipt)
    assert.ok(aa); assert.ok(bern)
    assert.equal(aa.role, 'primary'); assert.equal(bern.role, 'counter')
    assert.equal(aa.requestUrl, AA_CH_DE_PUBLICATION.url); assert.equal(bern.requestUrl, BERN_CH_DE_PUBLICATION.url)
    assert.notEqual(aa.bodyText, bern.bodyText); assert.notEqual(aa.rawDigest, bern.rawDigest)
    // A real transport receipt still is not an issuer receipt or a history proof.
    const bad = {} as never, signal = new AbortController().signal
    assert.equal(await issuer.reprove(reads.primary.receipt, bad, bad, signal), null)
    assert.equal(await issuer.reprove(reads.counter.receipt, bad, bad, signal), null)
    assert.equal(await issuer.finalize(reads.counter.receipt, bad, bad, null, bad, signal), null)
    assert.equal(await issuer.reproveObservation(reads.primary.receipt, bad, bad, signal), null)
  } finally { wire.releaseAll(); mock.restoreAll() }
})

test('AA/Bern source: status, redirect, framing, duplicate-header, encoding and byte refusals never retry', async () => {
  const cases: readonly WireOptions[] = [
    { status: 302 }, { status: 403 }, { complete: false },
    { headers: ['Content-Type','text/html','Content-Length','1','Content-Length','1'] },
    { headers: ['Content-Type','text/html','Content-Length','1','Transfer-Encoding','chunked'] },
    { headers: ['Content-Type','text/html','Content-Encoding','gzip'] },
    { headers: ['Content-Type','application/json'] },
    { headers: ['Content-Type','text/html','Content-Length','1'] },
    { headers: ['Content-Type','text/html'], body: 'x'.repeat(AA_CH_DE_PUBLICATION.maximumBytes + 1) },
    { body: Buffer.from([0xc3,0x28]) }, { body: Buffer.from([0xef,0xbb,0xbf,0x61]) }, { body: '' },
  ]
  for (const role of ['primary','counter'] as const) for (const item of cases) {
    const wire = syntheticWire(item)
    try {
      const result = await readerFor(role)(new AbortController().signal, performance.now() + 2000)
      assert.equal(result.status, 'unavailable'); assert.equal(wire.calls, 1); assert.equal(wire.active, 0)
      if (result.status !== 'unavailable') assert.fail('refused frame')
      assert.ok(result.attempt)
      const attempt = inspectAaChDeOwnedAttempt(result.attempt)
      assert.ok(attempt); assert.equal(attempt.role, role); assert.equal(attempt.status, 'unavailable')
      assert.equal(attempt.reason, result.reason); assert.equal(inspectAaChDeOwnedOriginal(result.attempt), null)
    } finally { wire.releaseAll(); mock.restoreAll() }
  }
})

test('AA/Bern source: real Bern DNS failure is privately recorded while the independent primary remains exact', async () => {
  const wire = syntheticWire()
  mock.method(Resolver.prototype, 'resolve4', (async (host: string) => {
    if (host === BERN_CH_DE_PUBLICATION.hostname) throw new Error('synthetic DNS failure')
    return ['1.1.1.1']
  }) as Resolver['resolve4'])
  mock.method(Resolver.prototype, 'resolve6', (async (host: string) => {
    if (host === BERN_CH_DE_PUBLICATION.hostname) throw new Error('synthetic DNS failure')
    return []
  }) as Resolver['resolve6'])
  try {
    const result = await readAaChDeOwnedSources(new AbortController().signal, performance.now() + 2000)
    assert.equal(result.primary.status, 'read'); assert.equal(result.counter.status, 'unavailable')
    if (result.counter.status !== 'unavailable') assert.fail('counter failure')
    assert.equal(result.counter.reason, 'dns_failed'); assert.ok(result.counter.attempt)
    const attempt = inspectAaChDeOwnedAttempt(result.counter.attempt)
    assert.ok(attempt); assert.equal(attempt.requestUrl, BERN_CH_DE_PUBLICATION.url)
    assert.equal(attempt.role, 'counter'); assert.equal(attempt.status, 'unavailable'); assert.equal(attempt.reason, 'dns_failed')
    assert.ok(attempt.completedAt >= attempt.startedAt)
    assert.equal(inspectAaChDeOwnedOriginal(result.counter.attempt), null)
    assert.equal(inspectAaChDeOwnedAttempt({ ...attempt }), null)
    assert.equal(wire.calls, 1); assert.equal(wire.requests[0]!.hostname, AA_CH_DE_PUBLICATION.hostname); assert.equal(wire.active, 0)
  } finally { wire.releaseAll(); mock.restoreAll() }
})

test('AA/Bern source: shared two-operation cap never starts a third DNS or HTTP attempt', async () => {
  const wire = syntheticWire({ hangBody: true, holdClose: true }), controller = new AbortController()
  let settled = false
  const pending = readAaChDeOwnedSources(controller.signal, performance.now() + 2000).then(result => { settled = true; return result })
  try {
    await tick()
    assert.equal(wire.calls, 2); assert.equal(wire.active, 2); assert.equal(wire.dns.length, 4)
    const extra = await readBernChDeOwnedSource(new AbortController().signal, performance.now() + 1000)
    assert.deepEqual(extra, { status: 'unavailable', reason: 'busy', attempt: null })
    assert.equal(wire.calls, 2); assert.equal(wire.dns.length, 4)
    controller.abort(); await tick(); assert.equal(settled, false)
    wire.release('primary'); await tick(); assert.equal(settled, false); assert.equal(wire.active, 1)
    wire.release('counter')
    const result = await pending
    assert.equal(result.primary.status, 'unavailable'); assert.equal(result.counter.status, 'unavailable')
    assert.equal(wire.active, 0)
  } finally { controller.abort(); wire.releaseAll(); await pending; mock.restoreAll() }
})

test('AA/Bern source: a counter refusal cannot return while the other actual connection is still open', async () => {
  const wire = syntheticWire({ hangBody: true, holdClose: true }, { status: 403 }), controller = new AbortController()
  let settled = false
  const pending = readAaChDeOwnedSources(controller.signal, performance.now() + 2000).then(result => { settled = true; return result })
  try {
    await tick(); assert.equal(wire.calls, 2); assert.equal(wire.active, 1); assert.equal(settled, false)
    controller.abort(); await tick(); assert.equal(settled, false)
    wire.release('primary')
    const result = await pending
    assert.equal(result.counter.status, 'unavailable')
    if (result.counter.status !== 'unavailable') assert.fail('counter refusal')
    assert.equal(result.counter.reason, 'http_status'); assert.equal(wire.active, 0)
  } finally { controller.abort(); wire.releaseAll(); await pending; mock.restoreAll() }
})

test('AA/Bern source: cancelling DNS joins both native operations, including a synchronous peer failure', async () => {
  let release: (() => void) | null = null, cancelled = 0, calls = 0, settled = false
  mock.method(Resolver.prototype, 'resolve4', (() => new Promise<string[]>((resolve, reject) => {
    void resolve; release = () => reject(new Error('synthetic cancellation'))
  })) as unknown as Resolver['resolve4'])
  mock.method(Resolver.prototype, 'resolve6', (() => { throw new Error('synthetic synchronous failure') }) as Resolver['resolve6'])
  mock.method(Resolver.prototype, 'cancel', () => { cancelled++ })
  mock.method(https, 'request', (() => { calls++; assert.fail('DNS failure reached HTTP') }) as typeof https.request)
  const controller = new AbortController()
  const pending = readBernChDeOwnedSource(controller.signal, performance.now() + 2000).then(value => { settled = true; return value })
  try {
    await tick(); controller.abort(); await tick()
    assert.ok(cancelled >= 1); assert.equal(settled, false); assert.equal(calls, 0)
    const join = release as (() => void) | null; assert.ok(join); join()
    const result = await pending
    assert.equal(result.status, 'unavailable'); assert.equal(calls, 0)
  } finally { controller.abort(); const join = release as (() => void) | null; join?.(); await pending; mock.restoreAll() }
})

test('AA/Bern source: private DNS addresses and already-aborted calls never open HTTP or invent a completed read', async () => {
  let calls = 0
  mock.method(Resolver.prototype, 'resolve4', (async () => ['127.0.0.1']) as unknown as Resolver['resolve4'])
  mock.method(Resolver.prototype, 'resolve6', (async () => []) as Resolver['resolve6'])
  mock.method(Resolver.prototype, 'cancel', () => undefined)
  mock.method(https, 'request', (() => { calls++; assert.fail('refused address reached HTTP') }) as typeof https.request)
  try {
    for (const role of ['primary','counter'] as const) {
      const refused = await readerFor(role)(new AbortController().signal, performance.now() + 2000)
      assert.equal(refused.status, 'unavailable')
      if (refused.status !== 'unavailable') assert.fail('address refusal')
      assert.equal(refused.reason, 'address_refused'); assert.ok(refused.attempt)
      assert.equal(inspectAaChDeOwnedOriginal(refused.attempt), null)
      const controller = new AbortController(); controller.abort()
      const aborted = await readerFor(role)(controller.signal, performance.now() + 2000)
      assert.deepEqual(aborted, { status: 'unavailable', reason: 'aborted', attempt: null })
    }
    assert.equal(calls, 0)
  } finally { mock.restoreAll() }
})

test('AA/Bern source: reviewed binding cannot omit, swap, duplicate or relabel its counter', () => {
  const program = selectedAaChDeQualification()
  assert.ok(program)
  assert.equal(selectedAaChDeProgramForBinding(program.binding), program)
  assert.equal(program.binding.sources.length, 2); assert.equal(program.counterInventory.eligibleRepresentations.length, 1)
  assert.notEqual(program.source.contentItemId, program.counter.source.contentItemId)
  for (const sources of [[program.sourceBinding], [program.counter.sourceBinding, program.sourceBinding],
    [program.sourceBinding, program.sourceBinding], [program.sourceBinding, { ...program.counter.sourceBinding, role: 'primary' as const }],
    [program.sourceBinding, { ...program.counter.sourceBinding, canonicalUrl: AA_CH_DE_PUBLICATION.url }]]) {
    assert.equal(selectedAaChDeProgramForBinding({ ...program.binding, sources }), null)
  }
})

test('AA/Bern source: production consumer requires the exact reviewed binding before any source or database I/O', () => {
  const fail = () => { assert.fail('binding selection performed I/O') }
  mock.method(Resolver.prototype, 'resolve4', fail as Resolver['resolve4'])
  mock.method(Resolver.prototype, 'resolve6', fail as Resolver['resolve6'])
  mock.method(https, 'request', fail as typeof https.request)
  try {
    const program = selectedAaChDeQualification(); assert.ok(program)
    const at = hrs1Clock(program.binding.activeFrom, program.binding.legalTimeZone); assert.ok(at)
    const consumer = (binding: Hrs1Binding) => createHrs1SourceConsumer({ binding, registry: program.registry,
      fixed: async () => assert.fail('binding selection dispatched database work'), clock: () => at, fixtureIssuer: issuer })
    const selected = consumer(program.binding)
    assert.equal(selected.available, true)
    assert.equal(selected.held({}), null, 'selected configuration is not a source receipt')
    for (const binding of [
      { ...program.binding, methodDigest: '0'.repeat(64) },
      { ...program.binding, packageDigest: '0'.repeat(64) },
      { ...program.binding, contextKey: 'official-truth-context:v3:' + '0'.repeat(64) },
      { ...program.binding, sources: program.binding.sources.map((source, index) => ({ ...source,
        canonicalUrl: 'https://hrs1-synthetic-' + index + '.example/fictional-visa-rules' })) },
      { ...program.binding, dataMode: 'synthetic_test' as const },
    ]) assert.equal(consumer(binding).available, false, 'foreign binding cannot select production or use fixture fallback')
  } finally { mock.restoreAll() }
})

test('AA/Bern source: unrelated counter body remains an original ambiguity, never an agreement or manufactured fact', () => {
  const program = selectedAaChDeQualification()
  assert.ok(program)
  const at = hrs1Clock(program.binding.activeFrom, program.binding.legalTimeZone); assert.ok(at)
  const bodyText = '<html><body>unrelated publication with no entry rule</body></html>'
  const raw: AaChDeOwnedOriginal = { role: 'counter', requestUrl: BERN_CH_DE_PUBLICATION.url, finalUrl: BERN_CH_DE_PUBLICATION.url,
    method: 'GET', redirectCount: 0, httpStatus: 200, contentType: 'text/html', bodyText,
    bytes: Buffer.byteLength(bodyText), rawDigest: sha256Hex(bodyText), retrievedAt: at.now, startedAt: at.now }
  const result = qualifyAaChDeOriginal(raw, program.binding, at)
  assert.ok(result); assert.equal(result.outcome.status, 'unclear'); assert.equal(result.original.observation, null)
  assert.equal(result.original.qualification.role, 'counter')
  assert.deepEqual(hrs1OriginalEvidence(result.original).source, program.counter.source)
  assert.equal(result.original.bodyText, bodyText); assert.equal(result.original.rawDigest, raw.rawDigest)
  assert.equal(inspectAaChDeOwnedOriginal(raw), null)
  assert.equal(qualifyAaChDeOriginal({ ...raw, role: 'primary' }, program.binding, at), null)
  assert.equal(qualifyAaChDeOriginal({ ...raw, finalUrl: AA_CH_DE_PUBLICATION.url }, program.binding, at), null)
})

test('AA/Bern source: copied history, empty counter attempts and fabricated expiry are refused before any source read', async () => {
  const fail = () => { assert.fail('unproved history performed source I/O') }
  mock.method(Resolver.prototype, 'resolve4', fail as Resolver['resolve4'])
  mock.method(Resolver.prototype, 'resolve6', fail as Resolver['resolve6'])
  mock.method(https, 'request', fail as typeof https.request)
  try {
    const signal = new AbortController().signal
    for (const copied of [
      { reference: 'copied', originals: [], history: {}, validUntilExclusive: '2999-01-01T00:00:00.000Z' },
      { reference: 'copied', originals: [{ bodyText: 'copied' }], decision: { counterCheck: { attempts: [] } } },
      { reference: 'copied', decision: { counterCheck: { attempts: [{ status: 'agrees', source: null }] } } },
    ]) assert.equal(await issuer.reopen(copied as never, signal), null)
  } finally { mock.restoreAll() }
})
