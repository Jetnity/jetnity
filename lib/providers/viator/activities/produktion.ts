import 'server-only'

import { VIATOR_PRODUCTION_API_KEY_ENV } from '@/lib/providers/viator/activities/contracts'

/**
 * Source gate for the Viator Production binding.
 * No environment value can open it. A later reviewed release has to change this
 * constant and the resolver together, after a real guard port exists.
 */
export const VIATOR_PRODUCTION_QUELLE_OFFEN: boolean = false

export type ViatorProductionAufloesung =
  | { ok: true }
  | { ok: false; reason: 'source_closed' }

/**
 * Process resolver. The credential name is part of the type surface and is not read.
 * Injected tests use createViatorProductionTestClient and do not call this function.
 * Both branches stay closed until a later reviewed release builds a real binding.
 */
export function viatorProductionAusUmgebung(
  env?: { VERCEL_ENV?: string; [VIATOR_PRODUCTION_API_KEY_ENV]?: string },
): ViatorProductionAufloesung {
  void env
  if (VIATOR_PRODUCTION_QUELLE_OFFEN) return { ok: false, reason: 'source_closed' }
  return { ok: false, reason: 'source_closed' }
}
