// lib/layout/footer-official-logo-white-1.test.ts
//
// Der dunkle Footer zeigt das bestehende offizielle PNG reinweiß.
// Navbar, Asset, Favicon und App-Icons bleiben unverändert.

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

  test('Favicon und App-Icons bleiben bytegenau', () => {
    const icons = [
      ['app/icon.svg', 'c16821657b3a086e3f3ac827f10e4e567b79eb02'],
      ['app/apple-icon.png', '9c450179bcb1e8fdf5497eb12a3715c64ca1d2e7'],
      ['public/icons/jetnity-192.png', '04f453425aeaca21d4a00560ff47c851a13ff65b'],
      ['public/icons/jetnity-512.png', 'ffb7ed0baf587bca70e11ada2b218b8c7d82d90f'],
      ['public/icons/jetnity-512-maskable.png', 'cc485a9109c92c42668bd07c6a03358b982b194b'],
    ] as const
    for (const [pfad, sha] of icons) {
      assert.equal(gitBlobSha1(readFileSync(join(wurzel, pfad))), sha, pfad)
    }
  })
})
