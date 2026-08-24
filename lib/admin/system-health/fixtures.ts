import type { SystemHealthBericht, SystemHealthItem } from './typen'

const JETZT = '2026-08-24T03:00:00.000Z'

function item(teil: SystemHealthItem): SystemHealthItem {
  return teil
}

export const SYSTEM_HEALTH_AUDIT_BERICHT: SystemHealthBericht = {
  checkedAt: JETZT,
  writeActions: [],
  items: [
    item({
      id: 'app',
      name: 'App / Deployment',
      status: 'healthy',
      source: 'process-runtime',
      checkedAt: JETZT,
      freshness: { state: 'fresh', ageMs: 0, ttlMs: 60_000 },
      summary: 'Dieser Prozess hat die Health-Abfrage beantwortet und liefert Deployment-Metadaten.',
      proves: 'Dieser Next.js-Prozess ist in diesem Moment erreichbar.',
      doesNotProve: 'Vercel-Plattform oder Datenbank.',
      metadata: { vercelEnv: 'preview', commitSha: 'abc1234', deploymentId: 'dpl_audit', region: 'fra1' },
    }),
    item({
      id: 'vercel',
      name: 'Vercel',
      status: 'not_configured',
      source: 'none',
      checkedAt: JETZT,
      freshness: { state: 'fresh', ageMs: 0, ttlMs: 120_000 },
      summary: 'Kein freigegebenes Vercel-Management-Token. Plattform-Health bleibt unbelegt.',
      proves: 'Nur, dass keine Vercel-Management-API angebunden ist.',
      doesNotProve: 'Deployment-Zustand.',
    }),
    item({
      id: 'supabase',
      name: 'Supabase',
      status: 'unavailable',
      source: 'supabase-postgrest-airports',
      checkedAt: JETZT,
      freshness: { state: 'fresh', ageMs: 0, ttlMs: 60_000 },
      summary: 'Die Prüfung der Datenquelle ist fehlgeschlagen.',
      proves: 'Die App-Datenquelle hat diese Anfrage nicht erfolgreich beantwortet.',
      doesNotProve: 'Supabase-Management-Plattform-Health.',
    }),
    item({
      id: 'github',
      name: 'GitHub / CI',
      status: 'not_configured',
      source: 'none',
      checkedAt: JETZT,
      freshness: { state: 'fresh', ageMs: 0, ttlMs: 300_000 },
      summary: 'Keine sichere, freigegebene GitHub-Actions-Quelle.',
      proves: 'Nur, dass kein CI-Status gelesen wurde.',
      doesNotProve: 'Ob der letzte Workflow grün war.',
    }),
    item({
      id: 'infomaniak',
      name: 'Infomaniak',
      status: 'unknown',
      source: 'none',
      checkedAt: '2026-08-24T02:00:00.000Z',
      freshness: { state: 'stale', ageMs: 3_600_000, ttlMs: 300_000 },
      summary: 'Keine Domain-/Mail-/DNS-Quelle. Health wird nicht erfunden.',
      proves: 'Nur, dass keine Infomaniak-Integration aktiv ist.',
      doesNotProve: 'Domain, Mail oder Hosting.',
    }),
  ],
}
