import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import {
  KANONISCHE_PUBLIC_ORIGIN,
  LOKALER_ORIGIN_FALLBACK,
  indexingIstExplizitFreigegeben,
  kanonischeUrl,
  oeffentlicherOrigin,
  originIstEphemeral,
  originIstKanonischPublic,
  sitemapOeffentlicheUrls,
} from '@/lib/seo/oeffentlicher-origin'
import { NICHT_INDEXIEREN, sitemapEnthaeltReiseuebersicht, planenRobots } from '@/lib/seo/index-grenze'
import { robotsDokument } from '@/lib/seo/robots-regeln'

const hier = dirname(fileURLToPath(import.meta.url))

function quelle(relativ: string) {
  return readFileSync(join(hier, relativ), 'utf8')
}

const synthetischAllow = {
  NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
  VERCEL_ENV: 'production',
  NEXT_PUBLIC_ALLOW_INDEXING: 'true',
} as const

describe('Der öffentliche Origin-Vertrag', () => {
  test('normalisiert eine gültige SITE_URL auf Origin ohne Path, Query oder Slash', () => {
    const ergebnis = oeffentlicherOrigin({
      NEXT_PUBLIC_SITE_URL: 'https://jetnity.com/',
      VERCEL_ENV: 'production',
    })
    assert.equal(ergebnis.origin, KANONISCHE_PUBLIC_ORIGIN)
    assert.equal(ergebnis.hostname, 'jetnity.com')
    assert.equal(ergebnis.quelle, 'site')
    assert.equal(originIstKanonischPublic(ergebnis.origin), true)
  })

  test('lässt SITE_URL vor der Legacy-APP_URL gewinnen, ohne widersprüchliche Hosts freizugeben', () => {
    const gleich = oeffentlicherOrigin({
      NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
      NEXT_PUBLIC_APP_URL: 'https://jetnity.com/',
      VERCEL_ENV: 'production',
      NEXT_PUBLIC_ALLOW_INDEXING: 'true',
    })
    assert.equal(gleich.origin, KANONISCHE_PUBLIC_ORIGIN)
    assert.equal(gleich.quelle, 'site')
    assert.equal(gleich.darfIndexieren, true)

    const widerspruch = oeffentlicherOrigin({
      NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
      NEXT_PUBLIC_APP_URL: 'https://alt.example',
      VERCEL_ENV: 'production',
      NEXT_PUBLIC_ALLOW_INDEXING: 'true',
    })
    assert.equal(widerspruch.origin, KANONISCHE_PUBLIC_ORIGIN)
    assert.equal(widerspruch.quelle, 'site')
    assert.equal(widerspruch.darfIndexieren, false)
  })

  test('fällt auf APP_URL zurück, ohne Index-Sicherheit zu lockern', () => {
    const fallback = oeffentlicherOrigin({
      NEXT_PUBLIC_APP_URL: KANONISCHE_PUBLIC_ORIGIN,
      VERCEL_ENV: 'production',
      NEXT_PUBLIC_ALLOW_INDEXING: 'true',
    })
    assert.equal(fallback.origin, KANONISCHE_PUBLIC_ORIGIN)
    assert.equal(fallback.quelle, 'app')
    assert.equal(fallback.darfIndexieren, true)

    const ephemeralApp = oeffentlicherOrigin({
      NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
      NEXT_PUBLIC_APP_URL: 'https://jetnity-app.vercel.app',
      VERCEL_ENV: 'production',
      NEXT_PUBLIC_ALLOW_INDEXING: 'true',
    })
    assert.equal(ephemeralApp.origin, KANONISCHE_PUBLIC_ORIGIN)
    assert.equal(ephemeralApp.quelle, 'site')
    assert.equal(ephemeralApp.darfIndexieren, false)
  })

  test('P1-D0-2-TL-01: Public Indexing ist nur bei exakt true opt-in', () => {
    assert.equal(indexingIstExplizitFreigegeben(undefined), false)
    assert.equal(indexingIstExplizitFreigegeben(''), false)
    assert.equal(indexingIstExplizitFreigegeben('false'), false)
    assert.equal(indexingIstExplizitFreigegeben('TRUE'), false)
    assert.equal(indexingIstExplizitFreigegeben('1'), false)
    assert.equal(indexingIstExplizitFreigegeben('true'), true)

    assert.equal(
      oeffentlicherOrigin({
        NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
        VERCEL_ENV: 'production',
      }).darfIndexieren,
      false,
    )
    assert.equal(
      oeffentlicherOrigin({
        NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
        VERCEL_ENV: 'production',
        NEXT_PUBLIC_ALLOW_INDEXING: '',
      }).darfIndexieren,
      false,
    )
    assert.equal(
      oeffentlicherOrigin({
        NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
        VERCEL_ENV: 'production',
        NEXT_PUBLIC_ALLOW_INDEXING: 'false',
      }).darfIndexieren,
      false,
    )
    assert.equal(
      oeffentlicherOrigin({
        NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
        VERCEL_ENV: 'production',
        NEXT_PUBLIC_ALLOW_INDEXING: 'true',
      }).darfIndexieren,
      true,
    )
    assert.equal(
      oeffentlicherOrigin({
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        VERCEL_ENV: 'production',
        NEXT_PUBLIC_ALLOW_INDEXING: 'true',
      }).darfIndexieren,
      false,
    )
    assert.equal(
      oeffentlicherOrigin({
        NEXT_PUBLIC_SITE_URL: 'https://preview.vercel.app',
        VERCEL_ENV: 'production',
        NEXT_PUBLIC_ALLOW_INDEXING: 'true',
      }).darfIndexieren,
      false,
    )
    assert.equal(
      oeffentlicherOrigin({
        NEXT_PUBLIC_SITE_URL: 'https://jetnity.com/pfad',
        VERCEL_ENV: 'production',
        NEXT_PUBLIC_ALLOW_INDEXING: 'true',
      }).darfIndexieren,
      false,
    )
    assert.equal(
      oeffentlicherOrigin({
        NEXT_PUBLIC_SITE_URL: 'not-a-url',
        VERCEL_ENV: 'production',
        NEXT_PUBLIC_ALLOW_INDEXING: 'true',
      }).darfIndexieren,
      false,
    )
  })

  test('ungültige URL, falsches Protokoll und Path-Drift geben kein Index frei', () => {
    assert.equal(
      oeffentlicherOrigin({
        NEXT_PUBLIC_SITE_URL: 'not-a-url',
        NEXT_PUBLIC_APP_URL: 'https://jetnity.ch',
        VERCEL_ENV: 'production',
      }).darfIndexieren,
      false,
    )
    assert.equal(
      oeffentlicherOrigin({
        NEXT_PUBLIC_SITE_URL: 'ftp://jetnity.ch',
        NEXT_PUBLIC_APP_URL: 'https://jetnity.ch',
        VERCEL_ENV: 'production',
      }).darfIndexieren,
      false,
    )
    assert.equal(
      oeffentlicherOrigin({
        NEXT_PUBLIC_SITE_URL: 'https://jetnity.ch/pfad',
        VERCEL_ENV: 'production',
      }).darfIndexieren,
      false,
    )
    assert.equal(
      oeffentlicherOrigin({
        NEXT_PUBLIC_SITE_URL: 'https://jetnity.ch?utm=1',
        VERCEL_ENV: 'production',
      }).darfIndexieren,
      false,
    )
  })

  test('localhost und *.vercel.app bleiben deny-all', () => {
    assert.equal(originIstEphemeral('localhost'), true)
    assert.equal(originIstEphemeral('jetnity-app.vercel.app'), true)
    assert.equal(
      oeffentlicherOrigin({
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        VERCEL_ENV: 'production',
      }).darfIndexieren,
      false,
    )
    assert.equal(
      oeffentlicherOrigin({
        NEXT_PUBLIC_SITE_URL: 'https://preview.vercel.app',
        VERCEL_ENV: 'production',
      }).darfIndexieren,
      false,
    )
  })

  test('P1-D0-2-TL-02: Allow-Pfad gilt nur für https://jetnity.com', () => {
    assert.equal(KANONISCHE_PUBLIC_ORIGIN, 'https://jetnity.com')
    assert.equal(originIstKanonischPublic('https://jetnity.com'), true)
    assert.equal(originIstKanonischPublic('https://jetnity.ch'), false)
    assert.equal(originIstKanonischPublic('http://jetnity.com'), false)
    assert.equal(originIstKanonischPublic('https://www.jetnity.com'), false)

    assert.equal(
      oeffentlicherOrigin({
        NEXT_PUBLIC_SITE_URL: 'https://jetnity.ch',
        VERCEL_ENV: 'production',
        NEXT_PUBLIC_ALLOW_INDEXING: 'true',
      }).darfIndexieren,
      false,
    )
    assert.equal(
      oeffentlicherOrigin({
        NEXT_PUBLIC_SITE_URL: 'https://anderedomain.example',
        VERCEL_ENV: 'production',
        NEXT_PUBLIC_ALLOW_INDEXING: 'true',
      }).darfIndexieren,
      false,
    )
    assert.equal(
      oeffentlicherOrigin({
        NEXT_PUBLIC_SITE_URL: 'http://jetnity.com',
        VERCEL_ENV: 'production',
        NEXT_PUBLIC_ALLOW_INDEXING: 'true',
      }).darfIndexieren,
      false,
    )
    assert.equal(
      oeffentlicherOrigin({
        NEXT_PUBLIC_SITE_URL: 'https://www.jetnity.com',
        VERCEL_ENV: 'production',
        NEXT_PUBLIC_ALLOW_INDEXING: 'true',
      }).darfIndexieren,
      false,
    )
    assert.equal(
      oeffentlicherOrigin({
        NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
        NEXT_PUBLIC_APP_URL: 'https://jetnity.ch',
        VERCEL_ENV: 'production',
        NEXT_PUBLIC_ALLOW_INDEXING: 'true',
      }).darfIndexieren,
      false,
    )
    assert.equal(
      oeffentlicherOrigin({
        NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
        NEXT_PUBLIC_APP_URL: 'https://anderedomain.example',
        VERCEL_ENV: 'production',
        NEXT_PUBLIC_ALLOW_INDEXING: 'true',
      }).darfIndexieren,
      false,
    )
  })

  test('NEXT_PUBLIC_ALLOW_INDEXING=false bleibt ein harter Kill-Switch', () => {
    assert.equal(
      oeffentlicherOrigin({
        ...synthetischAllow,
        NEXT_PUBLIC_ALLOW_INDEXING: 'false',
      }).darfIndexieren,
      false,
    )
  })
})

