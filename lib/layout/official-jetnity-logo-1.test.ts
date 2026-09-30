// lib/layout/official-jetnity-logo-1.test.ts
//
// Das offizielle Logo ersetzt nur die Marke in Leiste und Footer.
// Sitzung, Navigation und das kanonische Asset bleiben unverändert.

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')
const KANONISCHES_LOGO = 'bfcbb46da7e87d5ef03e7e6457b06957df12359f'

function quelle(relativ: string) {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

function gitBlobSha1(bytes: Buffer) {
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
}

function markenlink(text: string) {
  const start = text.indexOf('aria-label="Jetnity Startseite"')
  assert.notEqual(start, -1)
  const fenster = text.slice(Math.max(0, start - 400), start + 900)
  return fenster
}

describe('Offizielles Jetnity-Logo 1 – Asset', () => {
  test('das kanonische PNG bleibt bytegenau 384×128 RGBA', () => {
    const bytes = readFileSync(join(wurzel, 'public/brand/jetnity-logo.png'))
    assert.equal(gitBlobSha1(bytes), KANONISCHES_LOGO)
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
    assert.equal(bytes.readUInt32BE(16), 384)
    assert.equal(bytes.readUInt32BE(20), 128)
    assert.equal(bytes[24], 8)
    assert.equal(bytes[25], 6)
  })
})

describe('Offizielles Jetnity-Logo 1 – Marke', () => {
  const navbar = quelle('components/layout/PublicNavbar.tsx')
  const footer = quelle('components/layout/Footer.tsx')

  for (const [name, text] of [
    ['Navbar', navbar],
    ['Footer', footer],
  ] as const) {
    test(`${name} zeigt das offizielle Logo im beschrifteten Startlink`, () => {
      const link = markenlink(text)
      assert.match(text, /import Image from 'next\/image'/)
      assert.match(link, /href="\/"/)
      assert.match(link, /src="\/brand\/jetnity-logo\.png"/)
      assert.match(link, /alt=""/)
      assert.match(link, /width=\{384\}/)
      assert.match(link, /height=\{128\}/)
      assert.match(link, /unoptimized/)
      assert.match(link, /width: 'auto'/)
      assert.equal(link.includes('<img'), false)
      assert.equal(/invert|brightness-|hue-rotate|saturate-|sepia|grayscale|mix-blend/.test(link), false)
      assert.equal(link.includes('rotate-45'), false)
      assert.equal(link.includes('bg-citrus-400'), false)
      assert.equal(link.includes('>Jetnity<'), false)
    })
  }

  test('die Leiste lädt das Logo sofort und färbt es nicht auf eine Fläche um', () => {
    const link = markenlink(navbar)
    assert.match(link, /priority/)
    assert.match(link, /h-\[48px\] w-auto md:h-\[32px\] lg:h-\[48px\]/)
    assert.equal(link.includes('bg-white'), false)
    assert.match(navbar, /min-h-\[72px\]/)
    assert.match(navbar, /FOKUS_RING/)
  })

  test('der Footer legt das dunkle Wortzeichen auf eine helle Fläche', () => {
    const link = markenlink(footer)
    assert.match(link, /h-\[48px\] w-auto/)
    assert.match(link, /height: '48px'/)
    assert.match(link, /bg-white/)
    assert.match(link, /rounded-xl/)
    assert.match(link, /min-h-11/)
    assert.equal(link.includes('priority'), false)
    assert.match(footer, /focus-visible:ring-white\/25/)
  })
})

describe('Offizielles Jetnity-Logo 1 – Verhalten bleibt', () => {
  const navbar = quelle('components/layout/PublicNavbar.tsx')
  const footer = quelle('components/layout/Footer.tsx')

  test('Sitzung, Abmelden und Mobile-Menü der Leiste bleiben', () => {
    assert.match(navbar, /from '@\/lib\/auth\/oeffentliche-navigation'/)
    assert.match(navbar, /sitzungseintraege\(sitzung\)/)
    assert.match(navbar, /standAusSitzung/)
    assert.match(navbar, /onAuthStateChange/)
    assert.match(navbar, /signOutAction/)
    assert.match(navbar, /GlobalesAbmeldenForm/)
    assert.equal((navbar.match(/<GastCreateLink/g) ?? []).length, 2)
    assert.match(navbar, /aria-controls=\{MOBILE_NAV_ID\}/)
    assert.match(navbar, /aria-expanded=\{mobileOpen\}/)
    assert.match(navbar, /key !== 'Escape'/)
    assert.match(navbar, /menuKnopf\.current\?\.focus/)
    assert.match(navbar, /hidden=\{!mobileOpen\}/)
    assert.match(navbar, /inert=\{!mobileOpen\}/)
  })

  test('Footer-Links, Sitzung und Kontakt bleiben', () => {
    assert.match(footer, /FooterSitzung/)
    assert.match(footer, /GastCreateLink/)
    assert.match(footer, /href="\/privacy"/)
    assert.match(footer, /href="\/terms"/)
    assert.match(footer, /href="\/impressum"/)
    assert.match(footer, /mailto:info@jetnity\.ch/)
    assert.match(footer, /min-h-11/)
    assert.equal(/href=["']\/login["']/.test(footer), false)
  })
})
