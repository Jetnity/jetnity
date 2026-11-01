import { CHILD_ORIGIN, PARENT_ORIGIN, PROTOCOL_REVISION } from './host-runtime.mjs'

/**
 * Source-owned binding for the internal DiscoverCars initial-load audit seam.
 * decide() does not read this selection. The production registry stays unselected.
 * The frame target is this constant. A plan field cannot replace it.
 */
export const AUDIT_POLICY_ID = 'discovercars-initial-load-audit-v1'

export const DISCOVERCARS_AUDIT_FRAME_SRC = 'https://widget.discovercars.com/de/locations/'

export const DISCOVERCARS_AUDIT_BINDING = Object.freeze({
  policyId: AUDIT_POLICY_ID,
  provider: 'discovercars',
  artifactSha256: '5a9ea3edf4bfa5762850e0d1e6c9f5d777d860f9442fbe17bf9a76b1618cc8aa',
  childOrigin: CHILD_ORIGIN,
  parentOrigin: PARENT_ORIGIN,
  protocolRevision: PROTOCOL_REVISION,
})

export function auditBindingMatches(value) {
  if (!value || value.selected !== true) return false
  const binding = DISCOVERCARS_AUDIT_BINDING
  return value.policyId === binding.policyId
    && value.provider === binding.provider
    && value.artifactSha256 === binding.artifactSha256
    && value.childOrigin === binding.childOrigin
    && value.parentOrigin === binding.parentOrigin
    && value.protocolRevision === binding.protocolRevision
}

export function auditFrameSource(plan) {
  if (!auditBindingMatches(plan)) return null
  return DISCOVERCARS_AUDIT_FRAME_SRC
}
