// scripts/auth/produktion-lesen.ts
//
// GET-only Production-Auth-Nachweis. Kein Schreiben, kein Schlüsselabruf,
// kein Admin-Auth, keine Datenbankmutation.
//
//   npm run auth:produktion:lesen -- --produktion --projekt-ref qscbgcdmivbbnzrcyegn
//
// Zielbestätigung und GET liegen in scripts/auth/ziel.ts
// (produktionsZiel + authKonfiguration). Die Ausgabe filtert
// lib/supabase/auth-produktion-lesen.ts auf die Audit-Allowlist.

import {
  productionAuthSnapshotAusKonfiguration,
  productionAuthSnapshotText,
  produktionLesenAuftrag,
} from '@/lib/supabase/auth-produktion-lesen'

import { authKonfiguration, produktionsZiel } from './ziel'

async function main() {
  const auftrag = produktionLesenAuftrag(process.argv, process.env)
  const ziel = await produktionsZiel(auftrag.bestaetigterRef)
  const live = await authKonfiguration(ziel)
  const snapshot = productionAuthSnapshotAusKonfiguration(live)
  process.stdout.write(`${productionAuthSnapshotText(snapshot)}\n`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
