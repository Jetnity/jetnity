// lib/intelligence/copilot-creators.ts

/**
 * Jetnity CoPilot Pro – Virtuelle Creator
 * - Rückwärtskompatibel zu bestehendem Code (id, name, region, mood, style, avatar)
 * - Zusätzliche optionale Felder (slug, bio, languages, specialties, cover, palette, isVirtual)
 * - Hilfsfunktionen: Matching nach Region/Mood, deterministische Generatoren für neue virtuelle Creator
 */

import type { Locale } from '@/config/i18n.config'

export type CopilotCreator = {
  id: string
  name: string
  region: string
  mood: string
  style: string
  avatar: string

  // optionale Felder
  slug?: string
  bio?: string
  languages?: Locale[]
  specialties?: string[]
  cover?: string
  palette?: { primary: string; accent: string }
  isVirtual?: boolean
}

/* ───────────────────────── Helpers ───────────────────────── */

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function h32(seed: string): number {
  // kleines, deterministisches 32-Bit Hash (FNV-1a inspiriert)
  let h = 2166136261 >>> 0
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)
  }
  return h >>> 0
}

function pick<T>(arr: readonly T[], seed: string): T {
  const idx = h32(seed) % arr.length
  return arr[idx]
}

/** FIX: slug optional erlauben, sonst ist `init.slug` nicht typisiert. */
function makeCreator(
  init: Omit<CopilotCreator, 'slug' | 'isVirtual'> & { slug?: string; isVirtual?: boolean }
): CopilotCreator {
  const { isVirtual, ...rest } = init
  const slug = init.slug ?? slugify(init.name)
  return { ...rest, slug, isVirtual: isVirtual ?? true }
}

/* ───────────────────────── Basispool (immer aktiv) ───────────────────────── */

export const copilotCreators: Readonly<CopilotCreator[]> = Object.freeze([
  makeCreator({
    id: 'copilot-1',
    name: 'Mira',
    region: 'Thailand',
    mood: 'Abenteuer',
    style: 'Cinematic Travel Photography, HDR, Ultra Wide',
    avatar: 'https://jetnity.ai/static/avatars/mira.png',
    bio: 'Liebt Dschungeltrails, Streetfood in Bangkok und Sonnenaufgänge auf Inseln.',
    languages: ['de', 'en'],
    specialties: ['Inseln', 'Street', 'Dschungel'],
    palette: { primary: '#1B7F79', accent: '#FFD166' },
    cover: '/images/creators/virtual/mira-cover.jpg',
  }),
  makeCreator({
    id: 'copilot-2',
    name: 'Luca',
    region: 'Italien',
    mood: 'Romantik',
    style: 'Film Look, Moody Light, Natural Portrait',
    avatar: 'https://jetnity.ai/static/avatars/luca.png',
    bio: 'Pastellfarbene Küstenorte, Espresso und Golden-Hour-Porträts am Meer.',
    languages: ['de', 'en', 'it'],
    specialties: ['Porträt', 'Küste', 'Dolce Vita'],
    palette: { primary: '#2C3E50', accent: '#E67E22' },
    cover: '/images/creators/virtual/luca-cover.jpg',
  }),
  makeCreator({
    id: 'copilot-3',
    name: 'Ayla',
    region: 'Türkei',
    mood: 'Historisch',
    style: 'Golden Hour, Architectural Focus, DSLR-Style',
    avatar: 'https://jetnity.ai/static/avatars/ayla.png',
    bio: 'Bazare, Moscheen und Morgenlicht über Kuppeln – Fokus auf Formen & Details.',
    languages: ['de', 'en', 'tr'],
    specialties: ['Architektur', 'Kultur', 'City'],
    palette: { primary: '#8E6E53', accent: '#F4D35E' },
    cover: '/images/creators/virtual/ayla-cover.jpg',
  }),
  makeCreator({
    id: 'copilot-4',
    name: 'Kenji',
    region: 'Japan',
    mood: 'Ruhe',
    style: 'Minimalism, Soft Color Grading, Fuji Style',
    avatar: 'https://jetnity.ai/static/avatars/kenji.png',
    bio: 'Schlichte Linien, leise Gassen, saisonale Farben – Zen im Bild.',
    languages: ['en', 'ja'],
    specialties: ['Minimal', 'Street', 'Natur'],
    palette: { primary: '#334155', accent: '#94A3B8' },
    cover: '/images/creators/virtual/kenji-cover.jpg',
  }),
  makeCreator({
    id: 'copilot-5',
    name: 'Zara',
    region: 'Marokko',
    mood: 'Mystisch',
    style: 'Desert Colors, Travel Portrait, Boho Aesthetic',
    avatar: 'https://jetnity.ai/static/avatars/zara.png',
    bio: 'Medinas, Sahara-Dünen und erdige Töne – Portraits mit tiefer Atmosphäre.',
    languages: ['de', 'en', 'fr', 'ar'],
    specialties: ['Wüste', 'Portrait', 'Handwerk'],
    palette: { primary: '#9A6E3A', accent: '#EFC88B' },
    cover: '/images/creators/virtual/zara-cover.jpg',
  }),
])

/* ───────────────────────── Matching & Suche ───────────────────────── */

export type CreatorSearch = {
  region?: string
  mood?: string
  limit?: number
}

