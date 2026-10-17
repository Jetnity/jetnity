import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, test } from 'node:test'

import type { FlughafenImportZeile } from '@/lib/airports/importieren'
import type { Ort } from '@/lib/places/domain'

import { ablaufen, oeffentlicheMeldung, type Eingaben, type Grenzen } from './ablauf'
import { SitzungsFehler, psqlArgumente, sitzungStarten } from './psql'
import { flughaefenLesen, orteLesen } from './quelle'
import { FLUGHAFEN_BEISPIELE, FLUGHAFEN_SPALTEN, ORT_SPALTEN, STAPEL } from './sql'
import { ZIEL, type VertrauenswuerdigesPsql } from './ziel'

const REPO = resolve(process.cwd())
const HIER = join(REPO, 'scripts/dev-reference-local-pg-prep-1')
const GRENZEN: Grenzen = { minFlughaefen: 1, maxFlughaefen: 1_000, minGeonamesOrte: 1, maxOrte: 2_000 }

type FakeConfig = Record<string, unknown>
type LogEintrag = { ereignis: string; art?: string; sql?: string; argv?: string[]; env?: Record<string, string> }

function codes(anzahl: number): string[] {
  const liste: string[] = [...FLUGHAFEN_BEISPIELE]
  for (let i = 0; liste.length < anzahl; i += 1) {
    const code = `Q${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + Math.floor(i / 26))}`
    if (!liste.includes(code)) liste.push(code)
  }
  return liste
}

function flughaefen(anzahl: number): FlughafenImportZeile[] {
  return codes(anzahl).map((iata) => ({
    iata, icao: null, name: `${iata} Airport`, city: iata === 'ZRH' ? 'Zurich' : null, region: null,
    country: iata === 'ZRH' ? 'Switzerland' : 'Testland', countryCode: iata === 'ZRH' ? 'CH' : 'TL',
    lat: 1, lon: 2, keywords: null, klasse: 'large',
  }))
}

function geonames(anzahl: number): Ort[] {
  const basis: Ort[] = [
    { id: 'geonames:1861060', source: 'geonames', sourceId: '1861060', name: 'Japan', typ: 'country', country: 'Japan', countryCode: 'JP', region: null, lat: 35, lon: 139, iata: null, keywords: 'Nippon' },
    { id: 'geonames:2657896', source: 'geonames', sourceId: '2657896', name: 'Zürich', typ: 'city', country: 'Switzerland', countryCode: 'CH', region: '25', lat: 47, lon: 8, iata: null, keywords: 'Zurich' },
  ]
  for (let i = 0; basis.length < anzahl; i += 1) {
    basis.push({ id: `geonames:${900000 + i}`, source: 'geonames', sourceId: String(900000 + i), name: `Ort ${i}`, typ: 'city', country: 'Testland', countryCode: 'TL', region: null, lat: 0, lon: 0, iata: null, keywords: null })
  }
  return basis
}

function flughafenAusDb(zeilen: FlughafenImportZeile[]) {
  return zeilen.map(({ iata, name, city, region, country, countryCode, lat, lon, keywords }) => ({
    iata, name, city, region, country, countryCode, lat, lon, keywords,
  }))
}

const VORPRUEFUNG = {
  datenbank: 'postgres', benutzer: 'postgres', replik: false, ssl: true, standardStrings: 'on', serverVersion: 170006,
  flughafenSpalten: [...FLUGHAFEN_SPALTEN, 'id'], ortSpalten: [...ORT_SPALTEN], flughaefen: 0, orte: 0,
}

