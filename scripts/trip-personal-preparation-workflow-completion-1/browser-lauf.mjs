// Einmaliger Nachweis der gemounteten Vorbereitung.
// Der native `npm test`-Lauf startet diesen Browser nicht.
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

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

const suiten = [
  {
    name: 'custom-list-mounted',
    datei: 'scripts/trip-personal-preparation-workflow-completion-1/personal-preparation-workflow-ui.test.ts',
    grenze: 'EigeneReisevorbereitung und Hook über flaeche.tsx. Aufgeschobene Callbacks, ungestyltes HTML, synthetische beispielreise. Kein TripWorkspace, kein Next-Router, kein gehostetes Konto.',
  },
  {
    name: 'actual-workspace',
    datei: 'scripts/trip-personal-preparation-workflow-completion-1/arbeitsbereich.test.ts',
    grenze: 'Echter TripWorkspace, echte Gast-Schreibfunktion und aktiveV3GastreiseLesen, synthetischer Speicher. Der Gastschreiber läuft beim Aufruf; nur die Antwort wird aufgeschoben. Konto-Schreibvorgänge bleiben am Adapter aufgeschoben. Kein Next-Router, kein Supabase, kein RLS, keine Production.',
  },
]

const quellen = [
  'lib/readiness/personal-preparation-workflow.ts',
  'components/trips/usePersonalPreparationLifecycle.ts',
  'components/trips/EigeneReisevorbereitung.tsx',
  'components/trips/TripWorkspace.tsx',
  'components/trips/GastArbeitsbereich.tsx',
  'components/trips/KontoArbeitsbereich.tsx',
  'scripts/trip-personal-preparation-workflow-completion-1/flaeche.tsx',
  'scripts/trip-personal-preparation-workflow-completion-1/arbeitsbereich.tsx',
  'scripts/trip-personal-preparation-workflow-completion-1/personal-preparation-workflow-ui.test.ts',
  'scripts/trip-personal-preparation-workflow-completion-1/arbeitsbereich.test.ts',
]

function git(args) {
  const ergebnis = spawnSync('git', args, { encoding: 'utf8' })
  return ergebnis.status === 0 ? ergebnis.stdout.trim() : null
}

function sha256(inhalt) {
  return createHash('sha256').update(inhalt).digest('hex')
}

function zaehlen(tap) {
  const zahl = (name) => {
    const treffer = tap.match(new RegExp(`^# ${name} (\\d+)`, 'm'))
    return treffer ? Number(treffer[1]) : 0
  }
  const faelle = [...tap.matchAll(/^(not )?ok \d+ - (.+)$/gm)].map((treffer) => ({
    ok: treffer[1] == null,
    name: treffer[2],
  }))
  return {
    tests: zahl('tests'),
    pass: zahl('pass'),
    fail: zahl('fail'),
    cancelled: zahl('cancelled'),
    skipped: zahl('skipped'),
    todo: zahl('todo'),
    faelle,
  }
}

const laeufe = []
let gesamtExit = 0
const texte = []

for (const suite of suiten) {
  const ergebnis = spawnSync(
    'node',
    ['--import', './scripts/server-only-test-register.mjs', '--import', 'tsx', '--test', '--test-reporter', 'tap', suite.datei],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  )
  const protokoll = `${ergebnis.stdout ?? ''}${ergebnis.stderr ?? ''}`
  const datei = `${suite.name}.txt`
  writeFileSync(`${ziel}/${datei}`, protokoll)
  const z = zaehlen(ergebnis.stdout ?? '')
  const quelle = suite.name === 'custom-list-mounted'
    ? z.faelle.filter((fall) => fall.name.includes('production wiring')).length
    : 0
  laeufe.push({
    name: suite.name,
    datei: suite.datei,
    reporter: 'tap',
    protokoll: datei,
    befehl: `node --import ./scripts/server-only-test-register.mjs --import tsx --test --test-reporter tap ${suite.datei}`,
    exit: ergebnis.status,
    signal: ergebnis.signal,
    zaehlung: z,
    mounted: suite.name === 'custom-list-mounted' ? z.tests - quelle : z.tests,
    sourcePattern: quelle,
    grenze: suite.grenze,
    styling: 'unstyled HTML; project CSS is recorded by ablauf.ts',
  })
  texte.push(`# ${suite.name} exit ${ergebnis.status}\n${protokoll}`)
  if ((ergebnis.status ?? 1) !== 0) gesamtExit = ergebnis.status ?? 1
}

const bericht = {
  autor: 'Jetnity Trip Personal Preparation Workflow Completion 1 — Cursor Generation 1',
  session: 'bc-6bbca11e-14c9-4f1a-ac07-e729d8a54ca3',
  modell: 'grok-4.7-high-fast',
  kopf: git(['rev-parse', 'HEAD']),
  main: git(['rev-parse', 'origin/main']),
  mergeBase: git(['merge-base', 'HEAD', 'origin/main']),
  node: process.version,
  exit: gesamtExit,
  hinweis: 'Getrennte Läufe. Die custom-list-Suite enthält einen Quelltextvergleich ohne Browser. Das ist kein hosted Account, kein Next-Router, kein Supabase, kein RLS und keine Production. CSS-Matrix steht separat in ablauf.json.',
  quellen: Object.fromEntries(quellen.map((pfad) => {
    const inhalt = readFileSync(pfad)
    return [pfad, { sha256: sha256(inhalt), blob: git(['hash-object', pfad]) }]
  })),
  laeufe,
}

writeFileSync(`${ziel}/browser-lauf.txt`, texte.join('\n'))
writeFileSync(`${ziel}/browser-lauf.json`, `${JSON.stringify(bericht, null, 2)}\n`)
process.stdout.write(texte.join('\n'))
process.exit(gesamtExit)
