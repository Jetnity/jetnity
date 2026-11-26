// Längste Breite der Massstabsleiste in der Etappenkarte (Leaflet `maxWidth`).
//
// Leaflet wählt eine runde Entfernung, deren Strich höchstens so breit ist wie `maxWidth`, und mindestens etwa halb so
// breit. Die Beschriftung («100 km») ist Text und wächst mit der Schrift; der Strich ist eine Länge in Pixeln. Bleibt
// `maxWidth` fest, ragt die Beschriftung bei grosser Schrift über den Rand des Strichs. Deshalb wächst `maxWidth`
// mit der Wurzelschrift (16 px = 100 %). Eine schmale Karte begrenzt es, damit der Strich nie breiter als die Karte wird.

const BASIS_BREITE = 100
const KARTENRAND = 24
const KLEINSTE_BREITE = 80

export function massstabBreite(wurzelSchriftPx: number, kartenBreitePx: number): number {
  const faktor = Number.isFinite(wurzelSchriftPx) && wurzelSchriftPx > 16 ? wurzelSchriftPx / 16 : 1
  const gewuenscht = Math.round(BASIS_BREITE * faktor)
  if (!Number.isFinite(kartenBreitePx) || kartenBreitePx <= 0) return gewuenscht
  return Math.max(KLEINSTE_BREITE, Math.min(gewuenscht, Math.floor(kartenBreitePx - KARTENRAND)))
}
