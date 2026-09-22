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

export function istVerifizierterTotpFaktor(
  faktor: Pick<MfaFaktor, 'id' | 'factor_type' | 'type' | 'status'>,
): boolean {
  return istTotpFaktor(faktor) && faktor.status === 'verified'
}

export type MfaFaktorenLesung =
  | { status: 'ok'; liste: MfaFaktor[] }
  | { status: 'unlesbar' }

function alsFaktorliste(wert: unknown): MfaFaktor[] | null {
  if (!Array.isArray(wert)) return null
  if (wert.some((eintrag) => eintrag == null || typeof eintrag !== 'object' || Array.isArray(eintrag))) {
    return null
  }
  return wert as MfaFaktor[]
}

/**
 * Liest unterstützte listFactors-Formen. Current Truth ist `all`, danach `totp`,
 * danach legacy `factors`. Fehlt jede dieser Listen oder ist sie keine Array-
 * von-Objekten-Form, ist die Antwort unlesbar — nicht „keine Faktoren“.
 */
export function mfaFaktorenListeLesen(data: unknown): MfaFaktorenLesung {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) {
    return { status: 'unlesbar' }
  }

  const roh = data as MfaListFactorsData
  const kandidat =
    roh.all !== undefined ? roh.all : roh.totp !== undefined ? roh.totp : roh.factors !== undefined ? roh.factors : undefined
  const liste = alsFaktorliste(kandidat)
  if (liste == null) return { status: 'unlesbar' }
  return { status: 'ok', liste }
}

export function waehleVerifiziertenTotpFaktor(liste: readonly MfaFaktor[]): MfaFaktor | null {
  return liste.find(istVerifizierterTotpFaktor) ?? null
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
