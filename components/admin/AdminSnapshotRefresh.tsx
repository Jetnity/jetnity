'use client'

import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ADMIN_LESE_TEXTE } from '@/lib/localization/admin-lese-texte'
import type { UiSprache } from '@/lib/localization/ui-sprache'

export default function AdminSnapshotRefresh({ observedAt, sprache = 'de' }: { observedAt: string; sprache?: UiSprache }) {
  const texte = ADMIN_LESE_TEXTE[sprache]
  const time = new Intl.DateTimeFormat(sprache === 'en' ? 'en-GB' : 'de-CH', {
    dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Europe/Zurich',
  }).format(new Date(observedAt))

  return (
    <div lang={sprache} className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
      <div className="min-w-0 break-words text-sm">
        <p>{texte['adminRead.snapshotPrefix']} <time dateTime={observedAt}>{time}</time> · {texte['adminRead.timezone']}</p>
        <p className="mt-1 text-xs text-muted-foreground">{texte['adminRead.snapshotHint']}</p>
      </div>
      <Button variant="outline" onClick={() => window.location.reload()}
        leftIcon={<RefreshCw className="h-4 w-4 shrink-0" aria-hidden="true" />}
        className="h-auto min-h-11 min-w-0 max-w-full whitespace-normal text-left transition-colors pointer-fine:h-auto pointer-fine:min-h-11 [&>span:last-child]:min-w-0 [&>span:last-child]:break-words">
        {texte['adminRead.refresh']}
      </Button>
    </div>
  )
}
