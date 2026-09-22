import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import IndexingStatus from '@/components/admin/system-health/IndexingStatus'
import {
  KANONISCHE_PUBLIC_ORIGIN,
  LOKALER_ORIGIN_FALLBACK,
  oeffentlicherOrigin,
  sitemapOeffentlicheUrls,
  type OriginUmgebung,
} from '@/lib/seo/oeffentlicher-origin'
import { htmlRobots } from '@/lib/seo/oeffentliche-metadata'
import { robotsDokument } from '@/lib/seo/robots-regeln'

import {
  SEO_STATUS_TEXTE,
  projiziereSeoStatus,
  waehleSeoStatusUmgebung,
} from './seo-status'
import { ladeSeoStatusFuerSeite, leseSeoStatusUmgebung } from './seo-status-server'

const hier = dirname(fileURLToPath(import.meta.url))

function quelle(relativ: string) {
  return readFileSync(join(hier, relativ), 'utf8')
}

const allowCanonical: OriginUmgebung = {
  NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
  VERCEL_ENV: 'production',
  NEXT_PUBLIC_ALLOW_INDEXING: 'true',
}

const previewDeny: OriginUmgebung = {
  NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
  VERCEL_ENV: 'preview',
  NEXT_PUBLIC_ALLOW_INDEXING: 'true',
}

const longPreviewOrigin =
  'https://jetnity-app-git-feat-admin-indexing-status-1-jetnity-e1b93c82.vercel.app'

function serialisiert(stand: ReturnType<typeof projiziereSeoStatus>): string {
  return JSON.stringify(stand)
}

function htmlAus(env: OriginUmgebung): string {
  return renderToStaticMarkup(createElement(IndexingStatus, { stand: projiziereSeoStatus(env) }))
}

function folgtVertrag(env: OriginUmgebung) {
  const stand = projiziereSeoStatus(env)
  const origin = oeffentlicherOrigin(env)
  const robots = robotsDokument(env)
  const urls = sitemapOeffentlicheUrls(env)
  const html = htmlRobots(env)
  assert.equal(stand.technischeOrigin, origin.origin)
  assert.equal(stand.hostname, origin.hostname)
  assert.equal(stand.originQuelle, origin.quelle)
  assert.equal(stand.kanonischeProduktOrigin, KANONISCHE_PUBLIC_ORIGIN)
  assert.equal(stand.entscheidung, origin.darfIndexieren ? 'allow' : 'deny')
  assert.deepEqual([...stand.robotsDisallow], [...robots.disallow])
  assert.equal(stand.sitemapBeworben, robots.sitemap !== null)
  assert.equal(stand.sitemapUrl, robots.sitemap)
  assert.deepEqual([...stand.sitemapUrls], urls)
  assert.equal(stand.sitemapAnzahl, urls.length)
  assert.equal(stand.htmlRobots, `${html.index ? 'index' : 'noindex'}, ${html.follow ? 'follow' : 'nofollow'}`)
  return stand
}

describe('Seo-Status-Umgebung wählt nur den Origin-Vertrag', () => {
  test('verwirft fremde Keys und Secrets', () => {
    const gewählt = waehleSeoStatusUmgebung({
      NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
      NEXT_PUBLIC_ALLOW_INDEXING: 'true',
      VERCEL_ENV: 'production',
      DATABASE_URL: 'postgresql://user:super-secret@db.internal/jetnity',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
      OPENAI_API_KEY: 'sk-secret',
    })
    assert.deepEqual(gewählt, {
      NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
      NEXT_PUBLIC_APP_URL: undefined,
      VERCEL_ENV: 'production',
      NODE_ENV: undefined,
      NEXT_PUBLIC_ALLOW_INDEXING: 'true',
    })
    assert.equal('DATABASE_URL' in gewählt, false)
    assert.equal(JSON.stringify(gewählt).includes('super-secret'), false)
  })

  test('Server-Adapter und Seitenlader existieren ohne process.env-Dump', () => {
    const server = quelle('./seo-status-server.ts')
    assert.match(server, /import 'server-only'/)
    assert.match(server, /leseSeoStatusUmgebung/)
    assert.match(server, /ladeSeoStatusFuerSeite/)
    assert.match(server, /waehleSeoStatusUmgebung\(process\.env\)/)
    assert.equal(server.includes('JSON.stringify(process.env)'), false)
    assert.equal(server.includes('console.log(process.env)'), false)
    assert.equal(typeof leseSeoStatusUmgebung, 'function')
    assert.equal(typeof ladeSeoStatusFuerSeite, 'function')
  })
})

