import type { ReactNode } from 'react'
import { Info, ListTodo, TriangleAlert } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Hinweis (DESIGN_SYSTEM.md 6.8): ein ruhiger Kasten fuer das, was jemand zu
 * einer Stelle wissen oder dort tun sollte.
 *
 * - `info`: zur Einordnung, nichts zu tun (neutral, bewusst nicht gruen)
 * - `aufgabe`: bitte erledigen, ohne Alarm (aprikosfarben, wie jede Handlung in Statusfarben)
 * - `dringend`: zeitkritisch oder blockierend; selten
 *
 * Der Ton steht als Symbol und im Text, nie nur als Farbe. Nur semantische
 * Farben, damit derselbe Hinweis auf Weiss-Mint und im gruenen Arbeitsbereich
 * lesbar bleibt.
 */
export type HinweisTon = 'info' | 'aufgabe' | 'dringend'

const TON: Record<HinweisTon, { flaeche: string; symbol: typeof Info; farbe: string }> = {
  info: { flaeche: 'border-status-neutral-line bg-status-neutral-soft', symbol: Info, farbe: 'text-status-neutral' },
  aufgabe: { flaeche: 'border-status-achtung-line bg-status-achtung-soft', symbol: ListTodo, farbe: 'text-status-achtung' },
  dringend: { flaeche: 'border-destructive bg-card', symbol: TriangleAlert, farbe: 'text-destructive' },
}

export function Hinweis({
  ton = 'info',
  titel,
  children,
  aktion,
  role,
  className,
  ...daten
}: {
  ton?: HinweisTon
  titel?: ReactNode
  children?: ReactNode
  aktion?: ReactNode
  role?: 'status' | 'alert' | 'note'
  className?: string
} & { [key: `data-${string}`]: string | undefined }) {
  const { flaeche, symbol: Symbol, farbe } = TON[ton]
  return (
    <div
      {...daten}
      role={role}
      data-hinweis={ton}
      className={cn('flex min-w-0 max-w-full gap-3 rounded-card border px-4 py-3 text-meta text-foreground', flaeche, className)}
    >
      <Symbol className={cn('mt-0.5 h-4 w-4 shrink-0', farbe)} aria-hidden="true" />
      <div className="grid min-w-0 flex-1 gap-1 [overflow-wrap:anywhere] [&_p]:max-w-prose">
        {titel ? <p className="font-semibold">{titel}</p> : null}
        {children}
        {aktion ? <div className="-mb-2 flex flex-wrap gap-x-4">{aktion}</div> : null}
      </div>
    </div>
  )
}
