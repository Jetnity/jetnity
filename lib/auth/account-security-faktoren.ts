// lib/auth/account-security-faktoren.ts
//
// AP-5-S1: TOTP-Faktoren aus dem installierten Auth-Vertrag lesen.
// Current Truth ist `factor_type`. Legacy-`type` ist nur Fallback.

export type MfaFaktorTyp = 'totp' | 'phone' | (string & {})

export type MfaFaktorStatus = 'verified' | 'unverified' | (string & {})

/**
 * Installierter Factor-Vertrag aus `@supabase/auth-js` 2.71.1.
 * `type` ist kein Current-Truth-Feld; es bleibt nur als Legacy-Fallback.
 */
export type MfaFaktor = {
  id: string
  factor_type: MfaFaktorTyp
  status: MfaFaktorStatus
  friendly_name?: string | null
  created_at?: string | null
  updated_at?: string | null
  type?: string | null
}

export type MfaListFactorsData = {
  all?: MfaFaktor[]
  totp?: MfaFaktor[]
  phone?: MfaFaktor[]
  factors?: MfaFaktor[]
}

export type TotpFaktorAnzeige = {
  id: string
  friendly_name: string | null
  created_at: string | null
  status: string | null
}

export function totpFaktorTyp(faktor: Pick<MfaFaktor, 'factor_type' | 'type'>): string | null {
  if (faktor.factor_type != null && faktor.factor_type !== '') {
    return faktor.factor_type
  }
  if (faktor.type != null && faktor.type !== '') {
    return faktor.type
  }
  return null
}

export function istTotpFaktor(faktor: Pick<MfaFaktor, 'id' | 'factor_type' | 'type'>): boolean {
  return typeof faktor.id === 'string' && faktor.id.length > 0 && totpFaktorTyp(faktor) === 'totp'
}

export function totpFaktorenAusAntwort(data: MfaListFactorsData | null | undefined): TotpFaktorAnzeige[] {
  const liste = data?.all ?? data?.totp ?? data?.factors ?? []
  return liste.filter(istTotpFaktor).map((faktor) => ({
    id: faktor.id,
    friendly_name: faktor.friendly_name ?? null,
    created_at: faktor.created_at ?? null,
    status: faktor.status ?? null,
  }))
}