function aufbau(config: FakeConfig = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'jetnity-devref-ablauf-'))
  const log = join(dir, 'fake.jsonl')
  const configPfad = join(dir, 'config.json')
  writeFileSync(configPfad, JSON.stringify({ log, vorpruefung: VORPRUEFUNG, beispiele: [...FLUGHAFEN_BEISPIELE].sort(), ...config }))
  const psql = join(dir, 'psql')
  writeFileSync(psql, `#!/bin/sh\nexec '${process.execPath}' '${join(HIER, 'fake-psql.mjs')}' '${configPfad}' "$@"\n`)
  chmodSync(psql, 0o755)
  const ca = join(dir, 'ca.crt')
  writeFileSync(ca, `-----BEGIN CERTIFICATE-----\n${'A'.repeat(400)}\n-----END CERTIFICATE-----\n`)
  const journal = join(dir, 'journal.json')
  const ausgaben: string[] = []
  const fragen: string[] = []
  return {
    dir, psql, ca, journal, ausgaben, fragen,
    eintraege: (): LogEintrag[] =>
      existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map((z) => JSON.parse(z) as LogEintrag) : [],
    journalLesen: () => JSON.parse(readFileSync(journal, 'utf8')) as Record<string, unknown> & { stapelFertig: { flughaefen: number; orte: number } },
    abh: (antworten: string[] = [ZIEL.projektRef, 'ORTE']) => ({
      // Nur hier: das Test-Double wird direkt injiziert, nie über psqlPfadPruefen.
      sitzungStarten: () => sitzungStarten(psql as VertrauenswuerdigesPsql, ca),
      bestaetigen: async (frage: string) => {
        fragen.push(frage)
        return antworten.shift() ?? ''
      },
      ausgabe: (zeile: string) => ausgaben.push(zeile),
      journalPfad: journal,
      grenzen: GRENZEN,
    }),
  }
}

function eingaben(f = 20, o = 20): Eingaben {
  return { flughaefen: flughaefen(f), geonamesOrte: geonames(o), herkunft: [] }
}

function stapelSql(eintraege: LogEintrag[], art?: 'flughaefen' | 'orte'): LogEintrag[] {
  return eintraege.filter((e) => e.art === 'stapel' && (!art || e.sql?.startsWith(`-- jetnity:stapel ${art} `)))
}

