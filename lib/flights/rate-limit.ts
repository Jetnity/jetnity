// lib/flights/rate-limit.ts
//
// Schranke für externe Flugsuchen, ohne neue Infrastruktur.
//
// Der Zähler lebt im Prozess. Auf Vercel gilt er je Instanz – das ist bewusst
// schmaler als die Datenbankschranke des Modellwegs und reicht für Phase 3.1,
// solange die Suche in Production aus bleibt. Kein Secret, keine Reiseinhalte.
//
// Frei von Next.

export const FLUG_RATE_GRENZEN = {
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

export function flugSucheErlaubt(
  kennung: string,
  uhr?: () => number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const ts = jetzt(uhr)
  const key = kennung.trim() || 'unbekannt'
  const bisher = speicher.get(key) ?? { fenster: [], tag: [] }
  const fenster = saeubern(bisher.fenster, ts - FLUG_RATE_GRENZEN.fensterMs)
  const tag = saeubern(bisher.tag, ts - FLUG_RATE_GRENZEN.tagMs)

  if (fenster.length >= FLUG_RATE_GRENZEN.suchenJeFenster) {
    const aelteste = fenster[0] ?? ts
    speicher.set(key, { fenster, tag })
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((aelteste + FLUG_RATE_GRENZEN.fensterMs - ts) / 1000)) }
  }
  if (tag.length >= FLUG_RATE_GRENZEN.suchenJeTag) {
    const aelteste = tag[0] ?? ts
    speicher.set(key, { fenster, tag })
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((aelteste + FLUG_RATE_GRENZEN.tagMs - ts) / 1000)) }
  }

  fenster.push(ts)
  tag.push(ts)
  speicher.set(key, { fenster, tag })
  return { ok: true }
}

export function flugRateLeeren() {
  speicher.clear()
}

export function flugRateKennungAus(headers: Headers): string {
  const weitergeleitet = headers.get('x-forwarded-for')
  const erste = weitergeleitet?.split(',')[0]?.trim()
  if (erste) return `ip:${erste}`
  const real = headers.get('x-real-ip')?.trim()
  if (real) return `ip:${real}`
  return 'ip:unbekannt'
}
