// lib/commercial-provenance/trust.ts
//
// Actor↔Source-Trust-Grenze. SourceKind ist keine Selbstaussage.
// Untrusted Input wird nicht durch einen system-Default zu Provider-Truth.

import {
  COMMERCIAL_AKTEUR_QUELLEN,
  COMMERCIAL_PROVIDER_QUELLEN,
  type CommercialAkteur,
  type CommercialProvenanceFehler,
  type CommercialSourceKind,
} from '@/lib/commercial-provenance/domain'
import { commercialAkteurLesen } from '@/lib/commercial-provenance/lesen'

export function istCommercialProviderQuelle(
  kind: CommercialSourceKind,
): kind is (typeof COMMERCIAL_PROVIDER_QUELLEN)[number] {
  return (COMMERCIAL_PROVIDER_QUELLEN as readonly string[]).includes(kind)
}

export function commercialAkteurQuellePruefen(opts: {
  akteur: unknown
  sourceKind: CommercialSourceKind
}):
  | { ok: true; akteur: Exclude<CommercialAkteur, 'assistant' | 'llm'> }
  | { ok: false; fehler: CommercialProvenanceFehler[] } {
  const akteur = commercialAkteurLesen(opts.akteur)
  if (akteur == null) {
    return { ok: false, fehler: [{ code: 'missing_actor', path: 'akteur' }] }
  }
  if (akteur === 'assistant' || akteur === 'llm') {
    return { ok: false, fehler: [{ code: 'assistant_overwrite_forbidden', path: 'akteur' }] }
  }
  if (!COMMERCIAL_AKTEUR_QUELLEN[akteur].includes(opts.sourceKind)) {
    return { ok: false, fehler: [{ code: 'actor_source_forbidden', path: 'sourceKind' }] }
  }
  return { ok: true, akteur }
}
