// Interne Rückkehr aus einer externen Anbieter-Suche.
// Kein Anbieter-Callback, kein Booking- oder Personenbeleg und keine fremden URLs.

import { modusFuerReise, modusUrl } from '@/lib/trips/workspace-mode'
import type { Trip } from '@/types/trips'

/** Reuses the shared mode parser so a stale day never selects another day. */
export function providerZurReiseplanUrl(reise: Trip, vorherigerTagId?: string | null): string {
  const tagId = vorherigerTagId && reise.days.some(tag => tag.id === vorherigerTagId)
    ? vorherigerTagId : undefined
  const modus = modusFuerReise({
    ansicht: 'plan',
    bereich: null,
    ...(tagId && { tagId }),
    urlAnpassen: false,
  }, reise, reise.ohneTag)
  return modusUrl(`/reisen/${encodeURIComponent(reise.id)}`, modus)
}
