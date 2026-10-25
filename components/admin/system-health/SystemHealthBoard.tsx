'use client'

import { useCallback } from 'react'
import {
  FRESHNESS_LABEL,
  HEALTH_STATUS_LABEL,
  SYSTEM_HEALTH_API_PFAD,
  healthKarteIstGruen,
  sichtbarerKartenClaim,
  wendeEvidenceAlterAn,
  type SystemHealthBericht,
  type SystemHealthCheck,
  type SystemHealthItem,
} from '@/lib/admin/system-health'
import { deuteSystemHealth } from '@/lib/admin/operations-report-validation'
import OperationsEvidence from '@/components/admin/OperationsEvidence'
import { HISTORISCHER_SATZ, useOperationsReport, type OperationsHinweis } from '@/components/admin/operations/useOperationsReport'
import { cn } from '@/lib/utils'

function statusKlassen(item: Pick<SystemHealthItem, 'status' | 'freshness'>): string {
  if (healthKarteIstGruen(item)) {
    return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-800 dark:text-emerald-200'
  }
  if (item.freshness.state === 'stale' || item.status === 'degraded') {
    return 'border-amber-400/30 bg-amber-400/10 text-amber-800 dark:text-amber-200'
  }
  if (item.status === 'unavailable') {
    return 'border-rose-400/30 bg-rose-400/10 text-rose-800 dark:text-rose-200'
  }
  return 'border-border bg-background text-muted-foreground'
}

function kurztext(item: SystemHealthItem): string {
  if (item.id === 'app') return 'Prozess-Erreichbarkeit und Deployment werden getrennt bewertet.'
  if (item.id === 'supabase') return 'App-Datenzugriff und Plattformstatus werden getrennt bewertet.'
  if (item.status === 'not_configured') return 'Keine angebundene Statusquelle.'
  if (item.status === 'unknown') return 'Für diesen Dienst liegt kein belastbarer Status vor.'
  return item.summary
}

function alterWert(ageMs: number | null): string {
  return ageMs === null ? '' : String(ageMs)
}

function CheckZeile({ check, checkedAt }: { check: SystemHealthCheck; checkedAt: string }) {
  const statusText = HEALTH_STATUS_LABEL[check.status]
  const frischeText = FRESHNESS_LABEL[check.freshness.state]
  return (
    <li
      className="min-w-0 break-words border-b border-border px-1 py-3 last:border-b-0"
      data-health-check={check.id}
      data-health-status={check.status}
      data-health-freshness={check.freshness.state}
      data-health-age-ms={alterWert(check.freshness.ageMs)}
      data-health-checked-at={checkedAt}
      data-health-green={healthKarteIstGruen(check) ? 'true' : 'false'}
    >
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 break-words text-sm font-medium">{check.name}</p>
        <p className={cn('rounded-md border px-2 py-0.5 text-xs font-medium', statusKlassen(check))}>
          <span>{statusText}</span>
        </p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Nachweis: {frischeText}</p>
    </li>
  )
}

function HealthKarte({ item }: { item: SystemHealthItem }) {
  const statusText = HEALTH_STATUS_LABEL[item.status]
  const frischeText = FRESHNESS_LABEL[item.freshness.state]
  const claim = sichtbarerKartenClaim(item)
  const beschriftung = `${claim}, ${frischeText}`
  const gruen = healthKarteIstGruen(item)

  return (
    <article
      className="min-w-0 break-words rounded-2xl border border-border bg-card px-4 pt-4 sm:px-5"
      aria-label={beschriftung}
      data-health-id={item.id}
      data-health-status={item.status}
      data-health-freshness={item.freshness.state}
      data-health-age-ms={alterWert(item.freshness.ageMs)}
      data-health-checked-at={item.checkedAt}
      data-health-green={gruen ? 'true' : 'false'}
      data-health-claim={claim}
    >
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3 pb-3">
        <div className="min-w-0 break-words">
          <h3 className="break-words text-base font-semibold">{item.name}</h3>
          <p className="mt-1 break-words text-sm text-muted-foreground">{kurztext(item)}</p>
        </div>
        <p className={cn('rounded-md border px-2 py-1 text-xs font-medium', statusKlassen(item))}>
          <span>{statusText}</span>
        </p>
      </div>
      {item.checks?.length ? (
        <ul className="mb-3 grid min-w-0 gap-x-6 border-t sm:grid-cols-2" aria-label={`Teilprüfungen ${item.name}`}>
          {item.checks.map((teil) => (
            <CheckZeile key={teil.id} check={teil} checkedAt={item.checkedAt} />
          ))}
        </ul>
      ) : null}
      <p className="mb-3 break-words text-xs text-muted-foreground">
        Geprüft {new Date(item.checkedAt).toLocaleString('de-CH')} · Nachweis {frischeText}
      </p>
      <div className="min-w-0 break-words">
        <OperationsEvidence item={item} />
      </div>
    </article>
  )
}

