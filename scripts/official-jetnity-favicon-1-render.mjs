// scripts/official-jetnity-favicon-1-render.mjs
//
// Copies the stylized left signet from the canonical logo and builds the icon family.
// The bold typographic J is a separate component and is not copied.
// Crop and proportional Lanczos3 scale only. No redraw, no sharpen.
//
// Run: node scripts/official-jetnity-favicon-1-render.mjs

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..')
const logoPfad = join(wurzel, 'public/brand/jetnity-logo.png')

export const FLAECHE = { r: 0xf5, g: 0xf4, b: 0xee, alpha: 1 }
const FUELLUNG = 0.84
const NACHBARN = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]

function signetAusLogo(data, breite, hoehe, kanaele) {
  const gesehen = new Int32Array(breite * hoehe)
  gesehen.fill(-1)
  const teile = []
  let nummer = 0

  for (let y = 0; y < hoehe; y++) {
    for (let x = 0; x < breite; x++) {
      const start = y * breite + x
      if (data[(start * kanaele) + 3] < 1 || gesehen[start] !== -1) continue
      const warteschlange = [[x, y]]
      gesehen[start] = nummer
      let anzahl = 0
      let minX = x
      let maxX = x
      let minY = y
      let maxY = y
      while (warteschlange.length > 0) {
        const [cx, cy] = warteschlange.pop()
        anzahl += 1
        if (cx < minX) minX = cx
        if (cx > maxX) maxX = cx
        if (cy < minY) minY = cy
        if (cy > maxY) maxY = cy
        for (const [dx, dy] of NACHBARN) {
          const nx = cx + dx
          const ny = cy + dy
          if (nx < 0 || ny < 0 || nx >= breite || ny >= hoehe) continue
          const ziel = ny * breite + nx
          if (data[(ziel * kanaele) + 3] < 1 || gesehen[ziel] !== -1) continue
          gesehen[ziel] = nummer
          warteschlange.push([nx, ny])
        }
      }
      teile.push({ nummer, anzahl, minX, maxX, minY, maxY })
      nummer += 1
    }
  }

  const signet = teile
    .filter((teil) => teil.anzahl > 1000 && teil.minX < 80 && teil.maxX < 150)
    .sort((a, b) => a.minX - b.minX)[0]
  if (!signet) throw new Error('Signet-Komponente fehlt')

  const zielBreite = signet.maxX - signet.minX + 1
  const zielHoehe = signet.maxY - signet.minY + 1
  const roh = Buffer.alloc(zielBreite * zielHoehe * 4)
  let wortmarkeImRahmen = 0
  for (let y = signet.minY; y <= signet.maxY; y++) {
    for (let x = signet.minX; x <= signet.maxX; x++) {
      const ziel = ((y - signet.minY) * zielBreite + (x - signet.minX)) * 4
      const quelle = (y * breite + x) * kanaele
      if (gesehen[y * breite + x] === signet.nummer) {
        roh[ziel] = data[quelle]
        roh[ziel + 1] = data[quelle + 1]
        roh[ziel + 2] = data[quelle + 2]
        roh[ziel + 3] = data[quelle + 3]
      } else if (data[quelle + 3] >= 16) {
        wortmarkeImRahmen += 1
      }
    }
  }

  return {
    roh,
    breite: zielBreite,
    hoehe: zielHoehe,
    left: signet.minX,
    top: signet.minY,
    pixel: signet.anzahl,
    wortmarkeImRahmen,
  }
}

const logoRoh = await sharp(logoPfad).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const signetTeil = signetAusLogo(logoRoh.data, logoRoh.info.width, logoRoh.info.height, logoRoh.info.channels)
const SIGNET_BOX = { left: signetTeil.left, top: signetTeil.top, width: signetTeil.breite, height: signetTeil.hoehe }
const signetPng = await sharp(signetTeil.roh, {
  raw: { width: signetTeil.breite, height: signetTeil.hoehe, channels: 4 },
}).png({ compressionLevel: 9 }).toBuffer()
console.log('signet', SIGNET_BOX, 'pixels', signetTeil.pixel, 'excluded wordmark in box', signetTeil.wortmarkeImRahmen)

function inhaltBreite(groesse) {
  return Math.round(groesse * FUELLUNG)
}

function maskableInhaltBreite(groesse) {
  const halbDiagonaleProBreite = Math.hypot(0.5, SIGNET_BOX.height / SIGNET_BOX.width / 2)
  return Math.floor((groesse * 0.36) / halbDiagonaleProBreite)
}

async function komponieren(groesse, zielBreite, { alpha }) {
  const zielHoehe = Math.max(1, Math.round(zielBreite * (SIGNET_BOX.height / SIGNET_BOX.width)))
  if (zielBreite >= groesse || zielHoehe >= groesse) {
    throw new Error(`Signet ${zielBreite}×${zielHoehe} passt nicht in ${groesse}`)
  }
  const vordergrund = await sharp(signetPng)
    .resize(zielBreite, zielHoehe, { kernel: 'lanczos3', fit: 'fill' })
    .png()
    .toBuffer()
  let bild = sharp({
    create: {
      width: groesse,
      height: groesse,
      channels: 4,
      background: FLAECHE,
    },
  }).composite([{ input: vordergrund, gravity: 'centre' }])
  bild = alpha ? bild.ensureAlpha() : bild.removeAlpha()
  return bild.png({ compressionLevel: 9, force: true }).toBuffer()
}

async function schreiben(relativ, puffer) {
  const ziel = join(wurzel, relativ)
  mkdirSync(dirname(ziel), { recursive: true })
  writeFileSync(ziel, puffer)
  const meta = await sharp(puffer).metadata()
  console.log(relativ, meta.width, meta.height, meta.channels, meta.hasAlpha, puffer.length)
}

