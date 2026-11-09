import 'server-only'
import { createV3WorkIdentity } from '../contract'
import type { QuellenRegistry } from '@/lib/readiness/source-registry'
import { readV3IntakeBinding, readV3IntakeReference, type V3IntakeBinding, type V3IntakeReference, type V3IntakeResult, type V3ProposalIntakePort } from './intake-contract'
import { readV3RetainableProposal } from './proposal-bytes'
import { createV3PostgresQuarantineBackend, type V3IntakeSqlExecutor } from './quarantine-postgres'

/** No default environment, DB connection, registry or method authority. */
export function proposalIntakeProduction(): V3IntakeResult { return Object.freeze({ status: 'unavailable' }) }

/** Explicit code-owned composition seam. Still unbound in the application. */
export function createV3ProposalIntakeStore(options: Readonly<{
  registry: QuellenRegistry; executor: V3IntakeSqlExecutor | null; leaseMilliseconds: number;
}>) {
  const backend = createV3PostgresQuarantineBackend(options.registry, options.executor, options.leaseMilliseconds)
  const intake: V3ProposalIntakePort = Object.freeze({
    async capture(text: unknown, bindingInput: V3IntakeBinding, signal: AbortSignal): Promise<V3IntakeResult> {
      if (signal.aborted) return { status: 'unavailable' }
      const binding = readV3IntakeBinding(bindingInput)
      if (!binding.ok) return { status: 'rejected', reason: 'invalid_binding' }
      const parsed = readV3RetainableProposal(text, options.registry)
      if (!parsed.ok || typeof text !== 'string') return { status: 'rejected', reason: parsed.ok ? 'invalid_upload' : parsed.reason }
      const proposal = parsed.value.proposal
      const identity = createV3WorkIdentity({ context: proposal.context, method: binding.value.method,
        factKind: proposal.research.factKind, researchReason: proposal.research.researchReason })
      if (!identity.ok || identity.value.contextKey !== binding.value.contextKey
        || proposal.operationId !== binding.value.operationId || proposal.jobId !== binding.value.jobId
        || proposal.contextKey !== binding.value.contextKey) return { status: 'rejected', reason: 'binding_mismatch' }
      if (signal.aborted) return { status: 'unavailable' }
      return backend.capture(text, Object.freeze({ binding: binding.value, proposalDigest: parsed.value.digest, bytes: parsed.value.bytes }), signal)
    },
    async confirm(referenceInput: V3IntakeReference, signal: AbortSignal): Promise<V3IntakeResult> {
      const reference = readV3IntakeReference(referenceInput)
      if (!reference.ok) return { status: 'rejected', reason: 'invalid_binding' }
      const result = await backend.read(reference.value, signal)
      return result.status === 'recorded' ? { status: 'recorded', reference: result.record.reference } : { status: result.status }
    },
  })
  return Object.freeze({ intake, open: backend.read, forImport: backend.quarantine, confirmImport: backend.confirmImport })
}
