import type { ProviderOpsZustand } from '@/lib/provider-ops'
import { berechneFreshness } from './freshness'
import {
  PROVIDER_OPS_BOARD_NAMEN,
  PROVIDER_OPS_BOARD_TTL_MS,
  type ProviderOpsBoardCheck,
  type ProviderOpsBoardId,
  type ProviderOpsBoardItem,
  type ProviderOpsBoardStatus,
} from './typen'

export type DomainZustandSnapshot = {
  id: string
  name: string
  zustand: ProviderOpsZustand
}

export type ModelUsageSnapshot =
  | { ok: true; zeilen: number; kostenMikroUsd: number; juengsteCreatedAt: string | null }
  | { ok: false; timeout?: boolean; message: string }

function iso(nowMs: number): string {
  return new Date(nowMs).toISOString()
}

function basis(
  id: ProviderOpsBoardId,
  nowMs: number,
  checkedAt: string,
  status: ProviderOpsBoardStatus,
  rest: Omit<ProviderOpsBoardItem, 'id' | 'name' | 'status' | 'checkedAt' | 'freshness'>,
): ProviderOpsBoardItem {
  return {
    id,
    name: PROVIDER_OPS_BOARD_NAMEN[id],
    status,
    checkedAt,
    freshness: berechneFreshness({
      checkedAt,
      nowMs,
      ttlMs: PROVIDER_OPS_BOARD_TTL_MS[id],
    }),
    ...rest,
  }
}

function check(
  id: string,
  name: string,
  nowMs: number,
  ttlId: ProviderOpsBoardId,
  checkedAt: string,
  status: ProviderOpsBoardStatus,
  rest: Omit<ProviderOpsBoardCheck, 'id' | 'name' | 'status' | 'freshness'>,
): ProviderOpsBoardCheck {
  return {
    id,
    name,
    status,
    freshness: berechneFreshness({
      checkedAt,
      nowMs,
      ttlMs: PROVIDER_OPS_BOARD_TTL_MS[ttlId],
    }),
    ...rest,
  }
}

export function domainCheckAusZustand(
  snapshot: DomainZustandSnapshot,
  nowMs: number,
  checkedAt: string,
): ProviderOpsBoardCheck {
  if (snapshot.zustand.aktiv) {
    return check(snapshot.id, snapshot.name, nowMs, 'provider-ops', checkedAt, 'available', {
      source: 'provider-ops-zustand',
      summary: 'In dieser Nicht-Production-Umgebung ist die geschlossene Test-Capability eingeschaltet.',
      proves: 'Nur den S1-Zustand aktiv=true für diese Domain in einer Testumgebung.',
      doesNotProve: 'Production-Bereitschaft, Provider-Health, Live-Traffic oder einen echten Vertrag.',
    })
  }
  if (snapshot.zustand.grund === 'production') {
    return check(snapshot.id, snapshot.name, nowMs, 'provider-ops', checkedAt, 'disabled', {
      source: 'provider-ops-zustand',
      summary: 'Production ist im S1-Vertrag hart aus. Das ist keine Live-Freigabe.',
      proves: 'Nur, dass providerOpsZustand in Production aktiv=false / grund=production liefert.',
      doesNotProve: 'Einen persistenten Kill-Switch oder dass ein Provider existiert.',
    })
  }
  if (snapshot.zustand.grund === 'ohne-zugang') {
    return check(snapshot.id, snapshot.name, nowMs, 'provider-ops', checkedAt, 'not_configured', {
      source: 'provider-ops-zustand',
      summary: 'Kein belegter Test-Zugang. Die Domain bleibt nicht konfiguriert.',
      proves: 'Nur den S1-Grund ohne-zugang, ohne Secrets zu nennen.',
      doesNotProve: 'Ob später ein Provider gewählt wird oder Production erlaubt wäre.',
    })
  }
  return check(snapshot.id, snapshot.name, nowMs, 'provider-ops', checkedAt, 'disabled', {
    source: 'provider-ops-zustand',
    summary: 'Das Domain-Flag ist nicht gesetzt. Das ist der Normalzustand, kein Live-Provider.',
    proves: 'Nur den S1-Grund abgeschaltet.',
    doesNotProve: 'Provider-Health oder eine globale Abschaltung über ein Admin-Write.',
  })
}

export function bewerteProviderOps(
  domains: DomainZustandSnapshot[],
  nowMs: number,
): ProviderOpsBoardItem {
  const checkedAt = iso(nowMs)
  const checks = domains.map((domain) => domainCheckAusZustand(domain, nowMs, checkedAt))
  return basis('provider-ops', nowMs, checkedAt, 'foundation_only', {
    source: 'lib/provider-ops',
    summary:
      'S1-Operationsvertrag ist vorhanden. Das ist Foundation, keine Provideraktivierung und keine Live-Health.',
    detail:
      'Eine eingeschaltete Test-Capability einer Domain macht Provider-Ops insgesamt nicht bereit. Kein Toggle.',
    proves: 'Nur, dass der gemergte S1-Vertrag gelesen und domainweise ausgewertet wurde.',
    doesNotProve: 'Echte Provider, Production-Traffic, Health, Verträge oder Kostenlimits.',
    checks,
  })
}

