// lib/account/world-map-land.ts
//
// Lokale, gleichwinklige Landsilhouette für die Account-Weltkarte.
// Kein externes Karten-API, keine Tiles, kein Runtime-Fetch.
//
// Provenienz: Original-Vereinfachung für Jetnity World Map 1. Die Kontinente
// sind bewusst grob und dienen nur als Orientierung hinter gespeicherten
// Etappenkoordinaten. Keine Ländergrenzen, keine implizite Ländertreue.
// Lizenz: Originalarbeit in diesem Repository.

export const WORLD_MAP_LAND_PROVENIENZ = {
  name: 'Jetnity World Map 1 land silhouette',
  license: 'Original work in the Jetnity repository',
  source: 'local/simplified-equirectangular',
  runtimeFetch: false,
} as const

type LonLat = readonly [number, number]

function pfadAusRing(ring: readonly LonLat[]): string {
  return `${ring
    .map(([lon, lat], index) => {
      const x = lon + 180
      const y = 90 - lat
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')} Z`
}

const AFRIKA: LonLat[] = [
  [-5.6, 35.9],
  [-2.2, 35.2],
  [10.2, 36.8],
  [11.5, 33.2],
  [25.1, 31.6],
  [32.4, 31.2],
  [34.2, 27.8],
  [43.3, 12.6],
  [51.3, 11.8],
  [51.0, 2.1],
  [47.4, -2.4],
  [40.8, -10.8],
  [39.6, -15.4],
  [32.6, -26.0],
  [26.4, -33.8],
  [18.5, -34.7],
  [14.4, -22.6],
  [11.8, -17.2],
  [11.6, -5.1],
  [9.4, 4.1],
  [1.1, 6.2],
  [-4.7, 5.2],
  [-13.4, 9.4],
  [-17.5, 14.7],
  [-16.4, 21.6],
  [-14.6, 26.4],
  [-9.7, 31.5],
  [-5.6, 35.9],
]

const EUROPA: LonLat[] = [
  [-9.5, 38.8],
  [-9.3, 43.1],
  [-1.8, 43.3],
  [-1.6, 46.2],
  [-4.8, 48.5],
  [-4.7, 53.4],
  [1.8, 52.9],
  [4.9, 53.3],
  [8.1, 56.8],
  [12.1, 66.0],
  [18.2, 69.4],
  [24.8, 70.7],
  [31.4, 69.8],
  [28.9, 60.1],
  [21.4, 52.4],
  [28.6, 45.3],
  [29.0, 41.1],
  [23.7, 40.1],
  [19.9, 39.7],
  [16.1, 41.7],
  [12.4, 41.8],
  [8.6, 44.1],
  [3.1, 43.2],
  [-1.2, 37.2],
  [-5.6, 36.0],
  [-9.5, 38.8],
]

const ASIEN: LonLat[] = [
  [32.0, 46.2],
  [40.4, 47.1],
  [48.4, 50.0],
  [60.1, 54.8],
  [68.4, 66.8],
  [73.2, 71.8],
  [88.4, 73.4],
  [110.2, 73.8],
  [136.4, 71.4],
  [161.6, 68.2],
  [170.2, 66.4],
  [179.6, 64.8],
  [169.4, 60.1],
  [156.8, 59.4],
  [142.2, 54.2],
  [142.8, 47.1],
  [131.6, 43.0],
  [128.4, 34.8],
  [120.8, 32.6],
  [122.0, 24.2],
  [109.4, 21.4],
  [104.8, 16.4],
  [109.2, 13.2],
  [105.4, 8.6],
  [98.6, 8.4],
  [98.0, 16.8],
  [94.2, 22.0],
  [88.2, 21.8],
  [80.2, 15.8],
  [80.4, 9.8],
  [77.4, 8.1],
  [72.8, 19.1],
  [68.2, 23.6],
  [66.8, 25.2],
  [61.6, 25.1],
  [57.6, 26.4],
  [48.2, 29.8],
  [44.6, 33.2],
  [36.2, 35.8],
  [32.6, 35.2],
  [36.8, 37.8],
  [40.2, 40.8],
  [35.6, 42.2],
  [32.0, 46.2],
]

