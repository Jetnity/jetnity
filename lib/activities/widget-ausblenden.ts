'use client'

import { useSyncExternalStore } from 'react'
import type { ActivityWidgetProvider } from '@/lib/activities/widget-datenschutz'

// Negative display preference only. Removing it never grants CMP permission.
const verborgen = new Set<ActivityWidgetProvider>()
const listeners = new Set<() => void>()
const key = (provider: ActivityWidgetProvider) => `jetnity:activity-widget-hidden:${provider}`
function lesen(provider: ActivityWidgetProvider): boolean {
  if (typeof window === 'undefined') return true
  try { return verborgen.has(provider) || window.sessionStorage.getItem(key(provider)) === '1' }
  catch { return verborgen.has(provider) }
}
function abonnieren(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
const server = () => true

export function useActivityWidgetAusgeblendet(provider: ActivityWidgetProvider): [boolean, (value: boolean) => void] {
  const hidden = useSyncExternalStore(abonnieren, () => lesen(provider), server)
  return [hidden, (value) => {
    if (value) verborgen.add(provider)
    else verborgen.delete(provider)
    try {
      if (value) window.sessionStorage.setItem(key(provider), '1')
      else window.sessionStorage.removeItem(key(provider))
    } catch { /* The in-memory negative preference still survives navigation. */ }
    for (const listener of listeners) listener()
  }]
}
