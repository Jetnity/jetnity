#!/usr/bin/env node
// Leitet das Vorschaubild (Open Graph, Twitter, JSON-LD) aus `public/images/hero-bali.png` ab.
//
//   node scripts/premium-redesign-a/og-bild.mjs            schreibt public/images/hero-bali-og.jpg
//   node scripts/premium-redesign-a/og-bild.mjs --pruefen  schreibt nichts, prüft nur die vorhandene Datei
//
// Das Original bleibt unverändert (Hash und eingebettetes C2PA-Manifest). Das Derivat ist ein neuer Zuschnitt,
// kein neues Original: 1200 x 630 px, JPEG, ohne C2PA-Manifest und ohne Metadaten, mit dem Hinweis
// «KI-Illustration» im Bild, weil Social-Vorschauen den Alt-Text nicht zuverlässig zeigen.
// Keine neue Bildgenerierung, kein Anbieter, kein Netzwerk. Die Ableitung ist mit `sharp` (Abhängigkeit von Next.js)
// ausgeführt; ein anderer Rechner oder eine andere sharp-Version kann andere Bytes erzeugen. Massgeblich ist die
// eingecheckte Datei mit ihrem SHA-256 in `lib/trips/organisieren/bildnachweise.ts`.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '../..')
const QUELLE = join(wurzel, 'public/images/hero-bali.png')
const ZIEL = join(wurzel, 'public/images/hero-bali-og.jpg')

const BREITE = 1200
const HOEHE = 630
const GRENZE_BYTES = 300_000
// Ausgewählt wird die höchste Qualität, die mit Abstand unter der Grenze bleibt (Hinweis der Social-Plattformen: besser deutlich darunter).
const ZIEL_BYTES = 270_000
// Zuschnitt aus dem 1536 x 1024 Original: volle Breite, 806 Zeilen ab Zeile 100. Sonne, Palmenkronen und Terrassen bleiben im Bild.
const ZUSCHNITT = { left: 0, top: 100, width: 1536, height: 806 }
const HINWEIS = 'KI-Illustration'

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

function hinweisSvg() {
  const schrift = 26
  const breite = 214
  const hoehe = 46
  const rand = 28
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${BREITE}" height="${HOEHE}">` +
      `<rect x="${rand}" y="${HOEHE - rand - hoehe}" width="${breite}" height="${hoehe}" rx="${hoehe / 2}" fill="#000" fill-opacity="0.8"/>` +
      `<text x="${rand + breite / 2}" y="${HOEHE - rand - hoehe / 2 + schrift * 0.35}" text-anchor="middle" ` +
      `font-family="Noto Sans, DejaVu Sans, Arial, sans-serif" font-size="${schrift}" font-weight="700" fill="#fff">${HINWEIS}</text>` +
      `</svg>`,
  )
}

async function kopf(buffer) {
  const meta = await sharp(buffer).metadata()
  return { format: meta.format, breite: meta.width, hoehe: meta.height }
}

if (process.argv.includes('--pruefen')) {
  const daten = readFileSync(ZIEL)
  const echt = await kopf(daten)
  console.log(JSON.stringify({ datei: 'public/images/hero-bali-og.jpg', bytes: daten.length, sha256: sha256(daten), ...echt }))
  if (echt.format !== 'jpeg' || echt.breite !== BREITE || echt.hoehe !== HOEHE || daten.length >= GRENZE_BYTES) {
    console.error('FAIL: Vorschaubild entspricht nicht 1200 x 630 JPEG unter 300000 Bytes.')
    process.exit(1)
  }
  console.log('PASS')
  process.exit(0)
}

const quelle = readFileSync(QUELLE)
const quelleKopf = await kopf(quelle)
if (quelleKopf.format !== 'png' || quelleKopf.breite !== 1536 || quelleKopf.hoehe !== 1024) {
  throw new Error(`Unerwartetes Original: ${JSON.stringify(quelleKopf)}`)
}

const grund = await sharp(quelle)
  .extract(ZUSCHNITT)
  .resize(BREITE, HOEHE, { fit: 'cover' })
  .composite([{ input: hinweisSvg() }])
  .toBuffer()

let gewaehlt = null
for (let qualitaet = 97; qualitaet >= 60; qualitaet -= 1) {
  // Baseline statt progressiv: von allen Vorschau-Abrufern der Plattformen gelesen.
  const daten = await sharp(grund).jpeg({ quality: qualitaet, progressive: false, optimiseCoding: true, chromaSubsampling: '4:2:0' }).toBuffer()
  if (daten.length < ZIEL_BYTES) {
    gewaehlt = { qualitaet, daten }
    break
  }
}
if (!gewaehlt) throw new Error('Keine JPEG-Qualität unter dem Zielgewicht gefunden.')

writeFileSync(ZIEL, gewaehlt.daten)
const echt = await kopf(gewaehlt.daten)
console.log(JSON.stringify({
  quelle: { datei: 'public/images/hero-bali.png', sha256: sha256(quelle), ...quelleKopf },
  ableitung: { datei: 'public/images/hero-bali-og.jpg', qualitaet: gewaehlt.qualitaet, bytes: gewaehlt.daten.length, sha256: sha256(gewaehlt.daten), ...echt },
  sharp: sharp.versions.sharp,
  zuschnitt: ZUSCHNITT,
}, null, 2))
