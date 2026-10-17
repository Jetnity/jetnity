// scripts/dev-reference-local-pg-prep-1/ziel.ts
//
// Ein einziges, wörtlich festes Ziel: der Development-Branch
// yfvbxvijcorffwxbxahl. Host, Port, Datenbank, Benutzer und SSL-Modus
// kommen nie aus Argumenten oder Umgebung.
//
// Umgebungsvariablen werden nur nach ihrem Namen geprüft, ihr Wert wird
// nie gelesen. Passwörter gehen ausschliesslich über die maskierte
// /dev/tty-Abfrage von psql selbst.
//
// psql: nur das Homebrew-libpq-Binary. Ein anderes Programm könnte argv,
// Ziel und TLS ignorieren; deshalb hängt jede andere Sicherung hiervon ab.

import { spawnSync } from 'node:child_process'
import { lstatSync, readFileSync, realpathSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve } from 'node:path'

export const ZIEL = Object.freeze({
  projektRef: 'yfvbxvijcorffwxbxahl',
  host: 'db.yfvbxvijcorffwxbxahl.supabase.co',
  port: 5432,
  datenbank: 'postgres',
  benutzer: 'postgres',
  sslmode: 'verify-full',
} as const)

export type Ziel = typeof ZIEL

export const PRODUCTION_REF = 'qscbgcdmivbbnzrcyegn'

export const SCHREIBMODUS = 'schreiben-entwicklung-psql'

// Nur der verbundene Lauf. Eine eigenständige Orts-Stufe könnte auf einem
// unvollständigen Flughafenbestand aufsetzen.
export type Stufe = 'beide'

export type PlanAuftrag = {
  modus: 'plan'
  quelleFlughaefen: string | null
  quelleOrte: string | null
}

export type SchreibAuftrag = {
  modus: typeof SCHREIBMODUS
  stufe: Stufe
  psql: string
  ca: string
  journal: string
  quelleFlughaefen: string
  quelleOrte: string
}

export type Auftrag = PlanAuftrag | SchreibAuftrag

const PLAN_FLAGS = new Set(['modus', 'quelle-flughaefen', 'quelle-orte'])
const SCHREIB_FLAGS = new Set([...PLAN_FLAGS, 'stufe', 'psql', 'ca', 'journal'])

const UMGEBUNG_VERBOTEN = new Set([
  'DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING',
  'SUPABASE_DB_URL',
  'SUPABASE_DB_PASSWORD',
  'PSQLRC',
  'PSQL_HISTORY',
  'PSQL_PAGER',
  'CI',
])

// Absolute Pfade ohne Leerzeichen, Anführungszeichen oder Steuerzeichen.
// So braucht der conninfo-Text kein Quoting, das falsch sein könnte.
const SICHERER_PFAD = /^\/[A-Za-z0-9._@+/-]+$/

function fehler(meldung: string): never {
  throw new Error(`Abgebrochen: ${meldung}`)
}

export function argumenteLesen(argv: readonly string[]): Auftrag {
  const werte = new Map<string, string>()
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i] ?? ''
    if (!flag.startsWith('--') || flag.length < 3) {
      fehler(`unerwartetes Argument an Position ${i + 1}. Nur --name wert ist erlaubt.`)
    }
    const name = flag.slice(2)
    const wert = argv[i + 1]
    if (wert === undefined || wert.startsWith('-') || wert.trim() !== wert || wert === '') {
      fehler(`--${name} braucht genau einen Wert.`)
    }
    if (werte.has(name)) fehler(`--${name} ist doppelt angegeben.`)
    werte.set(name, wert)
  }

  for (const wert of [...werte.values()]) {
    if (wert.includes(PRODUCTION_REF)) fehler('der Production-Ref ist in keinem Argument erlaubt.')
    if (/:\/\//.test(wert) || /\bhost\s*=/.test(wert)) {
      fehler('Verbindungs-URIs oder conninfo-Texte sind nicht erlaubt; das Ziel ist fest.')
    }
  }

  const modus = werte.get('modus') ?? 'plan'
  if (modus === 'plan') {
    for (const name of werte.keys()) {
      if (!PLAN_FLAGS.has(name)) fehler(`--${name} ist im Plan-Modus nicht erlaubt.`)
    }
    return {
      modus: 'plan',
      quelleFlughaefen: werte.get('quelle-flughaefen') ?? null,
      quelleOrte: werte.get('quelle-orte') ?? null,
    }
  }

  if (modus !== SCHREIBMODUS) fehler(`--modus kennt nur plan oder ${SCHREIBMODUS}.`)
  for (const name of werte.keys()) {
    if (!SCHREIB_FLAGS.has(name)) fehler(`--${name} ist nicht erlaubt.`)
  }

  if (werte.get('stufe') !== 'beide') {
    fehler('--stufe muss beide sein. Getrennte Flughafen- oder Orts-Läufe sind gesperrt.')
  }
  const psql = werte.get('psql') ?? fehler('--psql <absoluter Pfad> fehlt.')
  const ca = werte.get('ca') ?? fehler('--ca <absoluter Pfad zum offiziellen CA-Zertifikat> fehlt.')
  const journal = werte.get('journal') ?? fehler('--journal <absoluter Pfad> fehlt.')
  const quelleFlughaefen = werte.get('quelle-flughaefen') ?? fehler('--quelle-flughaefen fehlt.')
  const quelleOrte = werte.get('quelle-orte') ?? fehler('--quelle-orte fehlt.')

  return { modus: SCHREIBMODUS, stufe: 'beide', psql, ca, journal, quelleFlughaefen, quelleOrte }
}

