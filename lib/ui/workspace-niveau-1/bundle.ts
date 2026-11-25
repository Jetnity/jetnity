import { atlasServerActions } from '@/scripts/trip-plan-browser/server-actions'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import * as esbuild from 'esbuild'

/**
 * Bündelt den echten Gast-Arbeitsbereich (Harness der Weiss-Mint-Prüfung) und das Projekt-CSS
 * für den Browsertest. Die CSS-Dateien stehen in der Reihenfolge, in der die App sie lädt:
 * Wurzel-Layout, Reise-Layout, Arbeitsbereich.
 */
const HARNESS = 'lib/ui/white-mint-home-workspace-1/harness.tsx'
const SHIMS = 'lib/ui/white-mint-home-workspace-1'

const CSS_DATEIEN = [
  'node_modules/leaflet/dist/leaflet.css',
  'components/trips/organisieren/auswahl/suchauswahl.css',
  'components/trips/reiseplan/etappen.css',
  'components/trips/reiseplan/etappen-tage.css',
  'components/trips/reiseplan/kartenauswahl.css',
  'components/trips/organisieren/omio/vergleich.css',
  'components/trips/organisieren/organisieren.css',
  'components/trips/organisieren/hotelsuche.css',
  'components/trips/organisieren/fluege/flugsuche.css',
  'components/trips/reisekarte/reisekarte.css',
  'components/trips/multi-stop-create-day-allocation-1/allocation.css',
  'components/readiness/at-visitor-preview.css',
  'components/workspace/workspace.css',
  'components/workspace/workspace-surfaces.css',
  'components/workspace/workspace-niveau.css',
  'styles/white-mint.css',
  'styles/startseite.css',
] as const

export async function projektCss() {
  const verlangen = createRequire(import.meta.url)
  const postcss = verlangen('postcss') as (plugins: unknown[]) => {
    process: (css: string, opts: { from: string }) => Promise<{ css: string }>
  }
  const nesting = verlangen('tailwindcss/nesting') as () => unknown
  const tailwindcss = verlangen('tailwindcss') as (config: unknown) => unknown
  const autoprefixer = verlangen('autoprefixer') as () => unknown
  const von = join(process.cwd(), 'styles/globals.css')
  const config = verlangen(join(process.cwd(), 'tailwind.config.js')) as unknown
  const basis = await postcss([nesting(), tailwindcss(config), autoprefixer()]).process(readFileSync(von, 'utf8'), { from: von })
  const teile = CSS_DATEIEN.map((datei) => readFileSync(join(process.cwd(), datei), 'utf8'))
  return [basis.css, ...teile].join('\n').replaceAll('</style', '<\\/style')
}

export const ANBIETER_RAHMEN = 'http://localhost:3999'

/** `mitAnbieter`: Flugvergleich mit Anbieterrahmen (Production-Pfad); sonst die Flugsuche ohne Anbieter. */
export async function bundeln(mitAnbieter: boolean) {
  const wurzel = process.cwd()
  const gebaut = await esbuild.build({
    absWorkingDir: wurzel,
    entryPoints: [HARNESS],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    define: {
      'process.env.NODE_ENV': '"production"',
      'process.env.NEXT_PUBLIC_TRAVELPAYOUTS_FRAME_ORIGIN': mitAnbieter ? JSON.stringify(ANBIETER_RAHMEN) : '""',
    },
    banner: { js: 'var __name=(target)=>target;globalThis.process=globalThis.process||{env:{NODE_ENV:"production"}};globalThis.global=globalThis;' },
    plugins: [
      atlasServerActions,
      {
        name: 'workspace-niveau-shims',
        setup(build) {
          const datei = (name: string) => join(wurzel, SHIMS, name)
          build.onResolve({ filter: /^next\/link$/ }, () => ({ path: datei('link.tsx') }))
          build.onResolve({ filter: /^next\/image$/ }, () => ({ path: datei('image.tsx') }))
          build.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: datei('navigation.tsx') }))
          build.onResolve({ filter: /^next\/dynamic$/ }, () => ({ path: join(wurzel, 'lib/ui/workspace-niveau-1/dynamic-geladen.tsx') }))
          build.onResolve({ filter: /\.css$/ }, (args) => ({ path: args.path, namespace: 'css-leer' }))
          build.onLoad({ filter: /.*/, namespace: 'css-leer' }, () => ({ contents: '', loader: 'js' }))
          build.onResolve({ filter: /^@\// }, (args) => {
            if (args.path === '@/app/auth/sign-out') return { path: datei('sign-out-stub.ts') }
            if (args.path === '@/lib/inspiration/cms-public-server') return { path: datei('inspiration-server-stub.ts') }
            if (args.path === '@/lib/supabase/client') return { path: datei('supabase-stub.ts') }
            if (args.path === '@/lib/reiseaenderung/aktionen' || args.path === '@/lib/places/aktionen') {
              return { path: datei('server-action-stub.ts') }
            }
            return build.resolve(join(wurzel, args.path.slice(2)), { resolveDir: wurzel, kind: args.kind })
          })
        },
      },
    ],
  })
  const js = gebaut.outputFiles[0]?.text
  if (!js) throw new Error('workspace-niveau bundle was empty')
  return js
}

export function dokument(css: string, js: string) {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><style>${css}</style></head><body><div id="root"></div><script>${js.replaceAll('</script', '<\\/script')}</script></body></html>`
}
