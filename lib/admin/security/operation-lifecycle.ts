// Subject-owned blocklist add/remove lifecycle.
// The subject is the captured IP. A callback, a refresh, or absence from the
// bounded list is not proof that a row was stored or removed.

import { SECURITY_DETAIL_MAX } from '@/lib/admin/security/response-contract'

export type BlockAktion = 'eintragen' | 'entfernen'

export type VorgangLage = 'ausstehend' | 'rueckgemeldet' | 'unbestaetigt' | 'abgelehnt'

export type Vorgang = {
  id: number
  ip: string
  aktion: BlockAktion
  grund: string | null
  lage: VorgangLage
}

export type VorgangBuch = {
  naechsteId: number
  nachIp: Record<string, Vorgang>
}

export type BeginnAblehnung = 'leer' | 'doppelt' | 'konflikt' | 'text'

export type BeginnErgebnis =
  | { ok: true; buch: VorgangBuch; vorgang: Vorgang }
  | { ok: false; buch: VorgangBuch; grund: BeginnAblehnung }

export type SchreibAusgang = 'rueckgemeldet' | 'verweigert' | 'unbestaetigt'

export function leeresBuch(): VorgangBuch {
  return { naechsteId: 1, nachIp: {} }
}

export function subjectSchluessel(ip: string): string {
  return ip.trim()
}

export function vorgangFuer(buch: VorgangBuch, ip: string): Vorgang | null {
  const schluessel = subjectSchluessel(ip)
  if (!schluessel) return null
  return buch.nachIp[schluessel] ?? null
}

export function istAusstehend(buch: VorgangBuch, ip: string): boolean {
  return vorgangFuer(buch, ip)?.lage === 'ausstehend'
}

export function vorgaengeNachBeginn(buch: VorgangBuch): Vorgang[] {
  return Object.values(buch.nachIp).sort((links, rechts) => links.id - rechts.id)
}

/** Drops displayed subjects. The next id stays so a later operation cannot reuse an in-flight id. */
export function blendeVorgaengeAus(buch: VorgangBuch): VorgangBuch {
  return { naechsteId: buch.naechsteId, nachIp: {} }
}

export function beginnVorgang(
  buch: VorgangBuch,
  input: { ip: string; aktion: BlockAktion; grund: string | null },
): BeginnErgebnis {
  const ip = subjectSchluessel(input.ip)
  if (!ip || ip.length > 200) return { ok: false, buch, grund: 'leer' }
  const bestehend = buch.nachIp[ip]
  if (bestehend?.lage === 'ausstehend') {
    return { ok: false, buch, grund: bestehend.aktion === input.aktion ? 'doppelt' : 'konflikt' }
  }
  const grund = input.aktion === 'eintragen' ? (input.grund ?? '').trim() : null
  if (grund !== null && grund.length > SECURITY_DETAIL_MAX) return { ok: false, buch, grund: 'text' }
  const vorgang: Vorgang = {
    id: buch.naechsteId,
    ip,
    aktion: input.aktion,
    grund,
    lage: 'ausstehend',
  }
  return {
    ok: true,
    vorgang,
    buch: {
      naechsteId: buch.naechsteId + 1,
      nachIp: { ...buch.nachIp, [ip]: vorgang },
    },
  }
}

/**
 * Settles only the captured operation id.
 * A late result for an older id leaves the current subject operation untouched.
 */
export function schliesseVorgang(
  buch: VorgangBuch,
  id: number,
  ip: string,
  lage: Exclude<VorgangLage, 'ausstehend'>,
): VorgangBuch {
  const schluessel = subjectSchluessel(ip)
  const bestehend = buch.nachIp[schluessel]
  if (!bestehend || bestehend.id !== id || bestehend.lage !== 'ausstehend') return buch
  return {
    ...buch,
    nachIp: {
      ...buch.nachIp,
      [schluessel]: { ...bestehend, lage },
    },
  }
}

export function schreibAusgang(status: number, koerper: unknown, lesbar: boolean): SchreibAusgang {
  if (status === 401 || status === 403) return 'verweigert'
  if (!lesbar || status < 200 || status >= 300) return 'unbestaetigt'
  if (!koerper || typeof koerper !== 'object' || Array.isArray(koerper)) return 'unbestaetigt'
  if ((koerper as { ok?: unknown }).ok !== true) return 'unbestaetigt'
  return 'rueckgemeldet'
}
