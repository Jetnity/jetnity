// lib/readiness/zustand.ts
//
// Ob Jetnity einen Requirements-Provider ausführen darf.
//
// Fail closed, analog zu Flug-/Hotel-/Provider-Ops:
//
//   · Production ist hart aus, unabhängig vom Flag.
//   · `JETNITY_READINESS_AKTIV` muss ausdrücklich `true` oder `1` sein.
//   · Zugang nur, wenn tatsächlich ein Requirements-Provider-Objekt da ist.
//   · `requirementsProviderAus()` bleibt in S4-R1 immer `null`.
//
// Eine fehlende Variable ist kein Buildfehler.
// Frei von Next, Vendor-SDKs und Secrets.

import { providerOpsZustand, type ProviderOpsZustand } from '@/lib/provider-ops'
import { requirementsProviderAus, type RequirementsProvider } from '@/lib/readiness/provider'

export type ReadinessZustand = ProviderOpsZustand

export type ReadinessUmgebung = {
  VERCEL_ENV?: string
  JETNITY_READINESS_AKTIV?: string
}

function readinessUmgebungAusProzess(): ReadinessUmgebung {
  const { VERCEL_ENV, JETNITY_READINESS_AKTIV } = process.env
  return { VERCEL_ENV, JETNITY_READINESS_AKTIV }
}

export function readinessZustand(
  umgebung: ReadinessUmgebung = readinessUmgebungAusProzess(),
  providerVorhanden = Boolean(requirementsProviderAus()),
): ReadinessZustand {
  return providerOpsZustand({
    vercelEnv: umgebung.VERCEL_ENV,
    flag: umgebung.JETNITY_READINESS_AKTIV,
    zugangVorhanden: providerVorhanden,
  })
}

export function requirementsProviderNachZustand(
  provider: RequirementsProvider | null,
  umgebung: ReadinessUmgebung = readinessUmgebungAusProzess(),
): RequirementsProvider | null {
  return readinessZustand(umgebung, Boolean(provider)).aktiv ? provider : null
}
