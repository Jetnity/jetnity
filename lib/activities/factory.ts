// lib/activities/factory.ts
//
// Phase 3.3 hat bewusst noch keinen Activity-Adapter.
// Die Naht bleibt, damit der erste Provider die Pipeline nicht umbauen muss.

import 'server-only'

import type { ActivityProvider } from '@/lib/activities/provider'

export function activityProviderAus(): ActivityProvider | null {
  return null
}
