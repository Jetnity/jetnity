// lib/traveller/account-registry-anzeige.ts
//
// Darstellungshilfen ohne Default-/First-Item-Semantik.

import { REGISTRY_COPY } from '@/lib/traveller/account-registry-copy'

export function registryTravellerAnzeigeName(label: string | null): string {
  return label ?? REGISTRY_COPY.ohneBezeichnung
}

export function registryDokumentCitizenshipId(
  citizenshipClientRef: string | null,
  citizenships: readonly { id: string; clientRef: string }[],
): string {
  if (!citizenshipClientRef) return ''
  return citizenships.find((eintrag) => eintrag.clientRef === citizenshipClientRef)?.id ?? ''
}
