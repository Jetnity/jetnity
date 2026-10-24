'use client'

// components/trips/usePlanningCreationLifecycle.ts
//
// Gemeinsame Oberfläche für den einen laufenden Create-Versuch.
// Kein Mutationsrahmen: keine Action, kein Speicher, kein Router.
// TripPlanner und Reiseidee bleiben die Aufrufer.

import * as React from 'react'

/**
 * Synchroner Schreibschutz plus Instanz-Generation.
 *
 * `laeuft` kommt erst im nächsten Render an. `gesperrt` gilt schon im
 * selben Turn, damit ein zweites Absenden und eine gleichzeitige Eingabe
 * den abgeschickten Entwurf nicht verändern.
 *
 * Die Generation bricht keinen schon gesendeten Konto-Aufruf ab. Sie sagt
 * nur, ob diese Instanz das Ergebnis noch anwenden darf.
 */
export function usePlanningCreationLifecycle() {
  const [laeuft, setLaeuft] = React.useState(false)
  const belegt = React.useRef(false)
  const generation = React.useRef(0)
  const montiert = React.useRef(true)

  React.useEffect(() => {
    montiert.current = true
    return () => {
      montiert.current = false
    }
  }, [])

  const gesperrt = () => belegt.current

  const beginnen = (): number | null => {
    if (belegt.current) return null
    belegt.current = true
    const lauf = generation.current + 1
    generation.current = lauf
    setLaeuft(true)
    return lauf
  }

  const aktuell = (lauf: number) => montiert.current && generation.current === lauf

  const beenden = (lauf: number) => {
    if (generation.current !== lauf) return
    belegt.current = false
    if (montiert.current) setLaeuft(false)
  }

  return { laeuft, gesperrt, beginnen, aktuell, beenden }
}