describe('projiziereSeoStatus folgt den bestehenden SEO-Helfern', () => {
  test('intentional deny liefert leere Sitemap und deny-all robots', () => {
    const stand = folgtVertrag({
      NEXT_PUBLIC_APP_URL: LOKALER_ORIGIN_FALLBACK,
      VERCEL_ENV: 'production',
    })
    assert.equal(stand.entscheidung, 'deny')
    assert.deepEqual([...stand.robotsDisallow], ['/'])
    assert.equal(stand.sitemapBeworben, false)
    assert.equal(stand.sitemapUrl, null)
    assert.deepEqual([...stand.sitemapUrls], [])
    assert.equal(stand.sitemapAnzahl, 0)
    assert.equal(stand.sitemapHinweis, SEO_STATUS_TEXTE.sitemapLeer)
    assert.equal(stand.entscheidungHinweis, SEO_STATUS_TEXTE.denyHinweis)
    assert.equal(stand.htmlRobots, 'noindex, nofollow')
    assert.equal(stand.originQuelle, 'app')
  })

  test('explizites Allow nur für kanonische Production', () => {
    const stand = folgtVertrag(allowCanonical)
    assert.equal(stand.entscheidung, 'allow')
    assert.equal(stand.technischeOrigin, KANONISCHE_PUBLIC_ORIGIN)
    assert.equal(stand.originQuelle, 'site')
    assert.equal(stand.sitemapBeworben, true)
    assert.equal(stand.sitemapUrl, `${KANONISCHE_PUBLIC_ORIGIN}/sitemap.xml`)
    assert.deepEqual([...stand.sitemapUrls], [
      `${KANONISCHE_PUBLIC_ORIGIN}/`,
      `${KANONISCHE_PUBLIC_ORIGIN}/planen`,
    ])
    assert.equal(stand.sitemapAnzahl, 2)
    assert.equal(stand.htmlRobots, 'index, follow')
    assert.equal(stand.entscheidungHinweis, SEO_STATUS_TEXTE.allowHinweis)
    assert.match(stand.entscheidungHinweis, /keine Product-Owner-Launch-Freigabe/)
  })

  test('Preview und Development bleiben deny', () => {
    const preview = folgtVertrag(previewDeny)
    assert.equal(preview.entscheidung, 'deny')
    assert.equal(preview.sitemapAnzahl, 0)

    const development = folgtVertrag({
      NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
      NODE_ENV: 'development',
      NEXT_PUBLIC_ALLOW_INDEXING: 'true',
    })
    assert.equal(development.entscheidung, 'deny')
    assert.deepEqual([...development.sitemapUrls], [])
  })

  test('unset und false Opt-in bleiben deny', () => {
    assert.equal(
      folgtVertrag({
        NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
        VERCEL_ENV: 'production',
      }).entscheidung,
      'deny',
    )
    assert.equal(
      folgtVertrag({
        NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
        VERCEL_ENV: 'production',
        NEXT_PUBLIC_ALLOW_INDEXING: '',
      }).entscheidung,
      'deny',
    )
    assert.equal(
      folgtVertrag({
        NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
        VERCEL_ENV: 'production',
        NEXT_PUBLIC_ALLOW_INDEXING: 'false',
      }).entscheidung,
      'deny',
    )
    assert.equal(
      folgtVertrag({
        NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
        VERCEL_ENV: 'production',
        NEXT_PUBLIC_ALLOW_INDEXING: 'TRUE',
      }).entscheidung,
      'deny',
    )
  })

  test('ungültige, credential-bearing, Query- und Hash-Origins leaken keine Rohwerte', () => {
    const faelle: Array<{ env: OriginUmgebung; verboten: string[] }> = [
      {
        env: {
          NEXT_PUBLIC_SITE_URL: 'https://indexer:supersecret@jetnity.com',
          VERCEL_ENV: 'production',
          NEXT_PUBLIC_ALLOW_INDEXING: 'true',
        },
        verboten: ['indexer', 'supersecret', 'indexer:supersecret'],
      },
      {
        env: {
          NEXT_PUBLIC_SITE_URL: 'https://jetnity.com/?token=abc123&utm=1#leak-hash',
          VERCEL_ENV: 'production',
          NEXT_PUBLIC_ALLOW_INDEXING: 'true',
        },
        verboten: ['token=abc123', 'utm=1', 'leak-hash', '?token='],
      },
      {
        env: {
          NEXT_PUBLIC_SITE_URL: 'not-a-url-PASSWORD-xyz',
          VERCEL_ENV: 'production',
          NEXT_PUBLIC_ALLOW_INDEXING: 'true',
        },
        verboten: ['not-a-url-PASSWORD-xyz', 'PASSWORD-xyz'],
      },
      {
        env: {
          NEXT_PUBLIC_SITE_URL: 'https://jetnity.com/<script>alert(1)</script>',
          VERCEL_ENV: 'production',
          NEXT_PUBLIC_ALLOW_INDEXING: 'true',
        },
        verboten: ['<script>', 'alert(1)'],
      },
    ]

    for (const fall of faelle) {
      const stand = folgtVertrag(fall.env)
      assert.equal(stand.entscheidung, 'deny')
      const text = serialisiert(stand)
      for (const roh of fall.verboten) {
        assert.equal(text.includes(roh), false, `Rohwert geleakt: ${roh}`)
      }
      const html = htmlAus(fall.env)
      for (const roh of fall.verboten) {
        assert.equal(html.includes(roh), false, `HTML leakt Rohwert: ${roh}`)
      }
    }
  })

  test('widersprüchliche SITE/APP und nicht-kanonische/ephemere Origins bleiben deny', () => {
    const widerspruch = folgtVertrag({
      NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
      NEXT_PUBLIC_APP_URL: 'https://alt.example',
      VERCEL_ENV: 'production',
      NEXT_PUBLIC_ALLOW_INDEXING: 'true',
    })
    assert.equal(widerspruch.entscheidung, 'deny')
    assert.equal(widerspruch.technischeOrigin, KANONISCHE_PUBLIC_ORIGIN)
    assert.equal(serialisiert(widerspruch).includes('alt.example'), false)

    const ephemeralApp = folgtVertrag({
      NEXT_PUBLIC_SITE_URL: KANONISCHE_PUBLIC_ORIGIN,
      NEXT_PUBLIC_APP_URL: 'https://jetnity-app.vercel.app',
      VERCEL_ENV: 'production',
      NEXT_PUBLIC_ALLOW_INDEXING: 'true',
    })
    assert.equal(ephemeralApp.entscheidung, 'deny')
    assert.equal(serialisiert(ephemeralApp).includes('jetnity-app.vercel.app'), false)

    const ch = folgtVertrag({
      NEXT_PUBLIC_SITE_URL: 'https://jetnity.ch',
      VERCEL_ENV: 'production',
      NEXT_PUBLIC_ALLOW_INDEXING: 'true',
    })
    assert.equal(ch.entscheidung, 'deny')
    assert.equal(ch.technischeOrigin, 'https://jetnity.ch')

    const previewHost = folgtVertrag({
      NEXT_PUBLIC_SITE_URL: longPreviewOrigin,
      VERCEL_ENV: 'preview',
    })
    assert.equal(previewHost.entscheidung, 'deny')
    assert.equal(previewHost.technischeOrigin, longPreviewOrigin)
    assert.equal(previewHost.originQuelle, 'site')
  })
})

