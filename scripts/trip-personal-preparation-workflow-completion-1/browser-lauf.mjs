// Einmaliger Nachweis der gemounteten Vorbereitung.
// Der native `npm test`-Lauf startet diesen Browser nicht.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'

const index = process.argv.indexOf('--ausgabe')
const ziel = index >= 0 ? process.argv[index + 1] : ''
if (!ziel) {
  console.error('Aufruf: node scripts/trip-personal-preparation-workflow-completion-1/browser-lauf.mjs --ausgabe <neues Verzeichnis>')
  process.exit(1)
}
if (existsSync(ziel)) {
  console.error(`Ausgabe existiert bereits und wird nicht überschrieben: ${ziel}`)
  process.exit(1)
}
mkdirSync(ziel, { recursive: true })

const dateien = [
  'scripts/trip-personal-preparation-workflow-completion-1/personal-preparation-workflow-ui.test.ts',
  'scripts/trip-personal-preparation-workflow-completion-1/arbeitsbereich.test.ts',
]

const ergebnis = spawnSync(
  'node',
  ['--import', './scripts/server-only-test-register.mjs', '--import', 'tsx', '--test', ...dateien],
  { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
)

const protokoll = `${ergebnis.stdout ?? ''}${ergebnis.stderr ?? ''}`
writeFileSync(`${ziel}/browser-lauf.log`, protokoll)
writeFileSync(`${ziel}/browser-lauf.json`, JSON.stringify({
  befehl: 'node --import ./scripts/server-only-test-register.mjs --import tsx --test ' + dateien.join(' '),
  exit: ergebnis.status,
  signal: ergebnis.signal,
  dateien,
  hinweis: 'Synthetischer lokaler Chromium-Lauf. Kein hosted Account, kein Next-Router, kein Supabase, kein RLS, keine Production.',
}, null, 2))

process.stdout.write(protokoll)
process.exit(ergebnis.status ?? 1)