export function bewerteKillSwitch(input: { vercelEnv: string | null; nowMs: number }): ProviderOpsBoardItem {
  const checkedAt = iso(input.nowMs)
  const production = input.vercelEnv === 'production'
  return basis('kill-switch', input.nowMs, checkedAt, 'foundation_only', {
    source: 'provider-ops-zustand',
    summary:
      'Kill-Switch-Form aus S1 ist vorhanden. Globale persistente Durchsetzung ist nicht belegt.',
    detail: production
      ? 'In Production liefert die Form aktiv=false. Das ist der Vertrag, kein Admin-Toggle und keine persistente Schalter-Wahrheit.'
      : 'Ausserhalb von Production bleibt die Form eine Foundation. Kein Write, kein zweiter Kill-Switch.',
    proves: 'Nur die S1-Form und, falls VERCEL_ENV=production, den hart aus-Zweig.',
    doesNotProve: 'Eine persistente globale Enforcement, ein Admin-Write oder dass Provider live abgeschaltet wurden.',
    metadata: { vercelEnv: input.vercelEnv },
  })
}

export function bewerteCostGuard(nowMs: number): ProviderOpsBoardItem {
  const checkedAt = iso(nowMs)
  return basis('cost-guard', nowMs, checkedAt, 'foundation_only', {
    source: 'lib/provider-ops/cost-guard',
    summary:
      'Cost-Guard-Interface und In-Memory-Implementierung existieren. Kein globales, persistentes Budget.',
    detail:
      'S1 ist prozesslokal und nicht production-global. Persistente Limits sind S6 und nicht Teil von Slice C.',
    proves: 'Nur, dass der S1-Cost-Guard-Port im Repository vorhanden ist.',
    doesNotProve: 'Monatsbudget, globale Kostensicherheit oder dass Calls blockiert werden.',
  })
}

export function bewerteModelUsage(input: {
  nowMs: number
  usage?: ModelUsageSnapshot
}): ProviderOpsBoardItem {
  const checkedAt = iso(input.nowMs)
  if (!input.usage) {
    return basis('model-usage', input.nowMs, checkedAt, 'unknown', {
      source: 'none',
      summary: 'Keine belastbare Prüfung der Modellnutzung.',
      proves: 'Nichts. Es liegt keine Leseantwort vor.',
      doesNotProve: 'Kosten, Budget oder Tokenverbrauch.',
    })
  }
  if (!input.usage.ok) {
    return basis('model-usage', input.nowMs, checkedAt, input.usage.timeout ? 'unavailable' : 'unavailable', {
      source: 'supabase-app-client',
      summary: 'Die Modellnutzung konnte nicht gelesen werden. Das ist kein leeres Kostenprotokoll.',
      detail: input.usage.message,
      proves: 'Nur, dass dieser Read fehlgeschlagen oder nicht rechtzeitig zurückgekommen ist.',
      doesNotProve: 'Dass keine Kosten entstanden sind.',
    })
  }
  if (input.usage.zeilen === 0) {
    return basis('model-usage', input.nowMs, checkedAt, 'empty', {
      source: 'public.model_usage',
      summary: 'Im gewählten Fenster gibt es keine aufgezeichneten Modellaufrufe. Das ist keine 0-USD-Budgetaussage.',
      proves: 'Nur, dass der autorisierte Read keine Zeile im Fenster gefunden hat.',
      doesNotProve: 'Ein Monatsbudget, Providerkosten oder dass Kostenlimits greifen.',
    })
  }
  return basis('model-usage', input.nowMs, checkedAt, 'available', {
    source: 'public.model_usage',
    summary: `${input.usage.zeilen} aufgezeichnete Modellzeilen. Summe der gespeicherten kosten_mikro_usd, keine nachträgliche Preisannahme.`,
    detail:
      'Anzeige nur gespeicherter Protokollwerte. Keine CHF-Umrechnung, kein Finance-Live, kein Payment-/Refund-Bezug.',
    proves: 'Nur die gelesenen model_usage-Zeilen und deren gespeicherte kosten_mikro_usd.',
    doesNotProve: 'Providerkosten, globales Budget, Stripe/Bexio oder künftige Modellpreise.',
    metadata: {
      zeilen: String(input.usage.zeilen),
      kostenMikroUsd: String(input.usage.kostenMikroUsd),
      juengsteCreatedAt: input.usage.juengsteCreatedAt,
    },
  })
}

export function wendeEvidenceAlterAn(item: ProviderOpsBoardItem, nowMs: number): ProviderOpsBoardItem {
  const freshness = berechneFreshness({
    checkedAt: item.checkedAt,
    nowMs,
    ttlMs: item.freshness.ttlMs,
  })
  const checks = item.checks?.map((teil) => ({
    ...teil,
    freshness: berechneFreshness({
      checkedAt: item.checkedAt,
      nowMs,
      ttlMs: teil.freshness.ttlMs,
    }),
  }))
  return { ...item, freshness, checks }
}