describe('IndexingStatus rendert die Projektion ohne Aktivierung', () => {
  test('Allow zeigt normalisierte Origins, Quelle, Grenze und Sitemap-Liste', () => {
    const html = htmlAus(allowCanonical)
    assert.match(html, /<h2[^>]*>Indexierungs-Konfiguration<\/h2>/)
    assert.match(html, /data-indexing-decision="allow"/)
    assert.match(html, /data-indexing-origin-source="site"/)
    assert.match(html, /data-indexing-sitemap-count="2"/)
    assert.match(html, /data-indexing-health-green="false"/)
    assert.match(html, /https:\/\/jetnity\.com/)
    assert.match(html, /Site-Origin/)
    assert.match(html, /erlaubt/)
    assert.match(html, /https:\/\/jetnity\.com\/sitemap\.xml/)
    assert.match(html, /https:\/\/jetnity\.com\/planen/)
    assert.match(html, /keine Product-Owner-Launch-Freigabe/)
    assert.match(html, /Nur technische Konfiguration/)
    assert.match(html, /Erneut prüfen/)
    assert.doesNotMatch(html, /<a |<button|<form|<input|<textarea|<select/)
    assert.doesNotMatch(html, /href="https?:\/\//)
    assert.doesNotMatch(html, /Gesund|Ausfall|Production READY|Launch freigeben|Indexing aktivieren/)
    assert.doesNotMatch(html, /NEXT_PUBLIC_|process\.env|dangerouslySetInnerHTML/)
  })

  test('Deny zeigt leeren Sitemap-Zustand und keinen Ausfall', () => {
    const html = htmlAus({
      NEXT_PUBLIC_APP_URL: LOKALER_ORIGIN_FALLBACK,
      VERCEL_ENV: 'preview',
    })
    assert.match(html, /data-indexing-decision="deny"/)
    assert.match(html, /verweigert/)
    assert.match(html, /Keine öffentlichen Sitemap-URLs/)
    assert.match(html, /kein Ausfall/)
    assert.match(html, /technischer Fallback|App-Origin/)
    assert.doesNotMatch(html, /<a |<button|<form/)
    assert.doesNotMatch(html, /Indexing aktivieren|Allow Indexing|public launch/i)
  })

  test('lange Origin umbricht per CSS, ohne fixe Clip-Breite', () => {
    const komponent = quelle('../../components/admin/system-health/IndexingStatus.tsx')
    assert.match(komponent, /min-w-0/)
    assert.match(komponent, /break-all/)
    assert.doesNotMatch(komponent, /w-\[\d+px\]/)
    assert.doesNotMatch(komponent, /min-w-\[\d{3,}px\]/)
    assert.doesNotMatch(komponent, /overflow-hidden/)
    const html = htmlAus({
      NEXT_PUBLIC_SITE_URL: longPreviewOrigin,
      VERCEL_ENV: 'preview',
    })
    assert.match(html, new RegExp(longPreviewOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    assert.match(html, /break-all/)
  })

  test('statischer Abschnitt braucht keine interaktive Details-Tastatur', () => {
    const html = htmlAus(allowCanonical)
    assert.doesNotMatch(html, /<details|<summary|autoFocus|autofocus/)
    const komponent = quelle('../../components/admin/system-health/IndexingStatus.tsx')
    assert.doesNotMatch(komponent, /use client/)
    assert.doesNotMatch(komponent, /process\.env/)
  })
})

describe('System-Health-Seite hängt die Sektion hinter den bestehenden Guard', () => {
  test('force-dynamic, Guard zuerst, keine neue API oder Capability', () => {
    const seite = quelle('../../app/(admin)/admin/system-health/page.tsx')
    assert.match(seite, /export const dynamic = 'force-dynamic'/)
    assert.match(seite, /requireAdminPage\(\{ surface: 'system-health', capability: 'betrieb-lesen' \}\)/)
    assert.match(seite, /ladeSystemHealthFuerSeite/)
    assert.match(seite, /ladeSeoStatusFuerSeite/)
    assert.match(seite, /IndexingStatus/)

    const rumpf = seite.slice(seite.indexOf('export default async function SystemHealthPage'))
    const guard = rumpf.indexOf('await requireAdminPage')
    const health = rumpf.indexOf('ladeSystemHealthFuerSeite')
    const seo = rumpf.indexOf('ladeSeoStatusFuerSeite')
    assert.ok(guard >= 0 && health > guard && seo > guard)
    assert.equal(rumpf.includes('leseSeoStatusUmgebung'), false)

    assert.equal(seite.includes('requireAdminApi'), false)
    assert.equal(seite.includes('capability:'), true)
    assert.equal(/\bfetch\(/.test(seite), false)
    assert.equal(seite.includes('NEXT_PUBLIC_ALLOW_INDEXING'), false)
  })
})
