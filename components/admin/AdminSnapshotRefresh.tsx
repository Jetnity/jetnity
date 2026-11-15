'use client'

import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminSnapshotRefresh({ observedAt }: { observedAt: string }) {
  const time = new Intl.DateTimeFormat('de-CH', {
    dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Europe/Zurich',
  }).format(new Date(observedAt))

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
      <div className="min-w-0 break-words text-sm">
        <p>Momentaufnahme vom <time dateTime={observedAt}>{time}</time> · Zürich</p>
        <p className="mt-1 text-xs text-muted-foreground">Keine automatische Aktualisierung. Status und Zahlen können inzwischen abweichen.</p>
      </div>
      <Button variant="outline" onClick={() => window.location.reload()}
        leftIcon={<RefreshCw className="h-4 w-4 shrink-0" aria-hidden="true" />}
        className="h-auto min-h-11 min-w-0 max-w-full whitespace-normal text-left pointer-fine:h-auto pointer-fine:min-h-11 [&>span:last-child]:min-w-0 [&>span:last-child]:break-words">
        Ansicht aktualisieren
      </Button>
    </div>
  )
}
