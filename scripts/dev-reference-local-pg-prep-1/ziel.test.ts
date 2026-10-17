import assert from 'node:assert/strict'
import { chmodSync, mkdirSync, mkdtempSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, test } from 'node:test'

import { psqlArgumente, psqlUmgebung, verbindungsText } from './psql'
import {
  PRODUCTION_REF,
  PSQL_VERTRAUEN,
  ZIEL,
  argumenteLesen,
  caPfadPruefen,
  journalPfadPruefen,
  psqlPfadPruefen,
  schreibauftragPruefen,
  terminalPruefen,
  umgebungPruefen,
  zielIstFest,
  type PsqlVertrauen,
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

  for (const stufe of ['orte', 'flughaefen', 'ORTE', 'alles']) {
    test(`getrennte oder unbekannte Stufe abgelehnt: ${stufe}`, () => {
      const args = schreibArgs().map((a) => (a === 'beide' ? stufe : a))
      assert.throws(() => argumenteLesen(args), /--stufe muss beide sein/)
    })
  }

  test('verbundener Lauf braucht beide Quellen', () => {
    const ohneFlug = schreibArgs().filter((_, i, a) => a[i] !== '--quelle-flughaefen' && a[i - 1] !== '--quelle-flughaefen')
    assert.throws(() => argumenteLesen(ohneFlug), /--quelle-flughaefen fehlt/)
    const ohneOrte = schreibArgs().filter((_, i, a) => a[i] !== '--quelle-orte' && a[i - 1] !== '--quelle-orte')
    assert.throws(() => argumenteLesen(ohneOrte), /--quelle-orte fehlt/)
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

  test('Journal im Repository wird abgelehnt', () => {
    assert.throws(() => journalPfadPruefen(join(REPO, 'journal.json'), REPO), /nicht im Repository/)
    assert.equal(journalPfadPruefen('/Users/owner/j.json', REPO), '/Users/owner/j.json')
  })

  test('schreibauftragPruefen lehnt im echten Modus ein Test-Double ab, auch mit sauberer Umgebung und TTY', () => {
    const dir = tmp()
    const wrapper = join(dir, 'psql')
    writeFileSync(wrapper, `#!/bin/sh\nexec node ${join(REPO, 'scripts/dev-reference-local-pg-prep-1/fake-psql.mjs')} "$@"\n`)
    chmodSync(wrapper, 0o755)
    const ca = join(dir, 'ca.crt')
    writeFileSync(ca, ZERTIFIKAT)
    const auftrag = { ...(argumenteLesen(schreibArgs()) as SchreibAuftrag), psql: wrapper, ca, journal: join(dir, 'j.json') }
    assert.throws(() => schreibauftragPruefen(auftrag, ['HOME', 'PATH'], TTY, REPO), /kein vertrauenswürdiges Homebrew-libpq-psql/)
  })

  test('schreibauftragPruefen prüft Umgebung und TTY vor jeder Datei', () => {
    const auftrag = argumenteLesen(schreibArgs()) as SchreibAuftrag
    assert.throws(() => schreibauftragPruefen(auftrag, ['PGPASSFILE'], TTY, REPO), /PGPASSFILE/)
    assert.throws(() => schreibauftragPruefen(auftrag, [], { ...TTY, stdinTty: false }, REPO), /interaktives/)
  })
})

describe('vertrauenswürdiges psql (nur Homebrew libpq)', () => {
  const UID = process.getuid?.() ?? 0

  function cellar(version = '18.6', formel = 'libpq') {
    const basis = realpathSync(tmp())
    const wurzel = join(basis, 'Cellar', 'libpq')
    const bin = join(basis, 'Cellar', formel, version, 'bin')
    mkdirSync(bin, { recursive: true, mode: 0o755 })
    const psql = join(bin, 'psql')
    writeFileSync(psql, '#!/bin/sh\necho nie ausgeführt\n')
    chmodSync(psql, 0o555)
    const versionsAufrufe: string[] = []
    const vertrauen: PsqlVertrauen = {
      libpqWurzeln: [wurzel],
      erlaubteUids: [UID],
      versionLesen: (pfad) => {
        versionsAufrufe.push(pfad)
        return `psql (PostgreSQL) ${version.split('_')[0]}`
      },
    }
    return { basis, wurzel, bin, psql, vertrauen, versionsAufrufe }
  }

  test('Standard-Vertrauen ist exakt das Homebrew-libpq-Cellar und eingefroren', () => {
    assert.deepEqual([...PSQL_VERTRAUEN.libpqWurzeln], ['/opt/homebrew/Cellar/libpq', '/usr/local/Cellar/libpq'])
    assert.ok(Object.isFrozen(PSQL_VERTRAUEN) && Object.isFrozen(PSQL_VERTRAUEN.libpqWurzeln))
    assert.ok(PSQL_VERTRAUEN.erlaubteUids.every((uid) => uid === UID || uid === 0))
  })

  test('Cellar-Binary unter libpq mit passender Version wird angenommen, auch über einen opt-Symlink', () => {
    const c = cellar('18.6_1')
    assert.equal(psqlPfadPruefen(c.psql, REPO, c.vertrauen), c.psql)
    const opt = join(c.basis, 'opt-libpq-psql')
    symlinkSync(c.psql, opt)
    assert.equal(psqlPfadPruefen(opt, REPO, c.vertrauen), c.psql)
  })

  test('Standard-Vertrauen lehnt beliebige Pfade ab: /tmp-Wrapper, Fake im Repo, nachgebautes Cellar', () => {
    const dir = tmp()
    const wrapper = join(dir, 'psql')
    writeFileSync(wrapper, '#!/bin/sh\n')
    chmodSync(wrapper, 0o755)
    assert.throws(() => psqlPfadPruefen(wrapper, REPO), /kein vertrauenswürdiges Homebrew-libpq-psql/)
    const fake = join(REPO, 'scripts/dev-reference-local-pg-prep-1/fake-psql.mjs')
    assert.throws(() => psqlPfadPruefen(fake, REPO), /Repository/)
    const c = cellar()
    assert.throws(() => psqlPfadPruefen(c.psql, REPO), /kein vertrauenswürdiges/, 'Cellar-Nachbau ausserhalb /opt/homebrew')
    const nachbau = join(c.basis, 'opt', 'homebrew', 'Cellar', 'libpq', '18.6', 'bin')
    mkdirSync(nachbau, { recursive: true })
    writeFileSync(join(nachbau, 'psql'), '#!/bin/sh\n')
    chmodSync(join(nachbau, 'psql'), 0o555)
    assert.throws(() => psqlPfadPruefen(join(nachbau, 'psql'), REPO), /kein vertrauenswürdiges/, 'Präfix ist verankert')

    const ausgefuehrt: string[] = []
    const spion: PsqlVertrauen = { ...PSQL_VERTRAUEN, versionLesen: (pfad) => (ausgefuehrt.push(pfad), '') }
    for (const pfad of [wrapper, c.psql, join(nachbau, 'psql')]) {
      assert.throws(() => psqlPfadPruefen(pfad, REPO, spion), /kein vertrauenswürdiges/)
    }
    assert.deepEqual(ausgefuehrt, [], 'ein nicht vertrauenswürdiges Binary wird nie ausgeführt')
  })

  test('postgresql@18-Formel oder Datei neben bin wird nicht als libpq angenommen', () => {
    const c = cellar('18.6', 'postgresql@18')
    assert.throws(() => psqlPfadPruefen(c.psql, REPO, c.vertrauen), /kein vertrauenswürdiges/)
    const d = cellar()
    const daneben = join(d.wurzel, '18.6', 'psql')
    writeFileSync(daneben, '#!/bin/sh\n')
    chmodSync(daneben, 0o555)
    assert.throws(() => psqlPfadPruefen(daneben, REPO, d.vertrauen), /kein vertrauenswürdiges/)
  })

  test('für Gruppe/andere beschreibbare Datei oder Verzeichnis wird abgelehnt', () => {
    const datei = cellar()
    chmodSync(datei.psql, 0o575)
    assert.throws(() => psqlPfadPruefen(datei.psql, REPO, datei.vertrauen), /beschreibbar/)
    const verzeichnis = cellar()
    chmodSync(join(verzeichnis.wurzel, '18.6'), 0o777)
    assert.throws(() => psqlPfadPruefen(verzeichnis.psql, REPO, verzeichnis.vertrauen), /beschreibbar/)
    assert.equal(verzeichnis.versionsAufrufe.length, 0)
  })

  test('fremder Eigentümer, nicht ausführbar, falsche oder zu alte Version werden abgelehnt', () => {
    const fremd = cellar()
    assert.throws(
      () => psqlPfadPruefen(fremd.psql, REPO, { ...fremd.vertrauen, erlaubteUids: [UID + 4242] }),
      /weder dir noch root/,
    )
    const starr = cellar()
    chmodSync(starr.psql, 0o444)
    assert.throws(() => psqlPfadPruefen(starr.psql, REPO, starr.vertrauen), /keine ausführbare Datei/)
    const anders = cellar()
    assert.throws(
      () => psqlPfadPruefen(anders.psql, REPO, { ...anders.vertrauen, versionLesen: () => 'psql (PostgreSQL) 17.2' }),
      /passt nicht/,
    )
    const unklar = cellar()
    assert.throws(
      () => psqlPfadPruefen(unklar.psql, REPO, { ...unklar.vertrauen, versionLesen: () => 'evil 1.0' }),
      /keine erkennbare Version/,
    )
    const alt = cellar('15.8')
    assert.throws(() => psqlPfadPruefen(alt.psql, REPO, alt.vertrauen), /älter als 16/)
  })
})
