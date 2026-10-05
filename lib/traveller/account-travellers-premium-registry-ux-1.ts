// lib/traveller/account-travellers-premium-registry-ux-1.ts
//
// Reine Darstellung der Account-Registry: kompakte Zusammenfassung und
// welche schwere Fläche offen ist. Keine Credential-Wahl, keine Trip-Abbildung.

import { landAnzeigeText, landPraefixText } from '@/lib/country/darstellung'
import { REGISTRY_COPY, REGISTRY_DOKUMENT_TYP_LABEL } from '@/lib/traveller/account-registry-copy'
import { registryTravellerAnzeigeName } from '@/lib/traveller/account-registry-anzeige'
import type { AccountRegistryTraveller } from '@/lib/traveller/account-registry'
import {
  dokumentAblaufGegenReferenztag,
  dokumentKontoAblaufText,
  dokumentKontoAblaufWarnung,
} from '@/lib/traveller/dokument-lebenszyklus'

export type RegistryFlaeche =
  | { readonly art: 'uebersicht' }
  | { readonly art: 'anlegen' }
  | { readonly art: 'verwalten'; readonly travellerId: string }

export function registryFlaecheAnlegen(aktuell: RegistryFlaeche): RegistryFlaeche {
  return aktuell.art === 'anlegen' ? { art: 'uebersicht' } : { art: 'anlegen' }
}

export function registryFlaecheVerwalten(aktuell: RegistryFlaeche, travellerId: string): RegistryFlaeche {
  if (aktuell.art === 'verwalten' && aktuell.travellerId === travellerId) {
    return { art: 'uebersicht' }
  }
  return { art: 'verwalten', travellerId }
}

export function registryVerwalteteId(flaeche: RegistryFlaeche): string | null {
  return flaeche.art === 'verwalten' ? flaeche.travellerId : null
}

export function registryAnzahlText(anzahl: number, leer: string, einzahl: string, mehrzahl: string): string {
  if (anzahl <= 0) return leer
  if (anzahl === 1) return `1 ${einzahl}`
  return `${anzahl} ${mehrzahl}`
}

export type RegistryDokumentZeile = {
  readonly id: string
  readonly typLabel: string
  readonly ablaufWarnung: boolean
  readonly ablaufSichtbar: boolean
  readonly ablaufText: string
}

export type RegistryKompaktkarte = {
  readonly name: string
  readonly wohnsitz: string
  readonly staatsbuergerschaften: readonly { readonly id: string; readonly label: string }[]
  readonly dokumente: readonly RegistryDokumentZeile[]
  readonly ablaufWarnungen: number
}

export function registryKompaktkarte(
  traveller: AccountRegistryTraveller,
  heute: string | null,
): RegistryKompaktkarte {
  const dokumente = traveller.facts.documents.map((eintrag) => {
    const lage = dokumentAblaufGegenReferenztag(eintrag.expiresOn, heute)
    const ohneKalender =
      lage.art === 'unknown' && (lage.grund === 'reference_missing' || lage.grund === 'reference_invalid')
    return {
      id: eintrag.id,
      typLabel: REGISTRY_DOKUMENT_TYP_LABEL[eintrag.documentType],
      ablaufWarnung: dokumentKontoAblaufWarnung(lage),
      ablaufSichtbar: !ohneKalender,
      ablaufText: dokumentKontoAblaufText(lage),
    }
  })

  return {
    name: registryTravellerAnzeigeName(traveller.facts.label),
    wohnsitz: traveller.facts.residenceCountryCode
      ? landPraefixText('Wohnsitz', traveller.facts.residenceCountryCode)
      : REGISTRY_COPY.wohnsitzLeer,
    staatsbuergerschaften: traveller.facts.citizenships.map((eintrag) => ({
      id: eintrag.id,
      label: landAnzeigeText(eintrag.countryCode),
    })),
    dokumente,
    ablaufWarnungen: dokumente.filter((eintrag) => eintrag.ablaufWarnung).length,
  }
}
