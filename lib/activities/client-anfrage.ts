// lib/activities/client-anfrage.ts
//
// Browser-Aufruf der geschlossenen Aktivitätensuche.
// Die Antwort wird auf die bestehende neutrale Hülle begrenzt, bevor sie
// dargestellt oder ausgewählt werden darf. Die Domain-, Ranking- und
// Providerlogik bleibt serverseitig.
//
// Frei von Next.

import type { ActivityOptionSichtbar, ActivitySucheAntwort } from '@/lib/activities/client-sicht'
import { clientEnthaeltGeheimnis } from '@/lib/activities/client-sicht'
import {
  ACTIVITY_ABDECKUNGSHINWEIS,
  ACTIVITY_MARKEN,
  ACTIVITY_SUCHE_GRENZEN,
  LEERE_ACTIVITY_EVIDENZ,
  type ActivityEvidenz,
  type ActivityMarke,
  type ActivitySuchStatus,
} from '@/lib/activities/domain'
import { activityOptionLesen } from '@/lib/activities/schema'

const STATUS: readonly ActivitySuchStatus[] = [
  'ok',
  'partial',
  'empty',
  'unavailable',
  'timeout',
  'error',
  'invalid',
  'rate_limited',
]

const AKTIV: ReadonlySet<ActivitySuchStatus> = new Set(['ok', 'partial'])

const EVIDENZ_FELDER = [
  'hatOrt',
  'hatKoordinaten',
  'hatTag',
  'hatDatum',
  'hatBestehendePunkte',
  'hatBelastbareZeiten',
  'hatInteressen',
  'hatBudget',
] as const satisfies readonly (keyof ActivityEvidenz)[]

const STANDARD_MELDUNG: Record<ActivitySuchStatus, string> = {
  ok: 'Aktivitäten gefunden.',
  partial: 'Einige Angebote konnten nicht gelesen werden. Die übrigen Aktivitäten siehst du unten.',
  empty: 'Keine passenden Aktivitäten für diesen Reisetag gefunden.',
  unavailable: 'Passende Aktivitäten sind gerade nicht verfügbar.',
  timeout: 'Die Aktivitätensuche hat zu lange gedauert.',
  error: 'Die Aktivitätsanfrage ist fehlgeschlagen.',
  invalid: 'Die Aktivitätsangaben konnten nicht gelesen werden.',
  rate_limited: 'Bitte warte einen Moment, dann kannst du erneut suchen.',
}

export function activitySucheFehlerAntwort(message: string): ActivitySucheAntwort {
  return {
    status: 'error',
    message,
    coverageNote: ACTIVITY_ABDECKUNGSHINWEIS,
    evidenz: { ...LEERE_ACTIVITY_EVIDENZ },
    options: [],
  }
}

function meldungLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const text = wert.trim()
  if (text.length < 1 || text.length > 500) return null
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text)) return null
  return text
}

function evidenzLesen(wert: unknown): ActivityEvidenz | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  const quelle = wert as Record<string, unknown>
  const evidenz = { ...LEERE_ACTIVITY_EVIDENZ }
  for (const feld of EVIDENZ_FELDER) {
    if (typeof quelle[feld] !== 'boolean') return null
    evidenz[feld] = quelle[feld]
  }
  return evidenz
}

function labelsLesen(wert: unknown): ActivityMarke[] | null {
  if (!Array.isArray(wert) || wert.length > ACTIVITY_MARKEN.length) return null
  const labels: ActivityMarke[] = []
  for (const eintrag of wert) {
    if (typeof eintrag !== 'string' || !(ACTIVITY_MARKEN as readonly string[]).includes(eintrag)) return null
    const marke = eintrag as ActivityMarke
    if (!labels.includes(marke)) labels.push(marke)
  }
  return labels
}

function gruendeLesen(wert: unknown): string[] | null {
  if (!Array.isArray(wert) || wert.length > 4) return null
  const gruende: string[] = []
  for (const eintrag of wert) {
    if (typeof eintrag !== 'string') return null
    const text = eintrag.trim()
    if (text.length < 1 || text.length > 240) return null
    if (/[\u0000-\u001F]/.test(text)) return null
    gruende.push(text)
  }
  return gruende
}

