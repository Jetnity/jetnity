import type { AttentionPunkt } from '@/lib/trips/attention'

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
