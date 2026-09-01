// lib/provider-ops/index.ts
//
// Minimaler gemeinsamer Provider-Operationsvertrag.
// Kein UniversalProvider, keine gemeinsame Suche, keine Fachwahrheit.
// Server-only S6-A-Adapter werden bewusst direkt importiert und nicht über
// dieses breite, provider-neutrale Barrel re-exportiert.

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
  providerOpsConsoleEventSink,
  providerOpsEvent,
  providerOpsEventSchreiben,
  providerOpsHealthAusEvents,
  type ProviderOpsEvent,
  type ProviderOpsEventSink,
  type ProviderOpsHealth,
  type ProviderOpsHealthStatus,
  type ProviderOpsOperation,
} from '@/lib/provider-ops/observability'
export {
  PROVIDER_OPS_CACHE_CLASSES,
  PROVIDER_OPS_DISPLAY_NOTICE_MAX_CHARS,
  PROVIDER_OPS_PERSIST_CLASSES,
  PROVIDER_OPS_USAGE_POLICY_FELDER,
  providerOpsUngepruefteUsagePolicy,
  providerOpsUsagePolicyAusGepruefterKonfiguration,
  type ProviderOpsCacheClass,
  type ProviderOpsPersistClass,
  type ProviderOpsUsagePolicy,
} from '@/lib/provider-ops/usage-policy'
