// Nur für nativ.test.ts. Nimmt das unveränderte Produktions-argv aus
// psqlArgumente() entgegen, prüft es exakt und startet das echte psql gegen
// einen eigenen Wegwerf-Cluster über einen privaten Unix-Socket.
//
// Ersetzt werden ausschliesslich --dbname (Supabase-Host → eigener Socket)
// und --password (lokal gilt trust; die Abfrage bräuchte /dev/tty).
// Kein TCP, kein Hostname, keine Zugangsdaten.
//
// Aufruf über einen Wrapper: node nativ-psql-umleitung.mjs <config.json> <argv...>

import { spawn } from 'node:child_process'
import { appendFileSync, existsSync, readFileSync } from 'node:fs'

function abbrechen(grund) {
  process.stderr.write(`nativ-psql-umleitung: ${grund}\n`)
  process.exit(97)
}

const [, , configPfad, ...argv] = process.argv
const config = JSON.parse(readFileSync(configPfad, 'utf8'))

if (JSON.stringify(argv) !== JSON.stringify(config.erwartet)) abbrechen('argv weicht vom Produktions-argv ab')

const socket = config.socket
if (typeof socket !== 'string' || !socket.startsWith(config.wurzel + '/')) abbrechen('Socket liegt nicht im eigenen Cluster')
if (!existsSync(`${socket}/.s.PGSQL.${config.port}`)) abbrechen('eigener Socket fehlt')

const ziel = `host=${socket} port=${config.port} dbname=postgres user=postgres connect_timeout=5 application_name=${config.anwendung}`
const echt = argv
  .filter((arg) => arg !== '--password')
  .map((arg) => (arg.startsWith('--dbname=') ? `--dbname=${ziel}` : arg))

if (echt.some((arg) => /supabase|sslrootcert|hostaddr|:\/\//i.test(arg))) abbrechen('fremdes Ziel im echten argv')
if (echt.filter((arg) => arg.startsWith('--dbname=')).length !== 1) abbrechen('genau ein --dbname erwartet')

const verbindungsNamen = Object.keys(process.env).filter((name) =>
  /^(PGHOST|PGHOSTADDR|PGPORT|PGDATABASE|PGUSER|PGPASSWORD|PGSERVICE|PGSSLMODE|DATABASE_URL)$/.test(name),
)
if (verbindungsNamen.length > 0) abbrechen('Verbindungs-Variable in der Umgebung')

appendFileSync(config.log, `${JSON.stringify({ argv: echt, umgebung: Object.keys(process.env).sort() })}\n`)

const kind = spawn(config.psql, echt, { stdio: 'inherit', env: process.env, shell: false })
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => kind.kill(signal))
kind.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)))
kind.on('error', () => abbrechen('psql nicht startbar'))
