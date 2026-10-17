import assert from 'node:assert/strict'
import { copyFileSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, test } from 'node:test'

import type { FlughafenImportZeile } from '@/lib/airports/importieren'
import type { Ort } from '@/lib/places/domain'

import { flughaefenLesen, orteLesen } from './quelle'
import {
  FLUGHAEFEN_LESEN_SQL,
  FLUGHAEFEN_PRUEFEN_SQL,
  FLUGHAFEN_BEISPIELE,
  FLUGHAFEN_SPALTEN,
  ORTE_PRUEFEN_SQL,
  ORT_SPALTEN,
  SITZUNG_SQL,
  STAPEL,
  VORPRUEFUNG_SQL,
  flughafenOrte,
  flughafenStapel,
  inStapel,
  ortStapel,
  orteMitFlughaefen,
  sqlZulassen,
} from './sql'

const REPO = resolve(process.cwd())
const ORIGINAL_FLUGHAEFEN = readFileSync(join(REPO, 'scripts/airports/importieren.ts'), 'utf8')
const ORIGINAL_ORTE = readFileSync(join(REPO, 'scripts/places/importieren.ts'), 'utf8')

function normal(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function zwischen(text: string, start: RegExp, ende: RegExp): string {
  const s = start.exec(text)
  assert.ok(s, `Start ${start} nicht gefunden`)
  const rest = text.slice(s.index + s[0].length)
  const e = ende.exec(rest)
  assert.ok(e, `Ende ${ende} nicht gefunden`)
  return rest.slice(0, e.index)
}

function felderAusWerte(text: string, variable: string): string[] {
  const rumpf = zwischen(text, /function werte\([^)]*\): string \{/, /\n\}/)
  return [...rumpf.matchAll(new RegExp(`${variable}\\.(\\w+)`, 'g'))].map((m) => m[1] ?? '')
}

function flughafen(iata: string, extra: Partial<FlughafenImportZeile> = {}): FlughafenImportZeile {
  return {
    iata, icao: null, name: `${iata} Airport`, city: null, region: null, country: 'Testland',
    countryCode: 'TL', lat: 1, lon: 2, keywords: null, klasse: 'large', ...extra,
  }
}