export function umgebungPruefen(namen: readonly string[]): void {
  const treffer = namen.filter((name) => name.startsWith('PG') || UMGEBUNG_VERBOTEN.has(name))
  if (treffer.length > 0) {
    fehler(
      `Umgebung enthält ${[...new Set(treffer)].sort().join(', ')}. ` +
        'Diese Namen dürfen nicht gesetzt sein; Werte werden nicht gelesen.',
    )
  }
}

export type Terminal = {
  stdinTty: boolean
  stdoutTty: boolean
  stderrTty: boolean
  devTtyOeffnenbar: boolean
}

export function terminalPruefen(terminal: Terminal): void {
  if (!terminal.stdinTty || !terminal.stdoutTty || !terminal.stderrTty) {
    fehler('kein interaktives Terminal. Schreiben läuft nur in einer privaten TTY-Sitzung.')
  }
  if (!terminal.devTtyOeffnenbar) {
    fehler('/dev/tty ist nicht verfügbar. psql würde das Passwort sonst über stdin lesen.')
  }
}

function innerhalb(wurzel: string, pfad: string): boolean {
  const rel = relative(wurzel, pfad)
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
}

function sichererAbsoluterPfad(name: string, pfad: string): string {
  if (!isAbsolute(pfad) || !SICHERER_PFAD.test(pfad) || resolve(pfad) !== pfad) {
    fehler(`${name} muss ein normalisierter absoluter Pfad ohne Leerzeichen oder Sonderzeichen sein.`)
  }
  return pfad
}

// Nur über psqlPfadPruefen erzeugbar. Offline-Tests casten bewusst und sichtbar.
export type VertrauenswuerdigesPsql = string & { readonly __vertrauenswuerdigesPsql: true }

export type PsqlVertrauen = {
  libpqWurzeln: readonly string[]
  erlaubteUids: readonly number[]
  versionLesen: (pfad: string) => string
}

function versionAusBinary(pfad: string): string {
  const ergebnis = spawnSync(pfad, ['--version'], {
    env: { PATH: '/usr/bin:/bin', LC_ALL: 'C' } as Record<string, string> as NodeJS.ProcessEnv,
    encoding: 'utf8',
    timeout: 5_000,
    shell: false,
  })
  if (ergebnis.status !== 0) fehler('psql --version schlug fehl.')
  return ergebnis.stdout.trim()
}

export const PSQL_VERTRAUEN: PsqlVertrauen = Object.freeze({
  libpqWurzeln: Object.freeze(['/opt/homebrew/Cellar/libpq', '/usr/local/Cellar/libpq']),
  erlaubteUids: Object.freeze([process.getuid?.() ?? -1, 0]),
  versionLesen: versionAusBinary,
})

const PSQL_MINDEST_MAJOR = 16

function nichtFremdBeschreibbar(pfad: string, vertrauen: PsqlVertrauen): void {
  const info = lstatSync(pfad)
  if (info.isSymbolicLink()) fehler('psql-Pfad enthält einen symbolischen Link nach der Auflösung.')
  if (!vertrauen.erlaubteUids.includes(info.uid)) fehler('psql-Pfad gehört weder dir noch root.')
  if ((info.mode & 0o022) !== 0) fehler('psql-Pfad ist für Gruppe oder andere beschreibbar.')
}

