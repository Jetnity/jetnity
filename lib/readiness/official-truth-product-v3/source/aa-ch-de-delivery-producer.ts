// One fixed untrusted delivery. This producer performs no source read, approval,
// queue operation or custody issuance. I1 must obtain fresh Issuer/HRS evidence.
import 'server-only'

import { sha256Hex } from '@/lib/readiness/digest'
import { immutable, ownRecord } from '@/lib/readiness/official-truth-autonomous-provenance-artifact'
import { createV3CombinationDiscoveryIdentity, createV3WorkIdentity,
  readV3CombinationDiscoveryJobRecord, readV3ResearchJobRecord,
  type V3ResearchIdentity, type V3ResearchProposal } from '../contract'
import type { M04DeliveryProducer } from '../jobs/contract'
import { hrs1Canonical, hrs1Same } from '../result/contract'
import { readV3IntakeBinding } from '../storage/intake-contract'
import { readV3RetainableProposal } from '../storage/proposal-bytes'
import { AA_BERN_CH_DE_METHOD_PACKAGE_TEXT, AA_BERN_CH_DE_REVIEWED_PROGRAM } from './aa-ch-de-reviewed-program'

const program = AA_BERN_CH_DE_REVIEWED_PROGRAM
const producerRevision = 1
const inputRevision = `snapshot:${sha256Hex(AA_BERN_CH_DE_METHOD_PACKAGE_TEXT)}`
const runnerId = `runner3_${sha256Hex(hrs1Canonical({
  kind: 'aa_bern_ch_de_untrusted_delivery', producerRevision, inputRevision,
})).slice(0, 32)}`
const invalid = Object.freeze({ status: 'failed', reason: 'invalid_proposal' } as const)
const aborted = Object.freeze({ status: 'failed', reason: 'unreachable' } as const)

function fixedIdentities() {
  const work = createV3WorkIdentity({ context: program.context, method: program.method,
    factKind: 'requirement_effect', researchReason: { status: 'missing' } })
  const discovery = createV3CombinationDiscoveryIdentity({
    destinationCountryCode: 'DE', citizenshipCountryCode: 'CH', method: program.method,
  })
  if (!work.ok || !discovery.ok || work.value.contextKey !== program.contextKey
    || program.context.scope.destinationCountryCode !== 'DE'
    || program.context.scope.citizenship.mode !== 'required'
    || !hrs1Same(program.context.scope.citizenship.countryCodes, ['CH'])
    || program.context.scope.credentialOption.mode !== 'option'
    || program.context.scope.credentialOption.documentType !== 'passport'
    || program.context.scope.credentialOption.issuingCountryCode !== 'CH'
    || program.context.scope.credentialOption.relatedCitizenshipCountryCode !== 'CH'
    || program.context.scope.requirementType !== 'visa' || program.context.route !== 'direct_entry'
    || program.context.conditions.status !== 'unconditional') throw Error('ch_de_delivery_context_invalid')
  return Object.freeze({ work: work.value, discovery: discovery.value })
}
const selected = fixedIdentities()

/** A suggestion corresponding to the reviewed program, never a source fact.
 * Neither this hypothesis nor a failed/unclear source check can publish a rule.
 * I1 compares it with the separately verified original and may supersede it. */
const proposedFact: V3ResearchProposal['proposedFact'] = immutable({
  schema: 1, fact: { kind: 'requirement_effect', effect: 'not_required', visaMode: 'visa_exempt' },
})
const references: V3ResearchProposal['references'] = immutable([program.source, program.counter.source].map(source => ({
  source: { sourceId: source.sourceId, contentItemId: source.contentItemId, representationId: source.representationId },
  claimedRetrievedAt: null, claimedValidity: { status: 'unresolved' as const },
})))

export const AA_CH_DE_DELIVERY_PRODUCER: M04DeliveryProducer = Object.freeze<M04DeliveryProducer>({
  async produce(input, signal) {
    try {
      if (signal.aborted) return aborted
      const packet = ownRecord(input, ['job', 'fence'])
      if (!packet) return invalid
      const fence = ownRecord(packet.fence, ['jobId', 'revision', 'leaseId', 'generation'])
      if (!fence) return invalid
      const rule = readV3ResearchJobRecord(packet.job)
      const discovery = rule.ok ? null : readV3CombinationDiscoveryJobRecord(packet.job)
      const job = rule.ok ? rule.value : discovery?.ok ? discovery.value : null
      // This checks the supplied fence shape/binding only. Actual claim, lease
      // freshness and commit fencing remain with M04 and its database boundary.
      if (!job || job.state !== 'leased' || !job.lease
        || fence.jobId !== job.jobId || fence.revision !== job.revision
        || fence.leaseId !== job.lease.leaseId || fence.generation !== job.lease.generation) return invalid
      let research: V3ResearchIdentity
      if (job.kind === 'research_job_record') {
        if (job.contextKey !== program.contextKey || job.jobKey !== selected.work.jobKey
          || !hrs1Same(job.context, program.context) || !hrs1Same(job.method, program.method)
          || job.research.factKind !== 'requirement_effect') return invalid
        research = job.research
      } else {
        if (!hrs1Same(job.identity, selected.discovery)) return invalid
        research = selected.work.research
      }
      // Stable within the same actual delivery attempt; another generation or
      // changed job/program has different identities. These are not receipts.
      const seed = hrs1Canonical({ producerRevision, inputRevision, job, fence })
      const operationId = `op3_${sha256Hex('operation:' + seed).slice(0, 32)}`
      const deliveryId = `delivery3_${sha256Hex('delivery:' + seed).slice(0, 32)}`
      const proposal: V3ResearchProposal = {
        schema: 3, kind: 'untrusted_research_proposal', jobId: job.jobId, operationId,
        context: program.context, contextKey: program.contextKey, research, proposedFact, references,
      }
      const text = JSON.stringify(proposal)
      const upload = readV3RetainableProposal(text, program.registry)
      const binding = readV3IntakeBinding({ schema: 3, kind: 'proposal_intake_binding',
        operationId, jobId: job.jobId, contextKey: program.contextKey, method: program.method,
        runnerId, deliveryId, inputRevision })
      if (!upload.ok || !binding.ok || !hrs1Same(upload.value.proposal.context, proposal.context)
        || !hrs1Same(upload.value.proposal.research, research)) return invalid
      if (signal.aborted) return aborted
      return Object.freeze({ status: 'delivered' as const,
        deliveries: Object.freeze([Object.freeze({ binding: binding.value, text })]) })
    } catch { return invalid }
  },
})
