// lib/layout/footer-official-logo-white-1.test.ts
//
// Der dunkle Footer zeigt das bestehende offizielle PNG reinweiß.
// Navbar und das kanonische Logo-Asset bleiben unverändert.
// Die Icon-Familie ist seit dem offiziellen Signet ersetzt; dieser Pin
// sperrt die neuen Bytes, nicht mehr den Platzhalter.

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

function quelle(relativ: string) {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

function markenlink(text: string) {
  const start = text.indexOf('aria-label="Jetnity Startseite"')
  assert.notEqual(start, -1)
  return text.slice(Math.max(0, start - 500), start + 900)
}

function gitBlobSha1(bytes: Buffer) {
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
}

describe('Footer Official Logo White 1', () => {
  const footer = quelle('components/layout/Footer.tsx')
  const navbar = quelle('components/layout/PublicNavbar.tsx')

  test('der Footer filtert das offizielle PNG reinweiß und ohne helle Fläche', () => {
    assert.match(footer, /src="\/brand\/jetnity-logo\.png"/)
    assert.match(footer, /brightness-0 invert/)
    assert.match(footer, /aria-label="Jetnity Startseite"/)
    assert.match(footer, /h-\[48px\] w-auto/)
    assert.match(footer, /height: '48px'/)
    assert.match(footer, /width: 'auto'/)
    assert.equal(footer.includes('bg-white'), false)
    assert.equal(footer.includes('rounded-xl bg-white'), false)
    assert.equal(/hue-rotate|saturate-|sepia|grayscale|mix-blend/.test(footer), false)
  })

  test('die Navbar bleibt vollfarbig und ohne Filter', () => {
    const link = markenlink(navbar)
    assert.match(link, /src="\/brand\/jetnity-logo\.png"/)
    assert.equal(/invert|brightness-|hue-rotate|saturate-|sepia|grayscale|mix-blend/.test(link), false)
    assert.equal(link.includes('bg-white'), false)
  })

  test('Favicon und App-Icons bleiben das offizielle Signet', () => {
    const icons = [
      ['app/icon.png', '31b8daea2c365c0f49aad87dd7dae17b5dc351e6'],
      ['app/apple-icon.png', '9f7996483f0a75d856415d3242224ee4094455f7'],
      ['public/icons/jetnity-192.png', 'db5a89ed626b10e84753cf1db4ff3cf13ad17ed4'],
      ['public/icons/jetnity-512.png', '4c28d164da7deec818153f0702290e70b20205bc'],
      ['public/icons/jetnity-512-maskable.png', '2c61669ead572382f1fb518bca32ea0b78cc13ef'],
      ['public/brand/jetnity-signet.png', '2db7371f3514618059c90389376c69feee16fb5d'],
    ] as const
    for (const [pfad, sha] of icons) {
      assert.equal(gitBlobSha1(readFileSync(join(wurzel, pfad))), sha, pfad)
    }
  })
})
