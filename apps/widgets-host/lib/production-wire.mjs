import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

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
  const plan = planFromFrozen(provider)
  if (!plan.ok || plan.sha256 !== selection.artifactSha256) return null
  return {
    selected: true,
    provider,
    policyId: selection.policyId,
    artifactSha256: selection.artifactSha256,
    childOrigin: selection.childOrigin,
    parentOrigin: selection.parentOrigin,
    protocolRevision: selection.protocolRevision,
    sandbox: selection.sandbox,
    nodes: plan.nodes,
  }
}

export function productionPlanForClient(provider) {
  return clientPlan(provider, productionSelection(provider))
}
