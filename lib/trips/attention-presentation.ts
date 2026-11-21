import type { AttentionLage, AttentionPunkt } from '@/lib/trips/attention'

export type AttentionGruppe = {
  punkt: AttentionPunkt
  mitglieder: AttentionPunkt[]
  anzahl: number
}

/**
 * Nur Darstellung: alle kanonischen Punkte bleiben als Mitglieder erhalten.
 * Map-Reihenfolge und Repräsentant folgen dem frühesten kanonischen Mitglied;
 * die Gruppengröße verändert weder Priorität noch Wahrheit der Einzelpunkte.
 */
export function attentionGruppieren(punkte: readonly AttentionPunkt[]): AttentionGruppe[] {
  const gruppen = new Map<string, AttentionGruppe>()
  for (const punkt of punkte) {
    // Explizite Präsentationsfelder, keine Interpretation opaker IDs.
    const schluessel = JSON.stringify([
      punkt.signal,
      punkt.schwere,
      punkt.lage,
      punkt.titel,
      punkt.ebene,
      punkt.aktion ? [
        punkt.aktion.art,
        punkt.aktion.bereich,
        punkt.aktion.preparationZiel ? [
          punkt.aktion.preparationZiel.bereich,
          punkt.aktion.preparationZiel.travellerClientRef ?? null,
        ] : null,
      ] : null,
    ])
    const gruppe = gruppen.get(schluessel)
    if (gruppe) {
      gruppe.mitglieder.push(punkt)
      gruppe.anzahl += 1
    } else {
      gruppen.set(schluessel, { punkt, mitglieder: [punkt], anzahl: 1 })
    }
  }
  return [...gruppen.values()]
}

const OHNE_SCHRITT: ReadonlySet<AttentionLage> = new Set(['unknown', 'insufficient_context', 'ungeprueft'])

/**
 * Ausführbar ist, was die reisende Person jetzt selbst weiterbringen kann.
 * Eine Prüfung, die Jetnity gerade nicht liefern kann, ist es nie, auch mit
 * Sprungziel. Warnungen, Fehler, veraltete Prüfungen und offene Lücken bleiben
 * oben, auch ohne Sprungziel, weil sie Aufmerksamkeit brauchen.
 */
export function attentionAusfuehrbar(punkt: AttentionPunkt): boolean {
  if (punkt.lage === 'unavailable') return false
  if (punkt.aktion) return true
  return !OHNE_SCHRITT.has(punkt.lage)
}

/** Teilt Gruppen ohne Umsortieren; jede Gruppe landet in genau einem Teil. */
export function attentionNachAusfuehrbarkeit(gruppen: readonly AttentionGruppe[]): {
  jetzt: AttentionGruppe[]
  gutZuWissen: AttentionGruppe[]
} {
  const jetzt: AttentionGruppe[] = []
  const gutZuWissen: AttentionGruppe[] = []
  for (const gruppe of gruppen) {
    ;(attentionAusfuehrbar(gruppe.punkt) ? jetzt : gutZuWissen).push(gruppe)
  }
  return { jetzt, gutZuWissen }
}
