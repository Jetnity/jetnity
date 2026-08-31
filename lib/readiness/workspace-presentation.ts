// lib/readiness/workspace-presentation.ts
//
// Presentation-only Workspace-Filter für Reisevorbereitung.
// Ändert keine Domain-Wahrheit, keine Persistenz und nicht TW-4.

import type { ReadinessSummary, ReadinessViewItem } from '@/lib/readiness/domain'
import type { ReadinessKind } from '@/types/trips'

export const READINESS_WORKSPACE_DUPLICATE_KINDS = [
  'entry_check',
  'visa_check',
  'travel_document_check',
  'insurance_check',
] as const

export type ReadinessWorkspaceDuplicateKind = (typeof READINESS_WORKSPACE_DUPLICATE_KINDS)[number]

export function readinessWorkspaceIstDuplicateKind(kind: ReadinessKind): boolean {
  return (READINESS_WORKSPACE_DUPLICATE_KINDS as readonly string[]).includes(kind)
}

export function readinessWorkspaceSichtbar(
  items: readonly ReadinessViewItem[],
): ReadinessViewItem[] {
  return items.filter((item) => !readinessWorkspaceIstDuplicateKind(item.kind))
}

export function readinessWorkspaceZaehlung(items: readonly ReadinessViewItem[]): Pick<
  ReadinessSummary,
  'open' | 'done' | 'skipped' | 'stale' | 'notApplicable'
> {
  const sichtbar = readinessWorkspaceSichtbar(items)
  const zaehlbar = sichtbar.filter((item) => item.currentness !== 'not_applicable')
  return {
    open: zaehlbar.filter((item) => item.currentness === 'current' && item.userStatus === 'open').length,
    done: zaehlbar.filter((item) => item.currentness === 'current' && item.userStatus === 'done').length,
    skipped: zaehlbar.filter((item) => item.currentness === 'current' && item.userStatus === 'skipped').length,
    stale: zaehlbar.filter((item) => item.currentness === 'stale').length,
    notApplicable: sichtbar.filter((item) => item.currentness === 'not_applicable').length,
  }
}

export function readinessWorkspaceZusammenfassung(
  summary: ReadinessSummary,
  items: readonly ReadinessViewItem[],
): ReadinessSummary {
  return {
    ...summary,
    ...readinessWorkspaceZaehlung(items),
  }
}
