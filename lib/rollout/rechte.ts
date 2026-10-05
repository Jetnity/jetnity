// lib/rollout/rechte.ts
//
// Schreibschutz aus PostgreSQL-Metadaten. Kein HTTP, kein Schreibversuch.

export const LeseRollen = ['anon', 'authenticated'] as const
export const SchreibPrivilegien = ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'] as const

export type TabellenRecht = {
  rolle: string
  privileg: string
}

export type PolicyZeile = {
  name: string
  cmd: string
  rollen: string[]
}

export type RechteMetadaten = {
  rlsAktiv: boolean
  rechte: TabellenRecht[]
  policies: PolicyZeile[]
}

function normalisiert(wert: string): string {
  return wert.trim().toLowerCase()
}

function betrifftLeser(rolle: string): boolean {
  const name = normalisiert(rolle)
  return name === 'anon' || name === 'authenticated' || name === 'public'
}

function istSchreibPrivileg(privileg: string): boolean {
  return (SchreibPrivilegien as readonly string[]).includes(privileg.trim().toUpperCase())
}

function istSchreibKommando(cmd: string): boolean {
  const wert = cmd.trim().toUpperCase()
  return wert === 'INSERT' || wert === 'UPDATE' || wert === 'DELETE' || wert === 'ALL' || wert === '*'
}

function istLeseKommando(cmd: string): boolean {
  const wert = cmd.trim().toUpperCase()
  return wert === 'SELECT' || wert === 'ALL' || wert === '*'
}

export function rechteAusMetadaten(daten: RechteMetadaten): {
  lesen: boolean
  schreiben: boolean
  detail: string
} {
  const selectRollen = new Set(
    daten.rechte
      .filter((zeile) => zeile.privileg.trim().toUpperCase() === 'SELECT')
      .map((zeile) => normalisiert(zeile.rolle)),
  )
  const publicSelect = selectRollen.has('public')
  const rollenKoennenLesen = LeseRollen.every((rolle) => selectRollen.has(rolle) || publicSelect)

  const lesePolicyRollen = new Set(
    daten.policies
      .filter((policy) => istLeseKommando(policy.cmd))
      .flatMap((policy) => policy.rollen.map(normalisiert)),
  )
  const publicLesePolicy = lesePolicyRollen.has('public')
  const policyErlaubtLesen = LeseRollen.every(
    (rolle) => lesePolicyRollen.has(rolle) || publicLesePolicy,
  )

  const schreibRechte = daten.rechte.filter(
    (zeile) => istSchreibPrivileg(zeile.privileg) && betrifftLeser(zeile.rolle),
  )
  const schreibPolicies = daten.policies.filter(
    (policy) => istSchreibKommando(policy.cmd) && policy.rollen.some(betrifftLeser),
  )

  const lesen = daten.rlsAktiv && rollenKoennenLesen && policyErlaubtLesen
  const schreiben = schreibRechte.length > 0 || schreibPolicies.length > 0

  const schreibDetail = [
    ...schreibRechte.map((zeile) => `${zeile.rolle}:${zeile.privileg}`),
    ...schreibPolicies.map((policy) => `policy:${policy.name}/${policy.cmd}`),
  ]

  return {
    lesen,
    schreiben,
    detail:
      `rls=${daten.rlsAktiv} select=${[...selectRollen].join(',') || 'keine'} ` +
      `schreiben=${schreibDetail.join(',') || 'nein'}`,
  }
}
