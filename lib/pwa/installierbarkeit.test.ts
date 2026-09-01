import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import { join } from 'node:path'
import { describe, test } from 'node:test'

import manifest from '@/app/manifest'

const ROOT = process.cwd()
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const MARKEN_GRUEN = { r: 0x15, g: 0x3a, b: 0x33 }
const MARKEN_LIME = { r: 0xdf, g: 0xf4, b: 0x7a }
const MASKABLE_SICHERER_RADIUS_ANTEIL = 0.4
const FARBDISTANZ_MARKENPIXEL = 40

type PngPixel = { r: number; g: number; b: number; a: number }

type PngBild = {
  breite: number
  hoehe: number
  farbtyp: number
  pixel: PngPixel[]
  roh: Buffer
}

function paeth(links: number, oben: number, obenLinks: number) {
  const schaetzung = links + oben - obenLinks
  const dLinks = Math.abs(schaetzung - links)
  const dOben = Math.abs(schaetzung - oben)
  const dObenLinks = Math.abs(schaetzung - obenLinks)
  if (dLinks <= dOben && dLinks <= dObenLinks) return links
  if (dOben <= dObenLinks) return oben
  return obenLinks
}

function pngChunkLesen(inhalt: Buffer) {
  const chunks: { typ: string; daten: Buffer }[] = []
  let offset = 8
  while (offset + 12 <= inhalt.length) {
    const laenge = inhalt.readUInt32BE(offset)
    const typ = inhalt.toString('ascii', offset + 4, offset + 8)
    const daten = inhalt.subarray(offset + 8, offset + 8 + laenge)
    chunks.push({ typ, daten })
    offset += 12 + laenge
  }
  return chunks
}

function pngEntfiltern(roh: Buffer, breite: number, hoehe: number, bytesProPixel: number) {
  const zeilenlaenge = breite * bytesProPixel
  const bild = Buffer.alloc(hoehe * zeilenlaenge)
  let quelle = 0

  for (let y = 0; y < hoehe; y++) {
    const filter = roh[quelle++]
    const ziel = y * zeilenlaenge
    for (let x = 0; x < zeilenlaenge; x++) {
      const links = x >= bytesProPixel ? bild[ziel + x - bytesProPixel] : 0
      const oben = y > 0 ? bild[ziel - zeilenlaenge + x] : 0
      const obenLinks = y > 0 && x >= bytesProPixel ? bild[ziel - zeilenlaenge + x - bytesProPixel] : 0
      const wert = roh[quelle++]
      let rekonstruiert: number
      if (filter === 0) rekonstruiert = wert
      else if (filter === 1) rekonstruiert = (wert + links) & 255
      else if (filter === 2) rekonstruiert = (wert + oben) & 255
      else if (filter === 3) rekonstruiert = (wert + Math.floor((links + oben) / 2)) & 255
      else if (filter === 4) rekonstruiert = (wert + paeth(links, oben, obenLinks)) & 255
      else throw new Error(`Nicht unterstützter PNG-Filter ${filter}`)
      bild[ziel + x] = rekonstruiert
    }
  }

  return bild
}

function pngLesen(datei: string): PngBild {
  const roh = readFileSync(datei)
  assert.deepEqual(roh.subarray(0, 8), PNG_SIGNATURE, `${datei} ist kein PNG`)

  const chunks = pngChunkLesen(roh)
  const ihdr = chunks.find((chunk) => chunk.typ === 'IHDR')
  assert.ok(ihdr, `${datei} hat keinen IHDR-Block`)

  const breite = ihdr.daten.readUInt32BE(0)
  const hoehe = ihdr.daten.readUInt32BE(4)
  const farbtyp = ihdr.daten[9]
  assert.ok(farbtyp === 2 || farbtyp === 6, `${datei} muss RGB oder RGBA sein`)

  const idat = Buffer.concat(chunks.filter((chunk) => chunk.typ === 'IDAT').map((chunk) => chunk.daten))
  const bytesProPixel = farbtyp === 6 ? 4 : 3
  const entpackt = inflateSync(idat)
  const bild = pngEntfiltern(entpackt, breite, hoehe, bytesProPixel)
  const pixel: PngPixel[] = []

  for (let i = 0; i < breite * hoehe; i++) {
    const offset = i * bytesProPixel
    pixel.push({
      r: bild[offset],
      g: bild[offset + 1],
      b: bild[offset + 2],
      a: farbtyp === 6 ? bild[offset + 3] : 255,
    })
  }

  return { breite, hoehe, farbtyp, pixel, roh }
}

