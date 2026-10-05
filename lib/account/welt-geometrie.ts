// lib/account/welt-geometrie.ts
//
// Die einzige Stelle, die die vollständige Ländergeometrie nachschlägt.
//
// `server-only` ist hier kein Formalismus: die erzeugte Ländertabelle wiegt
// rund 90 kB. Käme sie in ein Client-Bundle, zahlte jedes Telefon die Flächen
// aller Länder, um drei davon zu färben. Stattdessen sucht der Server die
// wenigen Pfade heraus und schickt nur sie.

import 'server-only'

import {
  weltLaenderAbleiten,
  type WeltGeometrie,
  type WeltLaenderAbleitung,
} from '@/lib/account/welt-laender'
import { countryCodeNormalisieren } from '@/lib/country/darstellung'
import {
  WORLD_MAP_LAENDER_PFADE,
  WORLD_MAP_LAENDER_PUNKTE,
} from '@/lib/account/world-map-laender'

/** Geometrie genau der angefragten Länder. Unbekannte Codes fehlen schlicht. */
export function weltGeometrieFuer(
  codes: readonly (string | null | undefined)[],
): WeltGeometrie {
  const geometrie: Record<string, WeltGeometrie[string]> = {}
  for (const roh of codes) {
    const code = countryCodeNormalisieren(roh)
    if (!code || geometrie[code]) continue
    const pfade = WORLD_MAP_LAENDER_PFADE[code] ?? null
    const punkt = WORLD_MAP_LAENDER_PUNKTE[code] ?? null
    if (!pfade && !punkt) continue
    geometrie[code] = { pfade, punkt }
  }
  return geometrie
}

/** Der übliche Weg: zwei Codelisten hinein, fertige Flächen heraus. */
export function weltLaenderLaden({
  besucht,
  geplant,
}: {
  besucht: readonly (string | null | undefined)[]
  geplant: readonly (string | null | undefined)[]
}): WeltLaenderAbleitung {
  return weltLaenderAbleiten({
    besucht,
    geplant,
    geometrie: weltGeometrieFuer([...besucht, ...geplant]),
  })
}
