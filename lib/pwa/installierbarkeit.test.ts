import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import { inflateSync } from 'node:zlib'

import manifest from '@/app/manifest'

const ROOT = process.cwd()
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

function pngAbmessungen(datei: string) {
  const inhalt = readFileSync(datei)
  assert.deepEqual(inhalt.subarray(0, 8), PNG_SIGNATURE, `${datei} ist kein PNG`)
  assert.equal(inhalt.toString('ascii', 12, 16), 'IHDR', `${datei} hat keinen IHDR-Block`)

  return {
    breite: inhalt.readUInt32BE(16),
    hoehe: inhalt.readUInt32BE(20),
    farbtyp: inhalt[25],
  }
}

function pngRgba(datei: string) {
  const inhalt = readFileSync(datei)
  const breite = inhalt.readUInt32BE(16)
  const hoehe = inhalt.readUInt32BE(20)
  let offset = 8
  const daten: Buffer[] = []

  while (offset < inhalt.length) {
    const laenge = inhalt.readUInt32BE(offset)
    const typ = inhalt.toString('ascii', offset + 4, offset + 8)
    if (typ === 'IDAT') daten.push(inhalt.subarray(offset + 8, offset + 8 + laenge))
    offset += 12 + laenge
  }

  const roh = inflateSync(Buffer.concat(daten))
  const zeilenbreite = breite * 4 + 1
  const pixel: Buffer[] = []
  for (let y = 0; y < hoehe; y += 1) {
    assert.equal(roh[y * zeilenbreite], 0, 'Produktionsicon verwendet erwartete filterlose PNG-Zeilen')
    pixel.push(roh.subarray(y * zeilenbreite + 1, (y + 1) * zeilenbreite))
  }

  return { breite, hoehe, pixel }
}

describe('PWA-1: installierbare, datensparsame App-Shell', () => {
  test('Manifest bewahrt den Produktvertrag und nennt vollständige PNG-Icons', () => {
    const daten = manifest()

    assert.equal(daten.name, 'Jetnity – Deine ganze Reise')
    assert.equal(daten.short_name, 'Jetnity')
    assert.equal(daten.description, 'Persönliche Reiseplanung und Reisebegleitung an einem Ort.')
    assert.equal(daten.id, '/')
    assert.equal(daten.start_url, '/')
    assert.equal(daten.scope, '/')
    assert.equal(daten.display, 'standalone')
    assert.equal(daten.background_color, '#f5f4ee')
    assert.equal(daten.theme_color, '#153a33')
    assert.deepEqual(daten.icons, [
      { src: '/icons/jetnity-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/jetnity-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/jetnity-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ])
  })

  test('Manifest- und Apple-Icons sind PNGs mit den deklarierten Abmessungen', () => {
    const erwarteteIcons = [
      ['public/icons/jetnity-192.png', 192],
      ['public/icons/jetnity-512.png', 512],
      ['public/icons/jetnity-512-maskable.png', 512],
      ['app/apple-icon.png', 180],
    ] as const

    for (const [relativerPfad, groesse] of erwarteteIcons) {
      const icon = pngAbmessungen(join(ROOT, relativerPfad))
      assert.deepEqual(icon, { breite: groesse, hoehe: groesse, farbtyp: 6 })
    }
  })

  test('Das maskable Icon ist ein eigenständiges, undurchsichtiges Safe-Zone-Asset', () => {
    const standard = readFileSync(join(ROOT, 'public/icons/jetnity-512.png'))
    const maskable = pngRgba(join(ROOT, 'public/icons/jetnity-512-maskable.png'))
    const mitte = maskable.breite / 2
    const sichererRadius = maskable.breite * 0.4
    let markPixel = 0

    assert.notDeepEqual(
      readFileSync(join(ROOT, 'public/icons/jetnity-512-maskable.png')),
      standard,
      'maskable Asset ist nicht das Standard-Icon',
    )

    for (let y = 0; y < maskable.hoehe; y += 1) {
      for (let x = 0; x < maskable.breite; x += 1) {
        const offset = x * 4
        const [rot, gruen, blau, alpha] = maskable.pixel[y].subarray(offset, offset + 4)
        assert.equal(alpha, 255, 'maskable Asset ist vollständig deckend')

        if (gruen > 180 && rot > 150 && blau < 180) {
          markPixel += 1
          assert.ok(Math.hypot(x + 0.5 - mitte, y + 0.5 - mitte) < sichererRadius)
        }
      }
    }

    assert.ok(markPixel > 0, 'maskable Asset enthält die Lime-Marke')
  })

  test('PWA-1 führt weder Service Worker noch Offline-Persistenz ein', () => {
    const appDateien = readdirSync(join(ROOT, 'app'), { recursive: true })
      .filter((datei): datei is string => typeof datei === 'string' && /\.(?:ts|tsx|js|jsx)$/.test(datei))

    for (const datei of appDateien) {
      const inhalt = readFileSync(join(ROOT, 'app', datei), 'utf8')
      assert.doesNotMatch(inhalt, /navigator\s*\.\s*serviceWorker|serviceWorker\s*\.\s*register|beforeinstallprompt|indexedDB|caches\s*\./)
    }

    assert.equal(existsSync(join(ROOT, 'public', 'sw.js')), false)
    assert.equal(existsSync(join(ROOT, 'public', 'service-worker.js')), false)
  })

  test('Root-Metadaten behalten die bestehende SEO-Grenze bei', () => {
    const layout = readFileSync(join(ROOT, 'app', 'layout.tsx'), 'utf8')

    assert.match(layout, /robots:\s*htmlRobots\(\)/)
    assert.match(layout, /manifest:\s*'\/manifest\.webmanifest'/)
    assert.equal(layout.includes('index: true'), false)
  })
})
