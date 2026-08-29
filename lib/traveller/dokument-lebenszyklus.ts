// lib/traveller/dokument-lebenszyklus.ts
//
// Reine Kalendertags-Auswertung vorhandener expiresOn-Metadaten.
// Kein persistierter Status, keine Credential-Wahl, keine Zielanforderung.

import { DOKUMENT_LEBENSZYKLUS_COPY } from '@/lib/traveller/dokument-lebenszyklus-copy'

const ISO_KALENDERTAG = /^(\d{4})-(\d{2})-(\d{2})$/

export type DokumentKontoAblaufArt = 'unknown' | 'expired' | 'not_expired'

export type DokumentKontoAblaufGrund =
  | 'expiry_missing'
  | 'expiry_invalid'
  | 'reference_missing'
  | 'reference_invalid'

export type DokumentKontoAblauf =
  | { art: 'unknown'; grund: DokumentKontoAblaufGrund }
  | { art: 'expired'; expiresOn: string; referenztag: string }
  | { art: 'not_expired'; expiresOn: string; referenztag: string }

export type DokumentReiseAblaufArt =
  | 'unknown'
  | 'expires_before_trip_start'
  | 'expires_during_trip'
  | 'expires_on_or_after_trip_end'

export type DokumentReiseAblaufGrund =
  | 'expiry_missing'
  | 'expiry_invalid'
  | 'trip_dates_incomplete'
  | 'trip_dates_invalid'

export type DokumentReiseAblauf =
  | { art: 'unknown'; grund: DokumentReiseAblaufGrund }
  | {
      art: 'expires_before_trip_start' | 'expires_during_trip' | 'expires_on_or_after_trip_end'
      expiresOn: string
      tripStart: string
      tripEnd: string
    }

export function kalenderdatumLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const treffer = ISO_KALENDERTAG.exec(wert)
  if (!treffer) return null
  const jahr = Number(treffer[1])
  const monat = Number(treffer[2])
  const tag = Number(treffer[3])
  if (!Number.isInteger(jahr) || !Number.isInteger(monat) || !Number.isInteger(tag)) return null
  if (monat < 1 || monat > 12 || tag < 1 || tag > 31) return null
  const probe = new Date(Date.UTC(jahr, monat - 1, tag))
  if (
    probe.getUTCFullYear() !== jahr ||
    probe.getUTCMonth() !== monat - 1 ||
    probe.getUTCDate() !== tag
  ) {
    return null
  }
  return `${treffer[1]}-${treffer[2]}-${treffer[3]}`
}

export function dokumentAblaufGegenReferenztag(
  expiresOn: unknown,
  referenztag: unknown,
): DokumentKontoAblauf {
  if (expiresOn == null || expiresOn === '') {
    return { art: 'unknown', grund: 'expiry_missing' }
  }
  const ablauf = kalenderdatumLesen(expiresOn)
  if (!ablauf) return { art: 'unknown', grund: 'expiry_invalid' }
  if (referenztag == null || referenztag === '') {
    return { art: 'unknown', grund: 'reference_missing' }
  }
  const bezug = kalenderdatumLesen(referenztag)
  if (!bezug) return { art: 'unknown', grund: 'reference_invalid' }
  if (ablauf < bezug) return { art: 'expired', expiresOn: ablauf, referenztag: bezug }
  return { art: 'not_expired', expiresOn: ablauf, referenztag: bezug }
}

export function dokumentAblaufGegenReise(
  expiresOn: unknown,
  tripStart: unknown,
  tripEnd: unknown,
): DokumentReiseAblauf {
  if (expiresOn == null || expiresOn === '') {
    return { art: 'unknown', grund: 'expiry_missing' }
  }
  const ablauf = kalenderdatumLesen(expiresOn)
  if (!ablauf) return { art: 'unknown', grund: 'expiry_invalid' }

  const startFehlt = tripStart == null || tripStart === ''
  const endeFehlt = tripEnd == null || tripEnd === ''
  if (startFehlt || endeFehlt) return { art: 'unknown', grund: 'trip_dates_incomplete' }

  const start = kalenderdatumLesen(tripStart)
  const ende = kalenderdatumLesen(tripEnd)
  if (!start || !ende || start > ende) {
    return { art: 'unknown', grund: 'trip_dates_invalid' }
  }

  if (ablauf < start) {
    return { art: 'expires_before_trip_start', expiresOn: ablauf, tripStart: start, tripEnd: ende }
  }
  if (ablauf < ende) {
    return { art: 'expires_during_trip', expiresOn: ablauf, tripStart: start, tripEnd: ende }
  }
  return { art: 'expires_on_or_after_trip_end', expiresOn: ablauf, tripStart: start, tripEnd: ende }
}

export function dokumenteAblaufGegenReise(
  documents: readonly { expiresOn?: unknown }[],
  tripStart: unknown,
  tripEnd: unknown,
): DokumentReiseAblauf[] {
  return documents.map((document) => dokumentAblaufGegenReise(document.expiresOn, tripStart, tripEnd))
}

export function dokumentKontoAblaufText(lage: DokumentKontoAblauf): string {
  if (lage.art === 'expired') return DOKUMENT_LEBENSZYKLUS_COPY.kontoAbgelaufen
  if (lage.art === 'not_expired') return DOKUMENT_LEBENSZYKLUS_COPY.kontoNichtAbgelaufen
  if (lage.grund === 'expiry_invalid') return DOKUMENT_LEBENSZYKLUS_COPY.kontoUngueltig
  if (lage.grund === 'reference_missing' || lage.grund === 'reference_invalid') {
    return DOKUMENT_LEBENSZYKLUS_COPY.kontoOhneReferenz
  }
  return DOKUMENT_LEBENSZYKLUS_COPY.kontoFehlt
}

export function dokumentReiseAblaufText(lage: DokumentReiseAblauf): string {
  if (lage.art === 'expires_before_trip_start') return DOKUMENT_LEBENSZYKLUS_COPY.reiseVorBeginn
  if (lage.art === 'expires_during_trip') return DOKUMENT_LEBENSZYKLUS_COPY.reiseWaehrend
  if (lage.art === 'expires_on_or_after_trip_end') return DOKUMENT_LEBENSZYKLUS_COPY.reiseNichtVorEnde
  if (lage.grund === 'expiry_invalid') return DOKUMENT_LEBENSZYKLUS_COPY.reiseUngueltig
  if (lage.grund === 'trip_dates_incomplete' || lage.grund === 'trip_dates_invalid') {
    return DOKUMENT_LEBENSZYKLUS_COPY.reiseOhneZeitraum
  }
  return DOKUMENT_LEBENSZYKLUS_COPY.reiseFehlt
}

export function dokumentKontoAblaufWarnung(lage: DokumentKontoAblauf): boolean {
  return lage.art === 'expired'
}

export function dokumentReiseAblaufWarnung(lage: DokumentReiseAblauf): boolean {
  return lage.art === 'expires_before_trip_start' || lage.art === 'expires_during_trip'
}
