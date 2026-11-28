#!/usr/bin/env node
// scripts/premium-redesign-a/konto-harness.mjs
//
// Lokaler Prüfstand für /account. Die Route liegt hinter der Anmeldung und wird nicht
// umgangen. Dieser Prüfstand rendert die echten Komponenten (WorkspaceShell, KontoStart)
// mit dem echten Projekt-CSS und denselben lokalen Ersatzmodulen wie der White-Mint-Test.
//
//   node --import tsx scripts/premium-redesign-a/konto-harness.mjs [Port] [Fixture-Ordner] [Fixture-Name]
//
// Weitere Seiten: /account/merkliste (synthetische Angebote) und /account/settings (Darstellungswahl).
// Dritte Seite: /reisen – «Meine Reisen» mit der echten Sammlung (Alle/Offen/Archiv) und synthetischen
// Konto-Reisen; die Auswahl wechselt die Adresse und die Liste folgt ihr wie auf dem Server.
//
// Zweite Seite: /reisen/konto – dieselbe Shell mit einer Konto-Reise (Reisebegleiter,
// «Reise ändern», Speicherhinweis «Im Konto gespeichert»), Reise aus dem Fixture-Ordner.
//
// Aus dem Arbeitsverzeichnis des geprüften Stands starten (Vorher: Worktree der Basis).

import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as esbuild from 'esbuild'

const wurzel = process.cwd()
const verlangen = createRequire(join(wurzel, 'package.json'))
const port = Number(process.argv[2] ?? 3470)
const fixtureOrdner = process.argv[3] ?? '/tmp/pra/fixtures'
const fixtureName = process.argv[4] ?? 'thailand'

const { atlasServerActions } = await import(join(wurzel, 'scripts/trip-plan-browser/server-actions.ts'))

async function css() {
  const postcss = verlangen('postcss')
  const nesting = verlangen('tailwindcss/nesting')
  const tailwindcss = verlangen('tailwindcss')
  const autoprefixer = verlangen('autoprefixer')
  const von = join(wurzel, 'styles/globals.css')
  const config = verlangen(join(wurzel, 'tailwind.config.js'))
  const ergebnis = await postcss([nesting(), tailwindcss(config), autoprefixer()]).process(readFileSync(von, 'utf8'), { from: von })
  // Fehlt eine Datei in einem älteren Stand (Vorher-Prüfstand), steht an ihrer Stelle nichts.
  const lesen = (pfad) => {
    try {
      return readFileSync(join(wurzel, pfad), 'utf8')
    } catch {
      return ''
    }
  }
  // Reihenfolge wie im echten Build (app/layout.tsx: globals, white-mint, startseite; danach die Shell-Stylesheets der
  // WorkspaceShell, dann die Route-Stylesheets). Bei gleicher Spezifität entscheidet die Reihenfolge; eine andere
  // Reihenfolge im Prüfstand würde Ergebnisse liefern, die der Build nicht zeigt.
  return [
    ergebnis.css,
    lesen('styles/white-mint.css'),
    lesen('styles/startseite.css'),
    lesen('components/workspace/workspace.css'),
    lesen('components/workspace/workspace-surfaces.css'),
    lesen('components/trips/reiseplan/etappen.css'),
    lesen('components/trips/kostenkarte.css'),
    lesen('components/trips/organisieren/auswahl/suchauswahl.css'),
  ].join('\n').replaceAll('</style', '<\\/style')
}

async function skript(eintrag = 'konto-harness.tsx') {
  const ersatz = (name) => join(wurzel, 'lib/ui/white-mint-home-workspace-1', name)
  const gebaut = await esbuild.build({
    absWorkingDir: wurzel,
    entryPoints: [join(wurzel, 'scripts/premium-redesign-a', eintrag)],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"' },
    banner: { js: 'var __name=(target)=>target;globalThis.process=globalThis.process||{env:{NODE_ENV:"production"}};globalThis.global=globalThis;' },
    plugins: [
      atlasServerActions,
      {
        name: 'konto-ersatzmodule',
        setup(build) {
          build.onResolve({ filter: /^next\/link$/ }, () => ({ path: ersatz('link.tsx') }))
          build.onResolve({ filter: /^next\/image$/ }, () => ({ path: ersatz('image.tsx') }))
          build.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: ersatz('navigation.tsx') }))
          build.onResolve({ filter: /^next\/dynamic$/ }, () => ({ path: ersatz('dynamic-stub.tsx') }))
          build.onResolve({ filter: /\.css$/ }, (args) => ({ path: args.path, namespace: 'css-leer' }))
          build.onLoad({ filter: /.*/, namespace: 'css-leer' }, () => ({ contents: '', loader: 'js' }))
          build.onResolve({ filter: /^@\// }, (args) => {
            if (args.path === '@/app/auth/sign-out') return { path: ersatz('sign-out-stub.ts') }
            if (args.path === '@/lib/supabase/client') return { path: ersatz('supabase-stub.ts') }
            if (args.path === '@/lib/reiseaenderung/aktionen' || args.path === '@/lib/places/aktionen') return { path: ersatz('server-action-stub.ts') }
            if (args.path === '@/lib/trips/archiv-aktionen') return { path: join(wurzel, 'scripts/premium-redesign-a/aktionen-stub.ts') }
            if (args.path === '@/lib/reisebegleiter/aktionen') return { path: join(wurzel, 'scripts/premium-redesign-a/aktionen-stub.ts') }
            return build.resolve(join(wurzel, args.path.slice(2)), { resolveDir: wurzel, kind: args.kind })
          })
        },
      },
    ],
  })
  return gebaut.outputFiles[0].text
}

const stil = await css()
function seite(skriptText, vorspann = '') {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><style>${stil}</style></head><body><div id="root"></div><script>${vorspann}</script><script>${skriptText}</script></body></html>`
}
const kontoSeite = seite(await skript())
const merklisteSeite = seite(await skript('merkliste-harness.tsx'))
const einstellungenSeite = seite(await skript('einstellungen-harness.tsx'))
const fixture = JSON.parse(readFileSync(join(fixtureOrdner, `${fixtureName}.json`), 'utf8'))
const fixtureVorspann = `globalThis.__REISE__ = ${JSON.stringify(JSON.parse(fixture.roh)).replaceAll('<', '\\u003c')}`
const reiseSeite = seite(await skript('reise-konto-harness.tsx'), fixtureVorspann)
const sammlungSeite = seite(await skript('sammlung-harness.tsx'), fixtureVorspann)

createServer((anfrage, antwort) => {
  if (anfrage.url?.startsWith('/brand/') || anfrage.url?.startsWith('/images/')) {
    try {
      const datei = readFileSync(join(wurzel, 'public', anfrage.url.split('?')[0]))
      antwort.writeHead(200).end(datei)
      return
    } catch {
      antwort.writeHead(404).end()
      return
    }
  }
  const pfad = anfrage.url?.split('?')[0] ?? '/'
  const inhalt =
    pfad === '/reisen' ? sammlungSeite
      : pfad.startsWith('/reisen') ? reiseSeite
        : pfad === '/account/merkliste' ? merklisteSeite
          : pfad === '/account/settings' ? einstellungenSeite
            : kontoSeite
  antwort.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(inhalt)
}).listen(port, '127.0.0.1', () => console.log(`Konto-Prüfstand auf http://127.0.0.1:${port}/account, /account/merkliste, /account/settings, /reisen (Meine Reisen) und /reisen/konto`))
