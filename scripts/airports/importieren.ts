#!/usr/bin/env node
// Kontrollierter Airport-Import nach public.airports.
//
// Standard ist Probe: Quelle lesen, validieren, zählen, nichts schreiben.
// Schreiben braucht --schreiben und --entwicklung. ziel() bricht ab, sobald
// SUPABASE_PROJECT_REF auf ein eigenständiges Projekt (Production) zeigt.
//
// Nicht in der CI, nicht im prebuild, nicht bei einer Nutzersuche.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { flughaefenAusOurAirports, type FlughafenImportZeile } from '@/lib/airports/importieren'

import { ziel } from '../auth/ziel'
import { runSql } from '../db/sql.mjs'

const QUELLE = 'https://raw.githubusercontent.com/davidmegginson/ourairports-data/main'
const DATEIEN = ['airports.csv', 'countries.csv', 'regions.csv'] as const
const STAPEL = 150
const BEISPIELE = ['ZRH', 'GVA', 'BSL', 'LHR', 'LGW', 'JFK', 'EWR', 'DXB', 'BKK', 'HND', 'NRT']

function argument(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}

function sqlText(wert: string | null): string {
  if (wert === null) return 'null'
  return `'${wert.replaceAll("'", "''")}'`
}

function sqlZahl(wert: number | null): string {
  if (wert === null || !Number.isFinite(wert)) return 'null'
  return String(wert)
}

function werte(zeile: FlughafenImportZeile): string {
  return [
    sqlText(zeile.iata),
    sqlText(zeile.icao),
    sqlText(zeile.name),
    sqlText(zeile.city),
    sqlText(zeile.region),
    sqlText(zeile.country),
    sqlText(zeile.countryCode),
    sqlZahl(zeile.lat),
    sqlZahl(zeile.lon),
    sqlText(zeile.keywords),
    sqlText(zeile.klasse),
    'now()',
  ].join(', ')
}

async function herunterladen(name: (typeof DATEIEN)[number]): Promise<string> {
  const res = await fetch(`${QUELLE}/${name}`, {
    headers: { accept: 'text/csv,text/plain;q=0.9,*/*;q=0.1' },
    signal: AbortSignal.timeout(90_000),
  })
  if (!res.ok) throw new Error(`${name} nicht lesbar (HTTP ${res.status}).`)
  const text = await res.text()
  if (!text.includes(',') || text.length < 80) {
    throw new Error(`${name} ist keine brauchbare CSV.`)
  }
  return text
}

async function quelleLesen(): Promise<{
  airportsCsv: string
  countriesCsv: string
  regionsCsv: string
  herkunft: string
}> {
  const verzeichnis = argument('datei')
  if (verzeichnis) {
    const lesen = (name: string) => readFileSync(join(verzeichnis, name), 'utf8')
    return {
      airportsCsv: lesen('airports.csv'),
      countriesCsv: lesen('countries.csv'),
      regionsCsv: lesen('regions.csv'),
      herkunft: verzeichnis,
    }
  }

  const [airportsCsv, countriesCsv, regionsCsv] = await Promise.all(DATEIEN.map(herunterladen))
  return { airportsCsv, countriesCsv, regionsCsv, herkunft: QUELLE }
}

async function anzahl(): Promise<number> {
  const zeilen = (await runSql('select count(*)::int as n from public.airports')) as { n: number }[]
  return zeilen[0]?.n ?? 0
}

async function beispiele(): Promise<{ iata: string; name: string; city: string | null }[]> {
  const liste = BEISPIELE.map((code) => sqlText(code)).join(', ')
  return (await runSql(
    `select iata, name, city from public.airports where iata in (${liste}) order by iata`,
  )) as { iata: string; name: string; city: string | null }[]
}

