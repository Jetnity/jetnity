// lib/rollout/ziel-art.ts
//
// Rein: Management-API-Status → Branch, eigenständiges Projekt oder unklar.
// Kein Netzwerk, kein Secret.

export type ZielArt = 'projekt' | 'branch' | 'unbekannt'

export function artAusStatus(projektStatus: number, branchStatus: number): ZielArt {
  if (projektStatus === 200 && branchStatus !== 200) return 'projekt'
  if (projektStatus === 404 && branchStatus === 200) return 'branch'
  return 'unbekannt'
}
