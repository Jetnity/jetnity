// lib/provider-ops/index.ts
//
// Minimaler gemeinsamer Provider-Operationsvertrag.
// Kein UniversalProvider, keine gemeinsame Suche, keine Fachwahrheit.

export {
  PROVIDER_OPS_DOMAINS,
  PROVIDER_OPS_OUTCOMES,
  istProviderOpsOutcome,
  providerOpsHttpStatusFuerOutcome,
  type ProviderOpsDomain,
  type ProviderOpsOutcome,
} from '@/lib/provider-ops/outcome'
export {
  providerOpsBegrenztLesen,
  providerOpsContentLengthUeberschritten,
  providerOpsHttpHeader,
  providerOpsInhaltstypOk,
  providerOpsKoerperLesen,
  providerOpsRateKennungAus,
} from '@/lib/provider-ops/anfrage'
export {
  providerOpsFlagAn,
  providerOpsIstProduction,
  providerOpsZustand,
  type ProviderOpsZustand,
  type ProviderOpsZustandGrund,
} from '@/lib/provider-ops/zustand'
export {
  providerOpsInMemoryCostGuard,
  type ProviderOpsCostGuard,
  type ProviderOpsCostGuardErgebnis,
  type ProviderOpsCostGuardGrenzen,
} from '@/lib/provider-ops/cost-guard'
export {
  PROVIDER_OPS_EVENT_FELDER,
  PROVIDER_OPS_OPERATIONEN,
  providerOpsEvent,
  type ProviderOpsEvent,
  type ProviderOpsOperation,
} from '@/lib/provider-ops/observability'
