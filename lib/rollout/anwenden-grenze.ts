// lib/rollout/anwenden-grenze.ts
//
// Production darf in diesem Playbook höchstens bis 20260820130000.
// Rein, ohne Netzwerk.

import { PHASE31_MIGRATIONEN } from '@/lib/rollout/befund'

export const PRODUCTION_AUSGANG_VERSION = '20260820080000'
export const PRODUCTION_GRENZE_VERSION = '20260820130000'

export const PHASE31_VERSIONEN = PHASE31_MIGRATIONEN.map((datei) => datei.slice(0, 14))

export type MigrationDatei = {
  datei: string
  version: string
  name: string
}

export type ProduktionsPlan = {
  offen: MigrationDatei[]
  spaeterAusgeschlossen: MigrationDatei[]
}

function versionenAus(dateien: readonly MigrationDatei[]): string[] {
  return dateien.map((datei) => datei.version)
}

export function produktionsPlan(eingabe: {
  angewendet: readonly string[]
  alle: readonly MigrationDatei[]
  bis: string
}): ProduktionsPlan {
  if (eingabe.bis !== PRODUCTION_GRENZE_VERSION) {
    throw new Error(
      `Production braucht --bis ${PRODUCTION_GRENZE_VERSION}. ` +
        `Ein anderer Grenzwert ist in diesem Playbook abgelehnt.`,
    )
  }

  const angewendet = new Set(eingabe.angewendet)
  if (!angewendet.has(PRODUCTION_AUSGANG_VERSION)) {
    throw new Error(
      `Production-Ausgang fehlt: erwartet ${PRODUCTION_AUSGANG_VERSION}. ` +
        `Gefunden: ${[...angewendet].sort().join(', ') || 'keine'}. Abgebrochen.`,
    )
  }

  const nachGrenze = [...angewendet].filter((version) => version > PRODUCTION_GRENZE_VERSION).sort()
  if (nachGrenze.length > 0) {
    throw new Error(
      `Production liegt hinter der Phase-3.1-Grenze ${PRODUCTION_GRENZE_VERSION}: ` +
        `${nachGrenze.join(', ')}. Abgebrochen.`,
    )
  }

  const erlaubt = new Set(PHASE31_VERSIONEN)
  const fremdImFenster = [...angewendet]
    .filter(
      (version) =>
        version > PRODUCTION_AUSGANG_VERSION &&
        version <= PRODUCTION_GRENZE_VERSION &&
        !erlaubt.has(version),
    )
    .sort()
  if (fremdImFenster.length > 0) {
    throw new Error(
      `Unerwartete Production-Migration im Phase-3.1-Fenster: ${fremdImFenster.join(', ')}. Abgebrochen.`,
    )
  }

  const offen = eingabe.alle
    .filter((datei) => !angewendet.has(datei.version))
    .sort((a, b) => a.version.localeCompare(b.version))

  const unerwartetOffen = offen.filter(
    (datei) =>
      datei.version > PRODUCTION_AUSGANG_VERSION &&
      datei.version <= PRODUCTION_GRENZE_VERSION &&
      !erlaubt.has(datei.version),
  )
  if (unerwartetOffen.length > 0) {
    throw new Error(
      `Unerwartete offene Migration vor der Grenze: ${versionenAus(unerwartetOffen).join(', ')}. Abgebrochen.`,
    )
  }

  const imPlan = offen.filter((datei) => erlaubt.has(datei.version))
  const spaeterAusgeschlossen = offen.filter((datei) => datei.version > PRODUCTION_GRENZE_VERSION)

  return { offen: imPlan, spaeterAusgeschlossen }
}
