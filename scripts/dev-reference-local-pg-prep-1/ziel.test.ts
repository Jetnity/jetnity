import assert from 'node:assert/strict'
import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, test } from 'node:test'

import { psqlArgumente, psqlUmgebung, verbindungsText } from './psql'
import {
  PRODUCTION_REF,
  ZIEL,
  argumenteLesen,
  caPfadPruefen,
  journalPfadPruefen,
  psqlPfadPruefen,
  schreibauftragPruefen,
  terminalPruefen,
  umgebungPruefen,
  zielIstFest,
  type SchreibAuftrag,
  type Terminal,
  type Ziel,
} from './ziel'

const REPO = resolve(process.cwd())
const TTY: Terminal = { stdinTty: true, stdoutTty: true, stderrTty: true, devTtyOeffnenbar: true }
const ZERTIFIKAT = `-----BEGIN CERTIFICATE-----\n${'A'.repeat(400)}\n-----END CERTIFICATE-----\n`

function tmp(): string {
  return mkdtempSync(join(tmpdir(), 'jetnity-devref-ziel-'))
}

function schreibArgs(extra: string[] = []): string[] {
  return [
    '--modus', 'schreiben-entwicklung-psql',
    '--stufe', 'beide',
    '--psql', '/opt/homebrew/bin/psql',
    '--ca', '/Users/owner/certs/dev-ca.crt',
    '--journal', '/Users/owner/jetnity-import/journal.json',
    '--quelle-flughaefen', '/Users/owner/quellen/ourairports',
    '--quelle-orte', '/Users/owner/quellen/geonames',
    ...extra,
  ]
}

describe('festes Ziel', () => {
  test('Ziel ist der Development-Branch, eingefroren, ohne Production-Ref', () => {
    assert.equal(ZIEL.host, 'db.yfvbxvijcorffwxbxahl.supabase.co')
    assert.equal(ZIEL.port, 5432)
    assert.equal(ZIEL.datenbank, 'postgres')
    assert.equal(ZIEL.sslmode, 'verify-full')
    assert.ok(Object.isFrozen(ZIEL))
    assert.ok(!JSON.stringify(ZIEL).includes(PRODUCTION_REF))
  })

  test('verändertes Ziel (Production-Host) wird vor dem Bau des conninfo abgelehnt', () => {
    const prod = Object.freeze({ ...ZIEL, host: `db.${PRODUCTION_REF}.supabase.co` }) as unknown as Ziel
    assert.throws(() => zielIstFest(prod), /weicht vom festen Development-Ziel ab/)
    assert.throws(() => verbindungsText(prod, '/x/ca.crt'), /weicht/)
    const anderePort = Object.freeze({ ...ZIEL, port: 6543 as 5432 })
    assert.throws(() => verbindungsText(anderePort, '/x/ca.crt'), /weicht/)
    assert.throws(() => zielIstFest({ ...ZIEL }), /weicht/, 'nicht eingefrorene Kopie')
  })

  test('conninfo: verify-full, CA-Pfad, kein Passwort, kein Fallback', () => {
    const text = verbindungsText(ZIEL, '/Users/owner/certs/dev-ca.crt')
    assert.equal(
      text,
      'host=db.yfvbxvijcorffwxbxahl.supabase.co port=5432 dbname=postgres user=postgres ' +
        'sslmode=verify-full sslrootcert=/Users/owner/certs/dev-ca.crt gssencmode=disable ' +
        'connect_timeout=15 application_name=jetnity_dev_reference_import_prep_1',
    )
    assert.doesNotMatch(text, /password|sslmode=require|sslrootcert=system|hostaddr|service=/)
  })

  test('psql-argv ist exakt fest und erzwingt die TTY-Passwortabfrage', () => {
    const argv = psqlArgumente('/c/ca.crt')
    assert.deepEqual(argv.slice(0, 6), [
      '--no-psqlrc', '--password', '--quiet', '--no-align', '--tuples-only', '--set=ON_ERROR_STOP=1',
    ])
    assert.equal(argv.length, 7)
    assert.ok(argv[6]?.startsWith('--dbname=host=db.yfvbxvijcorffwxbxahl.supabase.co '))
    assert.ok(!argv.some((a) => a === '-w' || a === '--no-password' || a.startsWith('-h') || a.startsWith('--host')))
  })

  test('Kind-Umgebung ist neu gebaut: keine ~/.pgpass, kein Service-File, kein psqlrc, nichts aus der Elternumgebung', () => {
    const env = psqlUmgebung('/tmp/leer', 'xterm-256color')
    assert.deepEqual(Object.keys(env).sort(), [
      'HOME', 'LANG', 'LC_ALL', 'PATH', 'PGCLIENTENCODING', 'PGPASSFILE', 'PGSERVICEFILE', 'PGSYSCONFDIR',
      'PSQLRC', 'PSQL_HISTORY', 'TERM',
    ])
    assert.equal(env.PGPASSFILE, '/dev/null')
    assert.equal(env.PGSERVICEFILE, '/dev/null')
    assert.equal(env.PSQLRC, '/dev/null')
    assert.equal(env.HOME, '/tmp/leer')
    assert.equal(psqlUmgebung('/tmp/leer', 'x; rm -rf /').TERM, 'dumb')
    assert.ok(!('PGPASSWORD' in env) && !('PGHOST' in env) && !('PGSSLMODE' in env))
  })
})

