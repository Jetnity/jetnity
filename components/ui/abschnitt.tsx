import type { HTMLAttributes, ReactNode } from 'react'

import { Karte } from '@/components/ui/karte'
import { cn } from '@/lib/utils'

/**
 * Abschnitt (DESIGN_SYSTEM.md 6.9): eine Karte mit Überschrift, höchstens
 * einem Satz Einordnung und höchstens einer Aktion rechts. Die Überschrift
 * benennt den Abschnitt für Screenreader (`aria-labelledby`).
 */
export function Abschnitt({
  id,
  titel,
  beschreibung,
  aktion,
  ebene: Ueberschrift = 'h3',
  className,
  children,
  ...rest
}: {
  id: string
  titel: ReactNode
  beschreibung?: ReactNode
  aktion?: ReactNode
  ebene?: 'h2' | 'h3'
  className?: string
  children: ReactNode
} & Omit<HTMLAttributes<HTMLElement>, 'id' | 'title' | 'children'>) {
  return (
    <Karte as="section" aria-labelledby={id} className={cn('p-4 sm:p-6', className)} {...rest}>
      <header className="flex min-w-0 flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 basis-56">
          <Ueberschrift id={id} tabIndex={-1} className="text-subtitle text-foreground outline-none [overflow-wrap:anywhere]">
            {titel}
          </Ueberschrift>
          {beschreibung ? <p className="mt-1 text-meta text-muted-foreground">{beschreibung}</p> : null}
        </div>
        {aktion ? <div className="min-w-0 shrink-0">{aktion}</div> : null}
      </header>
      <div className="mt-4 min-w-0">{children}</div>
    </Karte>
  )
}
