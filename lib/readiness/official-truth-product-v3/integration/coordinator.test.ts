import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { readV3SourceDecisionRecord } from '../contract'
import { createV3ImportCoordinator } from '../import/service-server'
import { presentV3VisitorAnswer } from '../visitor/presentation'
import { createV3IntegrationCoordinator, officialTruthV3IntegrationProduction, type V3IntegrationResult } from './coordinator'
import { integrationFixture } from './test-support/fixture'
import { id, ref } from './test-support/originals'

function published(result: V3IntegrationResult) {
  assert.equal(result.status, 'published', JSON.stringify(result))
  if (result.status !== 'published') assert.fail('publication expected')
  return result
}
async function answer(f: ReturnType<typeof integrationFixture>, countries = ['CH']) {
  const result = await f.run.query({ destinationCountryCode: 'AQ', citizenshipCountryCodes: countries })
  assert.ok(result.ok, JSON.stringify(result)); if (!result.ok) assert.fail('answer expected')
  return result.answer
}
function refresh(f: ReturnType<typeof integrationFixture>, pages = 9) {
  f.store.control.instant += 1000; f.originals.control.epoch++
  f.originals.control.retrievedAt = f.store.clock().now; f.originals.control.primaryPages = pages
}
async function first(f: ReturnType<typeof integrationFixture>, seed = 'first') {
  return published(await f.run.ingest(JSON.stringify(f.originals.proposal(seed))))
}

