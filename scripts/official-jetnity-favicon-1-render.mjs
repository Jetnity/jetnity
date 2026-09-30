// scripts/official-jetnity-favicon-1-render.mjs
//
// Extracts the left signet from the canonical logo and builds the icon family.
// Crop and proportional Lanczos3 scale only. No redraw, no sharpen.
//
// Run: node scripts/official-jetnity-favicon-1-render.mjs

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..')
const logoPfad = join(wurzel, 'public/brand/jetnity-logo.png')

export const SIGNET_CROP = { left: 36, top: 18, width: 123, height: 86 }
export const FLAECHE = { r: 0xf5, g: 0xf4, b: 0xee, alpha: 1 }
const FUELLUNG = 0.84

const signetPng = await sharp(logoPfad).extract(SIGNET_CROP).png({ compressionLevel: 9 }).toBuffer()

function inhaltBreite(groesse) {
  return Math.round(groesse * FUELLUNG)
}

function maskableInhaltBreite(groesse) {
  const halbDiagonaleProBreite = Math.hypot(0.5, SIGNET_CROP.height / SIGNET_CROP.width / 2)
  return Math.floor((groesse * 0.36) / halbDiagonaleProBreite)
}

async function komponieren(groesse, zielBreite, { alpha }) {
  const zielHoehe = Math.max(1, Math.round(zielBreite * (SIGNET_CROP.height / SIGNET_CROP.width)))
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
  `<svg width="768" height="256"><rect x="${SIGNET_CROP.left * 2}" y="${SIGNET_CROP.top * 2}" width="${SIGNET_CROP.width * 2}" height="${SIGNET_CROP.height * 2}" fill="none" stroke="#9a3b32" stroke-width="2"/></svg>`,
)
await sharp(logoZoom).composite([{ input: rahmen }]).png().toFile(join(evidenz, 'extraction-bounds.png'))

await sharp(signetPng)
  .resize(SIGNET_CROP.width * 4, SIGNET_CROP.height * 4, { kernel: 'nearest' })
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
      crop: SIGNET_CROP,
      gapColumns: [159, 160],
      wordmarkStartsAtX: 161,
      method: 'opaque-pixel bounding box of the left component; two fully transparent columns separate it from the wordmark; pixels copied with no resampling',
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
