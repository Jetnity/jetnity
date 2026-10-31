import { VIATOR_IMAGE_URL_HOSTS, VIATOR_PRODUCT_URL_HOSTS } from '@/lib/providers/viator/activities/contracts'

export type ViatorUrlResult = { ok: true; url: string } | { ok: false; reason: 'unsafe_url' }

const PRODUCT_HOSTS = new Set<string>(VIATOR_PRODUCT_URL_HOSTS)
const IMAGE_HOSTS = new Set<string>(VIATOR_IMAGE_URL_HOSTS)

/**
 * Validates an original provider URL without rewriting it.
 * The returned string is the input bytes when, and only when, the URL is
 * HTTPS, credential-free, and on the exact host allowlist.
 */
function validateViatorVendorUrl(raw: unknown, hosts: ReadonlySet<string>): ViatorUrlResult {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 2048) return { ok: false, reason: 'unsafe_url' }
  if (raw !== raw.trim() || /\s/.test(raw) || raw.includes('\\') || raw.includes('\0')) {
    return { ok: false, reason: 'unsafe_url' }
  }
  if (raw.toLowerCase().includes('javascript:') || raw.toLowerCase().includes('data:')) {
    return { ok: false, reason: 'unsafe_url' }
  }

  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return { ok: false, reason: 'unsafe_url' }
  }

  if (parsed.protocol !== 'https:') return { ok: false, reason: 'unsafe_url' }
  if (parsed.username || parsed.password) return { ok: false, reason: 'unsafe_url' }
  if (parsed.port) return { ok: false, reason: 'unsafe_url' }
  if (!hosts.has(parsed.hostname)) return { ok: false, reason: 'unsafe_url' }
  if (parsed.hostname.includes('..')) return { ok: false, reason: 'unsafe_url' }
  return { ok: true, url: raw }
}

export function validateViatorProductUrl(raw: unknown): ViatorUrlResult {
  return validateViatorVendorUrl(raw, PRODUCT_HOSTS)
}

export function validateViatorImageUrl(raw: unknown): ViatorUrlResult {
  return validateViatorVendorUrl(raw, IMAGE_HOSTS)
}

export function viatorBildAnzeigen(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 2048) return null
  if (raw.startsWith('/') && !raw.startsWith('//') && !raw.includes('..') && /^\/[A-Za-z0-9._/-]+$/.test(raw)) {
    return raw
  }
  const checked = validateViatorImageUrl(raw)
  return checked.ok ? checked.url : null
}