const NORDAMERIKA: LonLat[] = [
  [-168.0, 65.6],
  [-164.8, 68.8],
  [-156.4, 71.2],
  [-141.2, 69.6],
  [-127.6, 70.8],
  [-105.2, 73.4],
  [-88.4, 65.2],
  [-84.6, 65.8],
  [-70.4, 58.6],
  [-64.2, 54.4],
  [-60.8, 47.4],
  [-67.8, 44.8],
  [-74.2, 40.6],
  [-75.6, 35.2],
  [-80.8, 24.8],
  [-89.6, 29.2],
  [-97.4, 25.8],
  [-106.2, 22.4],
  [-110.4, 24.1],
  [-117.2, 32.6],
  [-124.4, 40.4],
  [-124.8, 48.4],
  [-127.2, 50.6],
  [-135.6, 57.2],
  [-149.2, 60.8],
  [-158.4, 59.0],
  [-166.4, 64.0],
  [-168.0, 65.6],
]

const SUDAMERIKA: LonLat[] = [
  [-77.2, 7.4],
  [-70.2, 12.2],
  [-60.4, 8.4],
  [-51.4, 4.2],
  [-44.6, -2.4],
  [-38.6, -8.1],
  [-34.8, -8.3],
  [-40.6, -20.4],
  [-48.4, -28.4],
  [-53.6, -34.6],
  [-68.4, -55.1],
  [-71.4, -41.4],
  [-73.8, -36.8],
  [-71.6, -22.8],
  [-76.4, -14.0],
  [-80.0, -2.2],
  [-79.0, 0.8],
  [-77.2, 7.4],
]

const AUSTRALIEN: LonLat[] = [
  [113.6, -22.4],
  [114.2, -27.8],
  [115.8, -33.8],
  [129.4, -31.6],
  [137.6, -34.8],
  [146.2, -39.0],
  [153.6, -28.2],
  [145.6, -15.6],
  [142.2, -10.8],
  [136.4, -12.2],
  [126.8, -13.8],
  [122.2, -17.8],
  [113.6, -22.4],
]

const GROENLAND: LonLat[] = [
  [-73.0, 78.2],
  [-60.2, 81.8],
  [-47.2, 82.6],
  [-20.4, 80.8],
  [-21.6, 70.2],
  [-43.2, 60.0],
  [-52.8, 64.8],
  [-68.4, 76.0],
  [-73.0, 78.2],
]

const MADAGASKAR: LonLat[] = [
  [49.2, -12.0],
  [50.4, -15.4],
  [47.6, -25.0],
  [43.6, -23.4],
  [43.4, -16.8],
  [49.2, -12.0],
]

const GROSSBRITANNIEN: LonLat[] = [
  [-5.6, 50.0],
  [-4.8, 53.4],
  [-1.8, 57.6],
  [1.6, 52.8],
  [1.2, 51.1],
  [-5.6, 50.0],
]

const JAPAN: LonLat[] = [
  [130.8, 31.6],
  [131.4, 33.8],
  [140.8, 41.4],
  [145.6, 43.4],
  [140.2, 35.4],
  [136.8, 34.6],
  [130.8, 31.6],
]

const NEUSEELAND: LonLat[] = [
  [172.6, -34.4],
  [178.4, -37.6],
  [176.8, -41.4],
  [167.8, -47.2],
  [166.6, -45.2],
  [172.4, -41.0],
  [172.6, -34.4],
]

const ANTARKTIS: LonLat[] = [
  [-180, -63.2],
  [180, -63.2],
  [180, -90],
  [-180, -90],
]

export const WORLD_MAP_LAND_PFADE: readonly string[] = [
  pfadAusRing(AFRIKA),
  pfadAusRing(EUROPA),
  pfadAusRing(ASIEN),
  pfadAusRing(NORDAMERIKA),
  pfadAusRing(SUDAMERIKA),
  pfadAusRing(AUSTRALIEN),
  pfadAusRing(GROENLAND),
  pfadAusRing(MADAGASKAR),
  pfadAusRing(GROSSBRITANNIEN),
  pfadAusRing(JAPAN),
  pfadAusRing(NEUSEELAND),
  pfadAusRing(ANTARKTIS),
]
