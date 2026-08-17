// lib/supabase/auth-bericht.ts
//
// Der Abgleich der Auth-Konfiguration als reine Rechnung: Sollwerte plus
// laufende Konfiguration ergeben einen Befund, und der Befund ergibt die
// Ausgabe. Kein Netz, kein Dateisystem, kein `process` – deshalb prüfbar in
// `npm test`, ohne Supabase-Zugang.
//
// Die eigentliche Aufgabe dieser Datei ist eine Trennung, die im Skript nicht
// zu sehen war: **Über welche Werte darf die Ausgabe reden?**
//
// Ein Schlüssel, den das Repository namentlich nennt, ist begutachtet – sein
// Wert steht in `supabase/config.toml` oder in `OHNE_TOML_SCHLUESSEL` und ist
// keine Zugangsdaten. Bei einem Schlüssel, den das Repository *nicht* kennt,
// weiss niemand, was darin steht; `jwt_secret` und `security_captcha_secret`
// zeigen, dass die Auth-Konfiguration Geheimnisse führt. Genau diese Schlüssel
// meldet der Abgleich aber – als „neu aufgetaucht“, in ein CI-Protokoll, das
// jeder mit Leserecht öffnen kann.
//
// Deshalb nimmt der Befund den Wert eines unbekannten Schlüssels nicht auf. Die
// Ausgabe kann ihn dann nicht verlieren, gleich in welcher Form sie erscheint.

import type { TomlTabelle } from '@/lib/supabase/config-toml'
import {
  erwarteteAuthKonfiguration,
  musterregeln,
  richtlinieStimmt,
  unklassifizierteSchluessel,
  type Erwartung,
} from '@/lib/supabase/auth-erwartung'

/** Ein genannter Schlüssel weicht ab. Werte erlaubt: beide sind begutachtet. */
export type Abweichung = {
  api: string
  erwartet: unknown
  gefunden: unknown
  quelle: string
  grund?: string
}

/**
 * Ein Schlüssel steht auf `true`, den keine Zeile des Repositories nennt.
 *
 * Ohne `gefunden`: Die Regel erwartet „aus“, also sagt die Abweichung schon
 * alles. Der Wert selbst stammt aus einem Schlüssel, den niemand begutachtet
 * hat, und gehört damit nicht in eine Ausgabe.
 */
export type Musterverstoss = {
  api: string
  regel: string
  grund: string
}

export type Befund = {
  /** Zahl der Sollwerte, die geprüft wurden. */
  geprueft: number
  /** Zahl der Schlüssel, die der Branch liefert. */
  schluessel: number
  abweichungen: Abweichung[]
  /** Erwartete Schlüssel, die die API nicht liefert – nur Namen. */
  fehlend: string[]
  verstoesse: Musterverstoss[]
  /** Schlüssel ohne Aussage im Repository – nur Namen, siehe Kopf der Datei. */
  unklassifiziert: string[]
  richtlinie: { stimmt: boolean; meldung?: string }
  sauber: boolean
}

/** Kürzt einen begutachteten Wert auf Protokolllänge. */
function kurz(wert: unknown): string {
  if (wert === undefined) return 'undefined'
  const text = typeof wert === 'string' ? wert : JSON.stringify(wert)
  if (text === undefined) return 'undefined'
  return text.length > 60 ? `${text.slice(0, 57)}…` : text
}

function vergleiche(erwartungen: Erwartung[], live: Record<string, unknown>) {
  const abweichungen: Abweichung[] = []
  const fehlend: string[] = []

  for (const e of erwartungen) {
    if (!(e.api in live)) {
      fehlend.push(e.api)
      continue
    }
    if (live[e.api] !== e.wert) {
      abweichungen.push({
        api: e.api,
        erwartet: e.wert,
        gefunden: live[e.api],
        quelle: e.quelle,
        grund: e.grund,
      })
    }
  }

  return { abweichungen, fehlend }
}

function musterVerstoesse(live: Record<string, unknown>, erwartungen: Erwartung[]): Musterverstoss[] {
  const genannt = new Set(erwartungen.map((e) => e.api))
  const verstoesse: Musterverstoss[] = []

  for (const regel of musterregeln()) {
    for (const [api, wert] of Object.entries(live)) {
      if (genannt.has(api)) continue
      if (!regel.muster.test(api)) continue
      if (wert !== regel.erwartet) {
        verstoesse.push({ api, regel: regel.name, grund: regel.grund })
      }
    }
  }

  return verstoesse
}

