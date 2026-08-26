import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import {
  htmlRobots,
  htmlRobotsUndRobotsTxtSindKonsistent,
  istVerboteneVercelPublicUrl,
  oeffentlicheMetadataOrigin,
} from '@/lib/seo/oeffentliche-metadata'
import {
  KANONISCHE_PUBLIC_ORIGIN,
  kanonischeUrl,
  oeffentlicherOrigin,
  sitemapOeffentlicheUrls,
} from '@/lib/seo/oeffentlicher-origin'
import { NICHT_INDEXIEREN, planenRobots } from '@/lib/seo/index-grenze'
import { robotsDokument } from '@/lib/seo/robots-regeln'

const hier = dirname(fileURLToPath(import.meta.url))

function quelle(relativ: string) {
  return readFileSync(join(hier, relativ), 'utf8')
}

function assertHtmlDeny(env: Parameters<typeof htmlRobots>[0]) {
  const robots = htmlRobots(env)
  assert.deepEqual(
    { index: robots.index, follow: robots.follow },
    { index: false, follow: false },
  )
  assert.deepEqual(
    { index: robots.googleBot.index, follow: robots.googleBot.follow },
    { index: false, follow: false },
  )
  assert.equal(htmlRobotsUndRobotsTxtSindKonsistent(env), true)
}

const synthetischAllow = {
  NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
  VERCEL_ENV: 'production',
  NEXT_PUBLIC_ALLOW_INDEXING: 'true',
} as const

describe('P1-D0-LIVE-01: HTML-Metadata folgt darfIndexieren', () => {
  test('1. Vercel production + Vercel-Host + allow unset bleibt noindex/nofollow', () => {
    const env = {
      NEXT_PUBLIC_APP_URL: 'https://jetnity-app.vercel.app',
      VERCEL_ENV: 'production',
    }
    assert.equal(oeffentlicherOrigin(env).darfIndexieren, false)
    assertHtmlDeny(env)
  })

  test('2. Vercel-Host + NEXT_PUBLIC_ALLOW_INDEXING=true bleibt noindex/nofollow', () => {
    const env = {
      NEXT_PUBLIC_APP_URL: 'https://jetnity-app.vercel.app',
      VERCEL_ENV: 'production',
      NEXT_PUBLIC_ALLOW_INDEXING: 'true',
    }
    assert.equal(oeffentlicherOrigin(env).darfIndexieren, false)
    assertHtmlDeny(env)
  })

  test('3. jetnity.com + allow unset bleibt noindex/nofollow', () => {
    const env = {
      NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
      VERCEL_ENV: 'production',
    }
    assert.equal(oeffentlicherOrigin(env).darfIndexieren, false)
    assertHtmlDeny(env)
  })

  test('4. jetnity.com + allow=false bleibt noindex/nofollow', () => {
    const env = {
      NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
      VERCEL_ENV: 'production',
      NEXT_PUBLIC_ALLOW_INDEXING: 'false',
    }
    assert.equal(oeffentlicherOrigin(env).darfIndexieren, false)
    assertHtmlDeny(env)
  })

  test('5. jetnity.com + allow=true ist technisch allow-fähig, ohne Env zu aktivieren', () => {
    const robots = htmlRobots(synthetischAllow)
    assert.equal(oeffentlicherOrigin(synthetischAllow).darfIndexieren, true)
    assert.equal(robots.index, true)
    assert.equal(robots.follow, true)
    assert.equal(robots.googleBot.index, true)
    assert.equal(robots.googleBot.follow, true)
    assert.equal(htmlRobotsUndRobotsTxtSindKonsistent(synthetischAllow), true)
  })

  test('6. jetnity.ch + allow=true bleibt deny', () => {
    assertHtmlDeny({
      NEXT_PUBLIC_SITE_URL: 'https://jetnity.ch',
      VERCEL_ENV: 'production',
      NEXT_PUBLIC_ALLOW_INDEXING: 'true',
    })
  })

  test('7. www.jetnity.com + allow=true bleibt deny', () => {
    assertHtmlDeny({
      NEXT_PUBLIC_SITE_URL: 'https://www.jetnity.com',
      VERCEL_ENV: 'production',
      NEXT_PUBLIC_ALLOW_INDEXING: 'true',
    })
  })

  test('8. http://jetnity.com + allow=true bleibt deny', () => {
    assertHtmlDeny({
      NEXT_PUBLIC_SITE_URL: 'http://jetnity.com',
      VERCEL_ENV: 'production',
      NEXT_PUBLIC_ALLOW_INDEXING: 'true',
    })
  })

  test('9. localhost bleibt deny', () => {
    assertHtmlDeny({
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      VERCEL_ENV: 'development',
    })
  })

  test('10. Preview *.vercel.app bleibt deny', () => {
    assertHtmlDeny({
      NEXT_PUBLIC_APP_URL: 'https://jetnity-git-fix.vercel.app',
      VERCEL_ENV: 'preview',
      NEXT_PUBLIC_ALLOW_INDEXING: 'true',
    })
  })

  test('11. denied Vercel-Host darf nicht als Jetnity-Canonical erscheinen', () => {
    const vercel = {
      NEXT_PUBLIC_APP_URL: 'https://jetnity-app.vercel.app',
      VERCEL_ENV: 'production',
      NEXT_PUBLIC_ALLOW_INDEXING: 'true',
    }
    const canonical = kanonischeUrl('/', vercel)
    const planen = kanonischeUrl('/planen', vercel)
    const metadataOrigin = oeffentlicheMetadataOrigin()

    assert.equal(canonical, `${KANONISCHE_PUBLIC_ORIGIN}/`)
    assert.equal(planen, `${KANONISCHE_PUBLIC_ORIGIN}/planen`)
    assert.equal(metadataOrigin, KANONISCHE_PUBLIC_ORIGIN)
    assert.equal(istVerboteneVercelPublicUrl(canonical), false)
    assert.equal(istVerboteneVercelPublicUrl(planen), false)
    assert.equal(istVerboteneVercelPublicUrl(metadataOrigin), false)
    assert.equal(istVerboteneVercelPublicUrl('https://jetnity-app.vercel.app'), true)
    assert.equal(istVerboteneVercelPublicUrl('https://jetnity-app.vercel.app/planen'), true)
    assert.equal(canonical.includes('vercel.app'), false)
    assert.equal(planen.includes('vercel.app'), false)
  })

  test('12. robots.txt und HTML-Metadata dürfen sich nicht widersprechen', () => {
    const denyFaelle = [
      {
        NEXT_PUBLIC_APP_URL: 'https://jetnity-app.vercel.app',
        VERCEL_ENV: 'production',
      },
      {
        NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
        VERCEL_ENV: 'production',
      },
      {
        NEXT_PUBLIC_SITE_URL: 'https://jetnity.ch',
        VERCEL_ENV: 'production',
        NEXT_PUBLIC_ALLOW_INDEXING: 'true',
      },
    ] as const

    for (const env of denyFaelle) {
      const html = htmlRobots(env)
      const robots = robotsDokument(env)
      assert.equal(html.index, false)
      assert.deepEqual(robots.disallow, ['/'])
      assert.equal(robots.sitemap, null)
      assert.deepEqual(sitemapOeffentlicheUrls(env), [])
      assert.equal(htmlRobotsUndRobotsTxtSindKonsistent(env), true)
    }

    const allowHtml = htmlRobots(synthetischAllow)
    const allowRobots = robotsDokument(synthetischAllow)
    assert.equal(allowHtml.index, true)
    assert.equal(allowRobots.host, KANONISCHE_PUBLIC_ORIGIN)
    assert.equal(allowRobots.sitemap, `${KANONISCHE_PUBLIC_ORIGIN}/sitemap.xml`)
    assert.equal(htmlRobotsUndRobotsTxtSindKonsistent(synthetischAllow), true)
  })
})

