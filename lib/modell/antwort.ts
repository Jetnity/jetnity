// lib/modell/antwort.ts
//
// Was die Gegenseite geantwortet hat – gelesen, nicht geglaubt.
//
// Diese Datei steht bewusst neben `lib/modell/aufruf.ts` und nicht darin. Der
// Aufruf selbst ist serverseitig (`server-only`, Schlüssel, `fetch`); das Lesen
// seiner Antwort ist reine Rechnung und genau der Teil, der schiefgeht: eine
// Antwort ohne `usage`, eine mit `refusal` statt Text, eine abgeschnittene, eine
// mit dem Text hinter einem `reasoning`-Eintrag.
//
// Getrennt lässt sich jeder dieser Fälle prüfen, ohne einen Aufruf zu machen.
// Zusammen wäre er nur mit einem echten – bezahlten – Aufruf erreichbar.
//
// Frei von Next, Supabase und `process.env`.

import type { Ergebnisklasse } from '@/lib/modell/konfiguration'
import type { Tokennutzung } from '@/lib/modell/preise'

/**
 * Das Ergebnis eines Aufrufs, ohne Laufzeit.
 *
 * `nutzung` ist `null`, wenn die Antwort keine mitgeschickt hat. Das ist nach
 * dem Vertrag der API nicht vorgesehen und trotzdem kein Grund, 0 Tokens zu
 * behaupten: Der Abschluss lässt in diesem Fall die vorher gebuchte
 * Kostenreservierung stehen, statt sie auf null zu senken.
 */
export type Rohergebnis =
  | { ok: true; text: string; nutzung: Tokennutzung | null }
  | {
      ok: false
      klasse: Ergebnisklasse
      /** Für das Protokoll, nicht für die Oberfläche. Ohne Nutzertext, ohne Schlüssel. */
      hinweis: string
      nutzung: Tokennutzung | null
    }

/** Die Nutzung eines Aufrufs, so vollständig wie die Antwort sie hergibt. */
export function nutzungAus(wert: unknown): Tokennutzung | null {
  if (!wert || typeof wert !== 'object') return null
  const usage = wert as Record<string, unknown>

  const eingabe = Number(usage.input_tokens)
  const ausgabe = Number(usage.output_tokens)
  if (!Number.isFinite(eingabe) || !Number.isFinite(ausgabe)) return null

  const details = usage.input_tokens_details
  const gecacht =
    details && typeof details === 'object'
      ? Number((details as Record<string, unknown>).cached_tokens)
      : 0

  return {
    eingabeTokens: Math.max(0, Math.round(eingabe)),
    gecachteTokens: Number.isFinite(gecacht) ? Math.max(0, Math.round(gecacht)) : 0,
    ausgabeTokens: Math.max(0, Math.round(ausgabe)),
  }
}

type Inhalt = { type?: unknown; text?: unknown; refusal?: unknown }

/**
 * Sucht den Text der Antwort in `output`.
 *
 * `output` ist eine Liste, und bei einem Denkmodell steht dort vor der Nachricht
 * mindestens ein `reasoning`-Eintrag. `output[0].content[0].text` wäre deshalb
 * die häufigste Ursache für ein „die Antwort ist leer“, das keine ist.
 */
export function antwortAus(output: unknown): { text: string } | { verweigert: string } | null {
  if (!Array.isArray(output)) return null

  for (const eintrag of output) {
    if (!eintrag || typeof eintrag !== 'object') continue
    const element = eintrag as Record<string, unknown>
    if (element.type !== 'message' || !Array.isArray(element.content)) continue

    for (const rohInhalt of element.content) {
      const inhalt = (rohInhalt ?? {}) as Inhalt
      if (inhalt.type === 'refusal' && typeof inhalt.refusal === 'string') {
        return { verweigert: inhalt.refusal }
      }
      if (inhalt.type === 'output_text' && typeof inhalt.text === 'string') {
        return { text: inhalt.text }
      }
    }
  }

  return null
}

/**
 * Formt aus HTTP-Status und Antwortkörper ein Ergebnis.
 *
 * Der Antwortkörper wird nirgends in einen `hinweis` übernommen: Eine
 * Fehlermeldung der API kann die Anfrage zitieren, und die enthält den Freitext
 * des Nutzers.
 */
export function rohergebnisAus(status: number, roh: unknown): Rohergebnis {
  const daten = (roh && typeof roh === 'object' ? roh : {}) as Record<string, unknown>
  const nutzung = nutzungAus(daten.usage)

  if (status < 200 || status > 299) {
    // Ein 4xx ist ein Defekt bei uns (Schema, Modellname, Kontingent des
    // Kontos), ein 5xx ein Ausfall dort. Die Unterscheidung entscheidet, wo
    // gesucht wird.
    return {
      ok: false,
      klasse: status >= 500 ? 'anbieter-5xx' : 'anbieter-4xx',
      hinweis: `OpenAI antwortete mit HTTP ${status}.`,
      nutzung,
    }
  }

  if (daten.status === 'incomplete') {
    const details = (daten.incomplete_details ?? {}) as Record<string, unknown>
    return {
      ok: false,
      klasse: 'abgeschnitten',
      hinweis: `Die Antwort blieb unvollständig (${String(details.reason ?? 'ohne Angabe')}).`,
      nutzung,
    }
  }

  const gelesen = antwortAus(daten.output)

  if (gelesen && 'verweigert' in gelesen) {
    return {
      ok: false,
      klasse: 'verweigert',
      hinweis: 'Das Modell hat die Anfrage abgelehnt.',
      nutzung,
    }
  }

  if (!gelesen || !gelesen.text.trim()) {
    return { ok: false, klasse: 'ungueltige-antwort', hinweis: 'Die Antwort trug keinen Text.', nutzung }
  }

  return { ok: true, text: gelesen.text, nutzung }
}
