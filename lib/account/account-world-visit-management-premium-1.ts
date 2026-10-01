// lib/account/account-world-visit-management-premium-1.ts
//
// Reine Darstellung der Besuchsliste: was sichtbar ist, was die lokale Suche
// trifft, und wie viele Ereignisse noch hinter der ersten Seite stehen.
//
// Die Historie selbst bleibt unangetastet. Diese Datei sortiert nicht um,
// fasst nichts zusammen und spricht keinen Speicher an. Wiederholte Besuche
// bleiben getrennte Zeilen, weil sie schon als getrennte Zeilen ankommen.

export const BESUCH_VERWALTUNG_ANFANG = 12
export const BESUCH_VERWALTUNG_SCHRITT = 12

export type BesuchVerwaltungZeile = {
  id: string
  titel: string
  landLabel: string | null
  zeitText: string
  wiederholungText: string | null
}

export function besuchEreignisZahlText(anzahl: number): string {
  return anzahl === 1 ? '1 Ereignis' : `${anzahl} Ereignisse`
}

export function besuchWeitereText(verborgen: number): string {
  return verborgen === 1 ? '1 weiteres Ereignis' : `${verborgen} weitere Ereignisse`
}

export function besuchSuchtrefferText(treffer: number, gesamt: number): string {
  const links = treffer === 1 ? '1 Ereignis' : `${treffer} Ereignisse`
  return `${links} von ${gesamt}`
}

/** Anzeigetext, über den die lokale Suche läuft. Keine zweite Wahrheit. */
function besuchVerwaltungSuchtext(zeile: BesuchVerwaltungZeile): string {
  return [zeile.titel, zeile.landLabel, zeile.zeitText, zeile.wiederholungText]
    .filter((teil): teil is string => typeof teil === 'string' && teil.trim().length > 0)
    .join(' ')
}

/**
 * Filtert die schon geladene Reihenfolge. Ein leerer Suchtext gibt dieselbe
 * Liste zurück. Treffer behalten ihre relative Ordnung.
 */
export function besucheLokalFiltern<T extends BesuchVerwaltungZeile>(
  eintraege: readonly T[],
  suche: string,
): readonly T[] {
  const query = suche.trim().toLocaleLowerCase('de-DE')
  if (!query) return eintraege
  return eintraege.filter((eintrag) =>
    besuchVerwaltungSuchtext(eintrag).toLocaleLowerCase('de-DE').includes(query),
  )
}

/**
 * Sichtbarer Ausschnitt.
 *
 * Ohne Suche gilt `grenze` als Anzahl der ersten Ereignisse. Mit Suche sind
 * alle Treffer sichtbar: die Suche ist die ausdrückliche Handlung, die
 * passenden Ereignisse zu zeigen. Verborgen heisst hier nur „noch nicht
 * aufgeklappt“, nie „entfernt“.
 */
export function besuchVerwaltungAusschnitt<T extends BesuchVerwaltungZeile>(
  eintraege: readonly T[],
  suche: string,
  grenze: number,
): {
  zeilen: readonly T[]
  gefiltert: readonly T[]
  sucheAktiv: boolean
  verborgen: number
} {
  const sucheAktiv = suche.trim().length > 0
  const gefiltert = besucheLokalFiltern(eintraege, suche)
  if (sucheAktiv) {
    return { zeilen: gefiltert, gefiltert, sucheAktiv, verborgen: 0 }
  }
  const anfang = Math.max(0, Math.floor(grenze))
  const zeilen = eintraege.slice(0, anfang)
  return {
    zeilen,
    gefiltert: eintraege,
    sucheAktiv: false,
    verborgen: Math.max(0, eintraege.length - zeilen.length),
  }
}
