// scripts/auth/pruefen.ts
//
// Vergleicht die Auth-Konfiguration des Development-Branches mit dem, was das
// Repository über sie sagt.
//
// Phase 1.4 hat für das Schema beendet, was hier für die Auth-Ebene nachgeholt
// wird: Ein Zustand, den niemand aus dem Repository ableiten kann, ist kein
// Zustand, auf den man sich verlassen kann. `supabase/config.toml` beschreibt
// jetzt den Branch – diese Prüfung sagt, ob die Beschreibung noch stimmt.
//
// Aufruf:
//   npm run auth:pruefen
//   npm run auth:pruefen -- --json
//
// Der Lauf endet mit Code 1, sobald etwas auseinanderläuft. Vier Fragen werden
// gestellt, und die letzte ist die, die eine reine Aufzählung nicht stellt:
//
//   1. Stimmt jeder Wert, den `config.toml` nennt?
//   2. Stimmt jeder Wert, den `config.toml` nicht ausdrücken kann?
//   3. Ist etwas eingeschaltet, das niemand eingeschaltet hat?
//   4. Gibt es einen Schlüssel, über den das Repository überhaupt nichts sagt?

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { leseToml } from '@/lib/supabase/config-toml'
import {
  erwarteteAuthKonfiguration,
  musterregeln,
  richtlinieStimmt,
  unklassifizierteSchluessel,
  type Erwartung,
} from '@/lib/supabase/auth-erwartung'

import { authKonfiguration, ziel } from './ziel'

const CONFIG = join(process.cwd(), 'supabase', 'config.toml')

type Abweichung = {
  api: string
  erwartet: unknown
  gefunden: unknown
  quelle: string
  grund?: string
}

function kurz(wert: unknown): string {
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

function musterVerstoesse(live: Record<string, unknown>, erwartungen: Erwartung[]) {
  const genannt = new Set(erwartungen.map((e) => e.api))
  const verstoesse: { api: string; regel: string; gefunden: unknown; grund: string }[] = []

  for (const regel of musterregeln()) {
    for (const [api, wert] of Object.entries(live)) {
      if (genannt.has(api)) continue
      if (!regel.muster.test(api)) continue
      if (wert !== regel.erwartet) {
        verstoesse.push({ api, regel: regel.name, gefunden: wert, grund: regel.grund })
      }
    }
  }

  return verstoesse
}

async function main() {
  const config = leseToml(readFileSync(CONFIG, 'utf8'))
  const erwartungen = erwarteteAuthKonfiguration(config)

  const z = await ziel()
  const live = await authKonfiguration(z)

  const { abweichungen, fehlend } = vergleiche(erwartungen, live)
  const verstoesse = musterVerstoesse(live, erwartungen)
  const unklassifiziert = unklassifizierteSchluessel(Object.keys(live), erwartungen)
  const richtlinie = richtlinieStimmt(config)

  if (process.argv.includes('--json')) {
    process.stdout.write(
      JSON.stringify({ abweichungen, fehlend, verstoesse, unklassifiziert, richtlinie }, null, 2) + '\n',
    )
  } else {
    console.log(`Auth-Konfiguration geprüft: ${erwartungen.length} Werte, ${Object.keys(live).length} Schlüssel am Branch.\n`)

    if (abweichungen.length === 0) {
      console.log(`  ✓ alle ${erwartungen.length} erwarteten Werte stimmen`)
    } else {
      console.log(`  ✗ ${abweichungen.length} Abweichung(en):`)
      for (const a of abweichungen) {
        console.log(`      ${a.api}`)
        console.log(`        erwartet: ${kurz(a.erwartet)}`)
        console.log(`        gefunden: ${kurz(a.gefunden)}`)
        console.log(`        Quelle:   ${a.quelle}`)
        if (a.grund) console.log(`        Grund:    ${a.grund}`)
      }
    }

    if (fehlend.length > 0) {
      console.log(`\n  ✗ ${fehlend.length} erwarteter Schlüssel fehlt in der Antwort der API:`)
      for (const f of fehlend) console.log(`      ${f}`)
    }

    if (verstoesse.length === 0) {
      console.log('  ✓ kein Anmeldedienst und kein Hook eingeschaltet, den config.toml nicht nennt')
    } else {
      console.log(`\n  ✗ ${verstoesse.length} unerwartet eingeschaltet:`)
      for (const v of verstoesse) {
        console.log(`      ${v.api} = ${kurz(v.gefunden)}  (${v.regel})`)
        console.log(`        ${v.grund}`)
      }
    }

    if (unklassifiziert.length === 0) {
      console.log('  ✓ jeder Schlüssel der API ist im Repository eingeordnet')
    } else {
      console.log(`\n  ✗ ${unklassifiziert.length} Schlüssel ohne Aussage im Repository:`)
      for (const u of unklassifiziert) console.log(`      ${u} = ${kurz(live[u])}`)
      console.log('    Einordnen in lib/supabase/auth-erwartung.ts – als Erwartung oder mit Grund unter NICHT_GEPRUEFT.')
    }

    if (richtlinie.stimmt) {
      console.log('  ✓ die Passwortregel der Formulare entspricht config.toml')
    } else {
      console.log(`\n  ✗ Passwortregel weicht ab: ${richtlinie.meldung}`)
    }
  }

  const sauber =
    abweichungen.length === 0 &&
    fehlend.length === 0 &&
    verstoesse.length === 0 &&
    unklassifiziert.length === 0 &&
    richtlinie.stimmt

  if (!sauber) process.exit(1)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
