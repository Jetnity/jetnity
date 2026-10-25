// lib/trips/trip-archive-workflow.ts
//
// Klassifikation und Vorgangsstand für Archivieren und Wiederherstellen.
// Der Server-Action-Vertrag bleibt in archiv-aktionen.ts.

export type ArchivKlasse = 'acknowledged' | 'returned-negative' | 'unknown'

export type ArchivSperre = {
  operationId: string
  tripId: string
  collectionId: string
} | null

export type ArchivSchreibstand = 'pending' | ArchivKlasse

export type ArchivBeobachtung = 'unread' | 'row-status' | 'row-absent'

export type Listenlieferung = 'keine' | 'gelesen' | 'nicht-gelesen'

export type ArchivVorgang = {
  operationId: string
  tripId: string
  collectionId: string
  aktion: 'archivieren' | 'wiederherstellen'
  status: string
  updatedAt: string
  archivePreviousStatus: 'draft' | 'planned' | 'booked' | null
  write: ArchivSchreibstand
  meldung: string
  observation: ArchivBeobachtung
  observedStatus: string | null
  listenlieferung: Listenlieferung
}

function eigeneSchluessel(wert: object): string {
  return Object.keys(wert).sort().join(',')
}

export function archivKlasse(wert: unknown): ArchivKlasse {
  if (wert === null || typeof wert !== 'object' || Array.isArray(wert)) return 'unknown'
  const schluessel = eigeneSchluessel(wert)
  const eintrag = wert as { ok?: unknown; wert?: unknown; meldung?: unknown }
  if (schluessel === 'ok,wert' && eintrag.ok === true && eintrag.wert === null) return 'acknowledged'
  if (schluessel === 'meldung,ok' && eintrag.ok === false && typeof eintrag.meldung === 'string' && eintrag.meldung.length > 0) {
    return 'returned-negative'
  }
  return 'unknown'
}

export function sperreSetzen(aktuell: ArchivSperre, naechste: Exclude<ArchivSperre, null>): ArchivSperre | 'belegt' {
  if (aktuell) return 'belegt'
  return naechste
}

export function sperreLoesen(aktuell: ArchivSperre, operationId: string): ArchivSperre {
  if (aktuell?.operationId === operationId) return null
  return aktuell
}

export function rueckmeldungAnwenden(
  vorgaenge: readonly ArchivVorgang[],
  eingabe: {
    mounted: boolean
    collectionId: string
    operationId: string
    klasse: ArchivKlasse
    meldung: string
  },
): ArchivVorgang[] {
  if (!eingabe.mounted) return vorgaenge.slice()
  return vorgaenge.map((vorgang) => {
    if (vorgang.collectionId !== eingabe.collectionId || vorgang.operationId !== eingabe.operationId) return vorgang
    if (vorgang.write !== 'pending') return vorgang
    if (eingabe.klasse === 'acknowledged') return { ...vorgang, write: 'acknowledged', meldung: '' }
    if (eingabe.klasse === 'returned-negative') return { ...vorgang, write: 'returned-negative', meldung: eingabe.meldung }
    return { ...vorgang, write: 'unknown', meldung: '' }
  })
}

function beobachtungSatz(vorgang: ArchivVorgang): string {
  if (vorgang.observation === 'unread') return 'Die geladene Liste ist davon unabhängig und noch nicht neu gelesen.'
  if (vorgang.observation === 'row-absent') return 'In der geladenen Liste ist diese Reise gerade nicht sichtbar.'
  return `In der geladenen Liste steht der Status ${vorgang.observedStatus ?? 'unbekannt'}.`
}

export function archivHinweis(vorgang: ArchivVorgang): { schreiben: string; sehen: string; alarm: boolean } {
  const schreiben =
    vorgang.write === 'pending'
      ? 'Die Aktion läuft.'
      : vorgang.write === 'acknowledged'
        ? 'Die Aktion hat Erfolg gemeldet.'
        : vorgang.write === 'returned-negative'
          ? vorgang.meldung
          : 'Das Ergebnis dieser Aktion ist unklar.'
  const basis = beobachtungSatz(vorgang)
  const sehen =
    vorgang.listenlieferung === 'nicht-gelesen' ? `Diese Adresse hat keine Liste gelesen. ${basis}` : basis
  return { schreiben, sehen, alarm: vorgang.write === 'returned-negative' || vorgang.write === 'unknown' }
}

export function beobachtungAnwenden(
  vorgaenge: readonly ArchivVorgang[],
  zeilen: readonly { id: string; status: string }[],
  problem: unknown,
  lesung: 'gelesen' | 'nicht-gelesen' = 'gelesen',
): ArchivVorgang[] {
  if (lesung !== 'gelesen' || problem) {
    return vorgaenge.map((vorgang) => ({ ...vorgang, listenlieferung: 'nicht-gelesen' as const }))
  }
  return vorgaenge.map((vorgang) => {
    const zeile = zeilen.find((eintrag) => eintrag.id === vorgang.tripId)
    if (!zeile) {
      return { ...vorgang, observation: 'row-absent' as const, observedStatus: null, listenlieferung: 'gelesen' as const }
    }
    return { ...vorgang, observation: 'row-status' as const, observedStatus: zeile.status, listenlieferung: 'gelesen' as const }
  })
}