describe('Drift-Schutz gegen die Original-Importer', () => {
  test('Flughäfen: Spalten, Wertereihenfolge, ON CONFLICT, Stapelgrösse und Pflichtcodes wie im Original', () => {
    const spalten = zwischen(ORIGINAL_FLUGHAEFEN, /insert into public\.airports\s*\(/, /\)/)
    assert.deepEqual(normal(spalten).split(', '), [...FLUGHAFEN_SPALTEN])
    assert.deepEqual(felderAusWerte(ORIGINAL_FLUGHAEFEN, 'zeile'), [
      'iata', 'icao', 'name', 'city', 'region', 'country', 'countryCode', 'lat', 'lon', 'keywords', 'klasse',
    ])
    const original = normal(zwischen(ORIGINAL_FLUGHAEFEN, /on conflict \(iata\) do update set/, /`/))
    const neu = normal(zwischen(flughafenStapel([flughafen('ZRH')], 1).sql, /on conflict \(iata\) do update set/, /returning 1/))
    assert.equal(neu, original)
    assert.match(ORIGINAL_FLUGHAEFEN, new RegExp(`const STAPEL = ${STAPEL}\\b`))
    assert.match(ORIGINAL_FLUGHAEFEN, new RegExp(`const BEISPIELE = \\[${FLUGHAFEN_BEISPIELE.map((c) => `'${c}'`).join(', ')}\\]`))
  })

  test('Flughäfen: ICAO-Freigabe vor dem Upsert ist textgleich', () => {
    const original = normal(zwischen(ORIGINAL_FLUGHAEFEN, /await runSql\(\s*`update public\.airports/, /`/))
    const stapel = flughafenStapel([flughafen('ZRH', { icao: 'LSZH' }), flughafen('GVA', { icao: 'LSGG' })], 1).sql
    const neu = normal(zwischen(stapel, /update public\.airports/, /;/))
    assert.equal(
      neu,
      original.replace('${icaos}', "'LSZH', 'LSGG'").replace('${iatas}', "'ZRH', 'GVA'"),
    )
    assert.doesNotMatch(flughafenStapel([flughafen('ZRH')], 1).sql, /update public\.airports/, 'ohne ICAO kein Update')
  })

  test('Orte: Spalten, Wertereihenfolge, ON CONFLICT und Stapelgrösse wie im Original', () => {
    const spalten = zwischen(ORIGINAL_ORTE, /insert into public\.places\s*\(/, /\)/)
    assert.deepEqual(normal(spalten).split(', '), [...ORT_SPALTEN])
    assert.deepEqual(felderAusWerte(ORIGINAL_ORTE, 'ort'), [
      'id', 'source', 'sourceId', 'name', 'typ', 'country', 'countryCode', 'region', 'lat', 'lon', 'iata', 'keywords',
    ])
    const ort: Ort = {
      id: 'geonames:1', source: 'geonames', sourceId: '1', name: 'X', typ: 'city', country: null,
      countryCode: null, region: null, lat: null, lon: null, iata: null, keywords: null,
    }
    const original = normal(zwischen(ORIGINAL_ORTE, /on conflict \(id\) do update set/, /`/))
    const neu = normal(zwischen(ortStapel([ort], 1).sql, /on conflict \(id\) do update set/, /returning 1/))
    assert.equal(neu, original)
    assert.match(ORIGINAL_ORTE, new RegExp(`const STAPEL = ${STAPEL}\\b`))
  })

  test('Orte: Zusammenführung wie im Original – GeoNames zuerst, Flughafen-Orte nur mit neuer ID', () => {
    assert.match(
      normal(ORIGINAL_ORTE),
      /const ids = new Set\(orte\.map\(\(ort\) => ort\.id\)\) orte = \[\.\.\.orte, \.\.\.fluege\.filter\(\(ort\) => !ids\.has\(ort\.id\)\)\]/,
    )
    const a = { id: 'geonames:1' } as Ort
    const b = { id: 'airport:ZRH' } as Ort
    const c = { id: 'geonames:1', name: 'doppelt' } as Ort
    assert.deepEqual(orteMitFlughaefen([a], [b, c]), [a, b])
  })

  test('Original-Lesespalten für Flughafen-Orte entsprechen FLUGHAEFEN_LESEN_SQL', () => {
    const original = normal(zwischen(ORIGINAL_ORTE, /async function flughaefenHolen\(\)[^`]*`/, /`/))
    for (const spalte of ['iata', 'name', 'city', 'region', 'country', 'country_code', 'lat', 'lon', 'keywords']) {
      assert.match(original, new RegExp(`\\b${spalte}\\b`))
      assert.match(FLUGHAEFEN_LESEN_SQL, new RegExp(`\\b${spalte}\\b`))
    }
    assert.match(original, /where iata is not null/)
    assert.match(FLUGHAEFEN_LESEN_SQL, /where iata is not null/)
  })
})

describe('SQL-Schutz', () => {
  test('alle festen Anfragen und Stapel passieren die Schutzprüfung', () => {
    for (const sql of [SITZUNG_SQL, VORPRUEFUNG_SQL, FLUGHAEFEN_PRUEFEN_SQL, FLUGHAEFEN_LESEN_SQL, ORTE_PRUEFEN_SQL]) {
      assert.doesNotThrow(() => sqlZulassen(sql))
    }
    const boese = flughafen('ZRH', { name: "x'); drop table public.airports; --", keywords: '\\! rm -rf / :geheim' })
    const stapel = flughafenStapel([boese], 1).sql
    assert.doesNotThrow(() => sqlZulassen(stapel), 'Daten in Literalen sind keine Anweisungen')
    assert.match(stapel, /'x''\); drop table public\.airports; --'/)
  })

  for (const sql of [
    'delete from public.places',
    'truncate public.airports',
    'drop table public.places',
    'alter table public.places disable row level security',
    'grant all on public.places to anon',
    'select 1;\n\\! id',
    'select :geheim',
    "copy public.places to '/tmp/x'",
  ]) {
    test(`abgelehnt: ${sql.split('\n')[0]}`, () => {
      assert.throws(() => sqlZulassen(sql), /Abgebrochen/)
    })
  }

  test('Stapel committen einzeln und melden die Zeilenzahl zurück', () => {
    const zeilen = Array.from({ length: STAPEL * 2 + 5 }, (_, i) => flughafen(`A${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + Math.floor(i / 26))}`))
    const stapel = inStapel(zeilen, flughafenStapel)
    assert.deepEqual(stapel.map((s) => s.zeilen), [STAPEL, STAPEL, 5])
    for (const s of stapel) {
      assert.match(s.sql, /^-- jetnity:stapel flughaefen \d+ n=\d+\nbegin;/)
      assert.match(s.sql, /select jsonb_build_object\('n', count\(\*\)\)::text from geschrieben;\ncommit;$/)
    }
  })

  test('Orts-Prüfung liest als anon in einer zurückgerollten Read-only-Transaktion', () => {
    assert.match(ORTE_PRUEFEN_SQL, /begin transaction read only;\nset local role anon;/)
    assert.match(ORTE_PRUEFEN_SQL, /rollback;$/)
    assert.doesNotMatch(ORTE_PRUEFEN_SQL, /service_role|postgres|authenticated/)
  })
})

describe('Quellseite mit synthetischen Fixtures (lib-Parser unverändert)', () => {
  function verzeichnisse(): { flug: string; orte: string } {
    const flug = mkdtempSync(join(tmpdir(), 'jetnity-devref-flug-'))
    for (const name of ['airports.csv', 'countries.csv', 'regions.csv']) {
      copyFileSync(join(REPO, 'lib/airports/fixtures', name), join(flug, name))
    }
    const orte = mkdtempSync(join(tmpdir(), 'jetnity-devref-orte-'))
    copyFileSync(join(REPO, 'lib/places/fixtures/geonames.tsv'), join(orte, 'allCountries.txt'))
    copyFileSync(join(REPO, 'lib/places/fixtures/countries.txt'), join(orte, 'countryInfo.txt'))
    return { flug, orte }
  }

  test('Flughäfen: Pflicht-IATA vorhanden, ZRH mit Stadt und Land, ableitbar als airport:ZRH', async () => {
    const { flug } = verzeichnisse()
    const { zeilen, herkunft } = await flughaefenLesen(flug)
    const codes = new Set(zeilen.map((z) => z.iata))
    for (const code of FLUGHAFEN_BEISPIELE) assert.ok(codes.has(code), code)
    const zrh = zeilen.find((z) => z.iata === 'ZRH')
    assert.equal(zrh?.countryCode, 'CH')
    assert.equal(zrh?.city, 'Zurich')
    assert.equal(herkunft.length, 3)
    assert.ok(herkunft.every((h) => /^[0-9a-f]{64}$/.test(h.sha256)))

    const ausDb = zeilen.map(({ iata, name, city, region, country, countryCode, lat, lon, keywords }) => ({
      iata, name, city, region, country, countryCode, lat, lon, keywords,
    }))
    const orte = flughafenOrte(ausDb)
    const ort = orte.find((o) => o.id === 'airport:ZRH')
    assert.equal(ort?.typ, 'airport')
    assert.equal(ort?.iata, 'ZRH')
    assert.equal(ort?.countryCode, 'CH')
  })

  test('Orte: Japan als Land, Zürich als Stadt, Stream-Filter wie Download-Pfad des Originals', async () => {
    const { orte: dir } = verzeichnisse()
    const { orte, verworfen } = await orteLesen(dir)
    const japan = orte.find((o) => o.name === 'Japan')
    assert.equal(japan?.typ, 'country')
    assert.equal(japan?.countryCode, 'JP')
    const zuerich = orte.find((o) => o.name === 'Zürich')
    assert.equal(zuerich?.typ, 'city')
    assert.equal(zuerich?.country, 'Switzerland')
    assert.ok(!orte.some((o) => o.name === 'Helipad Nowhere'), 'irrelevante Zeilen bleiben draussen')
    assert.ok(verworfen >= 0)
  })

  test('mehrdeutige GeoNames-Quelle (zip und txt) wird abgelehnt', async () => {
    const { orte: dir } = verzeichnisse()
    copyFileSync(join(dir, 'allCountries.txt'), join(dir, 'allCountries.zip'))
    await assert.rejects(orteLesen(dir), /genau eine/)
  })
})