function optionenLesen(wert: unknown): ActivityOptionSichtbar[] | null {
  if (!Array.isArray(wert) || wert.length > ACTIVITY_SUCHE_GRENZEN.angebote) return null
  const optionen: ActivityOptionSichtbar[] = []
  for (const eintrag of wert) {
    if (!eintrag || typeof eintrag !== 'object' || Array.isArray(eintrag)) return null
    if (clientEnthaeltGeheimnis(eintrag)) return null
    const kern = activityOptionLesen(eintrag)
    if (!kern) return null
    const roh = eintrag as Record<string, unknown>
    const labels = labelsLesen(roh.labels)
    const reasons = gruendeLesen(roh.reasons)
    const konflikt = roh.konflikt
    if (!labels || !reasons) return null
    if (konflikt !== 'frei' && konflikt !== 'ueberschneidung' && konflikt !== 'unbekannt') return null
    optionen.push({ ...kern, labels, reasons, konflikt })
  }
  return optionen
}

function hinweisLesen(wert: unknown): string {
  if (typeof wert !== 'string') return ACTIVITY_ABDECKUNGSHINWEIS
  const text = wert.trim()
  if (text.length < 1 || text.length > 500) return ACTIVITY_ABDECKUNGSHINWEIS
  if (/[\u0000-\u001F]/.test(text)) return ACTIVITY_ABDECKUNGSHINWEIS
  return text
}

function istStatus(wert: unknown): wert is ActivitySuchStatus {
  return typeof wert === 'string' && (STATUS as readonly string[]).includes(wert)
}

/**
 * Baut eine erlaubte Antwort. Unbekannte Felder werden nicht weitergereicht.
 * Ein nicht erfolgreicher HTTP-Status kann eine Erfolgsform nicht handlungsfähig machen.
 */
export function activitySucheAntwortLesen(wert: unknown, httpStatus: number): ActivitySucheAntwort {
  const fehler = activitySucheFehlerAntwort(STANDARD_MELDUNG.error)
  if (clientEnthaeltGeheimnis(wert)) return fehler
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return fehler
  const roh = wert as Record<string, unknown>
  if (!istStatus(roh.status)) return fehler

  const httpOk = httpStatus >= 200 && httpStatus < 300
  if (AKTIV.has(roh.status) && !httpOk) return fehler

  const meldung = meldungLesen(roh.message) ?? STANDARD_MELDUNG[roh.status]
  const coverageNote = hinweisLesen(roh.coverageNote)

  if (!AKTIV.has(roh.status)) {
    if (roh.evidenz !== undefined && evidenzLesen(roh.evidenz) === null) return fehler
    const evidenz = roh.evidenz === undefined ? { ...LEERE_ACTIVITY_EVIDENZ } : evidenzLesen(roh.evidenz)
    if (!evidenz) return fehler
    return {
      status: roh.status,
      message: meldung,
      coverageNote,
      evidenz,
      options: [],
    }
  }

  const evidenz = evidenzLesen(roh.evidenz)
  const options = optionenLesen(roh.options)
  if (!evidenz || !options) {
    return {
      status: 'invalid',
      message: STANDARD_MELDUNG.invalid,
      coverageNote: ACTIVITY_ABDECKUNGSHINWEIS,
      evidenz: { ...LEERE_ACTIVITY_EVIDENZ },
      options: [],
    }
  }
  return {
    status: roh.status,
    message: meldung,
    coverageNote,
    evidenz,
    options,
  }
}

export async function activitySucheVomClient(
  eingabe: unknown,
  optionen: { signal?: AbortSignal; fetchFn?: typeof fetch } = {},
): Promise<ActivitySucheAntwort> {
  const fetchFn = optionen.fetchFn ?? fetch
  const res = await fetchFn('/api/activities/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(eingabe),
    signal: optionen.signal,
  })
  let roh: unknown
  try {
    roh = await res.json()
  } catch (fehler: unknown) {
    if (istAbbruch(fehler)) throw fehler
    return activitySucheFehlerAntwort(STANDARD_MELDUNG.error)
  }
  return activitySucheAntwortLesen(roh, res.status)
}

function istAbbruch(fehler: unknown): boolean {
  return (
    (fehler instanceof DOMException && fehler.name === 'AbortError') ||
    (fehler instanceof Error && fehler.name === 'AbortError')
  )
}
