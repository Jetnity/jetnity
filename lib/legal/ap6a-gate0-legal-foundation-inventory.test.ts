// lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts
//
// AP-6a Gate 0 Evidence-Lock: welche Legal-/Consent-Flächen heute
// tatsächlich existieren. Kein Runtime-Write. Kein Rechtstext.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { SITEMAP_OEFFENTLICHE_PFADE } from '@/lib/seo/index-grenze'
import {
  AP6A_LEGAL_ROUTEN,
  AP6A_NON_SCOPE,
  AP6A_RUNTIME_VERTRAG,
  AP6B_ERST_DANACH,
  AP6A_VERWANDTE_FEHLENDE_ROUTEN,
  LEGAL_INPUT_KLASSEN,
  istAp6aLegalRoute,
} from '@/lib/legal/ap6a-gate0-vertrag'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

const QUELL_ENDUNGEN = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs'])
const QUELL_VERZEICHNISSE = ['app', 'lib', 'components']
const IGNORIERTE_TEILE = new Set(['node_modules', '.git', 'docs', 'supabase'])

function dateienSammeln(verzeichnis: string, gefunden: string[] = []): string[] {
  for (const eintrag of readdirSync(verzeichnis, { withFileTypes: true })) {
    if (IGNORIERTE_TEILE.has(eintrag.name)) continue
    const pfad = join(verzeichnis, eintrag.name)
    if (eintrag.isDirectory()) {
      dateienSammeln(pfad, gefunden)
      continue
    }
    const punkt = eintrag.name.lastIndexOf('.')
    const endung = punkt >= 0 ? eintrag.name.slice(punkt) : ''
    if (QUELL_ENDUNGEN.has(endung) && !eintrag.name.endsWith('.test.ts') && !eintrag.name.endsWith('.test.tsx')) {
      gefunden.push(pfad)
    }
  }
  return gefunden
}

