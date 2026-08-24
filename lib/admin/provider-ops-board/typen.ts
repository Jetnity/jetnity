export const PROVIDER_OPS_BOARD_IDS = [
  'provider-ops',
  'kill-switch',
  'cost-guard',
  'model-usage',
] as const

export type ProviderOpsBoardId = (typeof PROVIDER_OPS_BOARD_IDS)[number]

export const PROVIDER_OPS_BOARD_STATUSES = [
  'available',
  'foundation_only',
  'disabled',
  'not_configured',
  'unknown',
  'unavailable',
  'empty',
] as const

export type ProviderOpsBoardStatus = (typeof PROVIDER_OPS_BOARD_STATUSES)[number]

export const FRESHNESS_STATES = ['fresh', 'stale', 'unknown'] as const

export type FreshnessState = (typeof FRESHNESS_STATES)[number]

export type BoardFreshness = {
  state: FreshnessState
  ageMs: number | null
  ttlMs: number
}

export type ProviderOpsBoardCheck = {
  id: string
  name: string
  status: ProviderOpsBoardStatus
  source: string
  freshness: BoardFreshness
  summary: string
  proves: string
  doesNotProve: string
}

export type ProviderOpsBoardItem = {
  id: ProviderOpsBoardId
  name: string
  status: ProviderOpsBoardStatus
  source: string
  checkedAt: string
  freshness: BoardFreshness
  summary: string
  detail?: string
  proves: string
  doesNotProve: string
  metadata?: Record<string, string | null>
  checks?: ProviderOpsBoardCheck[]
}

export type ProviderOpsBoardBericht = {
  checkedAt: string
  items: ProviderOpsBoardItem[]
  writeActions: []
}

export const PROVIDER_OPS_BOARD_NAMEN: Record<ProviderOpsBoardId, string> = {
  'provider-ops': 'Provider-Ops',
  'kill-switch': 'Kill-Switch-Vertrag',
  'cost-guard': 'Cost Guard',
  'model-usage': 'Modellnutzung',
}

export const PROVIDER_OPS_BOARD_TTL_MS: Record<ProviderOpsBoardId, number> = {
  'provider-ops': 60_000,
  'kill-switch': 60_000,
  'cost-guard': 60_000,
  'model-usage': 120_000,
}

export const PROVIDER_OPS_BOARD_STATUS_LABEL: Record<ProviderOpsBoardStatus, string> = {
  available: 'Verfügbar (belegte Capability)',
  foundation_only: 'Nur Foundation',
  disabled: 'Abgeschaltet',
  not_configured: 'Nicht konfiguriert',
  unknown: 'Unbekannt',
  unavailable: 'Nicht erreichbar',
  empty: 'Keine Einträge',
}

export const FRESHNESS_LABEL: Record<FreshnessState, string> = {
  fresh: 'frisch',
  stale: 'veraltet',
  unknown: 'Alter unbekannt',
}

/** Sichtbares Grün nur bei frischer, eng belegter Capability – nie für Parent/Budget/Live. */
export function providerOpsKarteIstGruen(item: {
  id: string
  status: ProviderOpsBoardStatus
  freshness: BoardFreshness
}): boolean {
  if (item.id === 'provider-ops' || item.id === 'kill-switch' || item.id === 'cost-guard' || item.id === 'model-usage') {
    return false
  }
  return item.status === 'available' && item.freshness.state === 'fresh'
}

export function sichtbarerKartenClaim(item: Pick<ProviderOpsBoardItem, 'name' | 'status'>): string {
  return `${item.name} – ${PROVIDER_OPS_BOARD_STATUS_LABEL[item.status]}`
}

export function istUeberzogenerGesamtClaim(
  item: Pick<ProviderOpsBoardItem, 'id' | 'status'>,
): boolean {
  return (
    (item.id === 'provider-ops' || item.id === 'kill-switch' || item.id === 'cost-guard') &&
    (item.status === 'available' || item.status === 'disabled')
  )
}

export const PROVIDER_OPS_BOARD_WRITE_ACTIONS: readonly never[] = []

export const PROVIDER_OPS_BOARD_API_PFAD = '/api/admin/provider-ops'
