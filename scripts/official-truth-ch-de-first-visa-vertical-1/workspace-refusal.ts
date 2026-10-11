// Developer-only integration, no runtime page/API imports this module.
import 'server-only'

import { chDeVisaReadForTrip } from '../../lib/readiness/official-truth-ch-de-first-visa-vertical-1/adapter'
import { tripOfficialEvaluationsAuswerten } from '../../lib/readiness/trip-official-evaluations-server'
import { requirementsFuerReise } from '../../lib/readiness/engine'
import { requirementsProviderNachZustand } from '../../lib/readiness/zustand'
import type { Trip } from '../../types/trips'

/** The blocked reader supplies exactly null to the canonical engine. Also run
 * the actual existing account-server seam; tests compare both projections.
 * This harness cannot turn a local SQL/provenance success into an Official rule.
 */
export async function chDeWorkspaceRefusal(reise: Trip, request: unknown) {
  const read = chDeVisaReadForTrip(reise, request)
  const evaluations = await requirementsFuerReise(reise, requirementsProviderNachZustand(read.provider))
  const accountEvaluations = await tripOfficialEvaluationsAuswerten(reise)
  return { read, evaluations, accountEvaluations }
}
