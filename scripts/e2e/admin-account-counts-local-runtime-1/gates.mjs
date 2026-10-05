#!/usr/bin/env node
// Gate aggregation for this lane. Reuses #556 IDs and summary rules.
// Browser results cannot decide G0–G5/G20 or overall PASS.

import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { GATE_IDS, leereMatrix, setzeGate, zusammenfassung } from '../admin-account-counts-browser-acceptance-1/gates.mjs'
import {
  BROWSER_GATE_RESULTS,
  BROWSER_GATES,
  BROWSER_MODULE,
  CONTRACT_VERSION,
  RUNTIME_GATES,
} from './constants.mjs'

export { GATE_IDS, leereMatrix, setzeGate, zusammenfassung }

export function validateBrowserGates(payload) {
  if (!payload || payload.contractVersion !== CONTRACT_VERSION) {
    throw new Error(`Browser contractVersion must be ${CONTRACT_VERSION}`)
  }
  if (Array.isArray(payload.gates)) {
    const seen = new Set()
    for (const gate of payload.gates) {
      if (!gate?.id) throw new Error('Browser gate is missing an id')
      if (seen.has(gate.id)) throw new Error(`Duplicate browser gate ${gate.id}`)
      seen.add(gate.id)
    }
    payload = {
      ...payload,
      gates: Object.fromEntries(payload.gates.map((gate) => [gate.id, gate])),
    }
  }
  const gates = payload.gates || {}
  const seen = new Set()
  for (const id of BROWSER_GATES) {
    const gate = gates[id]
    if (!gate) throw new Error(`Missing browser gate ${id}`)
    if (seen.has(id)) throw new Error(`Duplicate browser gate ${id}`)
    seen.add(id)
    if (!BROWSER_GATE_RESULTS.includes(gate.result)) {
      throw new Error(`Browser gate ${id} has illegal result ${gate.result}`)
    }
  }
  for (const id of Object.keys(gates)) {
    if (!BROWSER_GATES.includes(id)) throw new Error(`Unknown browser gate ${id}`)
  }
  return gates
}

export function mergeBrowserGates(matrix, payload) {
  const gates = validateBrowserGates(payload)
  for (const id of BROWSER_GATES) {
    setzeGate(matrix, id, {
      result: gates[id].result,
      evidence: gates[id].evidence ?? null,
      notes: gates[id].notes ?? null,
    })
  }
  return matrix
}

export function markBrowserNotImplemented(matrix, reason) {
  for (const id of BROWSER_GATES) {
    setzeGate(matrix, id, { result: 'NOT RUN', notes: reason })
  }
  return matrix
}

export async function loadBrowserModule({ modulePath = BROWSER_MODULE, importer } = {}) {
  if (!existsSync(modulePath)) {
    return { present: false, module: null }
  }
  const loaded = importer
    ? await importer(modulePath)
    : await import(pathToFileURL(modulePath).href)
  if (typeof loaded.runBrowserFlows !== 'function') {
    throw new Error('Sibling browser module is present but does not export runBrowserFlows')
  }
  return { present: true, module: loaded }
}

export function decideVerdict({ mode, matrix, cleanupOk, browserPresent }) {
  const summary = zusammenfassung(matrix)
  if (!cleanupOk) return { verdict: 'CLEANUP_FAIL', summary, fullLocalExecution: false }
  if (mode === 'full' && !browserPresent) {
    return { verdict: 'NOT_IMPLEMENTED', summary: { ...summary, fullLocalExecution: false }, fullLocalExecution: false }
  }
  if (mode !== 'full') {
    return {
      verdict: summary.preflightBlocked ? 'BLOCKED_ENVIRONMENT' : 'RUNTIME_ONLY',
      summary: { ...summary, fullLocalExecution: false },
      fullLocalExecution: false,
    }
  }
  if (summary.fullLocalExecution) {
    return { verdict: 'LOCAL_FULL_STACK_PASS', summary, fullLocalExecution: true }
  }
  if (summary.preflightBlocked) {
    return { verdict: 'BLOCKED_ENVIRONMENT', summary, fullLocalExecution: false }
  }
  const failed = Object.values(matrix).some((gate) => gate.result === 'FAIL')
  return { verdict: failed ? 'FAIL' : 'NOT_IMPLEMENTED', summary, fullLocalExecution: false }
}

export function runtimeGateIds() {
  return RUNTIME_GATES
}
