import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import {
  NICHT_INDEXIEREN,
  PLANEN_INDEX_PARAMS,
  SITEMAP_OEFFENTLICHE_PFADE,
  planenHatIndexRelevanteParams,
  planenRobots,
  sitemapEnthaeltReiseuebersicht,
} from '@/lib/seo/index-grenze'

const hier = dirname(fileURLToPath(import.meta.url))

function quelle(relativ: string) {
  return readFileSync(join(hier, relativ), 'utf8')
}

describe('Die Index-Grenze für Reisen', () => {
  test('ist noindex, nofollow', () => {
    assert.deepEqual(NICHT_INDEXIEREN, { index: false, follow: false })
  })

  test('liegt auf /reisen', () => {
    const datei = quelle('../../app/(public)/reisen/page.tsx')
    assert.match(datei, /robots:\s*NICHT_INDEXIEREN/)
    assert.match(datei, /from '@\/lib\/seo\/index-grenze'/)
  })

  test('liegt auf /reisen/[tripId] ohne die Reise-Logik zu ersetzen', () => {
    const datei = quelle('../../app/(public)/reisen/[tripId]/page.tsx')
    assert.match(datei, /robots:\s*NICHT_INDEXIEREN/)
    assert.match(datei, /GastArbeitsbereich/)
    assert.match(datei, /KontoArbeitsbereich/)
    assert.match(datei, /istKontoKennung/)
    assert.match(datei, /reiseLaden/)
  })
})

describe('Die öffentliche Sitemap', () => {
  test('enthält Start und /planen, nicht /reisen', () => {
    assert.deepEqual([...SITEMAP_OEFFENTLICHE_PFADE], ['/', '/planen'])
    assert.equal(
      sitemapEnthaeltReiseuebersicht(
        SITEMAP_OEFFENTLICHE_PFADE.map((pfad) => `https://jetnity.example${pfad}`),
      ),
      false,
    )
    assert.equal(
      sitemapEnthaeltReiseuebersicht(['https://jetnity.example/reisen']),
      true,
    )
    assert.equal(
      sitemapEnthaeltReiseuebersicht(['https://jetnity.example/reisen/trip-1']),
      true,
    )
  })

  test('wird von sitemap.ts ohne Reiseübersicht gebaut', () => {
    const datei = quelle('../../app/sitemap.ts')
    assert.match(datei, /sitemapOeffentlicheUrls/)
    assert.equal(datei.includes('/reisen'), false)
  })
})

describe('/planen bleibt als Basis öffentlich', () => {
  test('ohne akzeptierten Search-Param-Key gibt es kein eigenes noindex', () => {
    assert.equal(planenHatIndexRelevanteParams(undefined), false)
    assert.equal(planenHatIndexRelevanteParams({}), false)
    assert.equal(planenHatIndexRelevanteParams({ utm_source: 'newsletter' }), false)
    assert.equal(planenRobots({}), undefined)
    assert.equal(planenRobots({ preview: '1' }), undefined)
  })

  test('überwacht genau die von der Route akzeptierten Params', () => {
    assert.deepEqual([...PLANEN_INDEX_PARAMS], ['idee', 'ziel', 'zielId'])
  })

  test('die Präsenz von idee, ziel oder zielId wird noindex, unabhängig vom Wert', () => {
    assert.deepEqual(planenRobots({ idee: '' }), NICHT_INDEXIEREN)
    assert.deepEqual(planenRobots({ idee: '   ' }), NICHT_INDEXIEREN)
    assert.deepEqual(planenRobots({ idee: 'Bali' }), NICHT_INDEXIEREN)
    assert.deepEqual(planenRobots({ ziel: '' }), NICHT_INDEXIEREN)
    assert.deepEqual(planenRobots({ zielId: '' }), NICHT_INDEXIEREN)
    assert.deepEqual(planenRobots({ idee: [''] }), NICHT_INDEXIEREN)
    assert.deepEqual(planenRobots({ ziel: ['Lissabon'] }), NICHT_INDEXIEREN)
    assert.deepEqual(planenRobots({ zielId: ['geonames:1650535'] }), NICHT_INDEXIEREN)
  })

  test('die Seite übernimmt die Werte weiter und setzt nur robots', () => {
    const datei = quelle('../../app/(public)/planen/page.tsx')
    assert.match(datei, /generateMetadata/)
    assert.match(datei, /planenRobots/)
    assert.match(datei, /kanonischeUrl\('\/planen'\)/)
    assert.match(datei, /\.\.\.\(robots \? \{ robots \} : \{\}\)/)
    assert.equal(datei.includes('robots: planenRobots'), false)
    assert.match(datei, /initialIdee/)
    assert.match(datei, /TripPlanner/)
    assert.match(datei, /Reiseidee/)
  })
})

describe('Sensitive Hilfsflächen', () => {
  test('/admin/login setzt noindex im Layout, nicht in der Client-Page', () => {
    const layout = quelle('../../app/(public)/admin/login/layout.tsx')
    const seite = quelle('../../app/(public)/admin/login/page.tsx')
    assert.match(layout, /robots:\s*NICHT_INDEXIEREN/)
    assert.match(seite, /'use client'/)
    assert.equal(seite.includes('robots'), false)
  })

  test('/unauthorized setzt noindex', () => {
    const datei = quelle('../../app/unauthorized/page.tsx')
    assert.match(datei, /robots:\s*NICHT_INDEXIEREN/)
    assert.match(datei, /Kein Zugriff/)
  })

  test('das Admin-Gruppenlayout setzt die App-Router-noindex-Grenze', () => {
    const datei = quelle('../../app/(admin)/layout.tsx')
    assert.match(datei, /robots:\s*NICHT_INDEXIEREN/)
    assert.match(datei, /requireAdminPage/)
  })

  test('Login, Register und Auth-Hilfsflächen bleiben noindex', () => {
    const login = quelle('../../app/(public)/login/page.tsx')
    const register = quelle('../../app/(public)/register/page.tsx')
    const callback = quelle('../../app/auth/callback/page.tsx')
    const passwort = quelle('../../app/auth/update-password/layout.tsx')
    assert.match(login, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false/)
    assert.match(register, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false/)
    assert.match(callback, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false/)
    assert.match(passwort, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false/)
  })

  test('der tote admin/head.tsx ist entfernt', () => {
    const datei = quelle('../../app/(admin)/admin/layout.tsx')
    assert.equal(datei.includes('head.tsx'), false)
    assert.throws(
      () => quelle('../../app/(admin)/admin/head.tsx'),
      /ENOENT/,
    )
  })
})
