'use client'

interface Props {
  impressions: number
  views: number
}

export default function SessionPerformancePanel({ impressions, views }: Props) {
  return (
    <div className="mt-8 p-4 rounded-xl border bg-muted/20 space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground mb-2">📊 Performance</h3>
      <p className="text-sm">👁️ Impressions: <span className="font-medium">{impressions}</span></p>
      <p className="text-sm">📈 Views: <span className="font-medium">{views}</span></p>
    </div>
  )
}
