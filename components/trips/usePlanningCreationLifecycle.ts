'use client'

// components/trips/usePlanningCreationLifecycle.ts
//
// Gemeinsame Oberfläche für den einen laufenden Create-Versuch.
// Kein Mutationsrahmen: keine Action, kein Speicher, kein Router.
// TripPlanner und Reiseidee bleiben die Aufrufer.
//
// Die Übergänge sind reine Werte. Der Hook hält sie in einer Ref, damit
// der Schutz schon vor dem nächsten Render gilt. Dieselben Übergänge
// prüft der gewöhnliche Node-Test, ohne Browser.

import * as React from 'react'

export type CreationLifecycleStand = {
  belegt: boolean
  generation: number
  montiert: boolean
}

export function creationLifecycleAnfang(): CreationLifecycleStand {
  return { belegt: false, generation: 0, montiert: true }
}

/**
 * Zweiter Aufruf, solange der erste noch belegt ist, bleibt ohne neue Generation.
 * Ein schon gesendeter Konto-Aufruf wird hier nicht abgebrochen.
 */
export function creationLifecycleBeginnen(stand: CreationLifecycleStand): {
  stand: CreationLifecycleStand
  lauf: number | null
} {
  if (stand.belegt) return { stand, lauf: null }
  const lauf = stand.generation + 1
  return {
    stand: { belegt: true, generation: lauf, montiert: stand.montiert },
    lauf,
  }
}

/** Nur diese Instanz und genau diese Generation dürfen ein Ergebnis anwenden. */
export function creationLifecycleAktuell(stand: CreationLifecycleStand, lauf: number): boolean {
  return stand.montiert && stand.generation === lauf
}

/**
 * Hebt die Belegung nur für die laufende Generation auf.
 * Eine ältere Generation lässt die neuere Belegung stehen.
 */
export function creationLifecycleBeenden(
  stand: CreationLifecycleStand,
  lauf: number,
): CreationLifecycleStand {
  if (stand.generation !== lauf) return stand
  return { ...stand, belegt: false }
}

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
  const stand = React.useRef<CreationLifecycleStand>(creationLifecycleAnfang())

  React.useEffect(() => {
    stand.current = { ...stand.current, montiert: true }
    return () => {
      stand.current = { ...stand.current, montiert: false }
    }
  }, [])

  const gesperrt = () => stand.current.belegt

  const beginnen = (): number | null => {
    const ergebnis = creationLifecycleBeginnen(stand.current)
    stand.current = ergebnis.stand
    if (ergebnis.lauf !== null) setLaeuft(true)
    return ergebnis.lauf
  }

  const aktuell = (lauf: number) => creationLifecycleAktuell(stand.current, lauf)

  const beenden = (lauf: number) => {
    const vorher = stand.current
    const naechste = creationLifecycleBeenden(vorher, lauf)
    stand.current = naechste
    if (naechste !== vorher && naechste.montiert) setLaeuft(false)
  }

  return { laeuft, gesperrt, beginnen, aktuell, beenden }
}
