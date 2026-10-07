/** UI result only. No fetch URL, browser authority flag or automatic provider activation. */
export type ExternalKind = 'weather' | 'hours' | 'routing' | 'reservation'
export type ExternalResult = { kind: ExternalKind; state: 'unconfigured' | 'unavailable' | 'error' | 'stale' | 'conflict' | 'empty' | 'current';
  reason: string; sourceRef?: string; observedAt?: number; retrievedAt?: number; validUntil?: number;
  value?: { temperatureC?: number; precipitationMm?: number; windMetersPerSecond?: number; open?: boolean; durationMinutes?: number; confirmed?: boolean } }
export function externalDefault(kind: ExternalKind): ExternalResult { return {kind,state:'unconfigured',reason:'Keine Quelle aktiviert.'} }
