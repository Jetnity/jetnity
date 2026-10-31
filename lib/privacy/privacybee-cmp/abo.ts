// Shared in-memory CMP subscription. One bridge, one stable server snapshot.
// The server snapshot is the untouched initial state. Browser reads update a
// separate client snapshot. Unsubscribe of the last listener stops the bridge.

import { attachCmpBridge } from '@/lib/privacy/privacybee-cmp/bruecke'
import {
  createController,
  ingestApi,
  releaseMountedContext,
  type CmpControllerState,
} from '@/lib/privacy/privacybee-cmp/steuerung'
import type { WidgetConsentProviderId } from '@/lib/privacy/widget-consent/vertrag'

const SERVER_SNAPSHOT: CmpControllerState = createController()
const MISSING_TIMEOUT_MS = 12_000

let snapshot: CmpControllerState = SERVER_SNAPSHOT
const listeners = new Set<() => void>()
let bridgeStop: (() => void) | null = null
let timeout: ReturnType<typeof setTimeout> | null = null
let missingTimedOut = false

declare global {
  interface Window {
    PrivacyBee?: unknown
  }
}

export function readCmpController(): CmpControllerState {
  return snapshot
}

/** Cached value for useSyncExternalStore. Always the same object. */
export function serverCmpSnapshot(): CmpControllerState {
  return SERVER_SNAPSHOT
}

function notify(): void {
  for (const listener of listeners) listener()
}

function overlayTimeout(next: CmpControllerState): CmpControllerState {
  if (!missingTimedOut) return next
  if (next.phase !== 'missing') {
    missingTimedOut = false
    return next
  }
  if (snapshot.phase === 'error' && snapshot.read.status === 'unusable' && snapshot.read.reason === 'missing_api') {
    return snapshot
  }
  return { ...next, phase: 'error', revision: next.revision + 1 }
}

function publish(next: CmpControllerState): void {
  const overlaid = overlayTimeout(next)
  if (overlaid === snapshot) return
  snapshot = overlaid
  notify()
}

function publishObserved(): void {
  const base =
    snapshot.phase === 'error' && snapshot.read.status === 'unusable' && snapshot.read.reason === 'missing_api'
      ? { ...snapshot, phase: 'missing' as const }
      : snapshot
  const api = typeof window === 'undefined' ? undefined : window.PrivacyBee
  publish(ingestApi(base, api))
}

function armTimeout(): void {
  if (timeout) clearTimeout(timeout)
  timeout = setTimeout(() => {
    if (snapshot.phase !== 'missing') return
    missingTimedOut = true
    publish(snapshot)
  }, MISSING_TIMEOUT_MS)
}

function ensureBridge(): void {
  if (bridgeStop || typeof document === 'undefined') return
  const bridge = attachCmpBridge(document, () => window.PrivacyBee, () => {
    publishObserved()
  })
  bridgeStop = () => bridge.stop()
  queueMicrotask(() => {
    if (bridgeStop) publishObserved()
  })
  armTimeout()
}

export function subscribeCmpController(onChange: () => void): () => void {
  listeners.add(onChange)
  ensureBridge()
  return () => {
    listeners.delete(onChange)
    if (listeners.size > 0 || !bridgeStop) return
    bridgeStop()
    bridgeStop = null
    if (timeout) clearTimeout(timeout)
    timeout = null
    missingTimedOut = false
  }
}

export function applyController(change: (state: CmpControllerState) => CmpControllerState): CmpControllerState {
  const next = change(snapshot)
  if (next !== snapshot) {
    snapshot = next
    notify()
  }
  return snapshot
}

/** Keeps the retired epoch after unmount without rendering into a dying tree. */
export function retireSharedExecution(providerId: WidgetConsentProviderId): void {
  const next = releaseMountedContext(snapshot, providerId)
  if (next !== snapshot) snapshot = next
}
