// lib/account/reise-archiv.ts
//
// AP-4 Account Archive Lifecycle. Getrennt von der date-only AP-3-Lage.
//
// `trips.status = archived` ist der gespeicherte Lifecycle. Die Restore-
// Provenienz liegt namespaced in `trips.metadata.account_archive.previous_status`.
// Ein früherer Status wird niemals erfunden. Historische `archived`-Zeilen
// ohne gültige Provenienz bleiben fail-closed.

import { reisePasstZurSuche, reisenGruppenAus, type ReiseGruppen } from '@/lib/account/reise-lage'
import type { TripStatus, TripSummary } from '@/types/trips'

const WIEDERHERSTELLBARE_STATI = ['draft', 'planned', 'booked'] as const
export type WiederherstellbarerStatus = (typeof WIEDERHERSTELLBARE_STATI)[number]

export const ACCOUNT_ARCHIVE_METADATA_KEY = 'account_archive' as const
const ACCOUNT_ARCHIVE_PREVIOUS_STATUS_KEY = 'previous_status' as const

export type ArchivStand = {
  status: string
  metadata: unknown
}

export type ArchivPlanFehler =
  | 'unbekannt'
  | 'bereits-archiviert'
  | 'ungueltiger-status'
  | 'nicht-archiviert'
  | 'keine-provenienz'
  | 'metadata-ungueltig'

export type ArchivPlan =
  | {
      ok: true
      expectedStatus: TripStatus
      nextStatus: TripStatus
      nextMetadata: Record<string, unknown>
    }
  | { ok: false; grund: ArchivPlanFehler }

function istWiederherstellbarerStatus(wert: unknown): wert is WiederherstellbarerStatus {
  return wert === 'draft' || wert === 'planned' || wert === 'booked'
}

export function istArchiviert(reise: Pick<TripSummary, 'status'>): boolean {
  return reise.status === 'archived'
}

export function offeneReisenAus<T extends Pick<TripSummary, 'status'>>(reisen: readonly T[]): T[] {
  return reisen.filter((reise) => !istArchiviert(reise))
}

export function archivierteReisenAus<T extends Pick<TripSummary, 'status'>>(reisen: readonly T[]): T[] {
  return reisen.filter((reise) => istArchiviert(reise))
}

export function previousStatusAusMetadata(metadata: unknown): WiederherstellbarerStatus | null {
  const objekt = objektAus(metadata)
  if (!objekt) return null
  const archiv = objekt[ACCOUNT_ARCHIVE_METADATA_KEY]
  const huelle = objektAus(archiv)
  if (!huelle) return null
  const previous = huelle[ACCOUNT_ARCHIVE_PREVIOUS_STATUS_KEY]
  return istWiederherstellbarerStatus(previous) ? previous : null
}

export function previousStatusAusReise(
  reise: Pick<TripSummary, 'archivePreviousStatus'>,
): WiederherstellbarerStatus | null {
  return istWiederherstellbarerStatus(reise.archivePreviousStatus) ? reise.archivePreviousStatus : null
}

export function metadataNachArchivieren(
  metadata: unknown,
  previousStatus: WiederherstellbarerStatus,
): Record<string, unknown> | null {
  const aktuell = objektAus(metadata)
  if (!aktuell) return null
  const bestehend = objektAus(aktuell[ACCOUNT_ARCHIVE_METADATA_KEY]) ?? {}
  return {
    ...aktuell,
    [ACCOUNT_ARCHIVE_METADATA_KEY]: {
      ...bestehend,
      [ACCOUNT_ARCHIVE_PREVIOUS_STATUS_KEY]: previousStatus,
    },
  }
}

export function metadataNachWiederherstellen(metadata: unknown): Record<string, unknown> | null {
  const aktuell = objektAus(metadata)
  if (!aktuell) return null
  const archiv = objektAus(aktuell[ACCOUNT_ARCHIVE_METADATA_KEY])
  if (!archiv) return null
  const { [ACCOUNT_ARCHIVE_PREVIOUS_STATUS_KEY]: _previous, ...restArchiv } = archiv
  if (Object.keys(restArchiv).length === 0) {
    const { [ACCOUNT_ARCHIVE_METADATA_KEY]: _archiv, ...rest } = aktuell
    return rest
  }
  return {
    ...aktuell,
    [ACCOUNT_ARCHIVE_METADATA_KEY]: restArchiv,
  }
}

export function archivSchreibversion(updatedAt: unknown): string | null {
  return typeof updatedAt === 'string' && updatedAt.length > 0 ? updatedAt : null
}

export function archivStandVeraltet(
  gelesen: { status: string; updatedAt: string },
  aktuell: { status: string; updatedAt: string },
): boolean {
  return gelesen.status !== aktuell.status || gelesen.updatedAt !== aktuell.updatedAt
}

export function archivierenPlan(stand: ArchivStand | null): ArchivPlan {
  if (!stand) return { ok: false, grund: 'unbekannt' }
  if (stand.status === 'archived') return { ok: false, grund: 'bereits-archiviert' }
  if (!istWiederherstellbarerStatus(stand.status)) return { ok: false, grund: 'ungueltiger-status' }

  const nextMetadata = metadataNachArchivieren(stand.metadata, stand.status)
  if (!nextMetadata) return { ok: false, grund: 'metadata-ungueltig' }

  return {
    ok: true,
    expectedStatus: stand.status,
    nextStatus: 'archived',
    nextMetadata,
  }
}

export function wiederherstellenPlan(stand: ArchivStand | null): ArchivPlan {
  if (!stand) return { ok: false, grund: 'unbekannt' }
  if (stand.status !== 'archived') return { ok: false, grund: 'nicht-archiviert' }

  const previous = previousStatusAusMetadata(stand.metadata)
  if (!previous) return { ok: false, grund: 'keine-provenienz' }

  const nextMetadata = metadataNachWiederherstellen(stand.metadata)
  if (!nextMetadata) return { ok: false, grund: 'metadata-ungueltig' }

  return {
    ok: true,
    expectedStatus: 'archived',
    nextStatus: previous,
    nextMetadata,
  }
}

export function kontoReisenSichten(
  reisen: readonly TripSummary[],
  suche: string,
  heute: string,
): { gruppen: ReiseGruppen; archiv: TripSummary[] } {
  const sichtbar = reisen.filter((reise) => reisePasstZurSuche(reise, suche))
  return {
    gruppen: reisenGruppenAus(offeneReisenAus(sichtbar), heute),
    archiv: archivierteReisenAus(sichtbar),
  }
}

function objektAus(wert: unknown): Record<string, unknown> | null {
  if (wert === null || wert === undefined) return {}
  if (typeof wert !== 'object' || Array.isArray(wert)) return null
  return { ...(wert as Record<string, unknown>) }
}
