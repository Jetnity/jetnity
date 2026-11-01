import { CHILD_ORIGIN, PARENT_ORIGIN, PROTOCOL_REVISION } from './host-runtime.mjs'
import { TWELVEGO_BINDING } from './twelvego-network-policy.mjs'

const discovercars = Object.freeze({
  provider: 'discovercars',
  selected: false,
  artifactSha256: '5a9ea3edf4bfa5762850e0d1e6c9f5d777d860f9442fbe17bf9a76b1618cc8aa',
  childOrigin: CHILD_ORIGIN,
  parentOrigin: PARENT_ORIGIN,
  protocolRevision: PROTOCOL_REVISION,
  processingPolicyRevision: 'unselected',
  policyId: 'unselected',
  sandbox: 'distinct-child-only',
  networkPolicy: 'unselected',
})

const twelvego = Object.freeze({ ...TWELVEGO_BINDING })

export const PRODUCTION_REGISTRY = Object.freeze({ discovercars, twelvego })

export function productionSelection(provider) {
  const row = PRODUCTION_REGISTRY[provider]
  if (!row || row.selected !== true) return null
  return row
}
