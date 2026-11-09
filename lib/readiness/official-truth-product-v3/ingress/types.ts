import type { QuellenRegistry } from '@/lib/readiness/source-registry'
import type { V3IntakeBinding, V3IntakeReference, V3ProposalIntakePort } from '../storage/intake-contract'

/** One direct lowercase JSON basename; no dots, path separators or hidden names. */
export const V3_RESEARCH_FILE_NAME = /^[a-z0-9][a-z0-9_-]{0,119}\.json$/

/** Runner-selected local identity only; neither Git provenance nor source authority. */
export type V3IngressRootPin = Readonly<{ directory: string; device: string; inode: string }>
export type V3ResearchDelivery = Readonly<{ fileName: string; binding: V3IntakeBinding }>
export type V3ResearchIngressConfiguration = Readonly<{
  root: V3IngressRootPin;
  registry: QuellenRegistry;
  intake: V3ProposalIntakePort | null;
  /** A logical work/abort budget, not a kernel IO or noncooperating-port deadline. */
  invocationMilliseconds?: number;
}>

export type V3IngressRefusal =
  | 'invalid_delivery' | 'invalid_binding' | 'binding_mismatch' | 'invalid_reference'
  | 'unsafe_file' | 'file_changed' | 'bound_exceeded' | 'invalid_encoding'
  | 'invalid_upload' | 'invalid_proposal'
export type V3IngressUnavailable =
  | 'unbound' | 'invalid_configuration' | 'unsupported_platform' | 'unsafe_root'
  | 'filesystem_unavailable' | 'cleanup_failed' | 'aborted' | 'budget_exhausted' | 'intake_unavailable'
export type V3ResearchIngressResult =
  /** Only untrusted proposal custody. Never approval, accepted data or a source receipt. */
  | Readonly<{ status: 'recorded'; reference: V3IntakeReference }>
  | Readonly<{ status: 'rejected'; reason: V3IngressRefusal }>
  | Readonly<{ status: 'unavailable'; reason: V3IngressUnavailable }>
  /** A capture may have committed. Reconcile this exact reference; never invent a new operation. */
  | Readonly<{ status: 'unconfirmed'; reference: V3IntakeReference }>
  | Readonly<{ status: 'collision' | 'not_attempted' }>

export interface V3ResearchFileIngress {
  deliver(delivery: unknown, signal?: AbortSignal): Promise<V3ResearchIngressResult>
  /** No file access. Re-entry after a lost acknowledgement uses the same exact reference. */
  confirm(reference: unknown, signal?: AbortSignal): Promise<V3ResearchIngressResult>
}

/** Internal owned-call scope: every asynchronous operation is drained before disposal. */
export type V3IngressBudget = Readonly<{
  signal: AbortSignal;
  stopped(): 'aborted' | 'budget_exhausted' | null;
}>
