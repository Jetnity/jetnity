// lib/account/kontoloeschung-direkt.ts
//
// Entscheidet, ob der Development-Nachweis die Branch-Schlüssel direkt benutzt
// oder weiter den Management-PAT. Kein Netz, keine Ausgabe der Schlüssel.

import { ENTWICKLUNGS_PROJEKT_REF, PRODUKTIONS_PROJEKT_REF } from './kontoloeschung-vertrag'

export type DirektEnv = {
  SUPABASE_PROJECT_REF?: string
  NEXT_PUBLIC_SUPABASE_URL?: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
}

export type DirektEntscheidung =
  | { modus: 'direkt'; ref: string; url: string }
  | { modus: 'management'; ref: string; url: string }
  | { modus: 'abbruch'; grund: 'produktion' | 'direkt_unvollstaendig' | 'projekt_ref' | 'url_abweichung' }

export type Zugang = {
  modus: 'direkt' | 'management'
  ref: string
  url: string
  anon: string
  geheim: string
  token: string
}

const GRUENDE = new Set([
  'token_fehlt',
  'management_401',
  'projekt_ref',
  'url_abweichung',
  'produktion',
  'direkt_unvollstaendig',
  'auth_admin',
  'schema',
  'anlegen',
  'anmeldung',
  'reise',
  'reisende',
  'besuch',
  'ereignis',
  'upload',
  'speicher',
  'speicher_policy',
  'mfa',
  'mfa_umgehung',
  'reauth',
  'loeschung',
  'profil',
  'bucket',
  'zahl',
  'tabelle',
  'id',
  'sql',
  'totp',
  'pass',
  'beleg',
  'offen',
  'ausnahme',
])

export function entwicklungsUrl(): string {
  return `https://${ENTWICKLUNGS_PROJEKT_REF}.supabase.co`
}

export function nachweisGrund(text: string): string {
  if (text === 'SUPABASE_ACCESS_TOKEN fehlt' || text === 'SUPABASE_PROJECT_REF fehlt') return 'token_fehlt'
  if (text.includes('(401)') || text.includes('HTTP 401')) return 'management_401'
  return GRUENDE.has(text) ? text : 'ausnahme'
}

function vorhanden(wert: string | undefined): string {
  return (wert ?? '').trim()
}

function produktionErkannt(ref: string, url: string): boolean {
  if (ref === PRODUKTIONS_PROJEKT_REF) return true
  if (!url) return false
  try {
    return new URL(url).hostname.toLowerCase() === `${PRODUKTIONS_PROJEKT_REF}.supabase.co`
  } catch {
    return url.includes(PRODUKTIONS_PROJEKT_REF)
  }
}

/**
 * Direkter Modus nur bei exakt dem Development-Ref, der Development-URL und
 * beiden Branch-Schlüsseln. Ein einzelner Schlüssel, Production oder eine
 * abweichende URL bricht ab, bevor irgendwer das Netz fragen darf.
 * Ohne beide Schlüssel bleibt der bisherige Management-PAT-Weg.
 */
export function direktZugangPruefen(env: DirektEnv): DirektEntscheidung {
  const ref = vorhanden(env.SUPABASE_PROJECT_REF)
  const url = vorhanden(env.NEXT_PUBLIC_SUPABASE_URL)
  const anon = vorhanden(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const geheim = vorhanden(env.SUPABASE_SERVICE_ROLE_KEY)
  const ziel = entwicklungsUrl()

  if (produktionErkannt(ref, url)) return { modus: 'abbruch', grund: 'produktion' }

  if ((anon.length > 0) !== (geheim.length > 0)) {
    return { modus: 'abbruch', grund: 'direkt_unvollstaendig' }
  }

  if (anon.length > 0 && geheim.length > 0) {
    if (ref !== ENTWICKLUNGS_PROJEKT_REF) return { modus: 'abbruch', grund: 'projekt_ref' }
    if (url !== ziel) return { modus: 'abbruch', grund: 'url_abweichung' }
    return { modus: 'direkt', ref, url }
  }

  if (ref !== ENTWICKLUNGS_PROJEKT_REF) return { modus: 'abbruch', grund: 'projekt_ref' }
  if (url && url !== ziel) return { modus: 'abbruch', grund: 'url_abweichung' }
  return { modus: 'management', ref, url: url || ziel }
}

export async function zugangAufloesen(
  env: DirektEnv,
  management: () => Promise<{ anon: string; geheim: string; token: string }>,
): Promise<Zugang> {
  const entscheidung = direktZugangPruefen(env)
  if (entscheidung.modus === 'abbruch') throw new Error(entscheidung.grund)
  if (entscheidung.modus === 'direkt') {
    return {
      modus: 'direkt',
      ref: entscheidung.ref,
      url: entscheidung.url,
      anon: vorhanden(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      geheim: vorhanden(env.SUPABASE_SERVICE_ROLE_KEY),
      token: '',
    }
  }
  const gelesen = await management()
  return {
    modus: 'management',
    ref: entscheidung.ref,
    url: entscheidung.url,
    anon: gelesen.anon,
    geheim: gelesen.geheim,
    token: gelesen.token,
  }
}