describe('P1-D0-LIVE-01: Layouts dürfen index nicht hart setzen', () => {
  test('Root- und Public-Layout verwenden htmlRobots und keine vercel.app-Origin', () => {
    const root = quelle('../../app/layout.tsx')
    const pub = quelle('../../app/(public)/layout.tsx')
    const start = quelle('../../app/(public)/page.tsx')

    assert.match(root, /from '@\/lib\/seo\/oeffentliche-metadata'/)
    assert.match(pub, /from '@\/lib\/seo\/oeffentliche-metadata'/)
    assert.match(root, /robots:\s*htmlRobots\(\)/)
    assert.match(pub, /robots:\s*htmlRobots\(\)/)
    assert.equal(root.includes('index: true'), false)
    assert.equal(pub.includes('index: true'), false)
    assert.equal(root.includes('oeffentlicherOrigin'), false)
    assert.equal(pub.includes('oeffentlicherOrigin'), false)
    assert.equal(root.includes('vercel.app'), false)
    assert.equal(pub.includes('vercel.app'), false)
    assert.match(start, /url: kanonischeUrl\('\/'\)/)
  })

  test('private noindex-Grenzen bleiben unverändert', () => {
    assert.deepEqual(NICHT_INDEXIEREN, { index: false, follow: false })
    assert.deepEqual(planenRobots({ idee: 'Bali' }), NICHT_INDEXIEREN)
    assert.match(quelle('../../app/(public)/reisen/page.tsx'), /robots:\s*NICHT_INDEXIEREN/)
    assert.match(quelle('../../app/(public)/reisen/[tripId]/page.tsx'), /robots:\s*NICHT_INDEXIEREN/)
    assert.match(quelle('../../app/(public)/login/page.tsx'), /index:\s*false/)
    assert.match(quelle('../../app/account/layout.tsx'), /index:\s*false/)
  })
})
