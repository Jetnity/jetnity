import {
  ANALYST_FRESHNESS_LABEL,
  ANALYST_OBSERVED_LABEL,
  ladeAnalystBericht,
  type AnalystBericht,
  type AnalystInsight,
} from '@/lib/admin/analyst'
import { beobachtungsstand } from '@/lib/admin/analyst/system-health-insights'
import { ADMIN_EHRLICHE_TEXTE } from '@/lib/admin/ehrliche-zustaende'
import { cn } from '@/lib/utils'

function chipKlassen(insight: AnalystInsight): string {
  if (insight.materiality === 'none' || insight.materiality === 'coverage') {
    return 'border-border bg-muted text-foreground'
  }
  if (
    insight.observed === 'unavailable' ||
    insight.observed === 'source_failed' ||
    insight.observed === 'partial_failed' ||
    insight.observed === 'lookup-failed' ||
    insight.observed === 'access_denied'
  ) {
    return 'border-rose-400/30 bg-rose-400/10 text-rose-800 dark:text-rose-200'
  }
  if (insight.freshness.state === 'stale' || insight.observed === 'degraded') {
    return 'border-amber-400/30 bg-amber-400/10 text-amber-800 dark:text-amber-200'
  }
  return 'border-border bg-muted text-foreground'
}

function abdeckungText(bericht: AnalystBericht): string {
  const teile = [
    bericht.coverage.evidenced.length ? `Belegt: ${bericht.coverage.evidenced.join(', ')}` : null,
    bericht.coverage.notConfigured.length
      ? `Nicht konfiguriert: ${bericht.coverage.notConfigured.join(', ')}`
      : null,
    bericht.coverage.unknown.length ? `Unbekannt: ${bericht.coverage.unknown.join(', ')}` : null,
    bericht.coverage.failed.length ? `Fehlgeschlagen: ${bericht.coverage.failed.join(', ')}` : null,
    bericht.coverage.notAttributed.length
      ? `Nicht zugeschrieben: ${bericht.coverage.notAttributed.join(', ')}`
      : null,
  ].filter(Boolean)
  return teile.join(' · ') || 'Keine belegte System-Health-Abdeckung in diesem Prozessstand.'
}

export function AdminLagehinweiseAnsicht({ bericht }: { bericht: AnalystBericht }) {
  const titel = ADMIN_EHRLICHE_TEXTE.aktuelleHinweiseTitel
  const hinweis = ADMIN_EHRLICHE_TEXTE.aktuelleHinweiseHinweis

  return (
    <section aria-labelledby="admin-lagehinweise-titel" className="min-w-0 w-full max-w-full">
      <h2 id="admin-lagehinweise-titel" className="text-lg font-semibold">
        {titel}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{hinweis}</p>
      {bericht.access.status === 'allowed' ? (
        <p className="mt-3 text-xs text-muted-foreground" data-analyst-coverage>
          {abdeckungText(bericht)}
        </p>
      ) : null}
      <ul className="mt-4 grid w-full min-w-0 list-none gap-3 p-0">
        {bericht.insights.map((insight) => {
          const observedLabel = ANALYST_OBSERVED_LABEL[insight.observed]
          const freshnessLabel = ANALYST_FRESHNESS_LABEL[insight.freshness.state]
          const stand = beobachtungsstand(insight)
          const statusName = `${insight.title}, ${observedLabel}, ${freshnessLabel}, ${stand.alterstext}`
          return (
            <li
              key={insight.id}
              className="min-w-0 w-full rounded-xl border border-border bg-background p-4"
              data-analyst-id={insight.id}
              data-analyst-materiality={insight.materiality}
              data-analyst-observed={insight.observed}
              data-analyst-freshness={insight.freshness.state}
              data-analyst-attribution={insight.attribution}
            >
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                <h3 className="min-w-0 text-sm font-medium">{insight.title}</h3>
                <p className={cn('rounded-md border px-2 py-0.5 text-xs font-medium', chipKlassen(insight))}>
                  <span>{observedLabel}</span>
                  <span className="mx-1" aria-hidden>
                    ·
                  </span>
                  <span>{freshnessLabel}</span>
                </p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{insight.explanation}</p>
              <p className="mt-2 text-xs text-muted-foreground" data-analyst-observed-at>
                <span className="font-medium text-foreground">Beobachtet: </span>
                {stand.dateTime ? <time dateTime={stand.dateTime}>{stand.zeittext}</time> : stand.zeittext}
                <span aria-hidden> · </span>
                <span data-analyst-age>{stand.alterstext}</span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Belegt: </span>
                {insight.proves}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Belegt nicht: </span>
                {insight.doesNotProve}
              </p>
              {insight.next ? (
                <a
                  href={insight.next.href}
                  className="mt-3 inline-block text-sm underline underline-offset-4 hover:no-underline"
                  aria-label={`${insight.next.label}: ${statusName}`}
                >
                  {insight.next.label}
                </a>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default async function AdminLagehinweise() {
  const bericht = await ladeAnalystBericht()
  return <AdminLagehinweiseAnsicht bericht={bericht} />
}
