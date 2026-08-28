import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

const FACTORY_AUFRUF =
  /create(?:ServerComponent|RouteHandler|ServerAction)Client(?:<[^>\n]+>)?\(\)/g

const IGNORIERTE_RELATIVE = new Set([
  'lib/supabase/server.ts',
  'check-jetnity-setup.ts',
])

function dateienSammeln(ordner: string, acc: string[] = []): string[] {
  for (const eintrag of readdirSync(ordner)) {
    if (eintrag === 'node_modules' || eintrag.startsWith('.')) continue
    const pfad = join(ordner, eintrag)
    const info = statSync(pfad)
    if (info.isDirectory()) dateienSammeln(pfad, acc)
    else if (/\.(ts|tsx)$/.test(eintrag) && !eintrag.endsWith('.test.ts')) acc.push(pfad)
  }
  return acc
}

function quelle(relativ: string) {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

function zeileZu(index: number, text: string) {
  return text.slice(0, index).split('\n').length
}

function istKommentarzeile(zeile: string) {
  const schnitt = zeile.trimStart()
  return schnitt.startsWith('//') || schnitt.startsWith('*') || schnitt.startsWith('/*')
}

describe('Supabase Server-Factories sind async-kompatibel', () => {
  test('die drei Factories awaited cookies() und bleiben typisiert', () => {
    const datei = quelle('lib/supabase/server.ts')
    assert.match(datei, /type CookieStore = Awaited<ReturnType<typeof cookies>>/)
    assert.match(
      datei,
      /export async function createServerComponentClient[\s\S]*Promise<SupabaseClient/,
    )
    assert.match(
      datei,
      /export async function createRouteHandlerClient[\s\S]*Promise<SupabaseClient/,
    )
    assert.match(
      datei,
      /export async function createServerActionClient[\s\S]*Promise<SupabaseClient/,
    )
    assert.equal((datei.match(/const store = await cookies\(\)/g) ?? []).length, 3)
    assert.equal(datei.includes('const store = cookies()'), false)
    assert.match(datei, /\/\* no-op in RSC \*\//)
    assert.match(datei, /store\.set\(\{ name, value, \.\.\.options \}\)/)
    assert.match(datei, /export \{ createServerComponentClient as createServerClient \}/)
    assert.equal(datei.includes('@ts-expect-error'), false)
    assert.equal(/\bas unknown as any\b/.test(datei), false)
  })

  test('kein Caller reicht eine Factory-Promise als Client weiter', () => {
    const funde: string[] = []
    for (const pfad of dateienSammeln(wurzel)) {
      const relativ = relative(wurzel, pfad).replaceAll('\\', '/')
      if (IGNORIERTE_RELATIVE.has(relativ)) continue
      const text = readFileSync(pfad, 'utf8')
      for (const treffer of text.matchAll(FACTORY_AUFRUF)) {
        const index = treffer.index ?? 0
        const zeilenanfang = text.lastIndexOf('\n', index) + 1
        const zeile = text.slice(zeilenanfang, text.indexOf('\n', index))
        if (istKommentarzeile(zeile)) continue
        if (/export\s+async\s+function/.test(zeile)) continue
        const davor = text.slice(Math.max(0, index - 12), index)
        if (!/await\s+$/.test(davor) && !/await\s*\(\s*$/.test(davor)) {
          funde.push(`${relativ}:${zeileZu(index, text)}`)
        }
      }
    }
    assert.deepEqual(funde, [])
  })

  test('der Kompatibilitätsalias createServerClient bleibt unbenutzt als synchrone Hintertür', () => {
    const funde: string[] = []
    for (const pfad of dateienSammeln(wurzel)) {
      const relativ = relative(wurzel, pfad).replaceAll('\\', '/')
      if (relativ === 'lib/supabase/server.ts' || relativ === 'proxy.ts') continue
      const text = readFileSync(pfad, 'utf8')
      if (
        text.includes("from '@/lib/supabase/server'") &&
        /createServerClient/.test(text)
      ) {
        funde.push(relativ)
      }
    }
    assert.deepEqual(funde, [])
  })
})

describe('Framework-facing Page/Metadata-Vertrag ist Promise-förmig', () => {
  const flaechen = [
    {
      datei: 'app/(public)/login/page.tsx',
      vertrag: /searchParams:\s*PageRequestParam<LoginSearchParams>/,
    },
    {
      datei: 'app/(public)/register/page.tsx',
      vertrag: /searchParams:\s*PageRequestParam<RegisterSearchParams>/,
    },
    {
      datei: 'app/(public)/admin/mfa/page.tsx',
      vertrag: /searchParams\?:\s*PageRequestParam<AdminMfaSearchParams>/,
    },
    {
      datei: 'app/(public)/planen/page.tsx',
      vertrag: /searchParams\?:\s*PageRequestParam<PlanenSearchParams>/,
    },
    {
      datei: 'app/(public)/reisen/[tripId]/page.tsx',
      vertrag: /params:\s*PageRequestParam<\{ tripId: string \}>/,
    },
    {
      datei: 'app/(admin)/admin/users/page.tsx',
      vertrag: /searchParams\?:\s*PageRequestParam<SearchParams>/,
    },
    {
      datei: 'app/unauthorized/page.tsx',
      vertrag: /searchParams\?:\s*PageRequestParam<SearchParams>/,
    },
  ] as const

  test('PageRequestParam ist Promise<T>, kein Sync-Objekt-Union', () => {
    const datei = quelle('lib/next/request-api.ts')
    assert.match(datei, /export type PageRequestParam<T> = Promise<T>/)
    assert.equal(datei.includes('export type PageRequestParam<T> = T | Promise<T>'), false)
  })

  test('bekannte Page/Metadata-Signaturen tragen den Promise-Vertrag', () => {
    for (const flaeche of flaechen) {
      const datei = quelle(flaeche.datei)
      assert.match(datei, flaeche.vertrag, flaeche.datei)
      assert.equal(
        /\|\s*Promise</.test(datei),
        false,
        `${flaeche.datei} darf kein T | Promise<T> als PageProps nutzen`,
      )
    }
    const planen = quelle('app/(public)/planen/page.tsx')
    assert.match(planen, /export async function generateMetadata\(\{ searchParams \}: PlanenSeiteProps\)/)
  })

  test('keine App-Page/Metadata-Signatur fällt auf ein Sync-Objekt-Union zurück', () => {
    const funde: string[] = []
    const union =
      /(?:params|searchParams)\??:\s*(?:[A-Za-z_$][\w$]*|\{[^}]+\})\s*\|\s*Promise</
    for (const pfad of dateienSammeln(join(wurzel, 'app'))) {
      const relativ = relative(wurzel, pfad).replaceAll('\\', '/')
      if (!/\/(page|layout|template)\.(ts|tsx)$/.test(relativ)) continue
      const text = readFileSync(pfad, 'utf8')
      if (union.test(text)) funde.push(relativ)
    }
    assert.deepEqual(funde, [])
  })
})

describe('Request-API-Flächen bleiben produktwahr', () => {
  test('Login next wird awaited und weiter durch anmeldeSeiteZiel geführt', () => {
    const datei = quelle('app/(public)/login/page.tsx')
    assert.match(datei, /const params = await leseRequestParam\(searchParams\)/)
    assert.match(datei, /anmeldeSeiteZiel\(data\.user, params\.next\)/)
    assert.match(datei, /<LoginForm next=\{params\.next \?\? null\}/)
    assert.match(datei, /await createServerComponentClient\(\)/)
    assert.equal(datei.includes('getSession()'), false)
    assert.match(datei, /getUser\(\)/)
  })

  test('Register next folgt demselben Allowlist-Vertrag', () => {
    const datei = quelle('app/(public)/register/page.tsx')
    assert.match(datei, /const params = await leseRequestParam\(searchParams\)/)
    assert.match(datei, /anmeldeSeiteZiel\(data\.user, params\.next\)/)
    assert.match(datei, /<RegisterForm next=\{params\.next \?\? null\}/)
    assert.match(datei, /await createServerComponentClient\(\)/)
    assert.equal(datei.includes('getSession()'), false)
  })

  test('Admin-MFA next bleibt erlaubtesAdminZiel nach Await', () => {
    const datei = quelle('app/(public)/admin/mfa/page.tsx')
    assert.match(datei, /const params = await leseOptionalRequestParam\(searchParams\)/)
    assert.match(datei, /erlaubtesAdminZiel\(params\?\.next\)/)
    assert.equal(datei.includes('erlaubtesNaechstesZiel'), false)
  })

  test('/planen Metadata und Page awaited searchParams, ohne Key-Präsenz zu verwässern', () => {
    const seite = quelle('app/(public)/planen/page.tsx')
    const grenze = quelle('lib/seo/index-grenze.ts')
    assert.match(seite, /export async function generateMetadata/)
    assert.match(seite, /const params = await leseOptionalRequestParam\(searchParams\)/)
    assert.match(seite, /planenRobots\(params\) \?\? htmlRobots\(\)/)
    assert.match(grenze, /Object\.hasOwn\(searchParams, name\)/)
    assert.equal(grenze.includes('Boolean(searchParams['), false)
    assert.equal(grenze.includes('searchParams.idee &&'), false)
  })

  test('[tripId] bleibt nach Await die Guest-vs-Account-Kennung', () => {
    const datei = quelle('app/(public)/reisen/[tripId]/page.tsx')
    assert.match(datei, /const \{ tripId \} = await leseRequestParam\(params\)/)
    assert.match(datei, /istKontoKennung\(tripId\)/)
    assert.match(datei, /<GastArbeitsbereich tripId=\{tripId\}/)
    assert.match(datei, /reiseLaden\(tripId\)/)
    assert.match(datei, /await createServerComponentClient\(\)/)
  })

  test('unauthorized unterscheidet lookup-failed nach Await', () => {
    const datei = quelle('app/unauthorized/page.tsx')
    assert.match(datei, /export default async function UnauthorizedPage/)
    assert.match(datei, /const params = await leseOptionalRequestParam\(searchParams\)/)
    assert.match(datei, /params\?\.grund === 'lookup-failed'/)
    assert.match(datei, /Prüfung nicht möglich/)
    assert.match(datei, /Kein Zugriff/)
  })

  test('Admin Users q/page bleiben nach Await dieselben Pagination-Werte', () => {
    const datei = quelle('app/(admin)/admin/users/page.tsx')
    assert.match(datei, /const params = await leseOptionalRequestParam\(searchParams\)/)
    assert.match(datei, /const q = \(params\?\.q \?\? ''\)\.trim\(\)/)
    assert.match(datei, /const page = Math\.max\(1, Number\(params\?\.page \?\? 1\)\)/)
    assert.match(datei, /PAGE_SIZE = 20/)
    assert.match(datei, /\(await createServerComponentClient\(\)\) as any/)
  })

  test('Request-URL-searchParams in Route Handlern bleiben unangetastet', () => {
    const places = quelle('app/api/search/places/route.ts')
    const airports = quelle('app/api/search/airports/route.ts')
    const events = quelle('app/api/admin/security/events/route.ts')
    assert.match(places, /new URL\(req\.url\)/)
    assert.match(places, /url\.searchParams\.get\('q'\)/)
    assert.match(airports, /new URL\(req\.url\)\.searchParams\.get\('q'\)/)
    assert.match(events, /new URL\(req\.url\)/)
    assert.equal(places.includes('leseRequestParam'), false)
    assert.equal(airports.includes('leseOptionalRequestParam'), false)
  })
})
