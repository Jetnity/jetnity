import { betragLesbar } from '@/lib/trips/bezeichnungen'
import { cn } from '@/lib/utils'

/**
 * Preis (DESIGN_SYSTEM.md 6.5): immer mit Währung, in gleich breiten Ziffern
 * und ohne Umbruch zwischen Währung und Betrag. Der Stand (gebucht oder nur
 * ausgewählt) steht daneben als Statussiegel, nie nur als Farbe des Betrags.
 */
export function Preis({
  betrag,
  waehrung,
  className,
}: {
  betrag: number
  waehrung: string
  className?: string
}) {
  return (
    <span data-preis className={cn('whitespace-nowrap tabular-nums', className)}>
      {betragLesbar(betrag, waehrung)}
    </span>
  )
}
