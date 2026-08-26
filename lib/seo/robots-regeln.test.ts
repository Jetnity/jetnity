import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import {
  ROBOTS_DISALLOW_ALLOW_MODUS,
  robotsDarfIndexieren,
  robotsDisallowListe,
  robotsIstEphemeralHost,
} from '@/lib/seo/robots-regeln'

const hier = dirname(fileURLToPath(import.meta.url))

describe('Der ephemeral-Host-Kill-Switch', () => {
  test('behält localhost und *.vercel.app als deny-all', () => {
    assert.equal(robotsIstEphemeralHost('localhost'), true)
    assert.equal(robotsIstEphemeralHost('jetnity-app.vercel.app'), true)
    assert.equal(robotsIstEphemeralHost('preview.vercel.app'), true)
    assert.equal(robotsIstEphemeralHost('jetnity.ch'), false)
    assert.equal(robotsIstEphemeralHost('jetnity.com'), false)

    assert.equal(
      robotsDarfIndexieren({
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        VERCEL_ENV: 'production',
      }),
      false,
    )
    assert.equal(
      robotsDarfIndexieren({
        NEXT_PUBLIC_APP_URL: 'https://jetnity-app.vercel.app',
        VERCEL_ENV: 'production',
      }),
      false,
    )
    assert.deepEqual(
      robotsDisallowListe({
        NEXT_PUBLIC_APP_URL: 'https://foo.vercel.app',
        VERCEL_ENV: 'production',
      }),
      ['/'],
    )
  })

  test('Preview und der Allow-Indexing-Kill-Switch bleiben geschlossen', () => {
    assert.equal(
      robotsDarfIndexieren({
        NEXT_PUBLIC_APP_URL: 'https://jetnity.com',
        VERCEL_ENV: 'preview',
      }),
      false,
    )
    assert.equal(
      robotsDarfIndexieren({
        NEXT_PUBLIC_APP_URL: 'https://jetnity.com',
        VERCEL_ENV: 'production',
        NEXT_PUBLIC_ALLOW_INDEXING: 'false',
      }),
      false,
    )
  })

  test('aktiviert kein Custom-Domain-Indexing still über Defaults hinaus', () => {
    // P1-D0-2-TL-01: Production ohne explizites true bleibt deny.
    // P1-D0-2-TL-02: jetnity.ch bleibt auch mit true deny.
    assert.equal(
      robotsDarfIndexieren({
        NEXT_PUBLIC_APP_URL: 'https://jetnity.com',
        VERCEL_ENV: 'production',
      }),
      false,
    )
    assert.equal(
      robotsDarfIndexieren({
        NEXT_PUBLIC_SITE_URL: 'https://jetnity.com',
        VERCEL_ENV: 'production',
      }),
      false,
    )
    assert.equal(
      robotsDarfIndexieren({
        NEXT_PUBLIC_SITE_URL: 'https://jetnity.ch',
        VERCEL_ENV: 'production',
        NEXT_PUBLIC_ALLOW_INDEXING: 'true',
      }),
      false,
    )
  })
})

describe('Der Allow-Modus schützt die D0-1-Pfade', () => {
  const liste = robotsDisallowListe({
    NEXT_PUBLIC_APP_URL: 'https://jetnity.com',
    VERCEL_ENV: 'production',
    NEXT_PUBLIC_ALLOW_INDEXING: 'true',
  })

  test('enthält Reisen, Auth, Unauthorized und die bisherigen Schutzpfade', () => {
    for (const pfad of [
      '/reisen',
      '/reisen/',
      '/auth/',
      '/unauthorized',
      '/admin/',
      '/account/',
      '/login',
      '/register',
      '/api/',
      '/ui-audit',
    ]) {
      assert.ok(liste.includes(pfad), `fehlt: ${pfad}`)
    }
  })

  test('ist dieselbe Liste wie ROBOTS_DISALLOW_ALLOW_MODUS', () => {
    assert.deepEqual(liste, [...ROBOTS_DISALLOW_ALLOW_MODUS])
  })

  test('wird von robots.ts über robotsDokument verwendet', () => {
    const datei = readFileSync(join(hier, '../../app/robots.ts'), 'utf8')
    assert.match(datei, /robotsDokument/)
    assert.match(datei, /disallow: '\/'/)
  })
})
