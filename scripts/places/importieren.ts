#!/usr/bin/env node
// Kontrollierter Ortsimport nach public.places.
//
// Standard ist Probe. Schreiben braucht --schreiben und --entwicklung.
// ziel() bricht ab, sobald SUPABASE_PROJECT_REF auf Production zeigt.
// Nicht in der CI, nicht im prebuild, nicht bei einer Nutzersuche.

import { readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { pipeline } from 'node:stream/promises'
import { createWriteStream } from 'node:fs'

import { type Ort } from '@/lib/places/domain'
import {
  geoNamesTsvZeile,
  geoNamesZeileRelevant,
  laenderAusCountryInfo,
  ortAusFlughafen,
  orteAusGeoNames,
  type GeoNamesZeile,
} from '@/lib/places/importieren'

import { ziel } from '../auth/ziel'
import { runSql } from '../db/sql.mjs'

const QUELLE = 'https://download.geonames.org/export/dump'
const STAPEL = 150
const BEISPIELE = ['Bali', 'Thailand', 'Tuscany', 'New York', 'Japan', 'Zürich', 'Zurich']

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

function werte(ort: Ort): string {
  return [
    sqlText(ort.id),
    sqlText(ort.source),
    sqlText(ort.sourceId),
    sqlText(ort.name),
    sqlText(ort.typ),
    sqlText(ort.country),
    sqlText(ort.countryCode),
    sqlText(ort.region),
    sqlZahl(ort.lat),
    sqlZahl(ort.lon),
    sqlText(ort.iata),
    sqlText(ort.keywords),
    'now()',
  ].join(', ')
}

async function herunterladen(name: string, zielPfad: string): Promise<void> {
  const res = await fetch(`${QUELLE}/${name}`, {
    headers: { accept: 'application/zip,text/plain;q=0.9,*/*;q=0.1' },
    signal: AbortSignal.timeout(180_000),
  })
  if (!res.ok || !res.body) throw new Error(`${name} nicht lesbar (HTTP ${res.status}).`)
  await pipeline(res.body as unknown as NodeJS.ReadableStream, createWriteStream(zielPfad))
}

async function geoNamesZeilen(zipPfad: string): Promise<GeoNamesZeile[]> {
  const kind = spawn('unzip', ['-p', zipPfad, 'allCountries.txt'], { stdio: ['ignore', 'pipe', 'pipe'] })
  if (!kind.stdout) throw new Error('unzip lieferte keinen Strom.')
  const zeilen: GeoNamesZeile[] = []
  const leser = createInterface({ input: kind.stdout })
  for await (const zeile of leser) {
    const gelesen = geoNamesTsvZeile(zeile)
    if (gelesen && geoNamesZeileRelevant(gelesen)) zeilen.push(gelesen)
  }
  const code = await new Promise<number>((resolve, reject) => {
    kind.on('error', reject)
    kind.on('close', resolve)
  })
  if (code !== 0) throw new Error('allCountries.zip konnte nicht gelesen werden.')
  return zeilen
}

async function quelleLesen(): Promise<{ orte: Ort[]; verworfen: number; herkunft: string }> {
  const verzeichnis = argument('datei')
  if (verzeichnis) {
    const tsv = readFileSync(join(verzeichnis, 'geonames.tsv'), 'utf8')
    const zeilen = tsv
      .split(/\r?\n/)
      .map(geoNamesTsvZeile)
      .filter((zeile): zeile is GeoNamesZeile => Boolean(zeile))
    const laender = laenderAusCountryInfo(readFileSync(join(verzeichnis, 'countries.txt'), 'utf8'))
    const { orte, verworfen } = orteAusGeoNames({ zeilen, laender })
    return { orte, verworfen, herkunft: verzeichnis }
  }

  const landPfad = join(tmpdir(), 'geonames-countryInfo.txt')
  const zipPfad = join(tmpdir(), 'geonames-allCountries.zip')
  await herunterladen('countryInfo.txt', landPfad)
  await herunterladen('allCountries.zip', zipPfad)
  const laender = laenderAusCountryInfo(readFileSync(landPfad, 'utf8'))
  const zeilen = await geoNamesZeilen(zipPfad)
  const { orte, verworfen } = orteAusGeoNames({ zeilen, laender })
  return { orte, verworfen, herkunft: QUELLE }
}

async function flughaefenHolen(): Promise<Ort[]> {
  const zeilen = (await runSql(`
    select iata, name, city, region, country, country_code as "countryCode",
           lat, lon, keywords
      from public.airports
     where iata is not null
  `)) as Parameters<typeof ortAusFlughafen>[0][]
  return zeilen.map(ortAusFlughafen).filter((ort): ort is Ort => Boolean(ort))
}

async function anzahl(): Promise<number> {
  const zeilen = (await runSql('select count(*)::int as n from public.places')) as { n: number }[]
  return zeilen[0]?.n ?? 0
}

async function stapelSchreiben(orte: Ort[]): Promise<void> {
  const werteListe = orte.map((ort) => `(${werte(ort)})`).join(',\n')
  await runSql(
    `insert into public.places
        (id, source, source_id, name, typ, country, country_code, region, lat, lon, iata, keywords, updated_at)
     values
        ${werteListe}
     on conflict (id) do update set
        source = excluded.source,
        source_id = excluded.source_id,
        name = excluded.name,
        typ = excluded.typ,
        country = excluded.country,
        country_code = excluded.country_code,
        region = excluded.region,
        lat = excluded.lat,
        lon = excluded.lon,
        iata = excluded.iata,
        keywords = excluded.keywords,
        updated_at = now()`,
  )
}

async function main() {
  const schreiben = process.argv.includes('--schreiben')
  const entwicklung = process.argv.includes('--entwicklung')

  if (schreiben && !entwicklung) {
    throw new Error('Schreiben braucht --schreiben und --entwicklung.')
  }

  const quelle = await quelleLesen()
  let orte = quelle.orte

  if (schreiben) {
    await ziel()
    const fluege = await flughaefenHolen()
    const ids = new Set(orte.map((ort) => ort.id))
    orte = [...orte, ...fluege.filter((ort) => !ids.has(ort.id))]
  }

  console.log(`Quelle: ${quelle.herkunft}`)
  console.log(`Übernommen: ${orte.length}`)
  console.log(`Verworfen: ${quelle.verworfen}`)

  if (!schreiben) {
    console.log('Probe – nichts geschrieben. Zum Schreiben: --schreiben --entwicklung')
    return
  }

  const vorher = await anzahl()
  console.log(`Bestand vorher: ${vorher}`)

  for (let i = 0; i < orte.length; i += STAPEL) {
    await stapelSchreiben(orte.slice(i, i + STAPEL))
    process.stdout.write(`  geschrieben ${Math.min(i + STAPEL, orte.length)}/${orte.length}\n`)
  }

  const nachher = await anzahl()
  console.log(`Bestand nachher: ${nachher}`)
  const beispiele = (await runSql(
    `select name, typ, country from public.places
      where name in (${BEISPIELE.map(sqlText).join(', ')})
         or keywords ilike '%Südtirol%'
         or iata = 'ZRH'
      order by name`,
  )) as { name: string; typ: string; country: string | null }[]
  for (const zeile of beispiele.slice(0, 20)) {
    console.log(`  ${zeile.typ.padEnd(8)} ${zeile.name}${zeile.country ? `, ${zeile.country}` : ''}`)
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : 'Import fehlgeschlagen.')
  process.exit(1)
})