export function psqlPfadPruefen(
  pfad: string,
  repoWurzel: string,
  vertrauen: PsqlVertrauen = PSQL_VERTRAUEN,
): VertrauenswuerdigesPsql {
  sichererAbsoluterPfad('--psql', pfad)
  let echt: string
  try {
    echt = realpathSync(pfad)
  } catch {
    fehler('--psql existiert nicht.')
  }
  if (innerhalb(realpathSync(repoWurzel), echt)) {
    fehler('--psql darf nicht aus dem Repository kommen. Nur ein lokal installiertes psql.')
  }

  let wurzel: string | null = null
  let cellarVersion: string | null = null
  for (const kandidat of vertrauen.libpqWurzeln) {
    const treffer = new RegExp(
      `^${kandidat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/(\\d+\\.\\d+(?:\\.\\d+)?(?:_\\d+)?)/bin/psql$`,
    ).exec(echt)
    if (treffer) {
      wurzel = kandidat
      cellarVersion = treffer[1] ?? null
      break
    }
  }
  if (!wurzel || !cellarVersion) {
    fehler('--psql ist kein vertrauenswürdiges Homebrew-libpq-psql (…/Cellar/libpq/<Version>/bin/psql).')
  }

  const datei = lstatSync(echt)
  if (!datei.isFile() || (datei.mode & 0o111) === 0) fehler('--psql ist keine ausführbare Datei.')
  for (let teil = echt; ; teil = dirname(teil)) {
    nichtFremdBeschreibbar(teil, vertrauen)
    if (teil === wurzel) break
    if (teil === dirname(teil)) fehler('psql liegt nicht unter der libpq-Wurzel.')
  }

  const version = /^psql \(PostgreSQL\) (\d+)\.(\d+)\b/.exec(vertrauen.versionLesen(echt))
  const [cellarMajor, cellarMinor] = cellarVersion.split(/[._]/)
  if (!version) fehler('psql meldet keine erkennbare Version.')
  if (Number(version[1]) < PSQL_MINDEST_MAJOR) fehler(`psql ist älter als ${PSQL_MINDEST_MAJOR}.`)
  if (version[1] !== cellarMajor || version[2] !== cellarMinor) {
    fehler('psql-Version passt nicht zum Homebrew-Verzeichnis.')
  }
  return echt as VertrauenswuerdigesPsql
}

export function caPfadPruefen(pfad: string): string {
  sichererAbsoluterPfad('--ca', pfad)
  let info
  try {
    info = lstatSync(pfad)
  } catch {
    fehler('CA-Zertifikat fehlt.')
  }
  if (!info.isFile()) fehler('--ca ist keine reguläre Datei.')
  if (info.size < 200 || info.size > 64 * 1024) fehler('--ca hat keine plausible Zertifikatsgrösse.')
  // Öffentliches Zertifikat: nur Form prüfen, Inhalt weder loggen noch kopieren.
  const text = readFileSync(pfad, 'utf8')
  if (!text.includes('-----BEGIN CERTIFICATE-----')) fehler('--ca enthält kein PEM-Zertifikat.')
  if (/PRIVATE KEY/.test(text)) fehler('--ca enthält einen privaten Schlüssel. Abgebrochen.')
  return pfad
}

export function journalPfadPruefen(pfad: string, repoWurzel: string): string {
  sichererAbsoluterPfad('--journal', pfad)
  if (innerhalb(resolve(repoWurzel), pfad)) {
    fehler('--journal darf nicht im Repository liegen.')
  }
  return pfad
}

// Reihenfolge: erst Umgebung und Terminal, dann Dateien. Kein Netzwerk.
export function schreibauftragPruefen(
  auftrag: SchreibAuftrag,
  umgebungsNamen: readonly string[],
  terminal: Terminal,
  repoWurzel: string,
  vertrauen: PsqlVertrauen = PSQL_VERTRAUEN,
): { psql: VertrauenswuerdigesPsql; ca: string; journal: string } {
  umgebungPruefen(umgebungsNamen)
  terminalPruefen(terminal)
  return {
    psql: psqlPfadPruefen(auftrag.psql, repoWurzel, vertrauen),
    ca: caPfadPruefen(auftrag.ca),
    journal: journalPfadPruefen(auftrag.journal, repoWurzel),
  }
}

export function zielIstFest(ziel: Ziel): void {
  const erwartet = JSON.stringify(ZIEL)
  if (JSON.stringify(ziel) !== erwartet || !Object.isFrozen(ziel)) {
    fehler('Ziel weicht vom festen Development-Ziel ab.')
  }
  if (JSON.stringify(ziel).includes(PRODUCTION_REF)) fehler('Production-Ziel.')
}
