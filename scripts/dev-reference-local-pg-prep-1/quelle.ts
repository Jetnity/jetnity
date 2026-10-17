// scripts/dev-reference-local-pg-prep-1/quelle.ts
//
// Liest lokal bereitgelegte Quelldateien. Kein Netzwerk.
// Parsing und Filter kommen unverändert aus lib/airports/importieren und
// lib/places/importieren. Der GeoNames-Weg filtert wie der Download-Pfad
// des Originals schon beim Streamen mit geoNamesZeileRelevant.

import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createReadStream, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import type { Readable } from 'node:stream'

import { flughaefenAusOurAirports, type FlughafenImportZeile } from '@/lib/airports/importieren'
import type { Ort } from '@/lib/places/domain'
import {
  geoNamesTsvZeile,
  geoNamesZeileRelevant,
  laenderAusCountryInfo,
  orteAusGeoNames,
  type GeoNamesZeile,
} from '@/lib/places/importieren'

export type Herkunft = { datei: string; sha256: string }

async function pruefsumme(pfad: string): Promise<string> {
  const hash = createHash('sha256')
  for await (const teil of createReadStream(pfad)) hash.update(teil as Buffer)
  return hash.digest('hex')
}

export async function flughaefenLesen(verzeichnis: string): Promise<{
  zeilen: FlughafenImportZeile[]
  verworfen: number
  herkunft: Herkunft[]
}> {
  const namen = ['airports.csv', 'countries.csv', 'regions.csv'] as const
  const pfade = namen.map((name) => join(verzeichnis, name))
  for (const pfad of pfade) {
    if (!existsSync(pfad)) throw new Error(`Abgebrochen: Quelldatei fehlt: ${pfad}`)
  }
  const [airportsCsv, countriesCsv, regionsCsv] = pfade.map((pfad) => readFileSync(pfad, 'utf8'))
  const { zeilen, verworfen } = flughaefenAusOurAirports({
    airportsCsv: airportsCsv ?? '',
    countriesCsv: countriesCsv ?? '',
    regionsCsv: regionsCsv ?? '',
  })
  const herkunft = await Promise.all(pfade.map(async (datei) => ({ datei, sha256: await pruefsumme(datei) })))
  return { zeilen, verworfen, herkunft }
}

async function relevanteZeilen(strom: Readable): Promise<GeoNamesZeile[]> {
  const zeilen: GeoNamesZeile[] = []
  for await (const zeile of createInterface({ input: strom, crlfDelay: Infinity })) {
    const gelesen = geoNamesTsvZeile(zeile)
    if (gelesen && geoNamesZeileRelevant(gelesen)) zeilen.push(gelesen)
  }
  return zeilen
}

async function ausZip(zipPfad: string): Promise<GeoNamesZeile[]> {
  const kind = spawn('unzip', ['-p', zipPfad, 'allCountries.txt'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
  })
  const code = new Promise<number | null>((resolve, reject) => {
    kind.on('error', reject)
    kind.on('close', resolve)
  })
  const zeilen = await relevanteZeilen(kind.stdout)
  if ((await code) !== 0) throw new Error('Abgebrochen: allCountries.zip konnte nicht gelesen werden.')
  return zeilen
}

export async function orteLesen(verzeichnis: string): Promise<{
  orte: Ort[]
  verworfen: number
  herkunft: Herkunft[]
}> {
  const landPfad = join(verzeichnis, 'countryInfo.txt')
  const zipPfad = join(verzeichnis, 'allCountries.zip')
  const txtPfad = join(verzeichnis, 'allCountries.txt')
  if (!existsSync(landPfad)) throw new Error(`Abgebrochen: Quelldatei fehlt: ${landPfad}`)
  const zip = existsSync(zipPfad)
  const txt = existsSync(txtPfad)
  if (zip === txt) {
    throw new Error('Abgebrochen: genau eine von allCountries.zip oder allCountries.txt muss vorliegen.')
  }
  const quelle = zip ? zipPfad : txtPfad
  const zeilen = zip ? await ausZip(zipPfad) : await relevanteZeilen(createReadStream(txtPfad))
  const laender = laenderAusCountryInfo(readFileSync(landPfad, 'utf8'))
  const { orte, verworfen } = orteAusGeoNames({ zeilen, laender })
  const herkunft = await Promise.all(
    [landPfad, quelle].map(async (datei) => ({ datei, sha256: await pruefsumme(datei) })),
  )
  return { orte, verworfen, herkunft }
}
