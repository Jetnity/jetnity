'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Waagrechter Scrollbereich fuer bewusst breite Inhalte.
 *
 * Gedacht fuer Tabellen, Reiter und Chip-Reihen, die auf schmalen Geraeten
 * nicht sinnvoll umbrechen koennen. Der Bereich loest drei Probleme, die bei
 * einem einfachen `overflow-x-auto` regelmaessig auftreten:
 *
 * 1. Der Bereich muss schrumpfen duerfen. `min-w-0` verhindert, dass die
 *    automatische Mindestgroesse in Grid- und Flex-Layouts stattdessen das
 *    ganze Layout verbreitert.
 * 2. Die waagrechte Wischbewegung darf nicht die Zurueck-Navigation des
 *    Browsers ausloesen, deshalb `overscroll-x-contain`.
 * 3. Ohne Hinweis bleibt unsichtbar, dass seitlich weitere Inhalte stehen.
 *    Deshalb erscheint an der jeweiligen Seite eine weiche Kante, solange dort
 *    noch Inhalt liegt.
 *
 * Der Bereich ist ausserdem mit der Tastatur erreichbar und bedienbar, weil
 * ein Scrollbereich sonst nur mit Maus oder Finger nutzbar waere.
 */
export interface ScrollRowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  children: React.ReactNode
  /** Beschriftung des Bereichs fuer Tastatur- und Screenreader-Bedienung. */
  label: string
  /**
   * Startfarbe der weichen Kanten. Muss zum Hintergrund hinter dem Bereich
   * passen, zum Beispiel `from-surface-25`.
   */
  fadeFromClassName?: string
  /** Klassen fuer den scrollenden Bereich selbst, etwa Abstaende der Kinder. */
  viewportClassName?: string
}

export function ScrollRow({
  children,
  label,
  className,
  fadeFromClassName = 'from-white',
  viewportClassName,
  ...rest
}: ScrollRowProps) {
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const [edges, setEdges] = React.useState({ start: false, end: false })

  const measure = React.useCallback(() => {
    const el = viewportRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    // Unterhalb eines Pixels ist die Differenz nur Rundung der Layoutbreite.
    const scrollable = max > 1
    setEdges({
      start: scrollable && el.scrollLeft > 1,
      end: scrollable && el.scrollLeft < max - 1,
    })
  }, [])

  React.useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    measure()

    // Der Hinweis haengt an der Breite: Fensterwechsel, Querformat und
    // nachgeladene Inhalte veraendern sie, ohne dass gescrollt wird.
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    for (const child of Array.from(el.children)) observer.observe(child)
    return () => observer.disconnect()
  }, [measure])

  const fade = 'pointer-events-none absolute inset-y-0 w-8 transition-opacity duration-200'

  return (
    <div className={cn('relative min-w-0', className)} {...rest}>
      <div
        ref={viewportRef}
        role="group"
        aria-label={label}
        tabIndex={0}
        onScroll={measure}
        className={cn(
          'flex min-w-0 overflow-x-auto overscroll-x-contain scrollbar-hide',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40',
          viewportClassName
        )}
      >
        {children}
      </div>

      <span
        aria-hidden="true"
        className={cn(fade, 'left-0 bg-gradient-to-r', fadeFromClassName, edges.start ? 'opacity-100' : 'opacity-0')}
      />
      <span
        aria-hidden="true"
        className={cn(fade, 'right-0 bg-gradient-to-l', fadeFromClassName, edges.end ? 'opacity-100' : 'opacity-0')}
      />
    </div>
  )
}
