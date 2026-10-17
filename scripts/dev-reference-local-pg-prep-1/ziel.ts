// scripts/dev-reference-local-pg-prep-1/ziel.ts
//
// Ein einziges, wörtlich festes Ziel: der Development-Branch
// yfvbxvijcorffwxbxahl. Host, Port, Datenbank, Benutzer und SSL-Modus
// kommen nie aus Argumenten oder Umgebung.
//
// Umgebungsvariablen werden nur nach ihrem Namen geprüft, ihr Wert wird
// nie gelesen. Passwörter gehen ausschliesslich über die maskierte
// /dev/tty-Abfrage von psql selbst.

import { lstatSync, readFileSync, realpathSync } from 'node:fs'
import { isAbsolute, relative, resolve } from 'node:path'

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

export type Stufe = 'flughaefen' | 'orte' | 'beide'

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
  quelleFlughaefen: string | null
  quelleOrte: string | null
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

  const stufe = werte.get('stufe')
  if (stufe !== 'flughaefen' && stufe !== 'orte' && stufe !== 'beide') {
    fehler('--stufe muss flughaefen, orte oder beide sein.')
  }
  const psql = werte.get('psql') ?? fehler('--psql <absoluter Pfad> fehlt.')
  const ca = werte.get('ca') ?? fehler('--ca <absoluter Pfad zum offiziellen CA-Zertifikat> fehlt.')
  const journal = werte.get('journal') ?? fehler('--journal <absoluter Pfad> fehlt.')
  const quelleFlughaefen = werte.get('quelle-flughaefen') ?? null
  const quelleOrte = werte.get('quelle-orte') ?? null
  if (stufe !== 'orte' && !quelleFlughaefen) fehler('--quelle-flughaefen fehlt.')
  if (stufe !== 'flughaefen' && !quelleOrte) fehler('--quelle-orte fehlt.')

  return { modus: SCHREIBMODUS, stufe, psql, ca, journal, quelleFlughaefen, quelleOrte }
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

export function psqlPfadPruefen(pfad: string, repoWurzel: string): string {
  sichererAbsoluterPfad('--psql', pfad)
  let echt: string
  try {
    echt = realpathSync(pfad)
  } catch {
    fehler('--psql existiert nicht.')
  }
  const info = lstatSync(echt)
  if (!info.isFile() || (info.mode & 0o111) === 0) fehler('--psql ist keine ausführbare Datei.')
  if (innerhalb(realpathSync(repoWurzel), echt)) {
    fehler('--psql darf nicht aus dem Repository kommen. Nur ein lokal installiertes psql.')
  }
  return echt
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
): { psql: string; ca: string; journal: string } {
  umgebungPruefen(umgebungsNamen)
  terminalPruefen(terminal)
  return {
    psql: psqlPfadPruefen(auftrag.psql, repoWurzel),
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
