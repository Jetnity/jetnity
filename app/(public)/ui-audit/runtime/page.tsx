import { notFound } from 'next/navigation'
import { modellZustand } from '@/lib/modell/konfiguration'
import { uiAuditSeiteAktiv } from '@/lib/ui-audit/freigabe'
import { weatherRequestOrigin } from '@/lib/reisewetter/request-origin'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const metadata = { title: 'Interner Dev-Runtime-Gate', robots: { index: false, follow: false } }

// Read-only and incident-branch-only: never expose secret values or model inputs.
// The managed Vercel preview remains deployment-protected by the existing SSO.
export default function IncidentRuntimeAudit() {
  const branch = 'fix/release1260-csp-ki-wetter-logout-cancel-dev-20261120'
  if (!uiAuditSeiteAktiv({
    VERCEL_ENV: process.env.VERCEL_ENV,
    JETNITY_UI_AUDIT: process.env.JETNITY_UI_AUDIT,
  }) || process.env.VERCEL_GIT_COMMIT_REF !== branch) notFound()

  const model = modellZustand()
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  const weather = process.env.OPENWEATHER_API_KEY ?? ''
  const modelConfigured = model.aktiv &&
    /^(eyJ|sb_secret_)/.test(service) && service.length > 30
  const weatherConfigured = weather.length > 20 && !weather.startsWith('intentionally-invalid')
  const devOriginAvailable = Boolean(weatherRequestOrigin(process.env))
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-xl font-semibold">Dev-Runtime-Prüfung (nur interner QA-Branch)</h1>
      <p className="mt-3">Ausschliesslich Konfigurationszustand – keine API-, Modell-, Datenbank- oder Anbieteraufrufe.</p>
      <dl className="mt-4 grid gap-3">
        <div><dt>KI-Modell mit vorhandenem Dienstclient</dt><dd data-incident-ki={modelConfigured ? 'ready' : 'blocked'}>{modelConfigured ? 'Bereit für begrenzten QA-Aufruf' : 'Gesperrt / nicht vollständig konfiguriert'}</dd></div>
        <div><dt>Wetter-Anbieterzugang</dt><dd data-incident-weather={weatherConfigured ? 'ready' : 'blocked'}>{weatherConfigured ? 'Vorhanden, echte Auth-/BG1-Abnahme notwendig' : 'Nicht eingerichtet'}</dd></div>
        <div><dt>Dev-Wetter-Origin</dt><dd data-incident-origin={devOriginAvailable ? 'ready' : 'blocked'}>{devOriginAvailable ? 'Zulässig; Einwilligung und Quoten-RPC bleiben Pflicht' : 'Gesperrt'}</dd></div>
      </dl>
    </main>
  )
}
