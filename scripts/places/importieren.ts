#!/usr/bin/env node
// Kontrollierter Ortsimport nach public.places.
//
// Standard ist Probe. Development: --schreiben --entwicklung.
// Production nur mit --schreiben --produktion --projekt-ref <exakter Ref>.
// Nicht in der CI, nicht im prebuild, nicht bei einer Nutzersuche.

import { readFileSync, existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
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
  verwaltungAusGeoNames,
} from '@/lib/places/importieren'

import { importAuftragLesen } from '@/lib/rollout/schreibauftrag'
import { zielFuerAuftrag } from '../auth/ziel'
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
    sqlZahl(ort.population ?? null),
    sqlText(ort.featureCode ?? null),
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

type QuellZeilen = { zeilen: GeoNamesZeile[]; gesamt: number; ungueltig: number; ausgefiltert: number }

async function geoNamesZeilen(zipPfad: string, landIds: Set<string>): Promise<QuellZeilen> {
  const kind = spawn('unzip', ['-p', zipPfad, 'allCountries.txt'], { stdio: ['ignore', 'pipe', 'ignore'] })
  // Listener vor dem Lesen: auch ein sehr kurzer/defekter Stream darf nicht hängen.
  const ende = new Promise<number | null>((resolve, reject) => {
    kind.on('error', reject)
    kind.on('close', resolve)
  })
  if (!kind.stdout) throw new Error('unzip lieferte keinen Strom.')
  const quelle: QuellZeilen = { zeilen: [], gesamt: 0, ungueltig: 0, ausgefiltert: 0 }
  for await (const zeile of createInterface({ input: kind.stdout })) {
    if (!zeile.trim()) continue
    quelle.gesamt += 1
    const gelesen = geoNamesTsvZeile(zeile)
    if (!gelesen) quelle.ungueltig += 1
    else if (!landIds.has(gelesen.geonameId) && !geoNamesZeileRelevant(gelesen)) quelle.ausgefiltert += 1
    else quelle.zeilen.push(gelesen)
  }
  if (await ende !== 0) throw new Error('allCountries.zip konnte nicht gelesen werden.')
  return quelle
}

async function quelleLesen() {
  const fixture = argument('datei')
  const lokal = argument('quelle-verzeichnis')
  const verzeichnis = fixture ?? lokal ?? mkdtempSync(join(tmpdir(), 'jetnity-geonames-'))
  try {
    if (!fixture && !lokal) {
      for (const name of ['countryInfo.txt', 'allCountries.zip', 'admin1CodesASCII.txt', 'admin2Codes.txt']) {
        await herunterladen(name, join(verzeichnis, name))
      }
    }
    const laender = laenderAusCountryInfo(readFileSync(join(verzeichnis, fixture ? 'countries.txt' : 'countryInfo.txt'), 'utf8'))
    const landIds = new Set(laender.flatMap((land) => land.geonameId ? [land.geonameId] : []))
    if (!fixture && landIds.size < 200) throw new Error('Die offizielle Länderreferenz ist unvollständig.')
    let quelle: QuellZeilen
    if (fixture) {
      const roh = readFileSync(join(fixture, 'geonames.tsv'), 'utf8').split(/\r?\n/).filter((z) => z.trim())
      const gelesen = roh.map(geoNamesTsvZeile)
      quelle = { zeilen: gelesen.filter((z): z is GeoNamesZeile => Boolean(z)), gesamt: roh.length, ungueltig: gelesen.filter((z) => !z).length, ausgefiltert: 0 }
    } else {
      quelle = await geoNamesZeilen(join(verzeichnis, 'allCountries.zip'), landIds)
    }
    const verwaltung = (name: string) => {
      const pfad = join(verzeichnis, name)
      // Kleine bestehende Fixtures dürfen ohne Verwaltungsdateien auskommen.
      if (fixture && !existsSync(pfad)) return []
      return verwaltungAusGeoNames(readFileSync(pfad, 'utf8'))
    }
    const ergebnis = orteAusGeoNames({
      zeilen: quelle.zeilen,
      laender,
      admin1: verwaltung('admin1CodesASCII.txt'),
      admin2: verwaltung('admin2Codes.txt'),
    })
    const importLandIds = new Set(ergebnis.orte.filter((ort) => ort.typ === 'country').map((ort) => ort.sourceId))
    const fehlendeLaender = laender.filter((land) => land.geonameId && !importLandIds.has(land.geonameId) && !ergebnis.historischeLandIds.includes(land.geonameId)).map((land) => land.code)
    if (fehlendeLaender.length) throw new Error(`Länderreferenz unvollständig: ${fehlendeLaender.join(', ')}`)
    return { ...ergebnis, laenderGeprueft: landIds.size, gesamt: quelle.gesamt, verworfen: ergebnis.verworfen + quelle.ungueltig + quelle.ausgefiltert, ungueltig: quelle.ungueltig, herkunft: fixture ?? lokal ?? QUELLE }
  } finally {
    if (!fixture && !lokal) rmSync(verzeichnis, { recursive: true, force: true })
  }
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
        (id, source, source_id, name, typ, country, country_code, region, lat, lon, iata, keywords, population, feature_code, updated_at)
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
        population = excluded.population,
        feature_code = excluded.feature_code,
        updated_at = now()`,
  )
}

async function main() {
  const auftrag = importAuftragLesen(process.argv)
  const schreiben = auftrag.modus !== 'probe'

  if (argument('export') && schreiben) throw new Error('--export ist nur für die Probe vorgesehen.')
  const quelle = await quelleLesen()
  let orte = quelle.orte

  if (schreiben) {
    await zielFuerAuftrag(auftrag)
    console.log(`Ziel: ${auftrag.modus}`)
    const fluege = await flughaefenHolen()
    const ids = new Set(orte.map((ort) => ort.id))
    orte = [...orte, ...fluege.filter((ort) => !ids.has(ort.id))]
  }

  console.log(`Quelle: ${quelle.herkunft}`)
  console.log(`Offizielle Länderidentitäten vollständig geprüft: ${quelle.laenderGeprueft}; historische Einträge ausgeschlossen: ${quelle.historischeLandIds.length}`)
  console.log(`Gelesene Quellzeilen: ${quelle.gesamt}`)
  console.log(`Übernommen: ${orte.length}`)
  console.log(`Verworfen: ${quelle.verworfen}; ungültige TSV-Zeilen: ${quelle.ungueltig}; doppelte IDs: ${quelle.doppelteIds}`)
  console.log(`Ausgelassene ganze Alias-Tokens (800-Zeichen-Grenze): ${quelle.aliasAusgelassen}`)
  console.log(`Typen: ${JSON.stringify(orte.reduce<Record<string, number>>((n, ort) => { n[ort.typ] = (n[ort.typ] ?? 0) + 1; return n }, {}))}`)
  const exportPfad = argument('export')
  if (exportPfad) writeFileSync(exportPfad, orte.map((ort) => JSON.stringify(ort)).join('\n') + '\n')

  if (!schreiben) {
    console.log(
      'Probe – nichts geschrieben. Zum Schreiben: --schreiben --entwicklung ' +
        'oder --schreiben --produktion --projekt-ref <Ref>',
    )
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
