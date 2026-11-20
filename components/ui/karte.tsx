import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

/**
 * Karte (DESIGN_SYSTEM.md 6.3): eine ruhige Fläche mit feinem Rand und
 * leichtem Schatten. Farben sind semantisch, damit dieselbe Karte auf
 * Weiss-Mint und im grünen Arbeitsbereich lesbar bleibt. Abstände setzt der
 * Inhalt, damit Listen bis an den Rand laufen können.
 */
export function Karte({
  as: Element = 'div',
  className,
  ...rest
}: { as?: 'div' | 'section' | 'article' } & HTMLAttributes<HTMLElement>) {
  return (
    <Element
      className={cn('min-w-0 max-w-full rounded-card border border-border bg-card text-card-foreground shadow-card', className)}
      {...rest}
    />
  )
}
