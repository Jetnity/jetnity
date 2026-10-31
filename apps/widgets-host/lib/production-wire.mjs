import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import { AUDIT_POLICY_ID, DISCOVERCARS_AUDIT_BINDING, auditBindingMatches } from './audit-network-policy.mjs'
import { TWELVEGO_BINDING, TWELVEGO_POLICY_ID, twelvegoBindingMatches } from './twelvego-network-policy.mjs'
import { DISCOVERCARS_EXPORT, TWELVEGO_EXPORT } from './frozen-exports.mjs'
import { CHILD_ORIGIN, PARENT_ORIGIN, PROTOCOL_REVISION, parseExport } from './host-runtime.mjs'
import { productionSelection } from './registry.mjs'

const RAW = Object.freeze({
  discovercars: DISCOVERCARS_EXPORT,
  twelvego: TWELVEGO_EXPORT,
})

const FILES = Object.freeze({
  discovercars: new URL('../artifacts/discovercars-widget-allgemein.html', import.meta.url),
  twelvego: new URL('../artifacts/12go-widget-allgemein.html', import.meta.url),
})

export function frozenRaw(provider) {
  return RAW[provider] ?? null
}

export function planFromFrozen(provider) {
  const raw = RAW[provider]
  if (typeof raw !== 'string') return { ok: false, reason: 'provider' }
  const parsed = parseExport(provider, raw)
  if (!parsed.ok) return parsed
  const fileBytes = readFileSync(FILES[provider])
  const moduleBytes = Buffer.from(raw, 'utf8')
  if (!fileBytes.equals(moduleBytes)) return { ok: false, reason: 'bytes' }
  return {
    ok: true,
    provider,
    nodes: parsed.nodes,
    sha256: createHash('sha256').update(fileBytes).digest('hex'),
    bytes: fileBytes.length,
  }
}

export function clientPlan(provider, selection) {
  if (!selection || selection.selected !== true || selection.provider !== provider) return null
  if (selection.childOrigin !== CHILD_ORIGIN || selection.parentOrigin !== PARENT_ORIGIN) return null
  if (selection.protocolRevision !== PROTOCOL_REVISION) return null
  if (selection.policyId === AUDIT_POLICY_ID && !auditBindingMatches(selection)) return null
  if (selection.policyId === TWELVEGO_POLICY_ID && !twelvegoBindingMatches(selection)) return null
  const plan = planFromFrozen(provider)
  if (!plan.ok || plan.sha256 !== selection.artifactSha256) return null
  if (selection.policyId === AUDIT_POLICY_ID && plan.sha256 !== DISCOVERCARS_AUDIT_BINDING.artifactSha256) return null
  if (selection.policyId === TWELVEGO_POLICY_ID && plan.sha256 !== TWELVEGO_BINDING.artifactSha256) return null
  return {
    selected: true,
    provider,
    policyId: selection.policyId,
    artifactSha256: selection.artifactSha256,
    childOrigin: selection.childOrigin,
    parentOrigin: selection.parentOrigin,
    protocolRevision: selection.protocolRevision,
    sandbox: selection.sandbox,
    processingPolicyRevision: selection.processingPolicyRevision,
    disclosureRevision: selection.disclosureRevision,
    networkPolicyRevision: selection.networkPolicyRevision,
    requiredOptional: selection.requiredOptional,
    purposeSeparationVerified: selection.purposeSeparationVerified,
    embedPath: selection.embedPath,
    nodes: plan.nodes,
  }
}

export function productionPlanForClient(provider) {
  return clientPlan(provider, productionSelection(provider))
}
