import { KANONISCHE_PUBLIC_ORIGIN } from '@/lib/seo/oeffentlicher-origin'

export const MARKETING_ZIELE = ['home', 'planning', 'inspiration'] as const
export const MARKETING_KANAELE = ['newsletter', 'instagram', 'partner', 'qr'] as const
export type MarketingZiel = typeof MARKETING_ZIELE[number]
export type MarketingKanal = typeof MARKETING_KANAELE[number]

export type MarketingLinkEingabe = {
  destination: MarketingZiel
  channel: MarketingKanal
  campaignId: string
  contentId?: string
}

const PFADE: Record<MarketingZiel, string> = { home: '/', planning: '/planen', inspiration: '/entdecken' }
const KANAELE: Record<MarketingKanal, { source: string; medium: string }> = {
  newsletter: { source: 'newsletter', medium: 'email' },
  instagram: { source: 'instagram', medium: 'social' },
  partner: { source: 'partner', medium: 'referral' },
  qr: { source: 'qr', medium: 'offline' },
}
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

export function marketingKennungErzeugen(prefix: 'cmp' | 'cnt', erzeugen: () => unknown): string | null {
  try {
    const uuid = erzeugen()
    return typeof uuid === 'string' && UUID_V4.test(uuid) ? `${prefix}-${uuid}` : null
  } catch {
    return null
  }
}

function kennung(wert: unknown, prefix: 'cmp' | 'cnt'): wert is string {
  return typeof wert === 'string' && wert.length === 40 && wert.startsWith(`${prefix}-`) && UUID_V4.test(wert.slice(4))
}

/** Captures only closed own data properties; no getter or input object escapes. */
export function marketingLinkEingabeLesen(wert: unknown): MarketingLinkEingabe | null {
  try {
    if (wert === null || typeof wert !== 'object' || Array.isArray(wert)) return null
    const prototype = Object.getPrototypeOf(wert)
    if (prototype !== Object.prototype && prototype !== null) return null
    const keys = Reflect.ownKeys(wert)
    if (keys.length < 3 || keys.length > 4 || keys.some((key) => typeof key !== 'string' || !['destination', 'channel', 'campaignId', 'contentId'].includes(key))) return null
    const own = Object.getOwnPropertyDescriptors(wert)
    if (keys.some((key) => !('value' in own[key as string]!))) return null
    const destination: unknown = own.destination?.value
    const channel: unknown = own.channel?.value
    const campaignId: unknown = own.campaignId?.value
    const contentId: unknown = own.contentId?.value
    if (typeof destination !== 'string' || !MARKETING_ZIELE.includes(destination as MarketingZiel)) return null
    if (typeof channel !== 'string' || !MARKETING_KANAELE.includes(channel as MarketingKanal)) return null
    if (!kennung(campaignId, 'cmp')) return null
    if (keys.includes('contentId') && !kennung(contentId, 'cnt')) return null
    return {
      destination: destination as MarketingZiel,
      channel: channel as MarketingKanal,
      campaignId,
      ...(keys.includes('contentId') ? { contentId: contentId as string } : {}),
    }
  } catch {
    return null
  }
}

/** Validates independently even when a caller bypasses the TypeScript type. */
export function marketingLinkErstellen(wert: unknown): string | null {
  const input = marketingLinkEingabeLesen(wert)
  if (!input) return null
  const url = new URL(PFADE[input.destination], KANONISCHE_PUBLIC_ORIGIN)
  const channel = KANAELE[input.channel]
  url.searchParams.set('utm_source', channel.source)
  url.searchParams.set('utm_medium', channel.medium)
  url.searchParams.set('utm_campaign', input.campaignId)
  if (input.contentId) url.searchParams.set('utm_content', input.contentId)
  return url.href
}
