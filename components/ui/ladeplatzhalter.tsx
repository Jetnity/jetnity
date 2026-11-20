import { cn } from '@/lib/utils'

/**
 * Ladeplatzhalter (DESIGN_SYSTEM.md 6.6): zeigt die Form dessen, was gleich
 * erscheint, statt eines Drehsymbols. Die Flaechen sind fuer Screenreader
 * unsichtbar; den Zustand sagt allein der Statustext. Bei „Bewegung reduzieren“
 * steht der Schimmer still (globale Regel in styles/globals.css).
 */
export function Ladeplatzhalter({
  status,
  zeilen = 3,
  className,
  ...daten
}: {
  /** Kurzer, ehrlicher Satz, was geladen wird. */
  status: string
  zeilen?: number
  className?: string
} & { [key: `data-${string}`]: string | undefined }) {
  return (
    <div {...daten} role="status" aria-live="polite" aria-busy="true" className={cn('grid min-w-0 gap-3', className)}>
      <span className="sr-only">{status}</span>
      <div aria-hidden="true" className="grid gap-3">
        <span className={cn(FLAECHE, 'h-7 w-2/5 rounded-control')} />
        {Array.from({ length: Math.max(1, zeilen) }, (_, index) => (
          <span key={index} className={cn(FLAECHE, 'h-16 rounded-card', index === zeilen - 1 && 'w-4/5')} />
        ))}
      </div>
    </div>
  )
}

const FLAECHE =
  'block bg-[linear-gradient(90deg,rgb(var(--muted))_0%,rgb(var(--card))_50%,rgb(var(--muted))_100%)] bg-[length:200%_100%] animate-schimmer'
