'use client'

import { attachCmpBridge } from '@/lib/privacy/privacybee-cmp/bruecke'
import { readCmpApi } from '@/lib/privacy/privacybee-cmp/schnappschuss'
import { CMP_RELEASE_AUTHORIZED } from '@/lib/privacy/privacybee-cmp/vertrag'
import { activityWidgetErlaubt } from './widget-datenschutz'

// Activity-only rollout authorized in TASK V4. This does not enable the shared
// CMP or manufacture a visitor consent. Once a CMP is observed, losing its API
// cannot silently restore automatic display (including after a page reload).
const CMP_GESEHEN = 'jetnity:activity-widget-cmp-observed'
let cmpGesehen = false
let erlaubt = false
let stop: (() => void) | null = null
const listeners = new Set<() => void>()

function beobachten() {
  const api = window.PrivacyBee
  cmpGesehen ||= api !== undefined
  try {
    cmpGesehen ||= window.sessionStorage.getItem(CMP_GESEHEN) === '1'
    if (cmpGesehen) window.sessionStorage.setItem(CMP_GESEHEN, '1')
  } catch { /* The in-memory latch still prevents a grant after an API loss. */ }
  const next = activityWidgetErlaubt({
    read: readCmpApi(api), cmpErforderlich: Boolean(CMP_RELEASE_AUTHORIZED) || cmpGesehen,
  })
  if (next === erlaubt) return
  erlaubt = next
  for (const listener of listeners) listener()
}

export function readActivityWidgetFreigabe(): boolean {
  if (typeof window === 'undefined') return false
  let gesehen = cmpGesehen || window.PrivacyBee !== undefined
  try { gesehen ||= window.sessionStorage.getItem(CMP_GESEHEN) === '1' } catch { /* use memory */ }
  // Read before mounting children as well: a refusal made while Activities was
  // unmounted must not allow one render with the previous affirmative snapshot.
  return activityWidgetErlaubt({
    read: readCmpApi(window.PrivacyBee), cmpErforderlich: Boolean(CMP_RELEASE_AUTHORIZED) || gesehen,
  })
}
export const serverActivityWidgetFreigabe = () => false

export function subscribeActivityWidgetFreigabe(listener: () => void): () => void {
  listeners.add(listener)
  if (!stop) {
    const bridge = attachCmpBridge(document, () => window.PrivacyBee, beobachten)
    stop = () => bridge.stop()
    beobachten()
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) { stop?.(); stop = null }
  }
}