function scoreCreator(c: CopilotCreator, query: CreatorSearch): number {
  let s = 0
  if (query.region) {
    const r = query.region.toLowerCase()
    if (c.region.toLowerCase() === r) s += 3
    else if (c.region.toLowerCase().includes(r)) s += 2
  }
  if (query.mood) {
    const m = query.mood.toLowerCase()
    const cm = c.mood.toLowerCase()
    if (cm === m) s += 3
    else if (cm.includes(m)) s += 2
  }
  if (/(cinematic|architect|minimal)/i.test(c.style)) s += 0.5
  return s
}

/** Liefert die besten virtuellen Creator – fällt auf Basispool zurück. */
export function findCopilotCreators(query: CreatorSearch = {}): CopilotCreator[] {
  const limit = Math.max(1, Math.min(query.limit ?? 5, 12))
  const scored = copilotCreators
    .map((c) => ({ c, s: scoreCreator(c, query) }))
    .sort((a, b) => b.s - a.s)

  const top = scored.filter((x) => x.s > 0).slice(0, limit).map((x) => x.c)
  if (top.length > 0) return top

  const seed = `${query.region ?? ''}|${query.mood ?? ''}`
  const start = h32(seed) % copilotCreators.length
  const fallback: CopilotCreator[] = []
  for (let i = 0; i < Math.min(limit, copilotCreators.length); i++) {
    fallback.push(copilotCreators[(start + i) % copilotCreators.length])
  }
  return fallback
}

/* ───────────────────────── Generator für neue virtuelle Creator ───────────────────────── */

const NAME_POOLS: Record<'generic' | 'asia' | 'europe' | 'med' | 'arabic', readonly string[]> = {
  generic: ['Nova', 'Kai', 'Rio', 'Skye', 'Noa', 'Sora', 'Juno', 'Mika'],
  asia: ['Yuki', 'Hana', 'Ren', 'Aiko', 'Min', 'Ari', 'Bo', 'Lei'],
  europe: ['Elio', 'Mila', 'Nora', 'Aris', 'Lina', 'Timo', 'Sven', 'Iris'],
  med: ['Siena', 'Rafa', 'Mauro', 'Luca', 'Ayla', 'Mira', 'Inez', 'Dario'],
  arabic: ['Zara', 'Nadia', 'Omar', 'Samir', 'Layla', 'Amir', 'Farah', 'Rami'],
} as const

const STYLE_SNIPPETS: readonly string[] = [
  'Cinematic Travel Photography',
  'Analog Film Look',
  'Soft Color Grading',
  'High Contrast Street',
  'Golden Hour Architecture',
  'Desert Portrait Aesthetic',
  'Minimal Coastal Series',
  'DSLR-Style Editorial',
] as const

const MOODS: readonly string[] = [
  'Abenteuer',
  'Romantik',
  'Ruhe',
  'Historisch',
  'Urban',
  'Natur',
  'Luxus',
  'Familie',
] as const

function regionCluster(region?: string): keyof typeof NAME_POOLS {
  if (!region) return 'generic'
  const r = region.toLowerCase()
  if (/(japan|korea|china|thai|vietnam|asia)/i.test(r)) return 'asia'
  if (/(marok|arab|dubai|egypt|sahara)/i.test(r)) return 'arabic'
  if (/(ital|spain|france|greece|mediterr|portu)/i.test(r)) return 'med'
  if (/(switz|german|austria|europe|poland|nether)/i.test(r)) return 'europe'
  return 'generic'
}

/** Generiert deterministisch einen neuen virtuellen Creator für eine Region. */
export function generateVirtualCreator(
  region: string,
  opts?: { seed?: string; mood?: string }
): CopilotCreator {
  const seed = `${region}|${opts?.mood ?? ''}|${opts?.seed ?? ''}`
  const cluster = regionCluster(region)
  const name = pick(NAME_POOLS[cluster], seed + ':name')
  const mood = opts?.mood ?? pick(MOODS, seed + ':mood')
  const styleA = pick(STYLE_SNIPPETS, seed + ':styleA')
  const styleB = pick(STYLE_SNIPPETS, seed + ':styleB')
  const idNum = (h32(seed) % 900 + 100).toString() // 100–999
  const id = `copilot-${idNum}`

  return makeCreator({
    id,
    name,
    region,
    mood,
    style: `${styleA}, ${styleB}`,
    avatar: `https://jetnity.ai/static/avatars/${slugify(name)}.png`,
    bio: `${name} kuratiert ${region}-Stories mit Fokus auf ${mood.toLowerCase()} und ${styleA.toLowerCase()}.`,
    languages: ['en', 'de'],
    specialties: [mood, styleA.split(' ')[0]],
    palette: { primary: '#334155', accent: '#8B5CF6' },
    cover: `/images/creators/virtual/${slugify(region)}-${slugify(name)}-cover.jpg`,
  })
}

/** Liefert N passende Creator (ergänzt bei Bedarf generierte Profile). */
export function getCreatorsForRegion(
  region: string,
  opts?: { mood?: string; limit?: number; seed?: string }
): CopilotCreator[] {
  const limit = Math.max(1, Math.min(opts?.limit ?? 5, 12))
  const base = findCopilotCreators({ region, mood: opts?.mood, limit })
  if (base.length >= limit) return base

  const out = [...base]
  while (out.length < limit) {
    const gen = generateVirtualCreator(region, {
      seed: `${opts?.seed ?? ''}-${out.length}`,
      mood: opts?.mood,
    })
    if (!out.some((c) => c.id === gen.id || c.slug === gen.slug)) out.push(gen)
    else break
  }
  return out.slice(0, limit)
}

/** Avatar-Fallback. */
export function getCreatorAvatar(creator: CopilotCreator): string {
  return creator.avatar || '/images/creators/virtual/default.png'
}
