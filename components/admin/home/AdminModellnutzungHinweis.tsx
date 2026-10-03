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
import AdminEvidenceDetails from './AdminEvidenceDetails'

function chipKlassen(insight: ModelUsageInsight): string {
  if (insight.materiality === 'coverage') {
    return 'border-border bg-background text-muted-foreground'
  }
  if (
    insight.observed === 'unavailable' ||
    insight.observed === 'source_failed' ||
    insight.observed === 'partial_failed' ||
    insight.observed === 'lookup-failed' ||
    insight.observed === 'access_denied'
  ) {
    return 'border-destructive/30 bg-destructive/10 text-destructive'
  }
  if (insight.freshness.state === 'stale') {
    return 'border-border bg-background text-muted-foreground'
  }
  return 'border-border bg-background text-muted-foreground'
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
      <p className="mt-1 text-xs text-muted-foreground">Read-only · 30 Tage, bis zu 200 Einträge</p>
      <p className="mt-2 text-sm text-muted-foreground">Kostenabdeckung unvollständig</p>
      <ul className="mt-3 grid w-full min-w-0 list-none gap-3 p-0">
        {bericht.insights.map((insight, index) => {
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
              <p className="mt-2 text-xs text-muted-foreground" data-model-usage-observed-at>
                <span className="font-medium text-foreground">Beobachtet: </span>
                {stand.dateTime ? <time dateTime={stand.dateTime}>{stand.zeittext}</time> : stand.zeittext}
                <span aria-hidden> · </span>
                <span data-model-usage-age>{stand.alterstext}</span>
              </p>
              <div className="mt-2 flex flex-wrap items-start gap-x-4">
                <div className="min-w-0 flex-1 basis-48">
                  <AdminEvidenceDetails>
                    {index === 0 ? (
                      <>
                        <p>{hinweis}</p>
                        {bericht.access.status === 'allowed' && bericht.access.grant === 'role' ? (
                          <p data-model-usage-coverage>{abdeckungText(bericht)}</p>
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

export default async function AdminModellnutzungHinweis() {
  const bericht = await ladeModelUsageBericht()
  return <AdminModellnutzungHinweisAnsicht bericht={bericht} />
}