export function SystemHealthAnsicht({ bericht }: { bericht: SystemHealthBericht }) {
  return (
    <div className="grid min-w-0 items-start gap-4 xl:grid-cols-2">
      <div className="min-w-0 space-y-4">
        {bericht.items.filter((item) => item.id === 'app' || item.id === 'supabase').map((item) => (
          <HealthKarte key={item.id} item={item} />
        ))}
      </div>
      <div className="min-w-0 space-y-4">
        {bericht.items.filter((item) => item.id !== 'app' && item.id !== 'supabase').map((item) => (
          <HealthKarte key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

function hinweis(bericht: SystemHealthBericht, wand: number): OperationsHinweis[] {
  return bericht.items.map((item) => {
    const gewendet = wendeEvidenceAlterAn(item, wand)
    const checks = gewendet.checks ?? []
    return {
      id: item.id,
      state: gewendet.freshness.state,
      ageMs: gewendet.freshness.ageMs,
      checks: (item.checks ?? []).map((check, index) => ({
        id: check.id,
        state: checks[index]?.freshness.state ?? check.freshness.state,
        ageMs: checks[index]?.freshness.ageMs ?? check.freshness.ageMs,
      })),
    }
  })
}

export default function SystemHealthBoard({
  anfang,
  endpunkt = SYSTEM_HEALTH_API_PFAD,
  aktualisierenErlaubt = true,
}: {
  anfang: SystemHealthBericht
  endpunkt?: string
  aktualisierenErlaubt?: boolean
}) {
  const deute = useCallback((wert: unknown) => deuteSystemHealth(wert), [])
  const { phase, pending, meldung, anzeige, erneut } = useOperationsReport({
    anfang,
    endpunkt,
    aktualisierenErlaubt,
    deute,
    hinweis,
  })

  return (
    <section
      className="min-w-0 space-y-4 break-words"
      data-operations-phase={phase}
      data-operations-endpoint={endpunkt}
      data-operations-pending={pending ? 'true' : 'false'}
      aria-busy={pending}
    >
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 break-words text-sm text-muted-foreground">
          <span className="mr-2 rounded-md border bg-card px-2 py-1 text-xs">Read-only</span>
          {anzeige ? `Geprüft ${new Date(anzeige.checkedAt).toLocaleString('de-CH')}` : phase === 'prueft' ? 'Prüfung wird gelesen.' : 'Kein bestätigter Prüfstand.'}
        </p>
        {aktualisierenErlaubt ? (
          <button
            type="button"
            onClick={erneut}
            disabled={pending}
            className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
          >
            {pending ? 'Aktualisiert…' : 'Erneut prüfen'}
          </button>
        ) : null}
      </div>
      <p className="sr-only" aria-live="polite">{pending ? 'Aktualisiert…' : ''}</p>
      {meldung && phase !== 'aktuell' && phase !== 'prueft' ? (
        <p
          role="alert"
          className="break-words rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-800 dark:text-rose-200"
        >
          {meldung}
        </p>
      ) : null}
      {phase === 'historisch' ? <p>{HISTORISCHER_SATZ}</p> : null}
      {anzeige ? <SystemHealthAnsicht bericht={anzeige} /> : null}
    </section>
  )
}
