import {
  MODEL_USAGE_FRESHNESS_LABEL,
  MODEL_USAGE_OBSERVED_LABEL,
  type ModelUsageBericht,
  type ModelUsageInsight,
} from '@/lib/admin/analyst/model-usage-typen'
import { ladeModelUsageBericht } from '@/lib/admin/analyst/model-usage-laden'
import { modelUsageBeobachtungsstand } from '@/lib/admin/analyst/model-usage-insights'
import { ADMIN_EHRLICHE_TEXTE } from '@/lib/admin/ehrliche-zustaende'
import { cn } from '@/lib/utils'

function chipKlassen(insight: ModelUsageInsight): string {
  if (insight.materiality === 'coverage') {
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
  if (insight.freshness.state === 'stale') {
    return 'border-amber-400/30 bg-amber-400/10 text-amber-800 dark:text-amber-200'
  }
  return 'border-border bg-muted text-foreground'
}

function abdeckungText(bericht: ModelUsageBericht): string {
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
  return teile.join(' · ') || 'Keine belegte Modellnutzungs-Abdeckung in diesem Prozessstand.'
}

export function AdminModellnutzungHinweisAnsicht({ bericht }: { bericht: ModelUsageBericht }) {
  const titel = ADMIN_EHRLICHE_TEXTE.modellnutzungTitel
  const hinweis = ADMIN_EHRLICHE_TEXTE.modellnutzungHinweis

  return (
    <section aria-labelledby="admin-modellnutzung-titel" className="min-w-0 w-full max-w-full break-words">
      <h2 id="admin-modellnutzung-titel" className="text-lg font-semibold">
        {titel}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{hinweis}</p>
      {bericht.access.status === 'allowed' && bericht.access.grant === 'role' ? (
        <p className="mt-3 text-xs text-muted-foreground" data-model-usage-coverage>
          {abdeckungText(bericht)}
        </p>
      ) : null}
      <ul className="mt-4 grid w-full min-w-0 list-none gap-3 p-0">
        {bericht.insights.map((insight) => {
          const observedLabel = MODEL_USAGE_OBSERVED_LABEL[insight.observed]
          const freshnessLabel = MODEL_USAGE_FRESHNESS_LABEL[insight.freshness.state]
          const stand = modelUsageBeobachtungsstand(insight)
          const statusName = `${insight.title}, ${observedLabel}, ${freshnessLabel}, ${stand.alterstext}`
          return (
            <li
              key={insight.id}
              className="min-w-0 w-full break-words rounded-xl border border-border bg-background p-4"
              data-model-usage-id={insight.id}
              data-model-usage-materiality={insight.materiality}
              data-model-usage-observed={insight.observed}
              data-model-usage-freshness={insight.freshness.state}
              data-model-usage-attribution={insight.attribution}
            >
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                <h3 className="min-w-0 text-sm font-medium">{insight.title}</h3>
                <p className={cn('max-w-full shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium', chipKlassen(insight))}>
                  <span>{observedLabel}</span>
                  <span className="mx-1" aria-hidden>
                    ·
                  </span>
                  <span>{freshnessLabel}</span>
                </p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{insight.explanation}</p>
              <p className="mt-2 text-xs text-muted-foreground" data-model-usage-observed-at>
                <span className="font-medium text-foreground">Beobachtet: </span>
                {stand.dateTime ? <time dateTime={stand.dateTime}>{stand.zeittext}</time> : stand.zeittext}
                <span aria-hidden> · </span>
                <span data-model-usage-age>{stand.alterstext}</span>
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
                  className="mt-3 inline-block text-sm underline underline-offset-4 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
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

export default async function AdminModellnutzungHinweis() {
  const bericht = await ladeModelUsageBericht()
  return <AdminModellnutzungHinweisAnsicht bericht={bericht} />
}
