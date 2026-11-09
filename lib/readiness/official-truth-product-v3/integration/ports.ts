import 'server-only'
import type { V3MethodRef, V3PublicProjectionRecord, V3ReadClock } from '../contract'
import type { V3ImportOutcome, V3ImportPorts, V3ImportPrepared } from '../import/service-server'
import type { V3ProposalUpload } from '../import/interface'
import type { V3JobFence, V3ManagedJobRecord, V3QueueOptions } from '../monitor/queue'
import type { V3ResearchWorkPort, V3ResearchResultCustodyPort, V3WorkerResultRecord, V3WorkerOutcome } from '../monitor/worker'
import type { V3TransitionProofPort, V3TransitionProofState, V3VersionCommitPort } from '../monitor/recovery'
import type { V3MonitorPlanPort, V3ProjectionSuppressionPort, V3SourceObservationPort } from '../monitor/monitor'
import type { V3VisitorPorts } from '../visitor/query'

export type V3ResearchArtifact = Readonly<{
  jobId: string; jobOperationId: string; jobKey: string; resultRef: string;
  fence: V3JobFence; method: V3MethodRef; uploads: readonly string[];
}>
/** Private durable result custody, not a researcher-supplied receipt. */
export interface V3ResearchArtifactPort {
  /** Confirm the exact original claim operation/result fence after an interrupted
   * integration. Current succeeded job/result custody is mandatory; a reused
   * leaseId or a later claim generation is insufficient. No new work on unknown. */
  resume(claim: Readonly<{ operationId: string; jobKey: string; leaseId: string; leaseMilliseconds: number }>,
    signal: AbortSignal): Promise<{ status: 'completed'; worker: Extract<V3WorkerOutcome, { status: 'completed' }> }
      | { status: 'not_attempted' | 'unconfirmed' | 'unavailable' }>
  open(job: V3ManagedJobRecord, result: V3WorkerResultRecord, signal: AbortSignal): Promise<
    { status: 'available'; receipt: object; artifact: V3ResearchArtifact }
    | { status: 'unconfirmed' | 'unavailable' }>
  reprove(receipt: object, artifact: V3ResearchArtifact, job: V3ManagedJobRecord,
    clock: V3ReadClock, signal: AbortSignal): Promise<boolean>
}

export type V3PublicationCommand = Readonly<{
  operationId: string; operationKey: string; prepared: V3ImportPrepared;
  projection: V3PublicProjectionRecord; methodReceipt: object; proofReceipt: object; notAfter: string;
  /** Preliminary proof only. The adapter must inspect actual receipt state AFTER it. */
  reprove(signal: AbortSignal): Promise<V3TransitionProofState>;
}>
export type V3PublicationConfirmation = Readonly<{
  operationId: string; operationKey: string; projectionRef: string; versionRef: string;
  checkedAt: string; freshUntil: string;
}>
export type V3PublicationState =
  | { status: 'confirmed'; confirmation: V3PublicationConfirmation }
  | { status: 'not_attempted' | 'not_current' | 'unconfirmed' | 'collision' | 'unavailable' }
/**
 * Both functions share the version/method/proof/archive authority boundary.
 * After ALL waits, inspect real receipts, current head, source/archived originals,
 * native expiry and end clock together. No yield between that check and writes
 * or confirmation. Publish exact projection + coverage + operation atomically.
 * Unknown outcomes are confirmed using the SAME operation/key; never blind retry.
 */
export interface V3ProjectionPublicationPort {
  confirm(command: V3PublicationCommand, signal: AbortSignal): Promise<V3PublicationState>
  publish(command: V3PublicationCommand, signal: AbortSignal): Promise<
    { status: 'reported' | 'unconfirmed' | 'collision' | 'unavailable' | 'not_current' }>
}

export type V3IntegrationEscalation = Extract<V3ImportOutcome, { status: 'escalation' }>
export type V3EscalationCommand = Readonly<{
  operationId: string; operationKey: string; upload: V3ProposalUpload; outcome: V3IntegrationEscalation;
}>
export type V3EscalationState =
  | { status: 'confirmed'; operationKey: string; escalationKey: string }
  | { status: 'not_attempted' | 'unconfirmed' | 'collision' | 'unavailable' }
/**
 * Independently prove the actual completed I1 quarantine outcome and current
 * method/source/history/archive custody. Atomically retain FULL decision/prior/
 * archive + audit + deduplicated outbox + suppression. Sticky conflict state must
 * participate in later evidence/commit proofs even without an accepted version.
 * Historical replay cannot erase a later resolution or suppress a newer head.
 * This port sends no message; it records an outbox item only.
 */
export interface V3EscalationPublicationPort {
  confirm(command: V3EscalationCommand, signal: AbortSignal): Promise<V3EscalationState>
  publish(command: V3EscalationCommand, signal: AbortSignal): Promise<
    { status: 'reported' | 'unconfirmed' | 'collision' | 'unavailable' }>
}

/** All positive implementations remain external, code-owned and currently unbound. */
export interface V3IntegrationPorts {
  import: V3ImportPorts<object, object, object, object>
  queue: Omit<V3QueueOptions, 'methodAuthority' | 'now'>
  versionStore: V3VersionCommitPort | null
  versionProofs: V3TransitionProofPort<object> | null
  publication: V3ProjectionPublicationPort | null
  escalations: V3EscalationPublicationPort | null
  research: {
    work: V3ResearchWorkPort<object> | null
    results: V3ResearchResultCustodyPort<object> | null
    artifacts: V3ResearchArtifactPort | null
  }
  visitor: Omit<V3VisitorPorts<object, object>, 'registry' | 'method' | 'methodAuthority' | 'clock' | 'queue' | 'discoveryQueue'>
  monitor: {
    plans: V3MonitorPlanPort<object> | null
    sources: V3SourceObservationPort<object> | null
    suppressions: V3ProjectionSuppressionPort | null
  }
  invocationMilliseconds: number
  /** Required reviewed deployment policy, not a method approval or default freshness extension. */
  projectionMaxAgeMilliseconds: number
}
