// lib/commercial-provenance/bindung.ts
//
// Optionale Composition ist fail-closed an Domain, Provider und Ref gebunden.
// Kein unsicherer generischer Helper, der beliebige Provenance an T hängt.

import type {
  CommercialBindung,
  CommercialOptionIdentitaet,
  CommercialProvenance,
  CommercialProvenanceDomain,
  MitCommercialProvenance,
} from '@/lib/commercial-provenance/domain'

function normalisiert(wert: string | null | undefined): string | null {
  const text = wert?.trim()
  return text ? text : null
}

export function commercialIdentitaetAusOption(option: CommercialOptionIdentitaet): {
  providerId: string | null
  externalRef: string | null
} {
  return {
    providerId: normalisiert(option.provider),
    externalRef: normalisiert(option.externalRef),
  }
}

export function optionMitCommercialProvenance<T extends CommercialOptionIdentitaet>(
  option: T,
  provenance: CommercialProvenance,
  domain: CommercialProvenanceDomain,
): CommercialBindung<T> {
  if (provenance.domain !== domain) {
    return { ok: false, fehler: [{ code: 'bind_domain_mismatch', path: 'domain' }] }
  }

  const optionId = commercialIdentitaetAusOption(option)
  if (provenance.quelle.providerBelegt) {
    if (!optionId.providerId || optionId.providerId !== provenance.quelle.providerId) {
      return { ok: false, fehler: [{ code: 'bind_provider_mismatch', path: 'provider' }] }
    }
  }

  const provenanceRef = normalisiert(provenance.referenz.externalRef)
  if (provenance.quelle.providerBelegt) {
    if (!provenanceRef || !optionId.externalRef || optionId.externalRef !== provenanceRef) {
      return { ok: false, fehler: [{ code: 'bind_ref_mismatch', path: 'externalRef' }] }
    }
  } else if (provenanceRef && optionId.externalRef && optionId.externalRef !== provenanceRef) {
    return { ok: false, fehler: [{ code: 'bind_ref_mismatch', path: 'externalRef' }] }
  }

  const gebunden: MitCommercialProvenance<T> = { ...option, commercialProvenance: provenance }
  return { ok: true, option: gebunden }
}
