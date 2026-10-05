// lib/provider-ops/zustand.ts
//
// Gemeinsame Kill-Switch-Form. Fachflags bleiben domain-spezifisch.
// Production ist hart aus. Fehlender Zugang ist unavailable, kein Buildfehler.

export type ProviderOpsZustandGrund = 'production' | 'abgeschaltet' | 'ohne-zugang'

export type ProviderOpsZustand =
  | { aktiv: true; umgebung: 'test' }
  | { aktiv: false; grund: ProviderOpsZustandGrund }

export function providerOpsFlagAn(wert: string | undefined): boolean {
  const normalisiert = wert?.trim().toLowerCase()
  return normalisiert === 'true' || normalisiert === '1'
}

export function providerOpsIstProduction(vercelEnv: string | undefined): boolean {
  return vercelEnv?.trim() === 'production'
}

export function providerOpsZustand(eingabe: {
  vercelEnv?: string
  flag?: string
  zugangVorhanden: boolean
}): ProviderOpsZustand {
  if (providerOpsIstProduction(eingabe.vercelEnv)) {
    return { aktiv: false, grund: 'production' }
  }
  if (!providerOpsFlagAn(eingabe.flag)) {
    return { aktiv: false, grund: 'abgeschaltet' }
  }
  if (!eingabe.zugangVorhanden) {
    return { aktiv: false, grund: 'ohne-zugang' }
  }
  return { aktiv: true, umgebung: 'test' }
}
