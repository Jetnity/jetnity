import AdminEvidenceDetails from './AdminEvidenceDetails'

type Day = { date: string; reisen: number }

function datum(date: string) {
  const [year, month, day] = date.split('-')
  return `${day}.${month}.${year}`
}

export default function AdminTimeSeriesClient({ data }: { data: Day[] }) {
  const maximum = Math.max(1, ...data.map((day) => day.reisen))
  const total = data.reduce((sum, day) => sum + day.reisen, 0)
  const ticks = [...new Set(data.length ? [0, Math.floor((data.length - 1) / 2), data.length - 1] : [])].filter((index) => index >= 0)

  return (
    <div className="min-w-0">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold tabular-nums text-foreground">{total}</span> neue Reisen im dargestellten Zeitraum
      </p>
      <figure className="mt-5" aria-label="Neue Reisen je Tag, diskrete Tageswerte">
        <ul
          className="grid h-44 items-end gap-1 border-b border-border sm:gap-2"
          style={{ gridTemplateColumns: `repeat(${Math.max(1, data.length)}, minmax(0, 1fr))` }}
        >
          {data.map((day) => (
            <li key={day.date} className="flex h-full min-w-0 flex-col items-center justify-end" aria-label={`${datum(day.date)}: ${day.reisen} Reisen`}>
              <span aria-hidden className="mb-1 text-xs font-medium tabular-nums">{day.reisen > 0 ? day.reisen : ''}</span>
              <div
                aria-hidden
                title={`${datum(day.date)}: ${day.reisen} Reisen`}
                className="w-full max-w-9 rounded-t bg-primary/80"
                style={{ height: `${(day.reisen / maximum) * 80}%` }}
              />
            </li>
          ))}
        </ul>
        <figcaption className="mt-2 flex justify-between gap-1 text-[10px] tabular-nums text-muted-foreground sm:text-xs">
          {ticks.map((index) => <span key={index}>{datum(data[index].date)}</span>)}
        </figcaption>
      </figure>
      {total === 0 && <p className="mt-3 text-sm text-muted-foreground">Keine neuen Reisen im dargestellten Zeitraum.</p>}
      <div className="mt-4">
        <AdminEvidenceDetails label="Datenqualität & Nachweis · Tageswerte">
          <p>Jeder Balken zeigt den gelieferten Tageswert. Fehlende Tage werden nicht ergänzt.</p>
          <dl className="grid grid-cols-2 gap-x-5 gap-y-1 tabular-nums">
            {data.map((day) => (
              <div key={day.date} className="flex flex-wrap justify-between gap-x-2">
                <dt>{datum(day.date)}</dt><dd>{day.reisen}</dd>
              </div>
            ))}
          </dl>
        </AdminEvidenceDetails>
      </div>
    </div>
  )
}
