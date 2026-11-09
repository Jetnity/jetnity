// SYNTHETIC N1 TEST SUPPORT ONLY. Real local files, fake intake; no database proof.
import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { sha256Hex } from '@/lib/readiness/digest'
import { makeSyntheticOriginals, METHOD, must } from '../../integration/test-support/originals'
import { readV3IntakeBinding, readV3IntakeReference, type V3IntakeBinding,
  type V3IntakeReference, type V3IntakeResult, type V3ProposalIntakePort } from '../../storage/intake-contract'
import { createV3ResearchFileIngress } from '../service-server'
import type { V3IngressRootPin, V3ResearchIngressConfiguration } from '../types'

function fakeIntake() {
  const rows = new Map<string, { reference: V3IntakeReference; text: string }>()
  const captures: { text: unknown; binding: V3IntakeBinding; signal: AbortSignal }[] = []
  const confirms: V3IntakeReference[] = []
  const port: V3ProposalIntakePort = {
    async capture(text, binding, signal) {
      captures.push({ text, binding, signal })
      if (signal.aborted) return { status: 'not_attempted' }
      assert.equal(typeof text, 'string')
      if (typeof text !== 'string') assert.fail('test text')
      const reference = must(readV3IntakeReference({ binding, proposalDigest: sha256Hex(text), bytes: Buffer.byteLength(text) }))
      const old = rows.get(binding.operationId)
      if (old && JSON.stringify(old.reference) !== JSON.stringify(reference)) return { status: 'collision' }
      rows.set(binding.operationId, { reference, text })
      return { status: 'recorded', reference }
    },
    async confirm(reference) {
      confirms.push(reference)
      const old = rows.get(reference.binding.operationId)
      if (!old) return { status: 'not_attempted' }
      return JSON.stringify(old.reference) === JSON.stringify(reference)
        ? { status: 'recorded', reference: old.reference } : { status: 'collision' }
    },
  }
  return { port, rows, captures, confirms }
}

export async function fixture(t: TestContext, seed = 'n1') {
  const parent = await fs.mkdtemp(join(tmpdir(), 'jetnity-n1-'))
  const directory = join(parent, 'selected')
  await fs.mkdir(directory, { mode: 0o700 })
  t.after(async () => { await fs.rm(parent, { recursive: true, force: true }) })
  const originals = makeSyntheticOriginals()
  const proposal = originals.proposal(seed)
  const text = JSON.stringify(proposal, null, 2) + '\n'
  const fileName = 'proposal-1.json'
  const path = join(directory, fileName)
  await fs.writeFile(path, text, { mode: 0o600 })
  const stat = await fs.lstat(directory, { bigint: true })
  const root: V3IngressRootPin = Object.freeze({ directory, device: stat.dev.toString(), inode: stat.ino.toString() })
  const binding = must(readV3IntakeBinding({ schema: 3, kind: 'proposal_intake_binding',
    operationId: proposal.operationId, jobId: proposal.jobId, contextKey: proposal.contextKey, method: METHOD,
    runnerId: `runner3_${sha256Hex('n1-runner').slice(0, 32)}`,
    deliveryId: `delivery3_${sha256Hex(seed).slice(0, 32)}`, inputRevision: `snapshot:${sha256Hex(seed)}` }))
  const expected = must(readV3IntakeReference({ binding, proposalDigest: sha256Hex(text), bytes: Buffer.byteLength(text) }))
  const intake = fakeIntake()
  const configuration: V3ResearchIngressConfiguration = { root, registry: originals.registry, intake: intake.port }
  function ingress(overrides: Partial<V3ResearchIngressConfiguration> = {}) {
    return createV3ResearchFileIngress({ ...configuration, ...overrides })
  }
  return { parent, directory, path, fileName, text, root, binding, expected, proposal,
    delivery: { fileName, binding }, originals, intake, configuration, ingress }
}

/** Deliberately malformed test reply; the transport interface cannot attest itself. */
export const malformed = (value: unknown): V3IntakeResult => value as V3IntakeResult
