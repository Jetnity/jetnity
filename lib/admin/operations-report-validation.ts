import {
  PROVIDER_OPS_BOARD_IDS,
  PROVIDER_OPS_BOARD_STATUSES,
  PROVIDER_OPS_BOARD_TTL_MS,
  type ProviderOpsBoardBericht,
  type ProviderOpsBoardId,
} from '@/lib/admin/provider-ops-board/typen'
import {
  HEALTH_STATUSES,
  SYSTEM_HEALTH_IDS,
  SYSTEM_HEALTH_TTL_MS,
  type SystemHealthBericht,
  type SystemHealthId,
} from '@/lib/admin/system-health/typen'

const FRISCHE = new Set(['fresh', 'stale', 'unknown'])
const HEALTH_STATUS = new Set<string>(HEALTH_STATUSES)
const OPS_STATUS = new Set<string>(PROVIDER_OPS_BOARD_STATUSES)
const HEALTH_BERICHT = new Set(['checkedAt', 'items', 'writeActions'])
const HEALTH_KARTE = new Set([
  'id',
  'name',
  'status',
  'source',
  'checkedAt',
  'freshness',
  'summary',
  'proves',
  'doesNotProve',
  'detail',
  'metadata',
  'checks',
  'sourceUpdatedAt',
])
const OPS_KARTE = new Set([
  'id',
  'name',
  'status',
  'source',
  'checkedAt',
  'freshness',
  'summary',
  'proves',
  'doesNotProve',
  'detail',
  'metadata',
  'checks',
])
const CHECK = new Set(['id', 'name', 'status', 'source', 'freshness', 'summary', 'proves', 'doesNotProve'])
const FRISCHE_FELDER = new Set(['state', 'ageMs', 'ttlMs'])

function istDatensatz(wert: unknown): wert is Record<string, unknown> {
  return Boolean(wert) && typeof wert === 'object' && !Array.isArray(wert) && Object.getPrototypeOf(wert) === Object.prototype
}

function text(wert: unknown): wert is string {
  return typeof wert === 'string' && wert.trim().length > 0
}

function zeit(wert: unknown): boolean {
  return text(wert) && Number.isFinite(Date.parse(wert))
}

function schluesselErlaubt(wert: Record<string, unknown>, erlaubt: Set<string>): boolean {
  return Object.keys(wert).every((feld) => erlaubt.has(feld))
}

function optionalText(wert: unknown): boolean {
  return wert === undefined || typeof wert === 'string'
}

function frische(
  wert: unknown,
  deckelMs: number,
): wert is { state: 'fresh' | 'stale' | 'unknown'; ageMs: number | null; ttlMs: number } {
  if (!istDatensatz(wert) || !schluesselErlaubt(wert, FRISCHE_FELDER)) return false
  const zustand = wert.state
  const alter = wert.ageMs
  const ttl = wert.ttlMs
  if (typeof zustand !== 'string' || !FRISCHE.has(zustand)) return false
  if (typeof ttl !== 'number' || !Number.isFinite(ttl) || ttl <= 0 || ttl > deckelMs) return false
  if (zustand === 'unknown') return alter === null
  if (typeof alter !== 'number' || !Number.isFinite(alter) || alter < 0) return false
  if (zustand === 'fresh' && alter > ttl) return false
  return true
}

function metadaten(wert: unknown): boolean {
  if (wert === undefined) return true
  if (!istDatensatz(wert)) return false
  return Object.values(wert).every((eintrag) => eintrag === null || typeof eintrag === 'string')
}

function pruefeCheck(
  wert: unknown,
  status: Set<string>,
  deckelMs: number,
  gesehen: Set<string>,
): boolean {
  if (!istDatensatz(wert) || !schluesselErlaubt(wert, CHECK)) return false
  if (!text(wert.id) || !text(wert.name) || !text(wert.source) || !text(wert.summary)) return false
  if (!text(wert.proves) || !text(wert.doesNotProve)) return false
  if (typeof wert.status !== 'string' || !status.has(wert.status)) return false
  if (gesehen.has(wert.id)) return false
  gesehen.add(wert.id)
  return frische(wert.freshness, deckelMs)
}

function pruefeKarte(
  wert: unknown,
  ids: readonly string[],
  status: Set<string>,
  felder: Set<string>,
  deckel: (id: string) => number,
  quelle: 'health' | 'ops',
): boolean {
  if (!istDatensatz(wert) || !schluesselErlaubt(wert, felder)) return false
  if (typeof wert.id !== 'string' || !ids.includes(wert.id)) return false
  if (!text(wert.name) || !text(wert.source) || !text(wert.summary)) return false
  if (!text(wert.proves) || !text(wert.doesNotProve) || !zeit(wert.checkedAt)) return false
  if (typeof wert.status !== 'string' || !status.has(wert.status)) return false
  if (!optionalText(wert.detail)) return false
  if (!metadaten(wert.metadata)) return false
  if (!frische(wert.freshness, deckel(wert.id))) return false
  if (quelle === 'health') {
    if (wert.sourceUpdatedAt !== undefined && !zeit(wert.sourceUpdatedAt)) return false
  }
  if (wert.checks !== undefined) {
    if (!Array.isArray(wert.checks)) return false
    const gesehen = new Set<string>()
    for (const check of wert.checks) {
      if (!pruefeCheck(check, status, deckel(wert.id), gesehen)) return false
    }
  }
  return true
}

function pruefeBericht(
  wert: unknown,
  ids: readonly string[],
  karte: (eintrag: unknown) => boolean,
): boolean {
  if (!istDatensatz(wert) || !schluesselErlaubt(wert, HEALTH_BERICHT)) return false
  if (!zeit(wert.checkedAt) || !Array.isArray(wert.writeActions) || wert.writeActions.length !== 0) return false
  if (!Array.isArray(wert.items) || wert.items.length !== ids.length) return false
  const gesehen = new Set<string>()
  for (const eintrag of wert.items) {
    if (!karte(eintrag) || !istDatensatz(eintrag) || typeof eintrag.id !== 'string') return false
    if (gesehen.has(eintrag.id)) return false
    gesehen.add(eintrag.id)
  }
  return ids.every((id) => gesehen.has(id))
}

export function deuteSystemHealth(wert: unknown): SystemHealthBericht {
  const gueltig = pruefeBericht(wert, SYSTEM_HEALTH_IDS, (eintrag) =>
    pruefeKarte(
      eintrag,
      SYSTEM_HEALTH_IDS,
      HEALTH_STATUS,
      HEALTH_KARTE,
      (id) => SYSTEM_HEALTH_TTL_MS[id as SystemHealthId],
      'health',
    ),
  )
  if (!gueltig) throw new Error('ungueltig')
  return wert as SystemHealthBericht
}

export function deuteProviderOps(wert: unknown): ProviderOpsBoardBericht {
  const gueltig = pruefeBericht(wert, PROVIDER_OPS_BOARD_IDS, (eintrag) =>
    pruefeKarte(
      eintrag,
      PROVIDER_OPS_BOARD_IDS,
      OPS_STATUS,
      OPS_KARTE,
      (id) => PROVIDER_OPS_BOARD_TTL_MS[id as ProviderOpsBoardId],
      'ops',
    ),
  )
  if (!gueltig) throw new Error('ungueltig')
  return wert as ProviderOpsBoardBericht
}
