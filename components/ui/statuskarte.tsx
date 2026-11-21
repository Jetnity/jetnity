import type { ComponentType, ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * Statuskarte (DESIGN_SYSTEM.md 6.18): eine Seite, die nur einen Zustand
 * meldet – 404, Anmeldung abschliessen, Link ungültig, kein Zugriff, Konto
 * gelöscht. Sie trägt die einzige h1 der Seite und führt mit höchstens zwei
 * Aktionen weiter.
 */
export const statusAktionHaupt =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

export const statusAktionNeben =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-input bg-card px-5 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

export const statusFussLink =
  'inline-flex min-h-11 items-center gap-2 rounded-control px-2 font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function Statuskarte({
  symbol: Symbol,
  ton = 'ruhig',
  kicker,
  titel,
  children,
  aktionen,
  fuss,
  className,
  ...daten
}: {
  symbol?: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
  ton?: 'ruhig' | 'fehler' | 'laedt'
  kicker?: ReactNode
  titel: ReactNode
  children?: ReactNode
  aktionen?: ReactNode
  fuss?: ReactNode
  className?: string
} & { [key: `data-${string}`]: string | undefined }) {
  return (
    <div
      {...daten}
      className={cn(
        'mx-auto w-full max-w-2xl rounded-panel border border-border bg-card p-6 text-center shadow-card sm:p-10',
        className,
      )}
    >
      {Symbol ? (
        <span
          className={cn(
            'mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted',
            ton === 'fehler' ? 'text-destructive' : 'text-foreground',
          )}
        >
          <Symbol className={cn('h-5 w-5', ton === 'laedt' && 'motion-safe:animate-spin')} aria-hidden="true" />
        </span>
      ) : null}
      {kicker ? <p className="mt-5 text-kicker uppercase text-muted-foreground">{kicker}</p> : null}
      <h1 className={cn(kicker ? 'mt-2' : 'mt-5', 'text-display text-foreground [overflow-wrap:anywhere]')}>{titel}</h1>
      {children ? (
        <div className="mx-auto mt-4 max-w-md space-y-3 text-body text-muted-foreground [overflow-wrap:anywhere]">
          {children}
        </div>
      ) : null}
      {aktionen ? (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:[&>*]:min-w-48">{aktionen}</div>
      ) : null}
      {fuss ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">{fuss}</div>
      ) : null}
    </div>
  )
}