async function stapelSchreiben(zeilen: FlughafenImportZeile[]): Promise<void> {
  const iatas = zeilen.map((zeile) => sqlText(zeile.iata)).join(', ')
  const icaos = zeilen
    .map((zeile) => zeile.icao)
    .filter((code): code is string => Boolean(code))
    .map(sqlText)
    .join(', ')

  if (icaos) {
    await runSql(
      `update public.airports
          set icao = null
        where icao in (${icaos})
          and iata not in (${iatas})`,
    )
  }

  const werteListe = zeilen.map((zeile) => `(${werte(zeile)})`).join(',\n')
  await runSql(
    `insert into public.airports
        (iata, icao, name, city, region, country, country_code, lat, lon, keywords, klasse, updated_at)
     values
        ${werteListe}
     on conflict (iata) do update set
        icao = excluded.icao,
        name = excluded.name,
        city = excluded.city,
        region = excluded.region,
        country = excluded.country,
        country_code = excluded.country_code,
        lat = excluded.lat,
        lon = excluded.lon,
        keywords = excluded.keywords,
        klasse = excluded.klasse,
        updated_at = now()`,
  )
}

async function bereinigen(zeilen: FlughafenImportZeile[]): Promise<number> {
  const werteListe = zeilen.map((zeile) => `(${sqlText(zeile.iata)})`).join(', ')
  const geloescht = (await runSql(
    `with behalten as (values ${werteListe})
     delete from public.airports a
      where a.iata is null
         or not exists (select 1 from behalten b(iata) where b.iata = a.iata)
     returning a.iata`,
  )) as { iata: string | null }[]
  return geloescht.length
}

async function main() {
  const schreiben = process.argv.includes('--schreiben')
  const entwicklung = process.argv.includes('--entwicklung')
  const sollBereinigen = process.argv.includes('--bereinigen')

  if (schreiben && !entwicklung) {
    throw new Error(
      'Schreiben braucht --schreiben und --entwicklung. Ohne beides bleibt der Lauf eine Probe.',
    )
  }

  const quelle = await quelleLesen()
  const { zeilen, verworfen } = flughaefenAusOurAirports(quelle)
  const codes = new Set(zeilen.map((zeile) => zeile.iata))
  const fehlend = BEISPIELE.filter((code) => !codes.has(code))

  console.log(`Quelle: ${quelle.herkunft}`)
  console.log(`Übernommen: ${zeilen.length}`)
  console.log(`Verworfen: ${verworfen}`)
  if (fehlend.length > 0) {
    throw new Error(`Pflichtcodes fehlen nach dem Filter: ${fehlend.join(', ')}`)
  }
  console.log(`Pflichtcodes vorhanden: ${BEISPIELE.join(', ')}`)

  if (!schreiben) {
    console.log('Probe – nichts geschrieben. Zum Schreiben: --schreiben --entwicklung')
    return
  }

  await ziel()
  const vorher = await anzahl()
  console.log(`Bestand vorher: ${vorher}`)

  for (let i = 0; i < zeilen.length; i += STAPEL) {
    const stueck = zeilen.slice(i, i + STAPEL)
    await stapelSchreiben(stueck)
    process.stdout.write(`  geschrieben ${Math.min(i + STAPEL, zeilen.length)}/${zeilen.length}\n`)
  }

  if (sollBereinigen) {
    const entfernt = await bereinigen(zeilen)
    console.log(`Bereinigt: ${entfernt}`)
  }

  const nachher = await anzahl()
  const getroffen = await beispiele()
  console.log(`Bestand nachher: ${nachher}`)
  for (const zeile of getroffen) {
    console.log(`  ${zeile.iata}  ${zeile.name}${zeile.city ? `, ${zeile.city}` : ''}`)
  }
  if (getroffen.length !== BEISPIELE.length) {
    const da = new Set(getroffen.map((zeile) => zeile.iata))
    throw new Error(`Nach dem Schreiben fehlen: ${BEISPIELE.filter((code) => !da.has(code)).join(', ')}`)
  }
}

main().catch((err: unknown) => {
  const meldung = err instanceof Error ? err.message : 'Import fehlgeschlagen.'
  console.error(meldung)
  process.exit(1)
})
