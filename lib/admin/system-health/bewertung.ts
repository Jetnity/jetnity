import { berechneFreshness } from './freshness'
import {
  SYSTEM_HEALTH_NAMEN,
  SYSTEM_HEALTH_TTL_MS,
  type HealthStatus,
  type SystemHealthId,
  type SystemHealthItem,
} from './typen'

export type AppRuntimeSnapshot = {
  vercelEnv: string | null
  commitSha: string | null
  deploymentId: string | null
  region: string | null
}

export type PingErgebnis =
  | { ok: true; sourceUpdatedAt?: string }
  | { ok: false; timeout?: boolean; message: string }

function iso(nowMs: number): string {
  return new Date(nowMs).toISOString()
}

function basis(
  id: SystemHealthId,
  nowMs: number,
  checkedAt: string,
  status: HealthStatus,
  rest: Omit<SystemHealthItem, 'id' | 'name' | 'status' | 'checkedAt' | 'freshness'>,
): SystemHealthItem {
  const freshness = berechneFreshness({
    checkedAt,
    nowMs,
    ttlMs: SYSTEM_HEALTH_TTL_MS[id],
  })
  return {
    id,
    name: SYSTEM_HEALTH_NAMEN[id],
    status,
    checkedAt,
    freshness,
    ...rest,
  }
}

export function bewerteApp(snapshot: AppRuntimeSnapshot, nowMs: number): SystemHealthItem {
  const checkedAt = iso(nowMs)
  const hatDeploymentHinweis = Boolean(snapshot.vercelEnv || snapshot.commitSha || snapshot.deploymentId)
  return basis('app', nowMs, checkedAt, 'healthy', {
    source: 'process-runtime',
    summary: hatDeploymentHinweis
      ? 'Dieser Prozess hat die Health-Abfrage beantwortet und liefert Deployment-Metadaten.'
      : 'Dieser Prozess hat die Health-Abfrage beantwortet. Es liegen keine Vercel-Deployment-Metadaten vor.',
    detail:
      'Das ist Prozess-Wahrheit, keine Plattform-Health. Ein lokaler oder einzelner Server beweist nicht Vercel, Datenbank oder CI.',
    proves: 'Dieser Next.js-Prozess ist in diesem Moment erreichbar und hat den Check ausgeführt.',
    doesNotProve: 'Vercel-Plattform, Supabase-Projekt, GitHub-CI oder Infomaniak.',
    metadata: {
      vercelEnv: snapshot.vercelEnv,
      commitSha: snapshot.commitSha,
      deploymentId: snapshot.deploymentId,
      region: snapshot.region,
    },
  })
}

export function bewerteNichtKonfiguriert(
  id: Exclude<SystemHealthId, 'app'>,
  nowMs: number,
  grund: { source: string; summary: string; proves: string; doesNotProve: string; detail?: string },
): SystemHealthItem {
  return basis(id, nowMs, iso(nowMs), 'not_configured', {
    source: grund.source,
    summary: grund.summary,
    detail: grund.detail,
    proves: grund.proves,
    doesNotProve: grund.doesNotProve,
  })
}

