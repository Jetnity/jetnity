import type { ProviderOpsBoardBericht, ProviderOpsBoardItem } from './typen'

const JETZT = '2026-08-24T17:00:00.000Z'
const FRISCH = { state: 'fresh' as const, ageMs: 0, ttlMs: 60_000 }

function item(teil: ProviderOpsBoardItem): ProviderOpsBoardItem {
  return teil
}

export const PROVIDER_OPS_BOARD_AUDIT_BERICHT: ProviderOpsBoardBericht = {
  checkedAt: JETZT,
  writeActions: [],
  items: [
    item({
      id: 'provider-ops',
      name: 'Provider-Ops',
      status: 'foundation_only',
      source: 'lib/provider-ops',
      checkedAt: JETZT,
      freshness: FRISCH,
      summary:
        'S1-Operationsvertrag ist vorhanden. Das ist Foundation, keine Provideraktivierung und keine Live-Health.',
      proves: 'Nur, dass der gemergte S1-Vertrag gelesen wurde.',
      doesNotProve: 'Echte Provider oder Production-Traffic.',
      checks: [
        {
          id: 'domain-flights',
          name: 'Flights',
          status: 'available',
          source: 'provider-ops-zustand',
          freshness: FRISCH,
          summary: 'In dieser Nicht-Production-Umgebung ist die geschlossene Test-Capability eingeschaltet.',
          proves: 'Nur den S1-Zustand aktiv=true für Flights in einer Testumgebung.',
          doesNotProve: 'Production-Bereitschaft.',
        },
        {
          id: 'domain-hotels',
          name: 'Hotels',
          status: 'not_configured',
          source: 'provider-ops-zustand',
          freshness: FRISCH,
          summary: 'Kein belegter Test-Zugang. Die Domain bleibt nicht konfiguriert.',
          proves: 'Nur den S1-Grund ohne-zugang.',
          doesNotProve: 'Hotel-Health.',
        },
      ],
    }),
    item({
      id: 'kill-switch',
      name: 'Kill-Switch-Vertrag',
      status: 'foundation_only',
      source: 'provider-ops-zustand',
      checkedAt: JETZT,
      freshness: FRISCH,
      summary: 'Kill-Switch-Form aus S1 ist vorhanden. Globale persistente Durchsetzung ist nicht belegt.',
      proves: 'Nur die S1-Form.',
      doesNotProve: 'Persistente Enforcement.',
    }),
    item({
      id: 'cost-guard',
      name: 'Cost Guard',
      status: 'foundation_only',
      source: 'lib/provider-ops/cost-guard',
      checkedAt: JETZT,
      freshness: FRISCH,
      summary: 'Cost-Guard-Interface und In-Memory-Implementierung existieren. Kein globales, persistentes Budget.',
      proves: 'Nur den S1-Cost-Guard-Port.',
      doesNotProve: 'Monatsbudget.',
    }),
    item({
      id: 'model-usage',
      name: 'Modellnutzung',
      status: 'empty',
      source: 'public.model_usage',
      checkedAt: JETZT,
      freshness: FRISCH,
      summary: 'Im gewählten Fenster gibt es keine aufgezeichneten Modellaufrufe. Das ist keine 0-USD-Budgetaussage.',
      proves: 'Nur einen leeren autorisierten Read.',
      doesNotProve: 'Ein Monatsbudget.',
    }),
  ],
}
