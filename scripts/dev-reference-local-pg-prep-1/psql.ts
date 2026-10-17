// scripts/dev-reference-local-pg-prep-1/psql.ts
//
// Eine psql-Sitzung, festes argv, leere Umgebung.
//
// Passwort: --password erzwingt die Abfrage, die psql selbst maskiert über
// /dev/tty stellt. Dieser Prozess sieht, speichert und loggt es nie.
// PGPASSFILE, PGSERVICEFILE, PSQLRC zeigen auf /dev/null, HOME auf ein
// leeres Verzeichnis: keine ~/.pgpass, kein pg_service.conf, kein
// ~/.postgresql/Client-Zertifikat, kein psqlrc.
//
// Protokoll: SQL über stdin, danach \echo <Marke>. Alles vor der Marke ist
// die Antwort. ON_ERROR_STOP=1 beendet psql beim ersten Fehler; die
// Sitzung wird dann nie neu gestartet.

import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createInterface } from 'node:readline'

import { sqlZulassen } from './sql'
import { ZIEL, zielIstFest, type Ziel } from './ziel'

export const ANWENDUNG = 'jetnity_dev_reference_import_prep_1'

export function verbindungsText(ziel: Ziel, caPfad: string): string {
  zielIstFest(ziel)
  return [
    `host=${ziel.host}`,
    `port=${ziel.port}`,
    `dbname=${ziel.datenbank}`,
    `user=${ziel.benutzer}`,
    `sslmode=${ziel.sslmode}`,
    `sslrootcert=${caPfad}`,
    'gssencmode=disable',
    'connect_timeout=15',
    `application_name=${ANWENDUNG}`,
  ].join(' ')
}

export function psqlArgumente(caPfad: string): string[] {
  return [
    '--no-psqlrc',
    '--password',
    '--quiet',
    '--no-align',
    '--tuples-only',
    '--set=ON_ERROR_STOP=1',
    `--dbname=${verbindungsText(ZIEL, caPfad)}`,
  ]
}

export function psqlUmgebung(leeresHome: string, term: string | undefined): Record<string, string> {
  return {
    PATH: '/usr/bin:/bin',
    HOME: leeresHome,
    LANG: 'C.UTF-8',
    LC_ALL: 'C.UTF-8',
    TERM: term && /^[A-Za-z0-9._-]+$/.test(term) ? term : 'dumb',
    PGPASSFILE: '/dev/null',
    PGSERVICEFILE: '/dev/null',
    PGSYSCONFDIR: leeresHome,
    PSQLRC: '/dev/null',
    PSQL_HISTORY: '/dev/null',
    PGCLIENTENCODING: 'UTF8',
  }
}

export type Sitzung = {
  senden(sql: string, zeitlimitMs?: number): Promise<string[]>
  beenden(): Promise<number | null>
}

export class SitzungsFehler extends Error {
  constructor(
    meldung: string,
    readonly exitCode: number | null,
  ) {
    super(meldung)
  }
}

const ERLAUBTE_STATUSZEILEN = /^(BEGIN|COMMIT|ROLLBACK|SET|UPDATE \d+|INSERT 0 \d+)$/

// stderr kann Fehlermeldungen mit Datenwerten tragen, nie aber das Passwort
// (das liest psql über /dev/tty). Trotzdem nur kurze, einzeilige Auszüge.
function stderrAuszug(zeilen: string[]): string {
  return zeilen
    .slice(-3)
    .map((zeile) => zeile.slice(0, 300))
    .join(' | ')
}

export function sitzungStarten(psqlPfad: string, caPfad: string): Sitzung {
  const leeresHome = mkdtempSync(join(tmpdir(), 'jetnity-devref-psql-'))
  const marke = `__JETNITY_DEVREF_${randomBytes(12).toString('hex')}__`
  const kind: ChildProcessWithoutNullStreams = spawn(psqlPfad, psqlArgumente(caPfad), {
    env: psqlUmgebung(leeresHome, process.env.TERM) as NodeJS.ProcessEnv,
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: false,
  })

  const stderr: string[] = []
  createInterface({ input: kind.stderr }).on('line', (zeile) => stderr.push(zeile))
  // EPIPE, wenn psql vor dem Lesen endet; der close-Handler meldet den Abbruch.
  kind.stdin.on('error', () => undefined)

  let puffer: string[] = []
  let wartend: { nummer: number; fertig: (zeilen: string[]) => void; fehler: (err: Error) => void } | null = null
  let beendet: { code: number | null } | null = null
  let zaehler = 0

  const ende = new Promise<number | null>((resolveEnde) => {
    kind.on('close', (code) => {
      beendet = { code }
      rmSync(leeresHome, { recursive: true, force: true })
      if (wartend) {
        wartend.fehler(
          new SitzungsFehler(`psql beendet (Code ${code}). ${stderrAuszug(stderr)}`.trim(), code),
        )
        wartend = null
      }
      resolveEnde(code)
    })
    kind.on('error', (err) => {
      if (wartend) {
        wartend.fehler(new SitzungsFehler(`psql nicht startbar: ${err.message}`, null))
        wartend = null
      }
    })
  })

  createInterface({ input: kind.stdout }).on('line', (zeile) => {
    if (!wartend) {
      puffer.push(zeile)
      return
    }
    if (zeile === `${marke}${wartend.nummer}`) {
      const antwort = puffer.filter((z) => z.trim() !== '' && !ERLAUBTE_STATUSZEILEN.test(z.trim()))
      puffer = []
      const w = wartend
      wartend = null
      w.fertig(antwort)
      return
    }
    puffer.push(zeile)
  })

  return {
    senden(sql, zeitlimitMs = 180_000) {
      if (beendet) return Promise.reject(new SitzungsFehler('psql-Sitzung ist bereits beendet.', null))
      if (wartend) return Promise.reject(new SitzungsFehler('Parallele Anfrage abgelehnt.', null))
      sqlZulassen(sql)
      zaehler += 1
      const nummer = zaehler
      return new Promise<string[]>((fertig, fehler) => {
        const uhr = setTimeout(() => {
          wartend = null
          kind.kill('SIGTERM')
          fehler(new SitzungsFehler('Zeitlimit überschritten; psql beendet.', null))
        }, zeitlimitMs)
        wartend = {
          nummer,
          fertig: (zeilen) => {
            clearTimeout(uhr)
            fertig(zeilen)
          },
          fehler: (err) => {
            clearTimeout(uhr)
            fehler(err)
          },
        }
        kind.stdin.write(`${sql}\n\\echo ${marke}${nummer}\n`)
      })
    },
    async beenden() {
      if (!beendet) kind.stdin.end('\\q\n')
      return ende
    },
  }
}

export function einzeiligesJson(zeilen: string[]): unknown {
  if (zeilen.length !== 1) {
    throw new Error(`Abgebrochen: unerwartete psql-Ausgabe (${zeilen.length} Zeilen statt 1).`)
  }
  try {
    return JSON.parse(zeilen[0] ?? '')
  } catch {
    throw new Error('Abgebrochen: psql-Ausgabe ist kein JSON.')
  }
}
