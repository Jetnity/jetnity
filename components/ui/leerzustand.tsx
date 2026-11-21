import type { ComponentType, ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * Leerzustand (DESIGN_SYSTEM.md 6.7): sagt, dass hier wirklich noch nichts ist,
 * und bietet genau einen naechsten Schritt an.
 *
 * Nur fuer eine bestaetigt leere Antwort verwenden. Ein Lesefehler ist kein
 * Leerzustand (AGENTS.md 15, ADR-0037): er bekommt eine eigene Meldung.
 */
export function Leerzustand({
  symbol: Symbol,
  titel,
  children,
  aktion,
  className,
  ...daten
}: {
  symbol?: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
  titel: ReactNode
  children?: ReactNode
  aktion?: ReactNode
  className?: string
} & { [key: `data-${string}`]: string | undefined }) {
  return (
    <section
      {...daten}
      className={cn(
        'min-w-0 max-w-full rounded-panel border border-dashed border-border bg-card px-6 py-12 text-center sm:px-10 sm:py-14',
        className,
      )}
    >
      {Symbol ? (
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground">
          <Symbol className="h-5 w-5" aria-hidden="true" />
        </span>
      ) : null}
      <h2 className="mx-auto mt-5 max-w-xl text-title text-foreground [overflow-wrap:anywhere]">{titel}</h2>
      {children ? (
        <div className="mx-auto mt-3 max-w-md text-body text-muted-foreground [overflow-wrap:anywhere]">{children}</div>
      ) : null}
      {aktion ? <div className="mt-6 flex justify-center">{aktion}</div> : null}
    </section>
  )
}
