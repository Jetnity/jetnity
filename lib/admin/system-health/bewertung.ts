import { berechneFreshness } from './freshness'
import {
  SYSTEM_HEALTH_NAMEN,
  SYSTEM_HEALTH_TTL_MS,
  type HealthStatus,
  type SystemHealthCheck,
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

function check(
  id: string,
  name: string,
  nowMs: number,
  ttlId: SystemHealthId,
  checkedAt: string,
  status: HealthStatus,
  rest: Omit<SystemHealthCheck, 'id' | 'name' | 'status' | 'freshness'>,
): SystemHealthCheck {
  return {
    id,
    name,
    status,
    freshness: berechneFreshness({
      checkedAt,
      nowMs,
      ttlMs: SYSTEM_HEALTH_TTL_MS[ttlId],
    }),
    ...rest,
  }
}

export function bewerteApp(snapshot: AppRuntimeSnapshot, nowMs: number): SystemHealthItem {
  const checkedAt = iso(nowMs)
  const prozess = check('app-prozess', 'App-Prozess', nowMs, 'app', checkedAt, 'healthy', {
    source: 'process-runtime',
    summary: 'Dieser Next.js-Prozess hat die Health-Abfrage beantwortet.',
    proves: 'Dieser Next.js-Prozess ist in diesem Moment erreichbar und hat den Check ausgeführt.',
    doesNotProve: 'Deployment-Health, Vercel-Plattform, Datenbank oder CI.',
  })
  const deployment = check(
    'app-deployment',
    'Deployment-Health',
    nowMs,
    'app',
    checkedAt,
    'unknown',
    {
      source: 'none',
      summary: 'Deployment-Health ist nicht belegt. VERCEL_* sind nur Metadaten.',
      proves: 'Nichts zur aktuellen Deployment- oder Plattform-Gesundheit.',
      doesNotProve: 'Ob dieses Deployment oder die Vercel-Plattform healthy ist.',
    },
  )
  return basis('app', nowMs, checkedAt, 'unknown', {
    source: 'process-runtime',
    summary: 'Deployment-Health ist nicht belegt. Nur die Prozess-Erreichbarkeit ist geprüft.',
    detail:
      'Eine Prozessantwort und vorhandene VERCEL_* Felder beweisen keine Deployment-Health. Der Gesamtzustand bleibt unbekannt.',
    proves: 'Nur den Sub-Check App-Prozess, nicht App/Deployment insgesamt.',
    doesNotProve: 'Deployment-Health, Vercel-Plattform, Supabase, GitHub-CI oder Infomaniak.',
    metadata: {
      vercelEnv: snapshot.vercelEnv,
      commitSha: snapshot.commitSha,
      deploymentId: snapshot.deploymentId,
      region: snapshot.region,
    },
    checks: [prozess, deployment],
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
  const management = check(
    'supabase-management',
    'Supabase Management / Plattform',
    input.nowMs,
    'supabase',
    now,
    'not_configured',
    {
      source: 'none',
      summary: 'Kein freigegebenes Supabase-Management-Token. Plattform-Health bleibt unbelegt.',
      proves: 'Nur, dass Management-Health nicht angebunden ist.',
      doesNotProve: 'Projektzustand, Billing oder Auth-Infrastruktur.',
    },
  )

  let zugriff: SystemHealthCheck
  if (!input.configured) {
    zugriff = check(
      'supabase-app-datenzugriff',
      'Supabase App-Datenzugriff',
      input.nowMs,
      'supabase',
      now,
      'not_configured',
      {
        source: 'supabase-app-client',
        summary: 'Keine App-Datenquelle konfiguriert.',
        proves: 'Nur, dass in dieser Runtime keine App-Supabase-Quelle gesetzt ist.',
        doesNotProve: 'Ob ein Supabase-Projekt existiert oder die Management-Plattform healthy ist.',
      },
    )
  } else if (!input.ping) {
    zugriff = check(
      'supabase-app-datenzugriff',
      'Supabase App-Datenzugriff',
      input.nowMs,
      'supabase',
      now,
      'unknown',
      {
        source: 'supabase-app-client',
        summary: 'Keine belastbare Prüfung der Datenquelle.',
        proves: 'Nichts. Es liegt keine Ping-Antwort vor.',
        doesNotProve: 'Erreichbarkeit oder Management-Health.',
      },
    )
  } else if (input.ping.ok) {
    zugriff = check(
      'supabase-app-datenzugriff',
      'Supabase App-Datenzugriff',
      input.nowMs,
      'supabase',
      now,
      'healthy',
      {
        source: 'supabase-postgrest-airports',
        summary: 'Die App erreicht ihre Datenquelle (öffentliche airports-Referenz).',
        proves: 'PostgREST hat eine lesende Anfrage auf public.airports in dieser Sitzung beantwortet.',
        doesNotProve: 'Supabase-Management, Dashboard, Billing oder die Plattform insgesamt.',
      },
    )
  } else if (input.ping.timeout) {
    zugriff = check(
      'supabase-app-datenzugriff',
      'Supabase App-Datenzugriff',
      input.nowMs,
      'supabase',
      now,
      'unavailable',
      {
        source: 'supabase-postgrest-airports',
        summary: 'Die Prüfung der Datenquelle ist in der Zeitgrenze nicht zurückgekommen.',
        proves: 'Nur, dass dieser App→PostgREST-Ping nicht rechtzeitig geantwortet hat.',
        doesNotProve: 'Management-Health oder dass das Projekt dauerhaft down ist.',
      },
    )
  } else {
    zugriff = check(
      'supabase-app-datenzugriff',
      'Supabase App-Datenzugriff',
      input.nowMs,
      'supabase',
      now,
      'unavailable',
      {
        source: 'supabase-postgrest-airports',
        summary: 'Die Prüfung der Datenquelle ist fehlgeschlagen.',
        proves: 'Die App-Datenquelle hat diese Anfrage nicht erfolgreich beantwortet.',
        doesNotProve: 'Supabase-Management-Plattform-Health.',
      },
    )
  }

  return basis('supabase', input.nowMs, now, 'not_configured', {
    source: zugriff.source,
    sourceUpdatedAt: input.ping && input.ping.ok ? input.ping.sourceUpdatedAt : undefined,
    summary:
      'Supabase-Gesamtzustand bleibt unbelegt. Der airports-Read beweist nur App-Datenzugriff, nicht die Plattform.',
    detail:
      'Management/Plattform ist nicht konfiguriert. Ein erfolgreicher public.airports-Read darf den Gesamtstatus nicht auf Gesund setzen.',
    proves: 'Nur den Sub-Check Supabase App-Datenzugriff, nicht Supabase insgesamt.',
    doesNotProve: 'Supabase-Projekt, Management, Billing, Auth-Infrastruktur oder andere Regionen.',
    checks: [zugriff, management],
  })
}

export function vercelNichtKonfiguriert(nowMs: number): SystemHealthItem {
  return bewerteNichtKonfiguriert('vercel', nowMs, {
    source: 'none',
    summary: 'Kein freigegebenes Vercel-Management-Token. Plattform-Health bleibt unbelegt.',
    detail:
      'Vorhandene VERCEL_* Runtime-Felder sind nur App-Metadaten. Sie beweisen weder Deployment-Health noch, dass das Vercel-Projekt aktuell healthy ist.',
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
