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
      ['app/icon.png', '93902bdacac943091ee6e0f7c3e12cf90a4aa04d'],
      ['app/apple-icon.png', '23afd15e5e7c29cb9b3289612867abdb5298c994'],
      ['public/icons/jetnity-192.png', 'a08d34b69328ab6958dd1040f8cd2a18cff2d301'],
      ['public/icons/jetnity-512.png', 'ca5a9440e492b422eefd29185f571d76d8054d80'],
      ['public/icons/jetnity-512-maskable.png', 'eff07c1a18753f8c611d681bd8c1f271fd4adb54'],
      ['public/brand/jetnity-signet.png', 'a2f91e16b2b21d910de534c6e72a8124fd821ac2'],
    ] as const
    for (const [pfad, sha] of icons) {
      assert.equal(gitBlobSha1(readFileSync(join(wurzel, pfad))), sha, pfad)
    }
  })
})
