// lib/commercial-provenance/quelle.ts
//
// Source-Identität und Provider-Identität sind getrennt.
// Provider-ID nur, wenn die Quelle tatsächlich providergebunden ist.

import {
  type CommercialAffiliate,
  type CommercialPersistenz,
  type CommercialProvenanceFehler,
  type CommercialSourceKind,
} from '@/lib/commercial-provenance/domain'
import { istBekanntePersistenz, istBekanntesSourceKind } from '@/lib/commercial-provenance/lesen'
import { istCommercialProviderQuelle } from '@/lib/commercial-provenance/trust'

const VERBOTENE_QUELLEN = new Set(['assistant', 'llm', 'ai', 'model'])
const ERFUNDENE_PROVIDER = new Set(['user', 'manual', 'jetnity', 'assistant', 'llm', 'system', 'unknown'])

export function commercialQuellePruefen(opts: {
  providerId: string | null | undefined
  sourceKind: string | null | undefined
  sourceLabel: string | null | undefined
  persistenz: string | null | undefined
}):
  | {
      ok: true
      providerId: string | null
      providerBelegt: boolean
      sourceKind: CommercialSourceKind
      sourceLabel: string | null
      persistenz: CommercialPersistenz
    }
  | { ok: false; fehler: CommercialProvenanceFehler[] } {
  const fehler: CommercialProvenanceFehler[] = []
  const kindRoh = opts.sourceKind?.trim() ?? ''
  if (!kindRoh) {
    fehler.push({ code: 'missing_source', path: 'sourceKind' })
  } else if (VERBOTENE_QUELLEN.has(kindRoh)) {
    fehler.push({ code: 'assistant_source_forbidden', path: 'sourceKind' })
  } else if (!istBekanntesSourceKind(kindRoh)) {
    fehler.push({ code: 'invalid_source_kind', path: 'sourceKind' })
  }

  const persistenzRoh = opts.persistenz?.trim() || 'ephemeral'
  if (!istBekanntePersistenz(persistenzRoh)) {
    fehler.push({ code: 'persistenz_source_widerspruch', path: 'persistenz' })
  }

  if (fehler.length > 0 || !istBekanntesSourceKind(kindRoh) || !istBekanntePersistenz(persistenzRoh)) {
    return { ok: false, fehler }
  }

  const providerId = opts.providerId?.trim() || null
  if (providerId && ERFUNDENE_PROVIDER.has(providerId.toLowerCase())) {
    return { ok: false, fehler: [{ code: 'erfundene_provider_id', path: 'providerId' }] }
  }

  const providerGebunden = istCommercialProviderQuelle(kindRoh)
  if (providerGebunden && !providerId) {
    return { ok: false, fehler: [{ code: 'missing_provider', path: 'providerId' }] }
  }
  if (!providerGebunden && providerId) {
    return { ok: false, fehler: [{ code: 'provider_id_ohne_providerquelle', path: 'providerId' }] }
  }

  if (kindRoh === 'persisted_snapshot' && persistenzRoh !== 'snapshot') {
    return {
      ok: false,
      fehler: [{ code: 'persistenz_source_widerspruch', path: 'persistenz' }],
    }
  }

  return {
    ok: true,
    providerId,
    providerBelegt: providerGebunden && providerId != null,
    sourceKind: kindRoh,
    sourceLabel: opts.sourceLabel?.trim() || null,
    persistenz: persistenzRoh,
  }
}

export function commercialAffiliateLesen(opts: {
  status?: string | null
  partnerId?: string | null
  clickId?: string | null
  attributionRef?: string | null
} | null | undefined):
  | { ok: true; affiliate: CommercialAffiliate }
  | { ok: false; fehler: CommercialProvenanceFehler[] } {
  if (!opts) {
    return {
      ok: true,
      affiliate: { status: 'unknown', partnerId: null, clickId: null, attributionRef: null },
    }
  }

  const partnerId = opts.partnerId?.trim() || null
  const clickId = opts.clickId?.trim() || null
  const attributionRef = opts.attributionRef?.trim() || null
  const hatBeleg = Boolean(partnerId || clickId || attributionRef)
  const statusRoh = opts.status?.trim() || (hatBeleg ? 'present' : 'unknown')

  if (statusRoh === 'unknown') {
    return {
      ok: true,
      affiliate: { status: 'unknown', partnerId, clickId, attributionRef },
    }
  }
  if (statusRoh === 'absent') {
    if (hatBeleg) {
      return { ok: false, fehler: [{ code: 'invalid_affiliate_claim', path: 'affiliate' }] }
    }
    return {
      ok: true,
      affiliate: { status: 'absent', partnerId: null, clickId: null, attributionRef: null },
    }
  }
  if (statusRoh === 'present') {
    if (!hatBeleg) {
      return { ok: false, fehler: [{ code: 'invalid_affiliate_claim', path: 'affiliate' }] }
    }
    return {
      ok: true,
      affiliate: { status: 'present', partnerId, clickId, attributionRef },
    }
  }
  return { ok: false, fehler: [{ code: 'invalid_affiliate_claim', path: 'affiliate.status' }] }
}