describe('Argumente', () => {
  test('Standard ohne Argumente ist Plan, nicht Schreiben', () => {
    assert.deepEqual(argumenteLesen([]), { modus: 'plan', quelleFlughaefen: null, quelleOrte: null })
  })

  test('gültiger Schreibauftrag wird gelesen', () => {
    const auftrag = argumenteLesen(schreibArgs())
    assert.equal(auftrag.modus, 'schreiben-entwicklung-psql')
  })

  test('die Original-Flags --schreiben --entwicklung schalten hier nichts frei', () => {
    assert.throws(() => argumenteLesen(['--schreiben', '--entwicklung']), /braucht genau einen Wert|nicht erlaubt/)
    assert.throws(() => argumenteLesen(['--modus', 'plan', '--schreiben', 'ja']), /nicht erlaubt/)
  })

  for (const [name, extra, muster] of [
    ['Host-Override', ['--host', 'db.example.com'], /nicht erlaubt/],
    ['Port-Override', ['--port', '6543'], /nicht erlaubt/],
    ['dbname-Override', ['--dbname', 'postgres'], /nicht erlaubt/],
    ['sslmode-Override', ['--sslmode', 'require'], /nicht erlaubt/],
    ['Benutzer-Override', ['--benutzer', 'service_role'], /nicht erlaubt/],
    ['Passwort-Argument', ['--passwort', 'geheim'], /nicht erlaubt/],
    ['--bereinigen', ['--bereinigen', 'ja'], /nicht erlaubt/],
    ['doppeltes Flag', ['--stufe', 'orte'], /doppelt/],
    ['kurzes Flag', ['-h', 'x'], /unerwartetes Argument/],
    ['Positionsargument', ['postgres://u@h/db'], /unerwartetes Argument|braucht genau einen Wert/],
    ['Flag ohne Wert', ['--quelle-orte'], /doppelt|genau einen Wert/],
  ] as const) {
    test(`abgelehnt: ${name}`, () => {
      assert.throws(() => argumenteLesen(schreibArgs([...extra])), muster)
    })
  }

  test('Production-Ref oder URI in irgendeinem Wert wird abgelehnt', () => {
    const prod = schreibArgs().map((a) => (a === '/Users/owner/certs/dev-ca.crt' ? `/x/${PRODUCTION_REF}.crt` : a))
    assert.throws(() => argumenteLesen(prod), /Production-Ref/)
    const uri = schreibArgs().map((a) =>
      a === '/Users/owner/quellen/geonames' ? 'postgresql://postgres@db.x.supabase.co:5432/postgres' : a,
    )
    assert.throws(() => argumenteLesen(uri), /URI|conninfo/)
    const conninfo = schreibArgs().map((a) => (a === '/opt/homebrew/bin/psql' ? 'host=evil' : a))
    assert.throws(() => argumenteLesen(conninfo), /conninfo/)
  })

  test('unbekannter Modus und fehlende Pflichtwerte schlagen fehl', () => {
    assert.throws(() => argumenteLesen(['--modus', 'produktion']), /kennt nur/)
    assert.throws(() => argumenteLesen(['--modus', 'schreiben-entwicklung-psql', '--stufe', 'beide']), /--psql/)
    const ohneCa = schreibArgs().filter((_, i, a) => a[i] !== '--ca' && a[i - 1] !== '--ca')
    assert.throws(() => argumenteLesen(ohneCa), /--ca/)
  })
})

