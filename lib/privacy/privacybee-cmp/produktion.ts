// Productive capability seam. The shipped table is null and the release is false.
// Handles are object identities. A copied field bag is not a grant.

import { browserHostIstLizenziert } from '@/lib/legal/privacybee-vertrag'

import { applyController, readCmpController } from '@/lib/privacy/privacybee-cmp/abo'
import { bakedProductionGateAllows, readBakedProductionGate } from '@/lib/privacy/privacybee-cmp/bootstrap'
import {
  readShippedProductionPolicy,
  validateProductionPolicy,
  type ProductionPolicyRecord,
} from '@/lib/privacy/privacybee-cmp/produktionspolitik'
import {
  bindReviewedPolicy,
  dispatchChoice,
  ingestApi,
  issueWork,
  releaseMountedContext,
  selectProvider,
  startLocalContext,
} from '@/lib/privacy/privacybee-cmp/steuerung'
import type { WidgetConsentProviderId } from '@/lib/privacy/widget-consent/vertrag'

export const PARENT_GENERATION_LIMIT = 1_000_000

export type ProductionCapability = {
  readonly providerId: WidgetConsentProviderId
  readonly src: string
  readonly childOrigin: string
  readonly sandbox: string
  readonly protocolRevision: 1
}

export type ProductionGrant = {
  readonly policyId: string
  readonly artifactSha256: string
  readonly parentGeneration: number
}

type Reservation = {
  providerId: WidgetConsentProviderId
  scopeKey: string
  policyId: string
  tuple: string
  artifactSha256: string
  epoch: number
  released: boolean
  consumed: boolean
}

export function nextParentGeneration(current: number): number | null {
  if (!Number.isInteger(current) || current < 0 || current >= PARENT_GENERATION_LIMIT) return null
  return current + 1
}

function tupleOf(policy: ProductionPolicyRecord): string {
  return JSON.stringify([
    policy.policyId,
    policy.requiredOptional,
    policy.processingPolicyRevision,
    policy.disclosureRevision,
    policy.artifactSha256,
    policy.embedPath,
    policy.networkPolicyRevision,
    policy.hostSelectionCommit,
    policy.sandbox,
  ])
}

function browserHostname(): string | null {
  if (typeof location === 'undefined') return null
  return location.hostname
}

function browserApi(): unknown {
  if (typeof window === 'undefined') return undefined
  return window.PrivacyBee
}

function gateAllows(): boolean {
  return bakedProductionGateAllows(readBakedProductionGate())
}

function policyForRequest(providerId: WidgetConsentProviderId): ProductionPolicyRecord | null {
  const policy = validateProductionPolicy(readShippedProductionPolicy(providerId))
  if (!policy || policy.providerId !== providerId) return null
  return policy
}

function reservationMatches(reservation: Reservation): boolean {
  const state = readCmpController()
  const live = state.live
  if (!live) return false
  return live.providerId === reservation.providerId
    && live.epoch === reservation.epoch
    && live.policyId === reservation.policyId
    && live.scopeKey === reservation.scopeKey
}

function retireIfCurrent(reservation: Reservation): void {
  if (reservation.released) return
  reservation.released = true
  const state = readCmpController()
  const live = state.live
  const slot = state.slots[reservation.providerId]
  const sameLive = Boolean(
    live &&
      live.providerId === reservation.providerId &&
      live.epoch === reservation.epoch &&
      live.policyId === reservation.policyId &&
      live.scopeKey === reservation.scopeKey,
  )
  const samePending = !live
    && slot.intent === 'selected'
    && slot.epoch === reservation.epoch
    && slot.policyId === reservation.policyId
    && slot.consent.scopeKey === reservation.scopeKey
  if (sameLive || samePending) {
    applyController((current) => releaseMountedContext(current, reservation.providerId))
  }
}

const reservations = new WeakMap<ProductionCapability, Reservation>()
let issuedGeneration = 0

function stillValid(capability: ProductionCapability): boolean {
  const reservation = reservations.get(capability)
  if (!reservation || reservation.released) return false
  if (!gateAllows() || !browserHostIstLizenziert(browserHostname())) {
    retireIfCurrent(reservation)
    return false
  }
  applyController((current) => ingestApi(current, browserApi()))
  const policy = policyForRequest(reservation.providerId)
  if (!policy || policy.policyId !== reservation.policyId || tupleOf(policy) !== reservation.tuple) {
    retireIfCurrent(reservation)
    return false
  }
  return reservationMatches(reservation)
}

export function requestProductionExecution(providerId: WidgetConsentProviderId, scopeKey: string): ProductionCapability | null {
    if (providerId !== 'discovercars' && providerId !== 'twelvego') return null
    if (typeof scopeKey !== 'string' || scopeKey.trim() === '') return null
    if (!gateAllows() || !browserHostIstLizenziert(browserHostname())) return null
    const policy = policyForRequest(providerId)
    if (!policy) return null
    const state = readCmpController()
    if (state.live) return null
    if (state.slots.discovercars.intent === 'selected' || state.slots.twelvego.intent === 'selected') return null

    let next = state
    const slot = next.slots[providerId]
    if (slot.consent.scopeKey !== scopeKey) {
      const reset = dispatchChoice(next, providerId, {
        type: 'reset_context',
        generation: slot.consent.generation,
        reason: 'scope_changed',
        scopeKey,
      })
      if (reset.slots[providerId].consent.scopeKey !== scopeKey) return null
      next = reset
    }
    next = selectProvider(next, providerId)
    next = bindReviewedPolicy(next, providerId, { id: policy.policyId, requiredOptional: policy.requiredOptional })
    const token = issueWork(next, providerId)
    if (!token || token.policyId !== policy.policyId) {
      applyController(() => releaseMountedContext(next, providerId))
      return null
    }
    const started = startLocalContext(next, providerId, { id: policy.policyId, requiredOptional: policy.requiredOptional }, browserApi(), browserHostname(), token)
    if (!started.created || started.state.live?.policyId !== policy.policyId) {
      applyController(() => releaseMountedContext(started.state, providerId))
      return null
    }
    applyController(() => started.state)
    const capability: ProductionCapability = Object.freeze({
      providerId,
      src: `${policy.childOrigin}${policy.embedPath}`,
      childOrigin: policy.childOrigin,
      sandbox: policy.sandbox,
      protocolRevision: 1,
    })
    reservations.set(capability, {
      providerId,
      scopeKey,
      policyId: policy.policyId,
      tuple: tupleOf(policy),
      artifactSha256: policy.artifactSha256,
      epoch: token.epoch,
      released: false,
      consumed: false,
    })
    return capability
}

export function checkProductionExecution(capability: ProductionCapability): boolean {
  return stillValid(capability)
}

export function consumeProductionGrant(capability: ProductionCapability): ProductionGrant | null {
    if (!stillValid(capability)) return null
    const reservation = reservations.get(capability)
    if (!reservation || reservation.consumed) return null
    const generation = nextParentGeneration(issuedGeneration)
    if (generation === null) return null
    issuedGeneration = generation
    reservation.consumed = true
    return {
      policyId: reservation.policyId,
      artifactSha256: reservation.artifactSha256,
      parentGeneration: generation,
    }
}

export function releaseProductionExecution(capability: ProductionCapability): void {
  const reservation = reservations.get(capability)
  if (!reservation) return
  retireIfCurrent(reservation)
}
