#!/usr/bin/env node
// Lokaler Development-Referenzimport über natives psql – VORBEREITUNG.
//
// Standard ist --modus plan: lokale Quelldateien lesen, filtern, Stapel
// zählen. Keine Datenbank, kein Netzwerk, kein psql.
//
// --modus schreiben-entwicklung-psql ist in diesem Stand gesperrt
// (SCHREIBEN_FREIGEGEBEN). Entsperren nur in einem eigenen, unabhängig
// reviewten Commit nach ausdrücklicher Owner-Freigabe des Schreibwegs.
//
// Ersetzt weder npm run airports:importieren noch places:importieren und
// ändert deren Verhalten nicht.

import { closeSync, openSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'

import { ortAusFlughafen } from '@/lib/places/importieren'

import { GRENZEN, ablaufen } from './ablauf'
import { sitzungStarten } from './psql'
import { flughaefenLesen, orteLesen } from './quelle'
import { FLUGHAFEN_BEISPIELE, STAPEL } from './sql'
import { ZIEL, argumenteLesen, schreibauftragPruefen, type PlanAuftrag } from './ziel'

const SCHREIBEN_FREIGEGEBEN = false as boolean

function devTtyOeffnenbar(): boolean {
  try {
    closeSync(openSync('/dev/tty', 'r'))
    return true
  } catch {
    return false
  }
}

async function planen(auftrag: PlanAuftrag): Promise<void> {
  if (!auftrag.quelleFlughaefen && !auftrag.quelleOrte) {
    throw new Error('Plan braucht --quelle-flughaefen <Verzeichnis> und/oder --quelle-orte <Verzeichnis>.')
  }
  console.log(`Plan – keine Datenbank, kein psql. Späteres Ziel wäre ausschliesslich ${ZIEL.host}.`)
  if (auftrag.quelleFlughaefen) {
    const { zeilen, verworfen, herkunft } = await flughaefenLesen(auftrag.quelleFlughaefen)
    const codes = new Set(zeilen.map((zeile) => zeile.iata))
    const fehlend = FLUGHAFEN_BEISPIELE.filter((code) => !codes.has(code))
    console.log(`Flughäfen übernommen: ${zeilen.length}, verworfen: ${verworfen}, Stapel: ${Math.ceil(zeilen.length / STAPEL)}`)
    console.log(fehlend.length ? `Pflichtcodes fehlen: ${fehlend.join(', ')}` : `Pflichtcodes vorhanden: ${FLUGHAFEN_BEISPIELE.join(', ')}`)
    const zrh = zeilen.find((zeile) => zeile.iata === 'ZRH')
    console.log(`airport:ZRH ableitbar: ${zrh && ortAusFlughafen(zrh) ? 'ja' : 'nein'}`)
    for (const eintrag of herkunft) console.log(`  ${eintrag.sha256}  ${eintrag.datei}`)
  }
  if (auftrag.quelleOrte) {
    const { orte, verworfen, herkunft } = await orteLesen(auftrag.quelleOrte)
    const japan = orte.some((ort) => ort.typ === 'country' && ort.countryCode === 'JP' && ort.name === 'Japan')
    const zuerich = orte.some((ort) => ort.typ === 'city' && ort.countryCode === 'CH' && /^Z(ü|u)rich$/.test(ort.name))
    console.log(`GeoNames-Orte übernommen: ${orte.length}, verworfen: ${verworfen} (ohne Flughafen-Orte aus der Datenbank)`)
    console.log(`Japan (Land): ${japan ? 'ja' : 'nein'}, Zürich (Stadt): ${zuerich ? 'ja' : 'nein'}`)
    for (const eintrag of herkunft) console.log(`  ${eintrag.sha256}  ${eintrag.datei}`)
  }
}

async function main(): Promise<void> {
  const auftrag = argumenteLesen(process.argv.slice(2))
  if (auftrag.modus === 'plan') {
    await planen(auftrag)
    return
  }

  if (!SCHREIBEN_FREIGEGEBEN) {
    throw new Error(
      'Abgebrochen: der psql-Schreibweg ist in diesem Stand gesperrt (R65, nur Vorbereitung). ' +
        'Kein psql gestartet, keine Verbindung.',
    )
  }

  const geprueft = schreibauftragPruefen(
    auftrag,
    Object.keys(process.env),
    {
      stdinTty: Boolean(process.stdin.isTTY),
      stdoutTty: Boolean(process.stdout.isTTY),
      stderrTty: Boolean(process.stderr.isTTY),
      devTtyOeffnenbar: devTtyOeffnenbar(),
    },
    process.cwd(),
  )

  const flughaefen = auftrag.quelleFlughaefen && auftrag.stufe !== 'orte' ? await flughaefenLesen(auftrag.quelleFlughaefen) : null
  const orte = auftrag.quelleOrte && auftrag.stufe !== 'flughaefen' ? await orteLesen(auftrag.quelleOrte) : null

  await ablaufen(
    {
      stufe: auftrag.stufe,
      flughaefen: flughaefen?.zeilen ?? null,
      geonamesOrte: orte?.orte ?? null,
      herkunft: [...(flughaefen?.herkunft ?? []), ...(orte?.herkunft ?? [])],
    },
    {
      sitzungStarten: () => sitzungStarten(geprueft.psql, geprueft.ca),
      bestaetigen: async (frage) => {
        const leser = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
        try {
          return await leser.question(frage)
        } finally {
          leser.close()
        }
      },
      ausgabe: (zeile) => console.log(zeile),
      journalPfad: geprueft.journal,
      grenzen: GRENZEN,
    },
  )
  console.log('Fertig. Journal:', geprueft.journal)
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : 'Abgebrochen.')
  process.exit(1)
})