describe('Umgebung und Terminal', () => {
  for (const name of ['PGHOST', 'PGHOSTADDR', 'PGPORT', 'PGSERVICE', 'PGSERVICEFILE', 'PGPASSWORD', 'PGPASSFILE', 'PGSSLMODE', 'PGSSLROOTCERT', 'PGOPTIONS', 'PGUSER', 'PGDATABASE', 'DATABASE_URL', 'SUPABASE_DB_URL', 'PSQLRC', 'CI']) {
    test(`abgelehnt: ${name} gesetzt`, () => {
      assert.throws(() => umgebungPruefen(['HOME', 'PATH', name]), new RegExp(name))
    })
  }

  test('Fehlermeldung nennt nur Namen, nie Werte', () => {
    try {
      umgebungPruefen(['PGPASSWORD'])
      assert.fail('erwartet Abbruch')
    } catch (err) {
      assert.match((err as Error).message, /Werte werden nicht gelesen/)
    }
  })

  test('saubere Umgebung passiert', () => {
    assert.doesNotThrow(() => umgebungPruefen(['HOME', 'PATH', 'TERM', 'SHELL', 'LANG']))
  })

  for (const feld of ['stdinTty', 'stdoutTty', 'stderrTty'] as const) {
    test(`nicht interaktiv (${feld}=false) wird abgelehnt`, () => {
      assert.throws(() => terminalPruefen({ ...TTY, [feld]: false }), /kein interaktives Terminal/)
    })
  }

  test('ohne /dev/tty wird abgelehnt, weil psql das Passwort sonst über stdin läse', () => {
    assert.throws(() => terminalPruefen({ ...TTY, devTtyOeffnenbar: false }), /dev\/tty/)
  })
})

describe('Dateien', () => {
  test('fehlendes CA-Zertifikat schlägt fehl', () => {
    assert.throws(() => caPfadPruefen(join(tmp(), 'fehlt.crt')), /CA-Zertifikat fehlt/)
  })

  test('CA: privater Schlüssel, Nicht-PEM, relativer Pfad und Leerzeichen werden abgelehnt', () => {
    const dir = tmp()
    const schluessel = join(dir, 'key.crt')
    writeFileSync(schluessel, `${ZERTIFIKAT}-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n`)
    assert.throws(() => caPfadPruefen(schluessel), /privaten Schlüssel/)
    const muell = join(dir, 'muell.crt')
    writeFileSync(muell, 'x'.repeat(500))
    assert.throws(() => caPfadPruefen(muell), /kein PEM/)
    assert.throws(() => caPfadPruefen('certs/ca.crt'), /absoluter Pfad/)
    assert.throws(() => caPfadPruefen('/Users/owner/my certs/ca.crt'), /absoluter Pfad/)
    assert.throws(() => caPfadPruefen('/Users/owner/../etc/ca.crt'), /normalisierter/)
    const gut = join(dir, 'ca.crt')
    writeFileSync(gut, ZERTIFIKAT)
    assert.equal(caPfadPruefen(gut), gut)
  })

  test('psql aus dem Repository oder nicht ausführbar wird abgelehnt', () => {
    const imRepo = join(REPO, 'scripts', 'dev-reference-local-pg-prep-1', 'fake-psql.mjs')
    assert.throws(() => psqlPfadPruefen(imRepo, REPO), /ausführbare Datei|Repository/)
    const dir = tmp()
    const datei = join(dir, 'psql')
    writeFileSync(datei, '#!/bin/sh\n')
    assert.throws(() => psqlPfadPruefen(datei, REPO), /ausführbare Datei/)
    chmodSync(datei, 0o755)
    assert.ok(psqlPfadPruefen(datei, REPO).endsWith('/psql'))
    assert.throws(() => psqlPfadPruefen(join(dir, 'nicht-da'), REPO), /existiert nicht/)
    assert.throws(() => psqlPfadPruefen(datei, dir), /nicht aus dem Repository/)
  })

  test('Journal im Repository wird abgelehnt', () => {
    assert.throws(() => journalPfadPruefen(join(REPO, 'journal.json'), REPO), /nicht im Repository/)
    assert.equal(journalPfadPruefen('/Users/owner/j.json', REPO), '/Users/owner/j.json')
  })

  test('schreibauftragPruefen prüft Umgebung und TTY vor jeder Datei', () => {
    const auftrag = argumenteLesen(schreibArgs()) as SchreibAuftrag
    assert.throws(() => schreibauftragPruefen(auftrag, ['PGPASSFILE'], TTY, REPO), /PGPASSFILE/)
    assert.throws(() => schreibauftragPruefen(auftrag, [], { ...TTY, stdinTty: false }, REPO), /interaktives/)
  })
})
