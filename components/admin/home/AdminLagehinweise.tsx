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
import AdminEvidenceDetails from './AdminEvidenceDetails'

function chipKlassen(insight: AnalystInsight): string {
  if (insight.materiality === 'none') return 'border-border bg-muted text-foreground'
  if (insight.materiality === 'coverage') return 'border-border bg-background text-muted-foreground'
  if (
    insight.observed === 'unavailable' ||
    insight.observed === 'source_failed' ||
    insight.observed === 'partial_failed' ||
    insight.observed === 'lookup-failed' ||
    insight.observed === 'access_denied'
  ) {
    return 'border-destructive/30 bg-destructive/10 text-destructive'
  }
  if (insight.freshness.state === 'stale' || insight.observed === 'degraded') {
    return 'border-border bg-muted text-foreground'
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
  const hinweis = ADMIN_EHRLICHE_TEXTE.aktuelleHinweiseHinweis

  const attention = bericht.insights.filter((insight) => insight.materiality === 'attention').length
  const noAction = bericht.access.status === 'allowed' && bericht.access.grant === 'role' &&
    bericht.insights.length === 1 && bericht.insights[0].materiality === 'none' &&
    bericht.insights[0].observed === 'healthy' && bericht.insights[0].freshness.state === 'fresh'

  return (
    <section aria-labelledby="admin-lagehinweise-titel" className="min-w-0 w-full max-w-full">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="admin-lagehinweise-titel" className="text-sm font-medium">Gesamtbild · System Health</h3>
        <span className={cn('rounded-full border px-3 py-1 text-xs font-medium', attention ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-border bg-background text-muted-foreground')}>
          {attention ? `${attention} Prüfhinweis${attention === 1 ? '' : 'e'}` : 'Begrenzte Abdeckung'}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Letzter Prozessstand · Plattformzustand nicht vollständig belegt</p>
      <ul className="mt-3 grid w-full min-w-0 list-none gap-3 p-0">
        {bericht.insights.map((insight, index) => {
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
                <h4 className="min-w-0 text-sm font-medium">{noAction ? 'Keine Maßnahmen erforderlich' : insight.title}</h4>
                <p className={cn('rounded-md border px-2 py-0.5 text-xs font-medium', chipKlassen(insight))}>
                  <span>{observedLabel}</span>
                  <span className="mx-1" aria-hidden>
                    ·
                  </span>
                  <span>{freshnessLabel}</span>
                </p>
              </div>
              {noAction ? <p className="mt-2 text-xs text-muted-foreground">Für die frisch belegten Quellen · kein Nachweis für die aktuelle Sitzung.</p> : null}
              <p className="mt-2 text-xs text-muted-foreground" data-analyst-observed-at>
                <span className="font-medium text-foreground">Beobachtet: </span>
                {stand.dateTime ? <time dateTime={stand.dateTime}>{stand.zeittext}</time> : stand.zeittext}
                <span aria-hidden> · </span>
                <span data-analyst-age>{stand.alterstext}</span>
              </p>
              <div className="mt-2 flex flex-wrap items-start gap-x-4">
                <div className="min-w-0 flex-1 basis-48">
                  <AdminEvidenceDetails>
                    {index === 0 ? (
                      <>
                        <p>{hinweis}</p>
                        <p>{ADMIN_EHRLICHE_TEXTE.steuerzentraleLage}</p>
                        {bericht.access.status === 'allowed' ? (
                          <p data-analyst-coverage>{abdeckungText(bericht)}</p>
                        ) : null}
                      </>
                    ) : null}
                    <p>{insight.explanation}</p>
                    <p>
                      <span className="font-medium text-foreground">Belegt: </span>
                      {insight.proves}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Belegt nicht: </span>
                      {insight.doesNotProve}
                    </p>
                  </AdminEvidenceDetails>
                </div>
                {insight.next ? (
                  <a
                    href={insight.next.href}
                    className="inline-flex min-h-11 items-center text-sm underline underline-offset-4 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    aria-label={`${insight.next.label}: ${statusName}`}
                  >
                    {insight.next.label}
                  </a>
                ) : null}
              </div>
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