/**
 * Vergleicht die Sollwerte aus `config.toml` mit der laufenden Konfiguration.
 *
 * Vier Fragen, und die letzte stellt eine reine Aufzählung nicht:
 *
 *   1. Stimmt jeder Wert, den `config.toml` nennt?
 *   2. Stimmt jeder Wert, den `config.toml` nicht ausdrücken kann?
 *   3. Ist etwas eingeschaltet, das niemand eingeschaltet hat?
 *   4. Gibt es einen Schlüssel, über den das Repository überhaupt nichts sagt?
 */
export function befund(config: TomlTabelle, live: Record<string, unknown>): Befund {
  const erwartungen = erwarteteAuthKonfiguration(config)

  const { abweichungen, fehlend } = vergleiche(erwartungen, live)
  const verstoesse = musterVerstoesse(live, erwartungen)
  const unklassifiziert = unklassifizierteSchluessel(Object.keys(live), erwartungen)
  const richtlinie = richtlinieStimmt(config)

  return {
    geprueft: erwartungen.length,
    schluessel: Object.keys(live).length,
    abweichungen,
    fehlend,
    verstoesse,
    unklassifiziert,
    richtlinie,
    sauber:
      abweichungen.length === 0 &&
      fehlend.length === 0 &&
      verstoesse.length === 0 &&
      unklassifiziert.length === 0 &&
      richtlinie.stimmt,
  }
}

/** Der Befund als Text, wie ihn `npm run auth:pruefen` schreibt. */
export function bericht(b: Befund): string {
  const zeilen: string[] = [
    `Auth-Konfiguration geprüft: ${b.geprueft} Werte, ${b.schluessel} Schlüssel am Branch.`,
    '',
  ]

  if (b.abweichungen.length === 0) {
    zeilen.push(`  ✓ alle ${b.geprueft} erwarteten Werte stimmen`)
  } else {
    zeilen.push(`  ✗ ${b.abweichungen.length} Abweichung(en):`)
    for (const a of b.abweichungen) {
      zeilen.push(`      ${a.api}`)
      zeilen.push(`        erwartet: ${kurz(a.erwartet)}`)
      zeilen.push(`        gefunden: ${kurz(a.gefunden)}`)
      zeilen.push(`        Quelle:   ${a.quelle}`)
      if (a.grund) zeilen.push(`        Grund:    ${a.grund}`)
    }
  }

  if (b.fehlend.length > 0) {
    zeilen.push('', `  ✗ ${b.fehlend.length} erwarteter Schlüssel fehlt in der Antwort der API:`)
    for (const f of b.fehlend) zeilen.push(`      ${f}`)
  }

  if (b.verstoesse.length === 0) {
    zeilen.push('  ✓ kein Anmeldedienst und kein Hook eingeschaltet, den config.toml nicht nennt')
  } else {
    zeilen.push('', `  ✗ ${b.verstoesse.length} unerwartet eingeschaltet:`)
    for (const v of b.verstoesse) {
      zeilen.push(`      ${v.api}  (${v.regel})`)
      zeilen.push(`        ${v.grund}`)
    }
  }

  if (b.unklassifiziert.length === 0) {
    zeilen.push('  ✓ jeder Schlüssel der API ist im Repository eingeordnet')
  } else {
    zeilen.push('', `  ✗ ${b.unklassifiziert.length} Schlüssel ohne Aussage im Repository:`)
    for (const u of b.unklassifiziert) zeilen.push(`      ${u}`)
    zeilen.push(
      '    Nur die Namen – was in einem unbekannten Schlüssel steht, weiss niemand.',
      '    Einordnen in lib/supabase/auth-erwartung.ts – als Erwartung oder mit Grund unter NICHT_GEPRUEFT.',
    )
  }

  if (b.richtlinie.stimmt) {
    zeilen.push('  ✓ die Passwortregel der Formulare entspricht config.toml')
  } else {
    zeilen.push('', `  ✗ Passwortregel weicht ab: ${b.richtlinie.meldung}`)
  }

  return zeilen.join('\n')
}

/** Derselbe Befund als JSON, für Weiterverarbeitung. */
export function alsJson(b: Befund): string {
  return JSON.stringify(b, null, 2)
}
