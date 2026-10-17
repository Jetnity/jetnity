import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, copyFileSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, test } from 'node:test'

import type { FlughafenImportZeile } from '@/lib/airports/importieren'
import type { Ort } from '@/lib/places/domain'

import { ablaufen, type Eingaben, type Grenzen } from './ablauf'
import { psqlArgumente, sitzungStarten } from './psql'
import { FLUGHAFEN_BEISPIELE, FLUGHAFEN_SPALTEN, ORT_SPALTEN, STAPEL } from './sql'
import { ZIEL } from './ziel'

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
      sitzungStarten: () => sitzungStarten(psql, ca),
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

function eingaben(stufe: Eingaben['stufe'], f = 20, o = 20): Eingaben {
  return { stufe, flughaefen: stufe === 'orte' ? null : flughaefen(f), geonamesOrte: stufe === 'flughaefen' ? null : geonames(o), herkunft: [] }
}

function stapelSql(eintraege: LogEintrag[], art?: 'flughaefen' | 'orte'): LogEintrag[] {
  return eintraege.filter((e) => e.art === 'stapel' && (!art || e.sql?.startsWith(`-- jetnity:stapel ${art} `)))
}

describe('Ablauf gegen ein psql-Test-Double (keine Datenbank, kein Netzwerk)', () => {
  test('erfolgreicher Lauf: Flughäfen zuerst, dann Orte, genau ein psql-Start mit festem argv', async () => {
    const f = flughaefen(320)
    const t = aufbau({ flughaefen: flughafenAusDb(f) })
    const e = { ...eingaben('beide'), flughaefen: f, geonamesOrte: geonames(310) }
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
    assert.deepEqual(arten.slice(0, 2), ['sitzung', 'vorpruefung'])
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
    await assert.rejects(ablaufen(eingaben('beide'), t.abh()), /Advisory Lock/)
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
      await assert.rejects(ablaufen(eingaben('beide'), t.abh()), muster)
      assert.equal(stapelSql(t.eintraege()).length, 0)
      assert.equal(t.fragen.length, 0)
    })
  }

  test('Vorprüfung mit zusätzlichem Feld (unerwartete Ausgabe) wird abgelehnt', async () => {
    const t = aufbau({ vorpruefung: { ...VORPRUEFUNG, extra: 1 } })
    await assert.rejects(ablaufen(eingaben('beide'), t.abh()), /erwartete Form/)
    assert.equal(stapelSql(t.eintraege()).length, 0)
  })

  test('fehlende Owner-Bestätigung: nichts geschrieben', async () => {
    const t = aufbau()
    await assert.rejects(ablaufen(eingaben('beide'), t.abh(['yes'])), /Owner-Bestätigung fehlt/)
    assert.equal(stapelSql(t.eintraege()).length, 0)
    assert.equal(t.journalLesen().status, 'abgebrochen')
  })

  test('Bestätigung mit Production-Ref statt Development-Ref: nichts geschrieben', async () => {
    const t = aufbau()
    await assert.rejects(ablaufen(eingaben('beide'), t.abh(['qscbgcdmivbbnzrcyegn'])), /Owner-Bestätigung/)
    assert.equal(stapelSql(t.eintraege()).length, 0)
  })

  test('kaputte Stapelausgabe: STOP, Journal nennt Stufe und fertige Stapel', async () => {
    const t = aufbau({ muellBei: 'stapel' })
    await assert.rejects(ablaufen(eingaben('flughaefen'), t.abh()), /kein JSON/)
    const journal = t.journalLesen()
    assert.equal(journal.status, 'abgebrochen')
    assert.equal(journal.aktuelleStufe, 'flughaefen')
    assert.equal(journal.stapelFertig.flughaefen, 0)
  })

  test('falsche gemeldete Zeilenzahl in Stapel 2: STOP nach Stapel 2, kein Stapel 3', async () => {
    const t = aufbau({ lugeBei: { art: 'flughaefen', nummer: 2, n: 7 } })
    await assert.rejects(ablaufen(eingaben('flughaefen', 400), t.abh()), /Stapel 2: 7 statt 150/)
    assert.equal(stapelSql(t.eintraege(), 'flughaefen').length, 2)
    assert.equal(t.journalLesen().stapelFertig.flughaefen, 1)
  })

  test('Teilabbruch in der Orts-Stufe: Stufe und Stapel im Journal, kein Neustart von psql, kein Rollback, kein Retry', async () => {
    const f = flughaefen(20)
    const t = aufbau({ flughaefen: flughafenAusDb(f), fehlerBei: { art: 'orte', nummer: 2 } })
    await assert.rejects(
      ablaufen({ ...eingaben('beide'), flughaefen: f, geonamesOrte: geonames(400) }, t.abh()),
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
  })

  test('erneuter Lauf mit demselben Journal (automatischer Neuversuch) wird vor psql abgelehnt', async () => {
    const t = aufbau({ fehlerBei: { art: 'flughaefen', nummer: 1 } })
    await assert.rejects(ablaufen(eingaben('flughaefen'), t.abh()), /psql beendet/)
    const vorher = t.eintraege().filter((x) => x.ereignis === 'start').length
    await assert.rejects(ablaufen(eingaben('flughaefen'), t.abh()), /Journal existiert bereits/)
    assert.equal(t.eintraege().filter((x) => x.ereignis === 'start').length, vorher, 'kein zweiter psql-Start')
  })

  test('Verbindungsfehler (psql endet sofort): STOP mit Code, kein zweiter Versuch', async () => {
    const t = aufbau({ sofortBeenden: true })
    await assert.rejects(ablaufen(eingaben('flughaefen'), t.abh()), /psql beendet \(Code 2\)/)
    assert.equal(t.eintraege().filter((x) => x.ereignis === 'start').length, 1)
  })

  test('Nachprüfung findet weniger Flughäfen als geplant: STOP vor der Orts-Stufe', async () => {
    const t = aufbau({ beispiele: ['ZRH'] })
    await assert.rejects(ablaufen(eingaben('beide'), t.abh()), /Nach dem Schreiben fehlen: GVA/)
    assert.equal(stapelSql(t.eintraege(), 'orte').length, 0)
  })

  test('Orts-Nachprüfung als anon ohne ZRH oder mit falscher Rolle: STOP', async () => {
    const f = flughaefen(20)
    const ohneZrh = aufbau({ flughaefen: flughafenAusDb(f), ortePruefen: { zrh: false } })
    await assert.rejects(ablaufen({ ...eingaben('beide'), flughaefen: f }, ohneZrh.abh()), /ZRH fehlt für anon/)
    const rolle = aufbau({ flughaefen: flughafenAusDb(f), ortePruefen: { rolle: 'postgres' } })
    await assert.rejects(ablaufen({ ...eingaben('beide'), flughaefen: f }, rolle.abh()), /nicht als anon/)
  })

  test('Orts-Stufe allein braucht bestehende Flughäfen in der Datenbank', async () => {
    const t = aufbau()
    await assert.rejects(ablaufen(eingaben('orte'), t.abh()), /braucht die Flughafen-Stufe zuerst/)
    const f = flughaefen(20)
    const ok = aufbau({ vorpruefung: { ...VORPRUEFUNG, flughaefen: 20 }, flughaefen: flughafenAusDb(f) })
    await ablaufen(eingaben('orte'), ok.abh(['ORTE']))
    assert.equal(ok.journalLesen().status, 'abgeschlossen')
    assert.equal(stapelSql(ok.eintraege(), 'flughaefen').length, 0)
  })

  test('zu viele Zeilen (Statement-Grenze) oder fehlende Pflichtcodes: Abbruch vor Journal und psql', async () => {
    const t = aufbau()
    await assert.rejects(ablaufen(eingaben('flughaefen', 1_200), t.abh()), /ausserhalb/)
    await assert.rejects(
      ablaufen({ ...eingaben('flughaefen'), flughaefen: flughaefen(20).filter((z) => z.iata !== 'ZRH') }, t.abh()),
      /Pflichtcodes fehlen nach dem Filter: ZRH/,
    )
    await assert.rejects(
      ablaufen({ ...eingaben('orte'), geonamesOrte: geonames(20).filter((o) => o.name !== 'Japan') }, t.abh()),
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
      '--modus', 'schreiben-entwicklung-psql', '--stufe', 'flughaefen', '--psql', t.psql, '--ca', t.ca,
      '--journal', t.journal, '--quelle-flughaefen', join(REPO, 'lib/airports/fixtures'),
    ])
    assert.equal(ergebnis.status, 1)
    assert.match(ergebnis.stderr, /gesperrt \(R65, nur Vorbereitung\)/)
    assert.equal(t.eintraege().length, 0)
    assert.ok(!existsSync(t.journal))
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
