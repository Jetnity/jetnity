import 'server-only'
import { parseFragment, type DefaultTreeAdapterMap } from 'parse5'

export type CityPhoto = { src: string; title: string; author: string; license: string; licenseUrl: string; sourceUrl: string }
const AGENT = 'Jetnity/1.0 (https://jetnity.com; info@jetnity.ch)'
const cache = new Map<string, { until: number; value: Promise<CityPhoto | null> }>()
let active = 0

function plain(value: unknown): string {
  if (typeof value !== 'string' || value.length > 8000) return ''
  const walk = (node: DefaultTreeAdapterMap['node']): string => {
    if (node.nodeName === '#text') return (node as DefaultTreeAdapterMap['textNode']).value
    if (['script', 'style'].includes(node.nodeName)) return ''
    return 'childNodes' in node ? node.childNodes.map(walk).join('') : ''
  }
  return walk(parseFragment(value)).replace(/\s+/g, ' ').trim().slice(0, 500)
}

/** Commons metadata is untrusted. No HTML, arbitrary hosts or unclear licences leave this boundary. */
export function licensedPhoto(raw: unknown, title: string): CityPhoto | null {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Record<string, unknown>
  if (typeof v.width !== 'number' || typeof v.height !== 'number' || v.width < 600 || v.height < 300) return null
  const meta = v.extmetadata as Record<string, { value?: unknown }> | undefined
  if (!meta || plain(meta.Restrictions?.value)) return null
  const author = plain(meta.Attribution?.value) || plain(meta.Artist?.value)
  const license = plain(meta.LicenseShortName?.value)
  const licenseRaw = meta.LicenseUrl?.value
  if (!author || typeof licenseRaw !== 'string') return null
  const licenseUrl = licenseRaw.replace(/^http:/, 'https:').replace(/\/?$/, '/')
  if (!/^https:\/\/creativecommons\.org\/(licenses\/(by|by-sa)\/(2\.0|2\.5|3\.0|4\.0)|publicdomain\/zero\/1\.0)\/$/.test(licenseUrl)) return null
  if (!/^(CC BY(?:-SA)? (2\.0|2\.5|3\.0|4\.0)|CC0)$/.test(license)) return null
  try {
    const src = new URL(String(v.thumburl ?? v.url))
    const source = new URL(String(v.descriptionurl))
    if (src.protocol !== 'https:' || !['upload.wikimedia.org', 'thumb.wikimedia.org'].includes(src.hostname) || src.username || src.password || src.port || !src.pathname.startsWith('/wikipedia/commons/') || !/\.(jpe?g|png|webp)$/i.test(src.pathname)) return null
    if (source.protocol !== 'https:' || source.hostname !== 'commons.wikimedia.org' || source.username || source.password || source.port || !source.pathname.startsWith('/wiki/File:')) return null
    src.search = ''; src.hash = ''
    return { src: src.href, sourceUrl: source.href, title, author, license, licenseUrl }
  } catch { return null }
}

async function json(url: string): Promise<unknown> {
  const r = await fetch(url, { headers: { 'User-Agent': AGENT, Accept: 'application/json' }, signal: AbortSignal.timeout(6000), redirect: 'error' })
  if (!r.ok || !r.body) throw Error('Image metadata unavailable')
  const reader = r.body.getReader(); const chunks: Uint8Array[] = []; let size = 0
  try {
    while (true) {
      const next = await reader.read()
      if (next.done) break
      size += next.value.length
      if (size > 256000) throw Error('Image metadata too large')
      chunks.push(next.value)
    }
  } finally { await reader.cancel() }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

async function resolvePhoto(geonames: string, country: string): Promise<CityPhoto | null> {
  if (active >= 12) return null
  active++
  try {
    // Exact canonical identifier + country. Never search by a possibly ambiguous city name.
    const query = `SELECT ?item ?image WHERE { ?item wdt:P1566 "${geonames}"; wdt:P18 ?image; wdt:P17/wdt:P297 "${country}". } ORDER BY STR(?image) LIMIT 4`
    const data = await json('https://query.wikidata.org/sparql?' + new URLSearchParams({ query, format: 'json' })) as { results?: { bindings?: { item?: { value?: string }; image?: { value?: string } }[] } }
    const matches = data.results?.bindings
    if (!Array.isArray(matches) || !matches.length || new Set(matches.map(m => m.item?.value)).size !== 1) return null
    const imageUrl = matches[0].image?.value
    if (!imageUrl) return null
    const file = new URL(imageUrl)
    if (file.hostname !== 'commons.wikimedia.org' || !file.pathname.startsWith('/wiki/Special:FilePath/')) return null
    const title = decodeURIComponent(file.pathname.slice('/wiki/Special:FilePath/'.length))
    if (title.length > 250 || !/\.(jpe?g|png|webp)$/i.test(title)) return null
    const params = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', prop: 'imageinfo', titles: 'File:' + title,
      iiprop: 'url|size|extmetadata', iiurlwidth: '1200', iiextmetadatafilter: 'Artist|Attribution|LicenseShortName|LicenseUrl|Restrictions' })
    const commons = await json('https://commons.wikimedia.org/w/api.php?' + params) as { query?: { pages?: { imageinfo?: unknown[] }[] } }
    return licensedPhoto(commons.query?.pages?.[0]?.imageinfo?.[0], title)
  } catch { return null } finally { active-- }
}

export async function cityPhoto(place: string, country: string): Promise<CityPhoto | null> {
  if (!/^geonames:[1-9]\d{0,8}$/.test(place) || !/^[A-Z]{2}$/.test(country)) return null
  const key = `${place}:${country}`
  const existing = cache.get(key)
  if (existing && existing.until > Date.now()) return existing.value
  if (cache.size >= 256) cache.delete(cache.keys().next().value!)
  const value = resolvePhoto(place.slice(9), country)
  cache.set(key, { until: Date.now() + 3600000, value })
  return value
}