export function bewerteSupabaseAppZugriff(input: {
  configured: boolean
  ping?: PingErgebnis
  nowMs: number
}): SystemHealthItem {
  const now = iso(input.nowMs)
  if (!input.configured) {
    return basis('supabase', input.nowMs, now, 'not_configured', {
      source: 'supabase-app-client',
      summary: 'Keine App-Datenquelle konfiguriert.',
      detail: 'NEXT_PUBLIC_SUPABASE_URL oder der Anon-Key fehlen. Das ist kein Management-Health.',
      proves: 'Nur, dass in dieser Runtime keine App-Supabase-Quelle gesetzt ist.',
      doesNotProve: 'Ob ein Supabase-Projekt existiert oder die Management-Plattform healthy ist.',
    })
  }
  if (!input.ping) {
    return basis('supabase', input.nowMs, now, 'unknown', {
      source: 'supabase-app-client',
      summary: 'Keine belastbare Prüfung der Datenquelle.',
      proves: 'Nichts. Es liegt keine Ping-Antwort vor.',
      doesNotProve: 'Erreichbarkeit oder Management-Health.',
    })
  }
  if (input.ping.ok) {
    return basis('supabase', input.nowMs, now, 'healthy', {
      source: 'supabase-postgrest-airports',
      sourceUpdatedAt: input.ping.sourceUpdatedAt,
      summary: 'Die App erreicht ihre Datenquelle (öffentliche airports-Referenz).',
      detail:
        'Das beweist App-Datenquellen-Zugriff, nicht die Supabase-Management-Plattform. Management bleibt nicht konfiguriert.',
      proves: 'PostgREST hat eine lesende Anfrage auf public.airports in dieser Sitzung beantwortet.',
      doesNotProve: 'Supabase-Management, Dashboard, Billing, Auth-Infrastruktur insgesamt oder andere Regionen.',
    })
  }
  if (input.ping.timeout) {
    return basis('supabase', input.nowMs, now, 'unavailable', {
      source: 'supabase-postgrest-airports',
      summary: 'Die Prüfung der Datenquelle ist in der Zeitgrenze nicht zurückgekommen.',
      detail: input.ping.message,
      proves: 'Nur, dass dieser Ping nicht rechtzeitig geantwortet hat.',
      doesNotProve: 'Management-Health oder dass das Projekt dauerhaft down ist.',
    })
  }
  return basis('supabase', input.nowMs, now, 'unavailable', {
    source: 'supabase-postgrest-airports',
    summary: 'Die Prüfung der Datenquelle ist fehlgeschlagen.',
    detail: input.ping.message,
    proves: 'Die App-Datenquelle hat diese Anfrage nicht erfolgreich beantwortet.',
    doesNotProve: 'Supabase-Management-Plattform-Health.',
  })
}

export function vercelNichtKonfiguriert(nowMs: number): SystemHealthItem {
  return bewerteNichtKonfiguriert('vercel', nowMs, {
    source: 'none',
    summary: 'Kein freigegebenes Vercel-Management-Token. Plattform-Health bleibt unbelegt.',
    detail:
      'Vorhandene VERCEL_* Runtime-Felder gehören zur App-/Deployment-Karte. Sie beweisen nicht, dass das Vercel-Projekt aktuell healthy ist.',
    proves: 'Nur, dass in Slice B keine Vercel-Management-API angebunden ist.',
    doesNotProve: 'Deployment-Zustand, Build-Queue oder Vercel-Plattform.',
  })
}

export function githubNichtKonfiguriert(nowMs: number): SystemHealthItem {
  return bewerteNichtKonfiguriert('github', nowMs, {
    source: 'none',
    summary: 'Keine sichere, freigegebene GitHub-Actions-Quelle.',
    detail:
      'Ein späterer read-only Token mit actions:read wäre nötig. Ein alter grüner Build darf hier nicht als aktuelles CI erscheinen.',
    proves: 'Nur, dass kein CI-Status gelesen wurde.',
    doesNotProve: 'Ob der letzte Workflow grün war oder das Repository erreichbar ist.',
  })
}

export function infomaniakNichtKonfiguriert(nowMs: number): SystemHealthItem {
  return bewerteNichtKonfiguriert('infomaniak', nowMs, {
    source: 'none',
    summary: 'Keine Domain-/Mail-/DNS-Quelle. Health wird nicht erfunden.',
    detail:
      'Später nötig: freigegebenes read-only Infomaniak-Token plus Product-Owner-Gate. Kein DNS- oder Mail-Write.',
    proves: 'Nur, dass keine Infomaniak-Integration aktiv ist.',
    doesNotProve: 'Domain, Mail oder Hosting.',
  })
}

export function wendeEvidenceAlterAn(item: SystemHealthItem, nowMs: number): SystemHealthItem {
  const freshness = berechneFreshness({
    checkedAt: item.checkedAt,
    nowMs,
    ttlMs: item.freshness.ttlMs,
  })
  return { ...item, freshness }
}