describe('Ablauf gegen ein psql-Test-Double (keine Datenbank, kein Netzwerk)', () => {
  test('erfolgreicher Lauf: Flughäfen zuerst, dann Orte, genau ein psql-Start mit festem argv', async () => {
    const f = flughaefen(320)
    const t = aufbau({ flughaefen: flughafenAusDb(f) })
    const e = { ...eingaben(), flughaefen: f, geonamesOrte: geonames(310) }
    await ablaufen(e, t.abh())

    const log = t.eintraege()
    const starts = log.filter((x) => x.ereignis === 'start')
    assert.equal(starts.length, 1)
    assert.deepEqual(starts[0]?.argv, psqlArgumente(t.ca))
    assert.equal(starts[0]?.env?.PGPASSFILE, '/dev/null')
    assert.ok(!Object.keys(starts[0]?.env ?? {}).some((k) => k === 'PGPASSWORD' || k === 'PGHOST' || k === 'PGSERVICE'))

    const arten = log.filter((x) => x.ereignis === 'sql').map((x) => x.art)
    const ersterOrt = log.findIndex((x) => x.sql?.startsWith('-- jetnity:stapel orte '))
    const letzterFlughafen = log.findLastIndex((x) => x.sql?.startsWith('-- jetnity:stapel flughaefen '))
    assert.ok(letzterFlughafen < ersterOrt, 'Flughäfen vollständig vor dem ersten Ort')
    assert.deepEqual(arten.slice(0, 5), ['sitzung', 'vorpruefung', 'anon-rechte', 'anon-leseprobe', 'stapel'])
    assert.ok(arten.indexOf('flughaefen-lesen') < log.findIndex((x) => x.sql?.startsWith('-- jetnity:stapel orte ')))
    assert.ok(arten.indexOf('flughaefen-pruefen') < arten.indexOf('flughaefen-lesen'))
    assert.equal(arten.at(-1), 'orte-pruefen')
    assert.equal(stapelSql(log, 'flughaefen').length, Math.ceil(320 / STAPEL))
    assert.equal(stapelSql(log, 'orte').length, Math.ceil((310 + 320) / STAPEL))
    assert.ok(log.some((x) => x.ereignis === 'ende'))

    for (const x of log.filter((y) => y.ereignis === 'sql')) {
      const ohneLiterale = (x.sql ?? '').replace(/'(?:[^']|'')*'/g, "''")
      assert.doesNotMatch(ohneLiterale, /\b(delete|truncate|drop|alter|grant)\b/i)
    }

    const journal = t.journalLesen()
    assert.equal(journal.status, 'abgeschlossen')
    assert.deepEqual(journal.stapelFertig, { flughaefen: 3, orte: 5 })
    assert.equal(t.fragen.length, 2)
  })

  test('Advisory Lock nicht erhalten (paralleler Writer): STOP vor jeder Vorprüfung', async () => {
    const t = aufbau({ sperre: false })
    await assert.rejects(ablaufen(eingaben(), t.abh()), /Advisory Lock/)
    assert.deepEqual(t.eintraege().filter((x) => x.ereignis === 'sql').map((x) => x.art), ['sitzung'])
    assert.equal(t.journalLesen().status, 'abgebrochen')
  })

  for (const [name, abweichung, muster] of [
    ['bestehende Flughafenzeilen', { flughaefen: 5 }, /airports enthält bereits 5/],
    ['bestehende Ortszeilen', { orte: 1 }, /places enthält bereits 1/],
    ['ohne TLS', { ssl: false }, /nicht TLS/],
    ['Read-Replik', { replik: true }, /Read-Replik/],
    ['falsche Rolle', { benutzer: 'service_role' }, /Datenbank oder Rolle/],
    ['fehlende Spalte', { ortSpalten: ['id', 'name'] }, /Spalten fehlen/],
    ['standard_conforming_strings off', { standardStrings: 'off' }, /standard_conforming_strings/],
  ] as const) {
    test(`Vorprüfung stoppt: ${name} – kein Stapel gesendet, keine Bestätigung gefragt`, async () => {
      const t = aufbau({ vorpruefung: { ...VORPRUEFUNG, ...abweichung } })
      await assert.rejects(ablaufen(eingaben(), t.abh()), muster)
      assert.equal(stapelSql(t.eintraege()).length, 0)
      assert.equal(t.fragen.length, 0)
    })
  }

  test('Vorprüfung mit zusätzlichem Feld (unerwartete Ausgabe) wird abgelehnt', async () => {
    const t = aufbau({ vorpruefung: { ...VORPRUEFUNG, extra: 1 } })
    await assert.rejects(ablaufen(eingaben(), t.abh()), /erwartete Form/)
    assert.equal(stapelSql(t.eintraege()).length, 0)
  })

  test('fehlende Owner-Bestätigung: nichts geschrieben', async () => {
    const t = aufbau()
    await assert.rejects(ablaufen(eingaben(), t.abh(['yes'])), /Owner-Bestätigung fehlt/)
    assert.equal(stapelSql(t.eintraege()).length, 0)
    assert.equal(t.journalLesen().status, 'abgebrochen')
  })

  test('Bestätigung mit Production-Ref statt Development-Ref: nichts geschrieben', async () => {
    const t = aufbau()
    await assert.rejects(ablaufen(eingaben(), t.abh(['qscbgcdmivbbnzrcyegn'])), /Owner-Bestätigung/)
    assert.equal(stapelSql(t.eintraege()).length, 0)
  })

  test('kaputte Stapelausgabe: STOP, Journal nennt Stufe und fertige Stapel', async () => {
    const t = aufbau({ muellBei: 'stapel' })
    await assert.rejects(ablaufen(eingaben(), t.abh()), /kein JSON/)
    const journal = t.journalLesen()
    assert.equal(journal.status, 'abgebrochen')
    assert.equal(journal.aktuelleStufe, 'flughaefen')
    assert.equal(journal.stapelFertig.flughaefen, 0)
  })

  test('falsche gemeldete Zeilenzahl in Stapel 2: STOP nach Stapel 2, kein Stapel 3', async () => {
    const t = aufbau({ lugeBei: { art: 'flughaefen', nummer: 2, n: 7 } })
    await assert.rejects(ablaufen(eingaben(400), t.abh()), /Stapel 2: 7 statt 150/)
    assert.equal(stapelSql(t.eintraege(), 'flughaefen').length, 2)
    assert.equal(t.journalLesen().stapelFertig.flughaefen, 1)
  })

  test('Teilabbruch in der Orts-Stufe: Stufe und Stapel im Journal, kein Neustart von psql, kein Rollback, kein Retry', async () => {
    const f = flughaefen(20)
    const t = aufbau({ flughaefen: flughafenAusDb(f), fehlerBei: { art: 'orte', nummer: 2 } })
    await assert.rejects(
      ablaufen({ ...eingaben(), flughaefen: f, geonamesOrte: geonames(400) }, t.abh()),
      /psql beendet \(Code 3\).*simulierter Fehler in Stapel 2/,
    )
    const log = t.eintraege()
    assert.equal(log.filter((x) => x.ereignis === 'start').length, 1, 'genau ein psql-Start')
    assert.equal(stapelSql(log, 'orte').length, 2)
    assert.ok(!log.some((x) => /\brollback\b/i.test((x.sql ?? '').replace(/'(?:[^']|'')*'/g, '')) && x.art === 'stapel'))
    const journal = t.journalLesen()
    assert.equal(journal.status, 'abgebrochen')
    assert.equal(journal.aktuelleStufe, 'orte')
    assert.deepEqual(journal.stapelFertig, { flughaefen: 1, orte: 1 })
    assert.equal(journal.meldung, 'psql beendet (Code 3).', 'kein stderr im Journal')
  })

  test('erneuter Lauf mit demselben Journal (automatischer Neuversuch) wird vor psql abgelehnt', async () => {
    const t = aufbau({ fehlerBei: { art: 'flughaefen', nummer: 1 } })
    await assert.rejects(ablaufen(eingaben(), t.abh()), /psql beendet/)
    const vorher = t.eintraege().filter((x) => x.ereignis === 'start').length
    await assert.rejects(ablaufen(eingaben(), t.abh()), /Journal existiert bereits/)
    assert.equal(t.eintraege().filter((x) => x.ereignis === 'start').length, vorher, 'kein zweiter psql-Start')
  })

  test('Verbindungsfehler (psql endet sofort): STOP mit Code, kein zweiter Versuch', async () => {
    const t = aufbau({ sofortBeenden: true })
    await assert.rejects(ablaufen(eingaben(), t.abh()), /psql beendet \(Code 2\)/)
    assert.equal(t.eintraege().filter((x) => x.ereignis === 'start').length, 1)
  })

  test('Nachprüfung findet weniger Flughäfen als geplant: STOP vor der Orts-Stufe', async () => {
    const t = aufbau({ beispiele: ['ZRH'] })
    await assert.rejects(ablaufen(eingaben(), t.abh()), /Nach dem Schreiben fehlen: GVA/)
    assert.equal(stapelSql(t.eintraege(), 'orte').length, 0)
  })

  test('Orts-Nachprüfung als anon ohne ZRH oder mit falscher Rolle: STOP', async () => {
    const f = flughaefen(20)
    const ohneZrh = aufbau({ flughaefen: flughafenAusDb(f), ortePruefen: { zrh: false } })
    await assert.rejects(ablaufen({ ...eingaben(), flughaefen: f }, ohneZrh.abh()), /ZRH fehlt für anon/)
    const rolle = aufbau({ flughaefen: flughafenAusDb(f), ortePruefen: { rolle: 'postgres' } })
    await assert.rejects(ablaufen({ ...eingaben(), flughaefen: f }, rolle.abh()), /nicht als anon/)
  })

  test('R66-F1: Teilbestand von 3.001 Flughäfen mit neuem Journal → null Orts-Stapel, keine Owner-Bestätigung', async () => {
    const teil = flughaefen(3_001)
    const t = aufbau({ vorpruefung: { ...VORPRUEFUNG, flughaefen: 3_001 }, flughaefen: flughafenAusDb(teil) })
    await assert.rejects(
      ablaufen(eingaben(), { ...t.abh([ZIEL.projektRef, 'ORTE']), grenzen: { ...GRENZEN, maxFlughaefen: 20_000 } }),
      /public\.airports enthält bereits 3001 Zeilen/,
    )
    assert.equal(stapelSql(t.eintraege(), 'orte').length, 0)
    assert.equal(stapelSql(t.eintraege()).length, 0)
    assert.equal(t.fragen.length, 0)
    assert.equal(t.journalLesen().aktuelleStufe, 'vorpruefung')
  })

  type DbFlughafen = ReturnType<typeof flughafenAusDb>
  for (const [name, abweichen] of [
    ['ein Flughafen fehlt', (z: DbFlughafen) => z.slice(0, -1)],
    ['gleiche Anzahl, anderer Code', (z: DbFlughafen) => [...z.slice(0, -1), { ...z.at(-1)!, iata: 'XQZ' }]],
    ['zusätzlicher fremder Flughafen', (z: DbFlughafen) => [...z, { ...z[0]!, iata: 'XQY' }]],
    ['doppelter Code statt eines fehlenden', (z: DbFlughafen) => [...z.slice(0, -1), z[0]!]],
  ] as const) {
    test(`R66-F1: zurückgelesener Flughafenbestand ≠ Quelle (${name}) → null Orts-Stapel, keine ORTE-Bestätigung`, async () => {
      const f = flughaefen(20)
      const t = aufbau({ flughaefen: abweichen(flughafenAusDb(f)) })
      await assert.rejects(ablaufen({ ...eingaben(), flughaefen: f }, t.abh()), /Keine Orte geschrieben/)
      assert.equal(stapelSql(t.eintraege(), 'orte').length, 0)
      assert.equal(t.fragen.length, 1, 'nur die Start-Bestätigung, keine ORTE-Bestätigung')
      assert.equal(t.journalLesen().stapelFertig.orte, 0)
    })
  }

  for (const [name, config, muster] of [
    ['kein SELECT-Grant', { anonRechte: { anonSelect: false } }, /kein SELECT/],
    ['RLS aus', { anonRechte: { rls: false } }, /RLS ist auf public\.places nicht aktiv/],
    ['keine anon-Policy', { anonRechte: { anonPolicy: false } }, /keine SELECT-Policy/],
    ['Leseprobe nicht als anon', { anonLeseprobe: { rolle: 'postgres' } }, /nicht als anon/],
    ['anon sieht bereits Zeilen', { anonLeseprobe: { orte: 3 } }, /unerwartete Zeilen/],
    ['Leseprobe verweigert', { fehlerBeiArt: 'anon-leseprobe', stderrText: 'permission denied for table places' }, /psql beendet \(Code 3\)/],
    ['unerwartete Form', { anonRechte: { extra: 1 } }, /erwartete Form/],
  ] as const) {
    test(`R66-F4: anon-Lesecheck vor dem ersten Schreiben stoppt (${name}) – kein Stapel, keine Bestätigung`, async () => {
      const t = aufbau(config)
      await assert.rejects(ablaufen(eingaben(), t.abh()), muster)
      assert.equal(stapelSql(t.eintraege()).length, 0)
      assert.equal(t.fragen.length, 0)
      assert.deepEqual(t.journalLesen().stapelFertig, { flughaefen: 0, orte: 0 })
    })
  }

  test('R66-F3: Journal enthält weder private Pfade noch rohes stderr, nur Basenames und SHA-256', async () => {
    const MARKER = 'PRIVATMARKER_sasa_7f3a'
    const GEHEIM = 'GEHEIMMARKER_9c1d'
    const privat = mkdtempSync(join(tmpdir(), `${MARKER}-`))
    const flugDir = join(privat, `flug-${MARKER}`)
    const ortDir = join(privat, `orte-${MARKER}`)
    mkdirSync(flugDir)
    mkdirSync(ortDir)
    copyFileSync(join(REPO, 'lib/airports/fixtures/airports.csv'), join(flugDir, 'airports.csv'))
    copyFileSync(join(REPO, 'lib/airports/fixtures/countries.csv'), join(flugDir, 'countries.csv'))
    copyFileSync(join(REPO, 'lib/airports/fixtures/regions.csv'), join(flugDir, 'regions.csv'))
    copyFileSync(join(REPO, 'lib/places/fixtures/geonames.tsv'), join(ortDir, 'allCountries.txt'))
    copyFileSync(join(REPO, 'lib/places/fixtures/countries.txt'), join(ortDir, 'countryInfo.txt'))
    const quelleF = await flughaefenLesen(flugDir)
    const quelleO = await orteLesen(ortDir)
    const herkunft = [...quelleF.herkunft, ...quelleO.herkunft, { datei: `${privat}/x.csv`, sha256: 'a'.repeat(64) }]

    const stderrText = `${GEHEIM} could not open ${flugDir}/airports.csv password=${GEHEIM} host=10.0.0.1`
    const t = aufbau({ fehlerBei: { art: 'flughaefen', nummer: 1 }, stderrText })
    const fehler = await ablaufen({ flughaefen: quelleF.zeilen, geonamesOrte: quelleO.orte, herkunft }, t.abh()).then(
      () => assert.fail('muss abbrechen'),
      (err: unknown) => err,
    )
    assert.ok(fehler instanceof SitzungsFehler)
    assert.match(fehler.message, new RegExp(GEHEIM), 'privates Terminal behält die Diagnose')

    const roh = readFileSync(t.journal, 'utf8')
    for (const verboten of [MARKER, GEHEIM, privat, t.dir, tmpdir(), '/Users/', '/private/', 'password', '10.0.0.1']) {
      assert.ok(!roh.includes(verboten), `Journal enthält ${verboten}`)
    }
    const journal = JSON.parse(roh) as Record<string, unknown>
    assert.deepEqual(Object.keys(journal).sort(), [
      'ablauf', 'aktualisiert', 'aktuelleStufe', 'geplant', 'herkunft', 'meldung', 'stapelFertig', 'status', 'vorher', 'ziel',
    ])
    assert.equal(journal.meldung, 'psql beendet (Code 3).')
    assert.equal(journal.ziel, `${ZIEL.host}:${ZIEL.port}/${ZIEL.datenbank}`)
    const eintraege = journal.herkunft as { datei: string; sha256: string }[]
    assert.deepEqual(eintraege.map((e) => e.datei).sort(), ['airports.csv', 'allCountries.txt', 'countries.csv', 'countryInfo.txt', 'regions.csv', 'x.csv'])
    for (const e of eintraege) {
      assert.deepEqual(Object.keys(e).sort(), ['datei', 'sha256'])
      assert.match(e.sha256, /^[0-9a-f]{64}$/)
      assert.doesNotMatch(e.datei, /\//)
    }
  })

  test('R66-F3: öffentliche Meldung ersetzt Pfade und kürzt', () => {
    assert.equal(
      oeffentlicheMeldung(new Error('Abgebrochen: Quelldatei fehlt: /Users/sasa/privat/a.csv (siehe /tmp/x)')),
      'Abgebrochen: Quelldatei fehlt: <pfad> (siehe <pfad>)',
    )
    assert.equal(
      oeffentlicheMeldung(new SitzungsFehler('psql beendet (Code 2). FATAL: /secret', 2, 'psql beendet (Code 2).')),
      'psql beendet (Code 2).',
    )
    assert.equal(oeffentlicheMeldung('kein Error'), 'unbekannter Fehler')
    assert.ok(oeffentlicheMeldung(new Error('x'.repeat(1_000))).length <= 300)
  })

  test('zu viele Zeilen (Statement-Grenze) oder fehlende Pflichtcodes: Abbruch vor Journal und psql', async () => {
    const t = aufbau()
    await assert.rejects(ablaufen(eingaben(1_200), t.abh()), /ausserhalb/)
    await assert.rejects(
      ablaufen({ ...eingaben(), flughaefen: flughaefen(20).filter((z) => z.iata !== 'ZRH') }, t.abh()),
      /Pflichtcodes fehlen nach dem Filter: ZRH/,
    )
    await assert.rejects(
      ablaufen({ ...eingaben(), geonamesOrte: geonames(20).filter((o) => o.name !== 'Japan') }, t.abh()),
      /Japan/,
    )
    assert.equal(t.eintraege().length, 0)
    assert.ok(!existsSync(t.journal))
  })
})

describe('CLI', () => {
  const cli = join(HIER, 'importieren.ts')
  function aufrufen(args: string[]) {
    return spawnSync(process.execPath, ['--import', 'tsx', cli, ...args], {
      cwd: REPO,
      encoding: 'utf8',
      env: { PATH: process.env.PATH ?? '/usr/bin:/bin', HOME: process.env.HOME ?? '/tmp' } as Record<string, string> as NodeJS.ProcessEnv,
      timeout: 60_000,
    })
  }

  test('Schreibmodus ist in diesem Stand gesperrt: kein psql-Start, kein Journal', () => {
    const t = aufbau()
    const ergebnis = aufrufen([
      '--modus', 'schreiben-entwicklung-psql', '--stufe', 'beide', '--psql', t.psql, '--ca', t.ca,
      '--journal', t.journal, '--quelle-flughaefen', join(REPO, 'lib/airports/fixtures'),
      '--quelle-orte', join(REPO, 'lib/places/fixtures'),
    ])
    assert.equal(ergebnis.status, 1)
    assert.match(ergebnis.stderr, /gesperrt \(R65, nur Vorbereitung\)/)
    assert.equal(t.eintraege().length, 0)
    assert.ok(!existsSync(t.journal))
  })

  test('SCHREIBEN_FREIGEGEBEN bleibt im Quelltext false', () => {
    const quelle = readFileSync(cli, 'utf8')
    assert.equal(quelle.match(/SCHREIBEN_FREIGEGEBEN\s*=/g)?.length, 1)
    assert.match(quelle, /^const SCHREIBEN_FREIGEGEBEN = false as boolean$/m)
  })

  test('getrennte Orts-Stufe ist auch über die CLI gesperrt', () => {
    const t = aufbau()
    const ergebnis = aufrufen([
      '--modus', 'schreiben-entwicklung-psql', '--stufe', 'orte', '--psql', t.psql, '--ca', t.ca,
      '--journal', t.journal, '--quelle-orte', join(REPO, 'lib/places/fixtures'),
    ])
    assert.equal(ergebnis.status, 1)
    assert.match(ergebnis.stderr, /--stufe muss beide sein/)
    assert.equal(t.eintraege().length, 0)
  })

  test('Plan-Modus mit synthetischen Fixtures: zählt, startet kein psql', () => {
    const orte = mkdtempSync(join(tmpdir(), 'jetnity-devref-cli-'))
    copyFileSync(join(REPO, 'lib/places/fixtures/geonames.tsv'), join(orte, 'allCountries.txt'))
    copyFileSync(join(REPO, 'lib/places/fixtures/countries.txt'), join(orte, 'countryInfo.txt'))
    const ergebnis = aufrufen(['--quelle-flughaefen', join(REPO, 'lib/airports/fixtures'), '--quelle-orte', orte])
    assert.equal(ergebnis.status, 0, ergebnis.stderr)
    assert.match(ergebnis.stdout, /Plan – keine Datenbank, kein psql/)
    assert.match(ergebnis.stdout, /Pflichtcodes vorhanden/)
    assert.match(ergebnis.stdout, /airport:ZRH ableitbar: ja/)
    assert.match(ergebnis.stdout, /Japan \(Land\): ja, Zürich \(Stadt\): ja/)
  })
})
