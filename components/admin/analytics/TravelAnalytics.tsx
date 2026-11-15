import { ANALYTICS_RANGES, type AnalyticsSource, type TravelAnalyticsReport } from '@/lib/admin/analytics/report'
import AdminSnapshotRefresh from '@/components/admin/AdminSnapshotRefresh'
import { Fehlerflaeche } from '@/components/admin/Ladezustand'

function dayLabel(date: string) {
  const [year, month, day] = date.split('-')
  return `${day}.${month}.${year}`
}

function MissingSource({ source }: { source: AnalyticsSource<unknown> }) {
  return source.kind === 'error' ? <Fehlerflaeche fehler={source.error} /> : (
    <p className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
      Für diese Sitzung sind keine Betriebszahlen verfügbar. Das ist keine Aussage über die Zahl der Reisen.
    </p>
  )
}

export default function TravelAnalytics({ report, invalidRange = false }: { report: TravelAnalyticsReport; invalidRange?: boolean }) {
  const rows = report.series.kind === 'ready' ? report.series.data : null
  const maximum = rows ? Math.max(1, ...rows.map((row) => row.trips)) : 1
  const total = rows?.reduce((sum, row) => sum + row.trips, 0)

  return (
    <div className="mx-auto grid min-w-0 max-w-7xl grid-cols-1 gap-5 [overflow-wrap:anywhere]">
      <header className="min-w-0">
        <p className="text-sm font-medium text-muted-foreground">Analytics · Jetnity</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Reiseaktivität</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Wie viele Reisen in Jetnity angelegt wurden – als Gesamtzahlen, ohne private Reiseinhalte.</p>
      </header>
      <AdminSnapshotRefresh observedAt={report.observedAt} />

      <section className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6" aria-labelledby="analytics-metrics">
        <h2 id="analytics-metrics" className="text-lg font-semibold">Gespeicherte Reisen</h2>
        <p className="mt-1 text-sm text-muted-foreground">Der Zeitraum von 30 Tagen läuft rückwärts ab der Abfrage. Die Auswahl darunter verändert diese Kennzahlen nicht.</p>
        <div className="mt-4">
          {report.metrics.kind === 'ready' ? (
            <dl className="grid min-w-0 gap-3 sm:grid-cols-3">
              {[
                ['Reisen insgesamt', report.metrics.data.total],
                ['Neue Reisen · letzte 30 Tage', report.metrics.data.last30Days],
                ['Konten mit neuer Reise · letzte 30 Tage', report.metrics.data.accountsWithTrip30Days],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0 rounded-xl border border-border bg-background p-4">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="mt-2 break-words text-3xl font-semibold tracking-tight tabular-nums">{value.toLocaleString('de-CH')}</dd>
                </div>
              ))}
            </dl>
          ) : <MissingSource source={report.metrics} />}
        </div>
      </section>

      <section className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6" aria-labelledby="analytics-series">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 max-w-full">
            <h2 id="analytics-series" className="text-lg font-semibold">Neue Reisen je Kalendertag</h2>
            <p className="mt-1 text-sm text-muted-foreground">Letzte {report.range} Tage einschliesslich heute</p>
          </div>
          <nav aria-label="Zeitraum der Reiseauswertung" className="flex flex-wrap gap-2">
            {ANALYTICS_RANGES.map((range) => (
              <a key={range} href={`/admin/analytics?tage=${range}`} aria-current={range === report.range ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center rounded-xl border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${range === report.range ? 'border-primary/40 bg-primary/10 font-semibold' : 'border-border hover:bg-muted'}`}>
                {range} Tage
              </a>
            ))}
          </nav>
        </div>
        {invalidRange && <p role="status" className="mt-3 text-sm text-muted-foreground">Der angefragte Zeitraum ist nicht gültig. Angezeigt werden 30 Tage.</p>}
        <div className="mt-5">
          {rows ? (
            <>
              <p className="text-sm"><strong className="tabular-nums">{total?.toLocaleString('de-CH')}</strong> neue Reisen vom {dayLabel(rows[0].date)} bis {dayLabel(rows[rows.length - 1].date)}</p>
              <figure className="mt-4" aria-label="Neue Reisen je Tag; genaue Werte in der Tabelle Tageswerte">
                <ul className="grid h-44 items-end gap-px border-b border-border" style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }}>
                  {rows.map((row) => (
                    <li key={row.date} className="flex h-full min-w-0 items-end justify-center" aria-label={`${dayLabel(row.date)}: ${row.trips} Reisen`}>
                      <span aria-hidden="true" title={`${dayLabel(row.date)}: ${row.trips} Reisen`} className="block w-full max-w-10 rounded-t bg-primary/80" style={{ height: `${(row.trips / maximum) * 95}%` }} />
                    </li>
                  ))}
                </ul>
                <figcaption className="mt-2 flex flex-wrap justify-between gap-2 text-xs tabular-nums text-muted-foreground"><span>{dayLabel(rows[0].date)}</span><span>{dayLabel(rows[rows.length - 1].date)}</span></figcaption>
              </figure>
              {total === 0 && <p className="mt-3 text-sm text-muted-foreground">In diesem Zeitraum wurden keine neuen Reisen erfasst.</p>}
              <details className="mt-4 rounded-xl border border-border bg-background">
                <summary className="min-h-11 cursor-pointer p-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Tageswerte anzeigen</summary>
                <div className="overflow-x-auto px-3 pb-3" role="region" aria-label="Tageswerte" tabIndex={0}>
                  <table className="w-full text-left text-sm tabular-nums">
                    <caption className="sr-only">Alle gelieferten Tageswerte der Reiseauswertung</caption>
                    <thead><tr className="border-b border-border"><th scope="col" className="py-2">Tag</th><th scope="col" className="py-2 text-right">Neue Reisen</th></tr></thead>
                    <tbody>{rows.map((row) => <tr key={row.date} className="border-b border-border last:border-0"><th scope="row" className="whitespace-nowrap py-2 font-normal">{dayLabel(row.date)}</th><td className="whitespace-nowrap py-2 text-right">{row.trips.toLocaleString('de-CH')}</td></tr>)}</tbody>
                  </table>
                </div>
              </details>
            </>
          ) : <MissingSource source={report.series} />}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Die Tagesgrenzen stammen aus der Datenbank. Der heutige Tag ist noch nicht abgeschlossen. Kalendertage und das rollierende 30-Tage-Fenster sind unterschiedliche Zeiträume.</p>
      </section>

      <aside className="min-w-0 rounded-2xl border border-border bg-card p-4 text-sm sm:p-6" aria-labelledby="analytics-source">
        <h2 id="analytics-source" className="font-semibold">Quelle und Bedeutung</h2>
        <p className="mt-2 text-muted-foreground">Quelle: gespeicherte Jetnity-Reisen, gelesen über die bestehenden geschützten Betriebsaggregate. Gastreisen, die nur auf einem Gerät liegen, werden nicht mitgezählt. Gelöschte Reisen sind nicht mehr enthalten.</p>
        <p className="mt-2 text-muted-foreground">Konten mit neuer Reise sind keine Gesamtzahl registrierter Konten und keine Besucherstatistik. Umsatz, Buchungen und Conversion werden aus diesen Zahlen nicht abgeleitet. Kennzahlen und Tagesreihe werden getrennt abgefragt.</p>
      </aside>
    </div>
  )
}
