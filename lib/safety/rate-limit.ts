// lib/safety/rate-limit.ts
//
// Preview-/Development-Schranke ohne neue Infrastruktur.
// Vor kostenpflichtiger Production-Provideraktivierung braucht es ein
// persistentes globales Limit. Der Zähler lebt im Prozess.

const SAFETY_RATE_GRENZEN = {
  fensterMs: 10 * 60 * 1000,
  anfragenJeFenster: 20,
  tagMs: 24 * 60 * 60 * 1000,
  anfragenJeTag: 80,
} as const

type Eintrag = { fenster: number[]; tag: number[] }

const speicher = new Map<string, Eintrag>()

function jetzt(uhr?: () => number): number {
  return uhr ? uhr() : Date.now()
}

function saeubern(liste: number[], ab: number): number[] {
  return liste.filter((zeit) => zeit >= ab)
}

export function safetyAnfrageErlaubt(
  kennung: string,
  uhr?: () => number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const ts = jetzt(uhr)
  const key = kennung.trim() || 'unbekannt'
  const bisher = speicher.get(key) ?? { fenster: [], tag: [] }
  const fenster = saeubern(bisher.fenster, ts - SAFETY_RATE_GRENZEN.fensterMs)
  const tag = saeubern(bisher.tag, ts - SAFETY_RATE_GRENZEN.tagMs)

  if (fenster.length >= SAFETY_RATE_GRENZEN.anfragenJeFenster) {
    const aelteste = fenster[0] ?? ts
    speicher.set(key, { fenster, tag })
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((aelteste + SAFETY_RATE_GRENZEN.fensterMs - ts) / 1000)),
    }
  }
  if (tag.length >= SAFETY_RATE_GRENZEN.anfragenJeTag) {
    const aelteste = tag[0] ?? ts
    speicher.set(key, { fenster, tag })
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((aelteste + SAFETY_RATE_GRENZEN.tagMs - ts) / 1000)),
    }
  }

  fenster.push(ts)
  tag.push(ts)
  speicher.set(key, { fenster, tag })
  return { ok: true }
}

export function safetyRateKennungAus(headers: Headers): string {
  const weitergeleitet = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return weitergeleitet || headers.get('x-real-ip')?.trim() || 'unbekannt'
}

export function safetyRateLeeren() {
  speicher.clear()
}