await schreiben('public/brand/jetnity-signet.png', signetPng)
await schreiben('app/icon.png', await komponieren(48, inhaltBreite(48), { alpha: true }))
await schreiben('app/apple-icon.png', await komponieren(180, inhaltBreite(180), { alpha: true }))
await schreiben('public/icons/jetnity-192.png', await komponieren(192, inhaltBreite(192), { alpha: true }))
await schreiben('public/icons/jetnity-512.png', await komponieren(512, inhaltBreite(512), { alpha: true }))
await schreiben(
  'public/icons/jetnity-512-maskable.png',
  await komponieren(512, maskableInhaltBreite(512), { alpha: false }),
)

const evidenz = join(wurzel, 'docs/evidence/official-jetnity-favicon-1')
mkdirSync(evidenz, { recursive: true })

const icon = await sharp(join(wurzel, 'app/icon.png')).png().toBuffer()
const micro = []
for (const groesse of [16, 24, 32, 48, 64]) {
  const quelle = groesse === 48
    ? icon
    : groesse < 48
      ? await sharp(icon).resize(groesse, groesse, { kernel: 'lanczos3' }).png().toBuffer()
      : await komponieren(groesse, inhaltBreite(groesse), { alpha: true })
  const datei = join(evidenz, `micro-${groesse}.png`)
  writeFileSync(datei, quelle)
  const zoom = groesse === 16 ? 10 : groesse === 24 ? 8 : groesse === 32 ? 6 : groesse === 48 ? 4 : 3
  micro.push({
    groesse,
    input: await sharp(quelle)
      .resize(groesse * zoom, groesse * zoom, { kernel: 'nearest' })
      .png()
      .toBuffer(),
    zoom,
  })
}

async function kontakt(dateiname, hintergrund) {
  const zelle = 220
  const breite = micro.length * zelle
  const hoehe = zelle + 36
  const teile = []
  for (let index = 0; index < micro.length; index++) {
    const eintrag = micro[index]
    teile.push({
      input: Buffer.from(
        `<svg width="${zelle}" height="36"><text x="12" y="24" font-family="sans-serif" font-size="16" fill="#153a33">${eintrag.groesse}px</text></svg>`,
      ),
      left: index * zelle,
      top: 0,
    })
    const meta = await sharp(eintrag.input).metadata()
    teile.push({
      input: eintrag.input,
      left: index * zelle + Math.round((zelle - meta.width) / 2),
      top: 36 + Math.round((zelle - meta.height) / 2),
    })
  }
  await sharp({
    create: { width: breite, height: hoehe, channels: 3, background: hintergrund },
  })
    .composite(teile)
    .png()
    .toFile(join(evidenz, dateiname))
}

await kontakt('micro-contact-light.png', '#f5f4ee')
await kontakt('micro-contact-dark.png', '#202124')

const logoZoom = await sharp(logoPfad)
  .resize(768, 256, { kernel: 'nearest' })
  .flatten({ background: '#f5f4ee' })
  .png()
  .toBuffer()
const rahmen = Buffer.from(
  `<svg width="768" height="256"><rect x="${SIGNET_BOX.left * 2}" y="${SIGNET_BOX.top * 2}" width="${SIGNET_BOX.width * 2}" height="${SIGNET_BOX.height * 2}" fill="none" stroke="#9a3b32" stroke-width="2"/></svg>`,
)
await sharp(logoZoom).composite([{ input: rahmen }]).png().toFile(join(evidenz, 'extraction-bounds.png'))

await sharp(signetPng)
  .resize(SIGNET_BOX.width * 4, SIGNET_BOX.height * 4, { kernel: 'nearest' })
  .flatten({ background: '#f5f4ee' })
  .png()
  .toFile(join(evidenz, 'signet-4x.png'))

const familie = [
  ['app/icon.png', 48],
  ['app/apple-icon.png', 96],
  ['public/icons/jetnity-192.png', 96],
  ['public/icons/jetnity-512.png', 128],
  ['public/icons/jetnity-512-maskable.png', 128],
]
const familienTeile = []
let links = 0
for (const [relativ, anzeige] of familie) {
  const input = await sharp(join(wurzel, relativ)).resize(anzeige, anzeige, { kernel: 'lanczos3' }).png().toBuffer()
  familienTeile.push({ input, left: links, top: 28 })
  familienTeile.push({
    input: Buffer.from(
      `<svg width="${anzeige}" height="24"><text x="4" y="16" font-family="sans-serif" font-size="12" fill="#153a33">${relativ.split('/').pop()}</text></svg>`,
    ),
    left: links,
    top: 0,
  })
  links += anzeige + 16
}
await sharp({
  create: { width: links, height: 160, channels: 3, background: '#f5f4ee' },
})
  .composite(familienTeile)
  .png()
  .toFile(join(evidenz, 'family-preview.png'))

writeFileSync(
  join(evidenz, 'extraction.json'),
  JSON.stringify(
    {
      source: 'public/brand/jetnity-logo.png',
      crop: SIGNET_BOX,
      pixels: signetTeil.pixel,
      wordmarkPixelsInsideBoxExcluded: signetTeil.wortmarkeImRahmen,
      method: '8-connected component of pixels with alpha >= 1; the leftmost large component is the stylized signet; the separate bold J and the rest of the wordmark are not copied, including where the J hook overlaps the signet box',
      squareSurface: '#f5f4ee',
      resampling: 'lanczos3',
      sharpening: 'not applied; a sigma 0.5 trial did not separate the pins and was rejected to avoid fringe',
      anyFill: FUELLUNG,
      maskableRadiusBudget: 0.36,
      iconPng: '48x48',
    },
    null,
    2,
  ),
)

console.log('evidence', evidenz)
