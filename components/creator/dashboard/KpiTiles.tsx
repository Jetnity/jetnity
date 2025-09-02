export default function KpiTiles({
  views, earnings, ctr, uploads,
}: { views: number; earnings: number; ctr: number; uploads: number }) {
  const items = [
    { label: 'Aufrufe', value: Intl.NumberFormat().format(views) },
    { label: 'Einnahmen', value: Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(earnings) },
    { label: 'CTR', value: `${ctr.toFixed(1)}%` },
    { label: 'Uploads', value: Intl.NumberFormat().format(uploads) },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="text-xs font-medium text-muted-foreground">{it.label}</div>
          <div className="mt-1 text-xl font-semibold tracking-tight">{it.value}</div>
        </div>
      ))}
    </div>
  )
}