function farbdistanz(pixel: PngPixel, farbe: { r: number; g: number; b: number }) {
  return Math.hypot(pixel.r - farbe.r, pixel.g - farbe.g, pixel.b - farbe.b)
}

function markenGeometrie(bild: PngBild) {
  const mitteX = (bild.breite - 1) / 2
  const mitteY = (bild.hoehe - 1) / 2
  const sichererRadius = bild.breite * MASKABLE_SICHERER_RADIUS_ANTEIL
  let markenpixel = 0
  let ausserhalb = 0
  let maxRadius = 0
  let lime = 0
  let weiss = 0

  for (let y = 0; y < bild.hoehe; y++) {
    for (let x = 0; x < bild.breite; x++) {
      const pixel = bild.pixel[y * bild.breite + x]
      if (pixel.a < 16) continue
      if (farbdistanz(pixel, MARKEN_GRUEN) <= FARBDISTANZ_MARKENPIXEL) continue

      markenpixel += 1
      const radius = Math.hypot(x - mitteX, y - mitteY)
      if (radius > maxRadius) maxRadius = radius
      if (radius > sichererRadius) ausserhalb += 1
      if (farbdistanz(pixel, MARKEN_LIME) <= 24) lime += 1
      if (pixel.r > 240 && pixel.g > 240 && pixel.b > 240) weiss += 1
    }
  }

  return { markenpixel, ausserhalb, maxRadius, sichererRadius, lime, weiss }
}

function ecken(bild: PngBild) {
  const { breite, hoehe, pixel } = bild
  return [
    pixel[0],
    pixel[breite - 1],
    pixel[(hoehe - 1) * breite],
    pixel[hoehe * breite - 1],
  ]
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
      ['public/icons/jetnity-192.png', 192, 6],
      ['public/icons/jetnity-512.png', 512, 6],
      ['public/icons/jetnity-512-maskable.png', 512, 2],
      ['app/apple-icon.png', 180, 6],
    ] as const

    for (const [relativerPfad, groesse, farbtyp] of erwarteteIcons) {
      const icon = pngLesen(join(ROOT, relativerPfad))
      assert.equal(icon.breite, groesse)
      assert.equal(icon.hoehe, groesse)
      assert.equal(icon.farbtyp, farbtyp)
    }
  })

  test('Maskable-Icon ist ein eigenständiges opakes, padded Asset mit Marke in der Safe Zone', () => {
    const beliebig = pngLesen(join(ROOT, 'public/icons/jetnity-512.png'))
    const maskable = pngLesen(join(ROOT, 'public/icons/jetnity-512-maskable.png'))

    assert.notEqual(
      createHash('sha256').update(maskable.roh).digest('hex'),
      createHash('sha256').update(beliebig.roh).digest('hex'),
      'purpose: maskable darf nicht nur ein Dateiname für dasselbe any-Icon sein',
    )
    assert.equal(maskable.farbtyp, 2, 'maskable muss ein opakes RGB-PNG ohne Alpha sein')
    assert.ok(maskable.pixel.every((pixel) => pixel.a === 255))

    for (const ecke of ecken(maskable)) {
      assert.deepEqual(ecke, { r: MARKEN_GRUEN.r, g: MARKEN_GRUEN.g, b: MARKEN_GRUEN.b, a: 255 })
    }

    const geometrie = markenGeometrie(maskable)
    const beliebigeGeometrie = markenGeometrie(beliebig)

    assert.ok(geometrie.markenpixel > 1000, 'maskable muss die Jetnity-Marke enthalten')
    assert.ok(geometrie.lime > 100, 'maskable muss das bestehende Lime-Karo erhalten')
    assert.ok(geometrie.weiss > 100, 'maskable muss den bestehenden weissen Akzent erhalten')
    assert.equal(geometrie.ausserhalb, 0, 'Markenpixel dürfen den zentrierten 40%-Radius nicht verlassen')
    assert.ok(geometrie.maxRadius < geometrie.sichererRadius)
    assert.ok(
      geometrie.maxRadius < beliebigeGeometrie.maxRadius,
      'maskable muss gegenüber dem any-Icon bewusst stärker gepolstert sein',
    )
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
