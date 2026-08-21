// lib/mobility/rate-limit.ts
//
// Schranke für externe Mobilitätssuchen, ohne neue Infrastruktur.
// Der Zähler lebt im Prozess. Auf Vercel gilt er je Instanz.
// Vor Production braucht es ein gespeichertes, globales Limit.
//
// Frei von Next.

export const MOBILITY_RATE_GRENZEN = {
  fensterMs: 10 * 60 * 1000,
  suchenJeFenster: 8,
  tagMs: 24 * 60 * 60 * 1000,
  suchenJeTag: 24,
} as const

type Eintrag = { fenster: number[]; tag: number[] }

const speicher = new Map<string, Eintrag>()

function jetzt(uhr?: () => number): number {
  return uhr ? uhr() : Date.now()
}

function saeubern(liste: number[], ab: number): number[] {
  return liste.filter((zeit) => zeit >= ab)
}

export function mobilitySucheErlaubt(
  kennung: string,
  uhr?: () => number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const ts = jetzt(uhr)
  const key = kennung.trim() || 'unbekannt'
  const bisher = speicher.get(key) ?? { fenster: [], tag: [] }
  const fenster = saeubern(bisher.fenster, ts - MOBILITY_RATE_GRENZEN.fensterMs)
  const tag = saeubern(bisher.tag, ts - MOBILITY_RATE_GRENZEN.tagMs)

  if (fenster.length >= MOBILITY_RATE_GRENZEN.suchenJeFenster) {
    const aelteste = fenster[0] ?? ts
    speicher.set(key, { fenster, tag })
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((aelteste + MOBILITY_RATE_GRENZEN.fensterMs - ts) / 1000)),
    }
  }
  if (tag.length >= MOBILITY_RATE_GRENZEN.suchenJeTag) {
    const aelteste = tag[0] ?? ts
    speicher.set(key, { fenster, tag })
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((aelteste + MOBILITY_RATE_GRENZEN.tagMs - ts) / 1000)),
    }
  }

  fenster.push(ts)
  tag.push(ts)
  speicher.set(key, { fenster, tag })
  return { ok: true }
}

export function mobilityRateKennungAus(headers: Headers): string {
  const weitergeleitet = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return weitergeleitet || headers.get('x-real-ip')?.trim() || 'unbekannt'
}
