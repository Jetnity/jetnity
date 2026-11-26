#!/usr/bin/env node
// scripts/premium-redesign-a/konto-harness.mjs
//
// Lokaler Prüfstand für /account. Die Route liegt hinter der Anmeldung und wird nicht
// umgangen. Dieser Prüfstand rendert die echten Komponenten (WorkspaceShell, KontoStart)
// mit dem echten Projekt-CSS und denselben lokalen Ersatzmodulen wie der White-Mint-Test.
//
//   node --import tsx scripts/premium-redesign-a/konto-harness.mjs [Port]
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

const { atlasServerActions } = await import(join(wurzel, 'scripts/trip-plan-browser/server-actions.ts'))

async function css() {
  const postcss = verlangen('postcss')
  const nesting = verlangen('tailwindcss/nesting')
  const tailwindcss = verlangen('tailwindcss')
  const autoprefixer = verlangen('autoprefixer')
  const von = join(wurzel, 'styles/globals.css')
  const config = verlangen(join(wurzel, 'tailwind.config.js'))
  const ergebnis = await postcss([nesting(), tailwindcss(config), autoprefixer()]).process(readFileSync(von, 'utf8'), { from: von })
  const lesen = (pfad) => readFileSync(join(wurzel, pfad), 'utf8')
  return [
    ergebnis.css,
    lesen('components/workspace/workspace.css'),
    lesen('components/workspace/workspace-surfaces.css'),
    lesen('components/trips/reiseplan/etappen.css'),
    lesen('styles/white-mint.css'),
    lesen('styles/startseite.css'),
    lesen('components/trips/organisieren/auswahl/suchauswahl.css'),
  ].join('\n').replaceAll('</style', '<\\/style')
}

async function skript() {
  const ersatz = (name) => join(wurzel, 'lib/ui/white-mint-home-workspace-1', name)
  const gebaut = await esbuild.build({
    absWorkingDir: wurzel,
    entryPoints: [join(wurzel, 'scripts/premium-redesign-a/konto-harness.tsx')],
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
            return build.resolve(join(wurzel, args.path.slice(2)), { resolveDir: wurzel, kind: args.kind })
          })
        },
      },
    ],
  })
  return gebaut.outputFiles[0].text
}

const dokument = `<!doctype html><html lang="de"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><style>${await css()}</style></head><body><div id="root"></div><script>${await skript()}</script></body></html>`

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
  antwort.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(dokument)
}).listen(port, '127.0.0.1', () => console.log(`Konto-Prüfstand auf http://127.0.0.1:${port}/account`))
