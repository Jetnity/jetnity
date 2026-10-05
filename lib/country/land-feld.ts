// lib/country/land-feld.ts
//
// Reine Options-/Auswahlhilfe für das gemeinsame LandFeld.
// Keine Auto-Vorauswahl, kein First-Item-Default.

import { COUNTRY_COPY } from '@/lib/country/copy'
import {
  COUNTRY_UI_LOCALE,
  countryCodeNormalisieren,
  katalogLaenderSortiert,
  landOptionLabel,
  landSucheTrifft,
  landDarstellung,
  type RegionAnzeige,
} from '@/lib/country/darstellung'
import { istKatalogLand } from '@/lib/country/katalog'

export type LandFeldOption = {
  readonly code: string
  readonly label: string
  readonly art: 'katalog' | 'unbekannt'
}

export type LandFeldOptionen = {
  readonly leerLabel: string
  readonly bestehend: LandFeldOption | null
  readonly katalog: readonly LandFeldOption[]
}

export function landFeldOptionen(eingabe: {
  suche?: string
  aktuellerCode?: string
  optional?: boolean
  locale?: string
  anzeige?: RegionAnzeige | null
}): LandFeldOptionen {
  const locale = eingabe.locale ?? COUNTRY_UI_LOCALE
  const suche = eingabe.suche ?? ''
  const aktuell = countryCodeNormalisieren(eingabe.aktuellerCode ?? '')
  const katalog = katalogLaenderSortiert(locale, eingabe.anzeige)
    .filter((code) => landSucheTrifft(code, suche, locale, eingabe.anzeige))
    .map((code) => ({
      code,
      label: landOptionLabel(code, locale, eingabe.anzeige),
      art: 'katalog' as const,
    }))

  let bestehend: LandFeldOption | null = null
  if (aktuell) {
    const sichtbar = katalog.some((eintrag) => eintrag.code === aktuell)
    if (!sichtbar) {
      const darstellung = landDarstellung(aktuell, locale, eingabe.anzeige)
      bestehend = {
        code: aktuell,
        label: darstellung.label,
        art: darstellung.art === 'katalog' ? 'katalog' : 'unbekannt',
      }
    }
  }

  return {
    leerLabel: eingabe.optional === false ? COUNTRY_COPY.waehlen : COUNTRY_COPY.nichtHinterlegt,
    bestehend,
    katalog,
  }
}

export function landFeldHatAuswahl(wert: string): boolean {
  const code = countryCodeNormalisieren(wert)
  return Boolean(code && istKatalogLand(code))
}