describe('E1 actual module composition; external adapters are synthetic only', () => {
  test('two citizenship misses become actual Discovery jobs, real workers/imports/versions/cache and full presentation', async () => {
    const f = integrationFixture(), before = await answer(f, ['RS', 'CH', 'CH'])
    assert.deepEqual(before.response.input.citizenshipCountryCodes, ['CH', 'RS'])
    assert.ok(before.response.cells.every((cell) => cell.results[0].status === 'pending'))
    assert.equal(f.store.queueRows.size, 2)
    const jobs = [...f.store.queueRows.values()]
    assert.ok(jobs.every((job) => job.kind === 'combination_discovery_job_record'))
    for (const job of jobs) {
      const result = await f.run.workOnce(f.claim(job))
      assert.equal(result.status, 'processed', JSON.stringify(result)); if (result.status !== 'processed') assert.fail()
      assert.equal(result.worker.acceptedRule, false)
      assert.equal(result.results.length, 1); published(result.results[0])
    }
    const after = await answer(f, ['CH', 'RS']), view = presentV3VisitorAnswer(after)
    assert.deepEqual(after.response.cells.map((cell) => cell.results[0].status), ['accepted', 'accepted'])
    assert.equal(view.synthetic, true); assert.equal(view.cells.length, 2)
    for (const cell of view.cells) {
      const item = cell.results[0]; assert.equal(item.status, 'accepted'); if (item.status !== 'accepted') assert.fail()
      assert.equal(item.statements[0].text, 'Mindestens 9 freie Passseiten')
      assert.ok(item.conditions.some((condition) => condition.includes('Besuch')))
      assert.match(item.checkedAtText, /08:00/); assert.match(item.source.href, /synthetic-primary\.example/)
    }
    assert.equal(f.store.counts.versionWrites, 2); assert.equal(f.store.counts.publicationWrites, 2)
    assert.equal(f.researchControl.calls, 2); assert.ok(f.originals.control.extracts > 2)
    // Reading prepared answers performs no fresh provider job.
    await answer(f, ['CH', 'RS']); assert.equal(f.researchControl.calls, 2)
  })

  test('two provider implementations use the same neutral interface, and proposed one-page facts never override original nine-page facts', async () => {
    for (const provider of ['a', 'b'] as const) {
      const f = integrationFixture(); f.researchControl.provider = provider
      await answer(f); const job = [...f.store.queueRows.values()][0]
      const result = await f.run.workOnce(f.claim(job)); assert.equal(result.status, 'processed')
      if (result.status !== 'processed') assert.fail(); published(result.results[0])
      const actual = [...f.store.versions.values()][0]
      assert.equal(actual.proposalDisposition, 'superseded_by_source')
      assert.equal(actual.version.subject.fact.fact.kind, 'blank_passport_pages')
      assert.deepEqual(actual.version.subject.fact.fact, { kind: 'blank_passport_pages', minimumPages: 9 })
      assert.equal(actual.decision.counterCheck.attempts[0].status, 'not_found')
    }
  })

  test('optional counter-source outage alone permits the clear original primary', async () => {
    const f = integrationFixture(); f.originals.control.counter = 'unreachable'
    await first(f)
    assert.equal((await answer(f)).response.cells[0].results[0].status, 'accepted')
    assert.equal(f.store.outbox.size, 0)
  })

  test('artifact digest mismatch, foreign citizenship and forged receipt cannot enter I1', async () => {
    for (const fault of ['wrongDigest', 'wrongPair', 'fakeReceipt'] as const) {
      const f = integrationFixture(); f.researchControl[fault] = true
      await answer(f); const result = await f.run.workOnce(f.claim([...f.store.queueRows.values()][0]))
      assert.equal(result.status, fault === 'fakeReceipt' ? 'unconfirmed' : 'invalid', JSON.stringify(result))
      assert.equal(f.store.counts.importWrites, 0); assert.equal(f.store.counts.versionWrites, 0); assert.equal(f.store.cache.size, 0)
    }
  })

  test('lost artifact response resumes the exact completed worker claim without another research execution', async () => {
    const f = integrationFixture(); await answer(f)
    const claim = f.claim([...f.store.queueRows.values()][0]); f.researchControl.loseOpen = true
    assert.equal((await f.run.workOnce(claim)).status, 'unconfirmed'); assert.equal(f.researchControl.calls, 1)
    const retried = await f.run.workOnce(claim); assert.equal(retried.status, 'processed', JSON.stringify(retried))
    if (retried.status !== 'processed') assert.fail(); published(retried.results[0])
    assert.equal(f.researchControl.calls, 1); assert.equal(f.store.counts.versionWrites, 1)
    assert.equal((await f.run.workOnce({ ...claim, operationId: id('op3', 'different-claim') })).status, 'worker_only')
  })

  test('R1 exact claim command binding rejects changed duration and corrupt custody while original replay remains valid', async () => {
    const f = integrationFixture(); await answer(f)
    const claim = f.claim([...f.store.queueRows.values()][0]); f.researchControl.loseOpen = true
    assert.equal((await f.run.workOnce(claim)).status, 'unconfirmed')
    const before = { ...f.store.counts }
    for (const altered of [{ ...claim, leaseMilliseconds: claim.leaseMilliseconds + 1 },
      { ...claim, leaseId: id('lease3', 'different-claim-lease') },
      { ...claim, jobKey: ref('combination-discovery-job', 'different-claim-job') }]) {
      assert.equal((await f.run.workOnce(altered)).status, 'unconfirmed')
      assert.deepEqual(f.store.counts, before); assert.equal(f.researchControl.calls, 1)
    }
    const replay = await f.run.workOnce(claim); assert.equal(replay.status, 'processed')
    if (replay.status !== 'processed') assert.fail(); published(replay.results[0])
    const completed = { ...f.store.counts }, receipt = f.store.queueOperations.get(claim.operationId)!
    f.store.queueOperations.set(claim.operationId, { ...receipt, commandKey: ref('queue-command', 'corrupt-claim-command') })
    assert.equal((await f.run.workOnce(claim)).status, 'unconfirmed')
    f.store.queueOperations.set(claim.operationId, { ...receipt, record: null })
    assert.equal((await f.run.workOnce(claim)).status, 'unconfirmed')
    assert.deepEqual(f.store.counts, completed); assert.equal(f.researchControl.calls, 1)
  })

  test('artifact lease, generation, original job operation and result reference grafts stop before import', async () => {
    for (const fault of ['lease', 'revision', 'generation', 'operation', 'result'] as const) {
      const f = integrationFixture(), open = f.artifacts.open.bind(f.artifacts)
      f.artifacts.open = async (...args) => {
        const opened = await open(...args); if (opened.status !== 'available') return opened
        const artifact = opened.artifact
        return { ...opened, artifact: { ...artifact,
          jobOperationId: fault === 'operation' ? id('op3', 'other-job-operation') : artifact.jobOperationId,
          resultRef: fault === 'result' ? ref('combination-discovery-result', 'other-result') : artifact.resultRef,
          fence: { ...artifact.fence, leaseId: fault === 'lease' ? id('lease3', 'other-lease') : artifact.fence.leaseId,
            revision: artifact.fence.revision + (fault === 'revision' ? 1 : 0),
            generation: artifact.fence.generation + (fault === 'generation' ? 1 : 0) } } }
      }
      await answer(f); const result = await f.run.workOnce(f.claim([...f.store.queueRows.values()][0]))
      assert.equal(result.status, 'invalid', `${fault}: ${JSON.stringify(result)}`)
      assert.equal(f.store.counts.importWrites, 0); assert.equal(f.store.counts.versionWrites, 0)
    }
  })

  test('accessor uploads are rejected without executing them and corrupt resumed result DTOs cannot enter import', async () => {
    const f = integrationFixture(), open = f.artifacts.open.bind(f.artifacts); let getters = 0
    f.artifacts.open = async (...args) => {
      const opened = await open(...args); if (opened.status !== 'available') return opened
      const uploads = [...opened.artifact.uploads]
      Object.defineProperty(uploads, '0', { enumerable: true, get() { getters++; return opened.artifact.uploads[0] } })
      return { ...opened, artifact: { ...opened.artifact, uploads } }
    }
    await answer(f); const claim = f.claim([...f.store.queueRows.values()][0])
    assert.equal((await f.run.workOnce(claim)).status, 'invalid'); assert.equal(getters, 0)
    const resume = f.artifacts.resume.bind(f.artifacts)
    f.artifacts.resume = async (...args) => {
      const resumed = await resume(...args); if (resumed.status !== 'completed') return resumed
      return { ...resumed, worker: { ...resumed.worker, result: { ...resumed.worker.result, accepted: true } } }
    }
    assert.equal((await f.run.workOnce(claim)).status, 'invalid')
    assert.equal(f.researchControl.calls, 1); assert.equal(f.store.counts.importWrites, 0)
  })

  test('lost actual queue ACK is an error until the same operation is confirmed, with no duplicate job', async () => {
    const f = integrationFixture()
    f.run = createV3IntegrationCoordinator({ ...f.ports, visitor: { ...f.ports.visitor,
      ids: () => ({ operationId: id('op3', 'same-visitor-request'), jobId: id('job3', 'same-visitor-request') }) } })
    f.store.control.loseQueue = true
    assert.equal((await answer(f)).response.cells[0].results[0].status, 'error')
    assert.equal(f.store.queueRows.size, 1); assert.equal(f.store.counts.queueWrites, 1)
    assert.equal((await answer(f)).response.cells[0].results[0].status, 'pending')
    assert.equal(f.store.queueRows.size, 1); assert.equal(f.store.counts.queueWrites, 1)
  })

  test('lost version and projection replies reconcile the same immutable operation without another mutation', async () => {
    for (const loss of ['loseVersion', 'losePublication'] as const) {
      const f = integrationFixture(); f.store.control[loss] = true
      const text = JSON.stringify(f.originals.proposal('retry'))
      const uncertain = await f.run.ingest(text)
      assert.notEqual(uncertain.status, 'published')
      const result = await f.run.ingest(text); published(result)
      assert.equal(f.store.counts.versionWrites, 1); assert.equal(f.store.counts.publicationWrites, 1); assert.equal(f.store.counts.importWrites, 1)
      const again = published(await f.run.ingest(text)); assert.equal(again.replayed, true)
      assert.equal(f.store.counts.publicationWrites, 1)
    }
  })

  test('unknown publication confirmation never triggers a blind second write or a replacement operation', async () => {
    const f = integrationFixture(), text = JSON.stringify(f.originals.proposal('unknown'))
    f.store.control.obscurePublication = true
    assert.equal((await f.run.ingest(text)).status, 'unconfirmed')
    assert.equal(f.store.counts.publicationWrites, 0)
    f.store.control.obscurePublication = false; published(await f.run.ingest(text))
    assert.equal(f.store.counts.versionWrites, 1); assert.equal(f.store.counts.publicationWrites, 1)
  })

  test('real conflicting primary/counter decision creates a new conflicted version, retained audit/outbox and hides old projection', async () => {
    const f = integrationFixture(); const prior = await first(f)
    refresh(f); f.originals.control.counter = 'conflicts'
    const text = JSON.stringify(f.originals.proposal('conflict'))
    const result = await f.run.ingest(text); assert.equal(result.status, 'escalated', JSON.stringify(result))
    assert.equal(f.store.counts.versionWrites, 2); assert.equal(f.store.outbox.size, 1)
    assert.ok(f.store.versions.has(prior.versionRef))
    const state = [...f.store.heads.values()][0]; assert.equal(state.pointer.state, 'conflicted')
    assert.equal((await answer(f)).response.cells[0].results[0].status, 'conflict')
    assert.equal((await f.run.ingest(text)).status, 'escalated')
    assert.equal(f.store.counts.escalationWrites, 1); assert.equal(f.store.outbox.size, 1)
  })

  test('unclear primary withdraws the accepted version and removes its positive public answer', async () => {
    const f = integrationFixture(); await first(f); refresh(f); f.originals.control.primaryUnclear = true
    assert.equal((await f.run.ingest(JSON.stringify(f.originals.proposal('unclear')))).status, 'escalated')
    assert.equal([...f.store.heads.values()][0].pointer.state, 'withdrawn')
    const result = (await answer(f)).response.cells[0].results[0]
    assert.equal(result.status, 'conflict'); if (result.status !== 'conflict') assert.fail()
    assert.equal(result.reason, 'primary_unclear')
  })

  test('first conflict without an accepted version remains sticky even when optional counter later disappears', async () => {
    const f = integrationFixture(); f.originals.control.counter = 'conflicts'
    assert.equal((await f.run.ingest(JSON.stringify(f.originals.proposal('initial-conflict')))).status, 'escalated')
    assert.equal(f.store.versions.size, 0); assert.equal(f.store.cache.size, 0)
    f.originals.control.counter = 'not_found'; refresh(f)
    assert.equal((await f.run.ingest(JSON.stringify(f.originals.proposal('still-conflicted')))).status, 'escalated')
    assert.equal(f.store.versions.size, 0); assert.equal(f.store.cache.size, 0)
    const before = await answer(f); assert.notEqual(before.response.cells[0].results[0].status, 'accepted')
    refresh(f); f.originals.control.resolve = true; f.originals.control.counterPages = 9; f.originals.control.counter = 'agrees'
    published(await f.run.ingest(JSON.stringify(f.originals.proposal('resolved-first'))))
    assert.equal(f.store.versions.size, 1); assert.equal(f.store.blocks.size, 0)
  })

  test('first escalation lost ACK replays full custody once; changed source proof cannot create a first block', async () => {
    const f = integrationFixture(); f.originals.control.counter = 'conflicts'; f.store.control.loseEscalation = true
    const text = JSON.stringify(f.originals.proposal('first-escalation-lost-ack'))
    assert.equal((await f.run.ingest(text)).status, 'unconfirmed')
    assert.equal((await f.run.ingest(text)).status, 'escalated')
    assert.equal(f.store.counts.escalationWrites, 1); assert.equal(f.store.outbox.size, 1)
    const changed = integrationFixture(); changed.originals.control.counter = 'conflicts'
    const publish = changed.store.escalations.publish.bind(changed.store.escalations)
    changed.store.escalations.publish = async (...args) => {
      await Promise.resolve(); changed.store.control.archiveEpoch++; return publish(...args)
    }
    assert.equal((await changed.run.ingest(JSON.stringify(changed.originals.proposal('stale-first-escalation')))).status, 'unavailable')
    assert.equal(changed.store.counts.escalationWrites, 0); assert.equal(changed.store.blocks.size, 0)
  })

  test('positive corrected original reaccepts as a new version, then archived escalation preserves full prior and archive through replay', async () => {
    const f = integrationFixture(); await first(f); refresh(f); f.originals.control.counter = 'conflicts'
    assert.equal((await f.run.ingest(JSON.stringify(f.originals.proposal('conflict')))).status, 'escalated')
    refresh(f); f.originals.control.resolve = true; f.originals.control.counterPages = 9; f.originals.control.counter = 'agrees'
    const reaccepted = published(await f.run.ingest(JSON.stringify(f.originals.proposal('corrected'))))
    const accepted = f.store.versions.get(reaccepted.versionRef)!; assert.equal(accepted.transition.action, 'reaccept')
    assert.equal(accepted.version.revision, 3); assert.equal(accepted.decision.knownConflicts[0].resolution?.basis, 'corrected_publication')
    refresh(f); f.originals.control.archive = true; f.originals.control.primaryUnclear = true
    const text = JSON.stringify(f.originals.proposal('archive-and-escalate'))
    assert.equal((await f.run.ingest(text)).status, 'escalated')
    const held = [...f.store.escalationOperations.values()].at(-1)!
    assert.ok(held.outcome.archiveAppend); assert.equal(held.outcome.previousDecision?.reference, accepted.decision.reference)
    assert.ok(readV3SourceDecisionRecord(held.outcome.decision, f.originals.registry, held.outcome.previousDecision, held.outcome.archiveAppend).ok)
    assert.equal(readV3SourceDecisionRecord(held.outcome.decision, f.originals.registry, held.outcome.previousDecision, null).ok, false)
    const writes = f.store.counts.escalationWrites
    assert.equal((await f.run.ingest(text)).status, 'escalated'); assert.equal(f.store.counts.escalationWrites, writes)
    assert.deepEqual([...f.store.escalationOperations.values()].at(-1), held)
  })

  test('actual monitor queues changed source bytes without claiming a changed rule; actual rule worker refreshes the version', async () => {
    const f = integrationFixture(); const accepted = await first(f)
    const contextKey = [...f.store.heads.keys()][0]; f.monitorTarget(contextKey); f.monitorControl.changed = true
    const monitored = await f.run.monitorOnce(); assert.equal(monitored.status, 'complete')
    assert.ok(monitored.outcomes.some((outcome) => outcome.status === 'research_queued' && outcome.ruleChange === 'not_asserted'))
    assert.equal(f.store.counts.versionWrites, 1)
    refresh(f, 7)
    const job = [...f.store.queueRows.values()].find((item) => item.kind === 'research_job_record')!; assert.ok(job)
    const result = await f.run.workOnce(f.claim(job)); assert.equal(result.status, 'processed', JSON.stringify(result))
    if (result.status !== 'processed') assert.fail(); const updated = published(result.results[0])
    assert.notEqual(updated.versionRef, accepted.versionRef); assert.equal(f.store.counts.versionWrites, 2)
    assert.equal(f.store.versions.get(updated.versionRef)?.version.revision, 2)
  })

  test('actual monitor suppresses expired projection with an audit once despite primary outage', async () => {
    const f = integrationFixture(); await first(f); f.monitorTarget([...f.store.heads.keys()][0])
    f.store.control.instant += 3_600_000; f.monitorControl.unreachable = true
    const concurrent = await Promise.all([f.run.monitorOnce(), f.run.monitorOnce()])
    assert.ok(concurrent.every((result) => result.outcomes.some((item) => item.status === 'suppressed' && item.ruleChange === 'not_asserted')))
    assert.equal(f.store.cache.size, 0); assert.equal(f.suppressionOperations.size, 1)
    assert.equal(f.store.audit.filter((item) => item.kind === 'monitor_suppression').length, 1)
    await f.run.monitorOnce()
    assert.equal(f.store.audit.filter((item) => item.kind === 'monitor_suppression').length, 1)
    assert.equal(f.store.counts.versionWrites, 1)
  })

  test('recovery uses independently fresh original and existing historical basis but creates a third version', async () => {
    const f = integrationFixture(); const historic = await first(f)
    refresh(f, 8); const current = await first(f, 'second')
    refresh(f, 9)
    const imported = await createV3ImportCoordinator(f.store.importPorts).submit(JSON.stringify(f.originals.proposal('recovery')))
    assert.equal(imported.status, 'completed'); if (imported.status !== 'completed' || imported.outcome.status !== 'prepared') assert.fail()
    const candidate = { ...structuredClone(imported.outcome.value),
      transition: { ...imported.outcome.value.transition, action: 'recover' as const, recoverFromVersionRef: historic.versionRef } }
    const result = published(await f.run.recover(candidate))
    assert.notEqual(result.versionRef, historic.versionRef); assert.notEqual(result.versionRef, current.versionRef)
    const recovered = f.store.versions.get(result.versionRef)!
    assert.equal(recovered.version.revision, 3); assert.equal(recovered.version.predecessor, current.versionRef)
    assert.equal(recovered.transition.recoverFromVersionRef, historic.versionRef); assert.equal(f.store.versions.size, 3)
    assert.equal((await answer(f)).response.cells[0].results[0].status, 'accepted')
  })

  test('R1 recovery rejects foreign or forged immutable historical records and accepts its actual same-context basis', async () => {
    const f = integrationFixture(), own = await first(f, 'r1-ch')
    const foreign = published(await f.run.ingest(JSON.stringify(f.originals.proposal('r1-rs', 'RS'))))
    refresh(f)
    const imported = await createV3ImportCoordinator(f.store.importPorts).submit(JSON.stringify(f.originals.proposal('r1-recovery-ch')))
    assert.equal(imported.status, 'completed'); if (imported.status !== 'completed' || imported.outcome.status !== 'prepared') assert.fail()
    const prepared = imported.outcome.value
    const candidate = (reference: string) => ({ ...structuredClone(prepared),
      transition: { ...prepared.transition, action: 'recover' as const, recoverFromVersionRef: reference } })
    const denied = await f.run.recover(candidate(foreign.versionRef))
    assert.equal(denied.status, 'version_only'); if (denied.status !== 'version_only') assert.fail()
    assert.equal(denied.result.status, 'invalid'); assert.equal(f.store.counts.versionWrites, 2)
    assert.equal(f.store.counts.publicationWrites, 2)
    const otherDestination = published(await f.run.ingest(JSON.stringify(f.originals.proposal('r1-us', 'CH', id('job3', 'direct-us'), 'US'))))
    const before = { ...f.store.counts }, historic = structuredClone(f.store.versions.get(own.versionRef)!)
    assert.equal((await f.run.recover(candidate(otherDestination.versionRef))).status, 'version_only')
    const alteredHistory = [
      { ...historic, version: { ...historic.version, method: { ...historic.version.method, revision: 2 } } },
      { ...historic, version: { ...historic.version, subject: { ...historic.version.subject,
        fact: { schema: 1 as const, fact: { kind: 'blank_passport_pages' as const, minimumPages: 8 } } } } },
      { ...historic, version: { ...historic.version, reference: ref('rule-version', 'forged-own-reference') } },
    ]
    for (const altered of alteredHistory) {
      f.store.versions.set(own.versionRef, altered)
      const result = await f.run.recover(candidate(own.versionRef))
      assert.equal(result.status, 'version_only'); if (result.status !== 'version_only') assert.fail()
      assert.equal(result.result.status, 'invalid'); assert.deepEqual(f.store.counts, before)
    }
    f.store.versions.set(own.versionRef, historic)
    const fakeReference = ref('rule-version', 'uncommitted-history')
    f.store.versions.set(fakeReference, { ...historic, version: { ...historic.version, reference: fakeReference } })
    assert.equal((await f.run.recover(candidate(fakeReference))).status, 'version_only')
    assert.deepEqual(f.store.counts, before)
    const recovered = published(await f.run.recover(candidate(own.versionRef)))
    const actual = f.store.versions.get(recovered.versionRef)!
    assert.equal(actual.version.revision, 2); assert.equal(actual.version.predecessor, own.versionRef)
    assert.equal(actual.transition.recoverFromVersionRef, own.versionRef)
    assert.equal(f.store.counts.versionWrites, before.versionWrites + 1)
    assert.equal(f.store.counts.publicationWrites, before.publicationWrites + 1)
  })

  test('method revocation, head replacement and expiry after publication await forbid publishing', async () => {
    for (const change of ['method', 'head', 'expiry', 'proof'] as const) {
      const f = integrationFixture()
      f.store.control.beforePublication = async () => {
        await Promise.resolve()
        if (change === 'method') f.store.control.methodEnabled = false
        if (change === 'head') { const [contextKey, head] = [...f.store.heads.entries()][0]
          f.store.heads.set(contextKey, { ...head, pointer: { ...head.pointer, versionRef: ref('rule-version', 'newer') } }) }
        if (change === 'expiry') f.store.control.instant += 3_600_001
        if (change === 'proof') f.store.control.proofEpoch++
      }
      assert.notEqual((await f.run.ingest(JSON.stringify(f.originals.proposal(change)))).status, 'published')
      assert.equal(f.store.counts.publicationWrites, 0)
    }
  })

  test('the final awaited source proof cannot carry a revoked method, changed head/archive or expired projection into atomic publication', async () => {
    for (const change of ['method', 'head', 'archive', 'expiry'] as const) {
      const f = integrationFixture(), reprove = f.store.versionProofs.reprove.bind(f.store.versionProofs)
      const publish = f.store.publication.publish.bind(f.store.publication)
      let publicationBoundary = false, changed = false
      f.store.publication.publish = async (...args) => { publicationBoundary = true; return publish(...args) }
      f.store.versionProofs.reprove = async (...args) => {
        const prior = await reprove(...args)
        if (publicationBoundary && !changed) {
          changed = true
          if (change === 'method') f.store.control.methodEnabled = false
          if (change === 'archive') f.store.control.archiveEpoch++
          if (change === 'expiry') f.store.control.instant += 300_001
          if (change === 'head') { const [contextKey, head] = [...f.store.heads.entries()][0]
            f.store.heads.set(contextKey, { ...head, pointer: { ...head.pointer, versionRef: ref('rule-version', 'concurrent-successor') } }) }
        }
        return prior
      }
      assert.equal((await f.run.ingest(JSON.stringify(f.originals.proposal(change)))).status, 'not_current')
      assert.equal(changed, true); assert.equal(f.store.counts.versionWrites, 1)
      assert.equal(f.store.counts.publicationWrites, 0); assert.equal(f.store.cache.size, 0)
    }
  })

  test('two real imports prepared against one missing head compete atomically and only one publishes', async () => {
    const f = integrationFixture(), importer = createV3ImportCoordinator(f.store.importPorts)
    const texts = ['competitor-a', 'competitor-b'].map((seed) => JSON.stringify(f.originals.proposal(seed)))
    for (const text of texts) { const result = await importer.submit(text)
      assert.equal(result.status, 'completed'); if (result.status !== 'completed') assert.fail()
      assert.equal(result.outcome.status, 'prepared') }
    const results = await Promise.all(texts.map((text) => f.run.ingest(text)))
    assert.equal(results.filter((item) => item.status === 'published').length, 1, JSON.stringify(results))
    const loser = results.find((item) => item.status === 'version_only')
    assert.ok(loser); assert.equal(loser.result.status, 'stale_head')
    assert.equal(f.store.counts.importWrites, 2); assert.equal(f.store.counts.versionWrites, 1)
    assert.equal(f.store.counts.publicationWrites, 1); assert.equal(f.store.heads.size, 1)
  })

  test('current batch removes positives for every citizenship if method is revoked during the final await', async () => {
    const f = integrationFixture(); await first(f)
    published(await f.run.ingest(JSON.stringify(f.originals.proposal('serbian', 'RS'))))
    f.store.control.beforeRead = async () => { await Promise.resolve(); f.store.control.methodEnabled = false }
    const result = await answer(f, ['CH', 'RS'])
    assert.ok(result.response.cells.every((cell) => cell.results.every((item) => item.status !== 'accepted')))
  })

  test('failed cache read does not become a new pending job', async () => {
    const f = integrationFixture(); await first(f); f.store.control.cacheError = true
    const count = f.store.counts.queueWrites
    assert.equal((await answer(f)).response.cells[0].results[0].status, 'error')
    assert.equal(f.store.counts.queueWrites, count)
  })

  test('private/unknown input is rejected before persistence and production has no positive bindings', async () => {
    const f = integrationFixture()
    for (const extra of [{ passportNumber: 'private' }, { mrz: 'private' }, { photo: 'private' }, { approved: true }]) {
      assert.equal((await f.run.ingest(JSON.stringify({ ...f.originals.proposal('bad'), ...extra }))).status, 'invalid')
      assert.equal((await f.run.query({ destinationCountryCode: 'AQ', citizenshipCountryCodes: ['CH'], ...extra })).ok, false)
    }
    assert.equal(f.store.quarantine.size, 0); assert.equal(f.researchControl.calls, 0)
    const closed = officialTruthV3IntegrationProduction()
    assert.equal((await closed.ingest()).status, 'unavailable'); assert.equal((await closed.workOnce()).status, 'unavailable')
    assert.equal((await closed.recover()).status, 'unavailable'); assert.equal((await closed.monitorOnce()).status, 'unavailable')
    const query = await closed.query({ destinationCountryCode: 'AQ', citizenshipCountryCodes: ['CH', 'RS'] })
    assert.ok(query.ok); if (!query.ok) assert.fail()
    assert.ok(query.answer.response.cells.every((cell) => cell.results[0].status === 'unavailable'))
  })

  test('missing publication or joint version adapter cannot fake a finished pipeline', async () => {
    const f = integrationFixture()
    const unsupported = createV3IntegrationCoordinator({ ...f.ports, versionStore: { ...f.store.versionStore, atomicBoundary: null } })
    const result = await unsupported.ingest(JSON.stringify(f.originals.proposal('unsupported')))
    assert.equal(result.status, 'version_only'); if (result.status !== 'version_only') assert.fail()
    assert.equal(result.result.status, 'unsupported'); assert.equal(f.store.counts.versionWrites, 0)
    const noPublish = createV3IntegrationCoordinator({ ...f.ports, publication: null })
    assert.equal((await noPublish.ingest(JSON.stringify(f.originals.proposal('no-publish')))).status, 'unavailable')
    assert.equal(f.store.counts.publicationWrites, 0)
    const invalidPolicy = createV3IntegrationCoordinator({ ...f.ports, projectionMaxAgeMilliseconds: 0 })
    const query = await invalidPolicy.query({ destinationCountryCode: 'AQ', citizenshipCountryCodes: ['RS'] })
    assert.ok(query.ok); if (!query.ok) assert.fail()
    assert.equal(query.answer.response.cells[0].results[0].status, 'unavailable'); assert.equal(f.store.counts.queueWrites, 0)
  })
})
