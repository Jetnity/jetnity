// lib/seasonal/rate-limit.ts
//
// In-process Preview/Dev-Schutz. Kein persistentes Production-Kostenlimit.

const FENSTER_MS = 10 * 60 * 1000
const ANFRAGEN_JE_FENSTER = 20
const TAG_MS = 24 * 60 * 60 * 1000
const ANFRAGEN_JE_TAG = 80

type Zaehler = {
  fensterStart: number
  fensterAnzahl: number
  tagStart: number
  tagAnzahl: number
}

const speicher = new Map<string, Zaehler>()

export function seasonalRateKennungAus(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const erste = forwarded.split(',')[0]?.trim()
    if (erste) return erste
  }
  return headers.get('x-real-ip')?.trim() || 'unbekannt'
}

export function seasonalAnfrageErlaubt(
  kennung: string,
  jetztMs: () => number = Date.now,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const jetzt = jetztMs()
  const bisher = speicher.get(kennung)
  const stand: Zaehler = bisher ?? {
    fensterStart: jetzt,
    fensterAnzahl: 0,
    tagStart: jetzt,
    tagAnzahl: 0,
  }
  if (jetzt - stand.fensterStart >= FENSTER_MS) {
    stand.fensterStart = jetzt
    stand.fensterAnzahl = 0
  }
  if (jetzt - stand.tagStart >= TAG_MS) {
    stand.tagStart = jetzt
    stand.tagAnzahl = 0
  }
  if (stand.fensterAnzahl >= ANFRAGEN_JE_FENSTER) {
    const retryAfterSec = Math.max(1, Math.ceil((stand.fensterStart + FENSTER_MS - jetzt) / 1000))
    speicher.set(kennung, stand)
    return { ok: false, retryAfterSec }
  }
  if (stand.tagAnzahl >= ANFRAGEN_JE_TAG) {
    const retryAfterSec = Math.max(1, Math.ceil((stand.tagStart + TAG_MS - jetzt) / 1000))
    speicher.set(kennung, stand)
    return { ok: false, retryAfterSec }
  }
  stand.fensterAnzahl += 1
  stand.tagAnzahl += 1
  speicher.set(kennung, stand)
  return { ok: true }
}

export function seasonalRateLeeren() {
  speicher.clear()
}