describe('robots und Sitemap teilen dieselbe Origin', () => {
  test('deny-all bewirbt keine Sitemap und keine öffentlichen URLs', () => {
    const lokal = {
      NEXT_PUBLIC_APP_URL: LOKALER_ORIGIN_FALLBACK,
      VERCEL_ENV: 'production',
    }
    const robots = robotsDokument(lokal)
    assert.deepEqual(robots.disallow, ['/'])
    assert.equal(robots.sitemap, null)
    assert.equal(robots.host, null)
    assert.deepEqual(sitemapOeffentlicheUrls(lokal), [])

    const productionOhneOptIn = {
      NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
      VERCEL_ENV: 'production',
    }
    const ohneOptIn = robotsDokument(productionOhneOptIn)
    assert.deepEqual(ohneOptIn.disallow, ['/'])
    assert.equal(ohneOptIn.sitemap, null)
    assert.equal(ohneOptIn.host, null)
    assert.deepEqual(sitemapOeffentlicheUrls(productionOhneOptIn), [])
  })

  test('synthetischer Allow-Modus nutzt Host, Sitemap und Canonicals derselben Origin', () => {
    const origin = oeffentlicherOrigin(synthetischAllow)
    assert.equal(origin.darfIndexieren, true)
    assert.equal(origin.origin, KANONISCHE_PUBLIC_ORIGIN)

    const robots = robotsDokument(synthetischAllow)
    assert.equal(robots.host, KANONISCHE_PUBLIC_ORIGIN)
    assert.equal(robots.sitemap, `${KANONISCHE_PUBLIC_ORIGIN}/sitemap.xml`)
    assert.ok(robots.disallow.includes('/reisen'))
    assert.ok(robots.disallow.includes('/unauthorized'))

    const urls = sitemapOeffentlicheUrls(synthetischAllow)
    assert.deepEqual(urls, [`${KANONISCHE_PUBLIC_ORIGIN}/`, `${KANONISCHE_PUBLIC_ORIGIN}/planen`])
    assert.equal(sitemapEnthaeltReiseuebersicht(urls), false)
    assert.equal(kanonischeUrl('/', synthetischAllow), `${KANONISCHE_PUBLIC_ORIGIN}/`)
    assert.equal(kanonischeUrl('/planen', synthetischAllow), `${KANONISCHE_PUBLIC_ORIGIN}/planen`)
  })

  test('robots.ts und sitemap.ts verwenden den Vertrag', () => {
    const robots = quelle('../../app/robots.ts')
    const sitemap = quelle('../../app/sitemap.ts')
    assert.match(robots, /robotsDokument/)
    assert.match(robots, /if \(!dokument\.sitemap/)
    assert.match(sitemap, /sitemapOeffentlicheUrls/)
    assert.equal(sitemap.includes('/reisen'), false)
  })
})

describe('Öffentliche Canonicals bleiben ohne Param-Varianten', () => {
  test('Start und /planen hängen am Vertrag', () => {
    const start = quelle('../../app/(public)/page.tsx')
    const planen = quelle('../../app/(public)/planen/page.tsx')
    assert.match(start, /kanonischeUrl\('\/'\)/)
    assert.match(start, /alternates:\s*\{\s*canonical:/)
    assert.match(start, /oeffentlicherOrigin/)
    assert.match(planen, /kanonischeUrl\('\/planen'\)/)
    assert.match(planen, /alternates:\s*\{\s*canonical:/)
    assert.equal(planen.includes('searchParams'), true)
    assert.equal(planen.includes('canonical: kanonischeUrl(`/planen?'), false)
    assert.deepEqual(planenRobots({ idee: '' }), NICHT_INDEXIEREN)
    assert.deepEqual(planenRobots({ idee: '   ' }), NICHT_INDEXIEREN)
    assert.deepEqual(planenRobots({ idee: 'Bali' }), NICHT_INDEXIEREN)
    assert.equal(kanonischeUrl('/planen', synthetischAllow), `${KANONISCHE_PUBLIC_ORIGIN}/planen`)
  })

  test('Layouts und JSON-LD teilen dieselbe Origin', () => {
    const root = quelle('../../app/layout.tsx')
    const pub = quelle('../../app/(public)/layout.tsx')
    const start = quelle('../../app/(public)/page.tsx')
    assert.match(root, /oeffentlicherOrigin/)
    assert.match(pub, /oeffentlicherOrigin/)
    assert.match(start, /url: origin/)
    assert.equal(start.includes('NEXT_PUBLIC_APP_URL ??'), false)
  })

  test('.env.example dokumentiert den sicheren Default und setzt true nicht', () => {
    const env = quelle('../../.env.example')
    assert.match(env, /NEXT_PUBLIC_SITE_URL=https:\/\/jetnity\.com/)
    assert.match(env, /NEXT_PUBLIC_ALLOW_INDEXING=false/)
    assert.match(env, /Public-Launch-Gate/)
    assert.equal(env.includes('NEXT_PUBLIC_ALLOW_INDEXING=true'), false)
    assert.equal(env.includes('NEXT_PUBLIC_SITE_URL=https://jetnity.ch'), false)
  })
})
