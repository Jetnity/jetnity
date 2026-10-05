import 'server-only'

import { requirementsFuerReise } from '@/lib/readiness/engine'
import type { OfficialEvaluation } from '@/lib/readiness/official'
import { requirementsProviderAus } from '@/lib/readiness/provider'
import { requirementsProviderNachZustand } from '@/lib/readiness/zustand'
import type { Trip } from '@/types/trips'

/** Nur der bereits unter Auth/RLS geladene Trip ist Auswertungskontext. */
export async function tripOfficialEvaluationsAuswerten(reise: Trip): Promise<OfficialEvaluation[]> {
  return requirementsFuerReise(reise, requirementsProviderNachZustand(requirementsProviderAus()))
}
