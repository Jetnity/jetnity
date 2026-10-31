// lib/activities/factory.ts
//
// Phase 3.3 hat bewusst noch keinen Activity-Adapter.
// Die Naht bleibt, damit der erste Provider die Pipeline nicht umbauen muss.

import 'server-only'

import type { ActivityProvider } from '@/lib/activities/provider'
import { viatorActivityProviderAusUmgebung } from '@/lib/providers/viator/activities/anbinden'
import { viatorProductionAusUmgebung } from '@/lib/providers/viator/activities/produktion'

export function activityProviderAus(): ActivityProvider | null {
  const production = viatorProductionAusUmgebung()
  if (production.ok) return null
  return viatorActivityProviderAusUmgebung()
}
