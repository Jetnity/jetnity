import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * Seitenkopf (DESIGN_SYSTEM.md 6.2): ein Kicker, genau eine h1, ein Satz
 * Einordnung und hoechstens eine Hauptaktion. Flach und ohne Bild, damit der
 * Inhalt auf dem Handy direkt darunter beginnt.
 *
 * Farben sind semantisch, damit derselbe Kopf auf Creme, Weiss-Mint und im
 * gruenen Arbeitsbereich lesbar bleibt.
 */
export function Seitenkopf({
  kicker,
  titel,
  children,
  aktion,
  className,
}: {
  kicker?: ReactNode
  titel: ReactNode
  /** Ein Satz Einordnung unter der Ueberschrift. */
  children?: ReactNode
  aktion?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0 max-w-3xl">
        {kicker ? <p className="text-kicker uppercase text-muted-foreground">{kicker}</p> : null}
        <h1 className="mt-1 text-display text-foreground [overflow-wrap:anywhere]">{titel}</h1>
        {children ? <div className="mt-2 max-w-prose text-body text-muted-foreground">{children}</div> : null}
      </div>
      {aktion ? <div className="min-w-0 shrink-0">{aktion}</div> : null}
    </header>
  )
}