function quelle(relativ: string): string {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

function rel(absolut: string): string {
  return relative(wurzel, absolut).replaceAll('\\', '/')
}

function hatAppPage(route: string): boolean {
  const ohneSlash = route.replace(/^\//, '')
  return (
    existsSync(join(wurzel, 'app', ohneSlash, 'page.tsx')) ||
    existsSync(join(wurzel, 'app', '(public)', ohneSlash, 'page.tsx'))
  )
}

describe('AP-6a Gate 0 Legal-Foundation-Vertragsinventar', () => {
  const dateien = QUELL_VERZEICHNISSE.flatMap((name) => dateienSammeln(join(wurzel, name)))
  const inhalte = dateien.map((pfad) => ({ pfad: rel(pfad), text: quelle(rel(pfad)) }))

  test('Pflichtrouten /privacy und /terms haben keine App-Page', () => {
    assert.deepEqual([...AP6A_LEGAL_ROUTEN], ['/privacy', '/terms'])
    for (const route of AP6A_LEGAL_ROUTEN) {
      assert.equal(hatAppPage(route), false, `${route} darf in Gate 0 keine Page haben`)
    }
    for (const route of AP6A_VERWANDTE_FEHLENDE_ROUTEN) {
      assert.equal(hatAppPage(route), false)
    }
  })

  test('RegisterForm verlangt Zustimmung und verlinkt beide 404-Routen', () => {
    const register = quelle('components/auth/RegisterForm.tsx')
    assert.equal(register.includes('href="/terms"'), true)
    assert.equal(register.includes('href="/privacy"'), true)
    assert.equal(register.includes('Nutzungsbedingungen'), true)
    assert.equal(register.includes('Datenschutzerklärung'), true)
    assert.equal(register.includes("disabled={loading || !accept}"), true)
    assert.equal(register.includes("erstes === 'terms'"), true)
  })

  test('OAuth-Start auf /register prüft die Legal-Checkbox nicht', () => {
    const register = quelle('components/auth/RegisterForm.tsx')
    const oauth = register.slice(register.indexOf('const handleOAuth'), register.indexOf('const s = passwortStaerke'))
    assert.equal(oauth.includes('accept'), false)
    assert.equal(register.includes('signInWithOAuth'), true)
  })

  test('Login- und Register-Copy behaupten DSGVO/CH-DSG ohne belegte Legal-Seite', () => {
    const register = quelle('components/auth/RegisterForm.tsx')
    const login = quelle('components/auth/LoginForm.tsx')
    assert.equal(register.includes('DSGVO'), true)
    assert.equal(register.includes('CH-DSG'), true)
    assert.equal(login.includes('DSGVO'), true)
    assert.equal(login.includes('CH-DSG'), true)
    assert.equal(login.includes('href="/privacy"'), false)
    assert.equal(login.includes('href="/terms"'), false)
  })

  test('CookieConsent bleibt Orphan und zeigt auf /privacy', () => {
    assert.equal(existsSync(join(wurzel, 'components/layout/CookieConsent.tsx')), true)
    const banner = quelle('components/layout/CookieConsent.tsx')
    assert.equal(banner.includes("jetnity:cookie-consent:v1"), true)
    assert.equal(banner.includes('href="/privacy"'), true)
    assert.equal(banner.includes('Views/Likes'), true)
    const imports = inhalte.filter(
      (datei) =>
        datei.pfad !== 'components/layout/CookieConsent.tsx' &&
        datei.text.includes("from '@/components/layout/CookieConsent'"),
    )
    assert.deepEqual(imports.map((datei) => datei.pfad), [])
    const tot = quelle('scripts/erreichbarkeit.mjs')
    assert.equal(tot.includes("components/layout/CookieConsent.tsx"), true)
  })

  test('Footer und Navbar haben keine Legal-Links', () => {
    const footer = quelle('components/layout/Footer.tsx')
    const navbar = quelle('components/layout/PublicNavbar.tsx')
    assert.equal(footer.includes('href="/privacy"'), false)
    assert.equal(footer.includes('href="/terms"'), false)
    assert.equal(footer.includes('mailto:info@jetnity.ch'), true)
    assert.equal(navbar.includes('href="/privacy"'), false)
    assert.equal(navbar.includes('href="/terms"'), false)
  })

  test('Sitemap und Indexing-Vertrag halten Legal-Routen draußen', () => {
    assert.deepEqual([...SITEMAP_OEFFENTLICHE_PFADE], ['/', '/planen'])
    assert.equal(SITEMAP_OEFFENTLICHE_PFADE.includes('/privacy' as never), false)
    assert.equal(SITEMAP_OEFFENTLICHE_PFADE.includes('/terms' as never), false)
    assert.equal(AP6A_RUNTIME_VERTRAG.sitemapBisPublicIndexing.includes('nicht in SITEMAP_OEFFENTLICHE_PFADE'), true)
    assert.equal(AP6A_RUNTIME_VERTRAG.robotsBisPublicIndexing, 'noindex, nofollow')
    assert.equal(AP6A_RUNTIME_VERTRAG.keineIndexierungVorPublicGate, true)
  })

  test('keine Consent-Migration und keine AP-6b-Consumer-Routen', () => {
    const migrationsWurzel = join(wurzel, 'supabase/migrations')
    const sqlNamen = existsSync(migrationsWurzel)
      ? readdirSync(migrationsWurzel).filter((name) => name.endsWith('.sql'))
      : []
    assert.deepEqual(
      sqlNamen.filter((name) => /consent/i.test(name)),
      [],
    )
    assert.equal(existsSync(join(wurzel, 'app', 'account', 'export', 'page.tsx')), false)
    assert.equal(existsSync(join(wurzel, 'app', 'account', 'delete', 'page.tsx')), false)
    assert.equal(existsSync(join(wurzel, 'app', 'account', 'privacy', 'page.tsx')), false)
    assert.ok(AP6A_NON_SCOPE.includes('consent-persistenz'))
    assert.ok(AP6B_ERST_DANACH.includes('datenexport'))
  })

  test('Legal-Input-Klassen und Route-Helfer bleiben strikt', () => {
    assert.deepEqual([...LEGAL_INPUT_KLASSEN], [
      'belegt',
      'fehlend',
      'unknown',
      'PO-Legal-approval-required',
    ])
    assert.equal(istAp6aLegalRoute('/privacy'), true)
    assert.equal(istAp6aLegalRoute('/terms'), true)
    assert.equal(istAp6aLegalRoute('/impressum'), false)
    assert.equal(AP6A_RUNTIME_VERTRAG.keineErfundenenRechtstexte, true)
    assert.equal(AP6A_RUNTIME_VERTRAG.keineConsentPersistenz, true)
  })
})
