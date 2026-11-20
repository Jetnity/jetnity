import { ANALYTICS_RANGES, type AnalyticsSource, type TravelAnalyticsReport } from '@/lib/admin/analytics/report'
import AdminSnapshotRefresh from '@/components/admin/AdminSnapshotRefresh'
import { Fehlerflaeche } from '@/components/admin/Ladezustand'
import { Seitenkopf } from '@/components/ui/seitenkopf'
import { analyticsText } from '@/lib/localization/analytics-texte'
import type { UiSprache } from '@/lib/localization/ui-sprache'

function dayLabel(date: string, sprache: UiSprache) {
  // Calendar dates are never converted into a guessed timestamp or timezone.
  const [year, month, day] = date.split('-')
  return sprache === 'en' ? `${year}-${month}-${day}` : `${day}.${month}.${year}`
}

function MissingSource({ source, sprache }: { source: AnalyticsSource<unknown>; sprache: UiSprache }) {
  return source.kind === 'error' ? <Fehlerflaeche fehler={source.error} sprache={sprache} /> : (
    <p className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
      {analyticsText(sprache, 'analytics.unavailable')}
    </p>
  )
}

export default function TravelAnalytics({ report, invalidRange = false, sprache = 'de' }: { report: TravelAnalyticsReport; invalidRange?: boolean; sprache?: UiSprache }) {
  const locale = sprache === 'en' ? 'en-GB' : 'de-CH'
  const rows = report.series.kind === 'ready' ? report.series.data : null
  const maximum = rows ? Math.max(1, ...rows.map((row) => row.trips)) : 1
  const total = rows?.reduce((sum, row) => sum + row.trips, 0)

  return (
    <div lang={sprache} className="mx-auto grid min-w-0 max-w-7xl grid-cols-1 gap-5 [overflow-wrap:anywhere]">
      <Seitenkopf kicker={analyticsText(sprache, 'analytics.eyebrow')} titel={analyticsText(sprache, 'analytics.title')}>
        <p>{analyticsText(sprache, 'analytics.intro')}</p>
      </Seitenkopf>
      <AdminSnapshotRefresh observedAt={report.observedAt} sprache={sprache} />

      <section className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6" aria-labelledby="analytics-metrics">
        <h2 id="analytics-metrics" className="text-lg font-semibold">{analyticsText(sprache, 'analytics.metricsTitle')}</h2>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">{analyticsText(sprache, 'analytics.metricsHint')}</p>
        <div className="mt-4">
          {report.metrics.kind === 'ready' ? (
            <dl className="grid min-w-0 gap-3 sm:grid-cols-3">
              {[
                [analyticsText(sprache, 'analytics.total'), report.metrics.data.total],
                [analyticsText(sprache, 'analytics.last30Days'), report.metrics.data.last30Days],
                [analyticsText(sprache, 'analytics.accounts30Days'), report.metrics.data.accountsWithTrip30Days],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0 rounded-xl border border-border bg-background p-4">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="mt-2 break-words text-3xl font-semibold tracking-tight tabular-nums">{value.toLocaleString(locale)}</dd>
                </div>
              ))}
            </dl>
          ) : <MissingSource source={report.metrics} sprache={sprache} />}
        </div>
      </section>

      <section className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6" aria-labelledby="analytics-series">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 max-w-full">
            <h2 id="analytics-series" className="text-lg font-semibold">{analyticsText(sprache, 'analytics.seriesTitle')}</h2>
            <p className="mt-1 max-w-prose text-sm text-muted-foreground">{analyticsText(sprache, 'analytics.period', { days: report.range })}</p>
          </div>
          <nav aria-label={analyticsText(sprache, 'analytics.rangeLabel')} className="flex flex-wrap gap-2">
            {ANALYTICS_RANGES.map((range) => (
              <a key={range} href={`/admin/analytics?tage=${range}`} aria-current={range === report.range ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center rounded-xl border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${range === report.range ? 'border-primary/40 bg-primary/10 font-semibold' : 'border-border hover:bg-muted'}`}>
                {analyticsText(sprache, 'analytics.range', { days: range })}
              </a>
            ))}
          </nav>
        </div>
        {invalidRange && <p role="status" className="mt-3 text-sm text-muted-foreground">{analyticsText(sprache, 'analytics.invalidRange')}</p>}
        <div className="mt-5">
          {rows ? (
            <>
              <p className="text-sm"><strong className="tabular-nums">{total?.toLocaleString(locale)}</strong>{' '}{analyticsText(sprache, total === 1 ? 'analytics.seriesSummary.one' : 'analytics.seriesSummary', { from: dayLabel(rows[0].date, sprache), to: dayLabel(rows[rows.length - 1].date, sprache) })}</p>
              <figure className="mt-4" aria-label={analyticsText(sprache, 'analytics.chartLabel')}>
                <ul className="grid h-44 items-end gap-px border-b border-border" style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }}>
                  {rows.map((row) => (
                    <li key={row.date} className="flex h-full min-w-0 items-end justify-center" aria-label={analyticsText(sprache, row.trips === 1 ? 'analytics.dayLabel.one' : 'analytics.dayLabel', { date: dayLabel(row.date, sprache), count: row.trips })}>
                      <span aria-hidden="true" title={analyticsText(sprache, row.trips === 1 ? 'analytics.dayLabel.one' : 'analytics.dayLabel', { date: dayLabel(row.date, sprache), count: row.trips })} className="block w-full max-w-10 rounded-t bg-primary/80" style={{ height: `${(row.trips / maximum) * 95}%` }} />
                    </li>
                  ))}
                </ul>
                <figcaption className="mt-2 flex flex-wrap justify-between gap-2 text-xs tabular-nums text-muted-foreground"><span>{dayLabel(rows[0].date, sprache)}</span><span>{dayLabel(rows[rows.length - 1].date, sprache)}</span></figcaption>
              </figure>
              {total === 0 && <p className="mt-3 text-sm text-muted-foreground">{analyticsText(sprache, 'analytics.zero')}</p>}
              <details className="mt-4 rounded-xl border border-border bg-background">
                <summary className="min-h-11 cursor-pointer p-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{analyticsText(sprache, 'analytics.showDays')}</summary>
                <div className="overflow-x-auto px-3 pb-3" role="region" aria-label={analyticsText(sprache, 'analytics.daysLabel')} tabIndex={0}>
                  <table className="w-full text-left text-sm tabular-nums">
                    <caption className="sr-only">{analyticsText(sprache, 'analytics.tableCaption')}</caption>
                    <thead><tr className="border-b border-border"><th scope="col" className="py-2">{analyticsText(sprache, 'analytics.day')}</th><th scope="col" className="py-2 text-right">{analyticsText(sprache, 'analytics.newTrips')}</th></tr></thead>
                    <tbody>{rows.map((row) => <tr key={row.date} className="border-b border-border last:border-0"><th scope="row" className="whitespace-nowrap py-2 font-normal">{dayLabel(row.date, sprache)}</th><td className="whitespace-nowrap py-2 text-right">{row.trips.toLocaleString(locale)}</td></tr>)}</tbody>
                  </table>
                </div>
              </details>
            </>
          ) : <MissingSource source={report.series} sprache={sprache} />}
        </div>
        <p className="mt-4 max-w-prose text-xs text-muted-foreground">{analyticsText(sprache, 'analytics.dayBoundary')}</p>
      </section>

      <aside className="min-w-0 rounded-2xl border border-border bg-card p-4 text-sm sm:p-6" aria-labelledby="analytics-source">
        <h2 id="analytics-source" className="font-semibold">{analyticsText(sprache, 'analytics.sourceTitle')}</h2>
        <p className="mt-2 max-w-prose text-muted-foreground">{analyticsText(sprache, 'analytics.source')}</p>
        <p className="mt-2 max-w-prose text-muted-foreground">{analyticsText(sprache, 'analytics.limits')}</p>
      </aside>
    </div>
  )
}
