// app/search/page.tsx
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { createServerComponentClient } from '@/lib/supabase/server'
import { maybeGenerateCopilotUpload } from '@/lib/intelligence/copilot-upload-checker'
import type { Tables } from '@/types/supabase'
import { Search, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import SearchMasonryAppend from './SearchMasonryAppend'

type Upload = Tables<'creator_uploads'>
type Sort = 'new' | 'old' | 'title'

type SearchParams = {
  tab?: string
  q?: string
  region?: string
  mood?: string
  city?: string
  sort?: Sort
  page?: string
  perPage?: string
}

/* ── SEO ──────────────────────────────────────────────── */
export async function generateMetadata(
  { searchParams }: { searchParams: SearchParams }
): Promise<Metadata> {
  const { mood, region, city, q } = normalizeParams(searchParams)
  const parts = [
    city && `Stadt: ${labelCity(city)}`,
    region && `Region: ${labelRegion(region)}`,
    mood && `Stimmung: ${labelMood(mood)}`,
    q && `Suche: “${q}”`,
  ].filter(Boolean)

  const title = parts.length
    ? `Reiseideen – ${parts.join(' • ')} | Jetnity`
    : 'Reiseideen & Inspiration – Suche | Jetnity'

  const description =
    parts.length
      ? `Finde kuratierte Reiseideen basierend auf ${parts.join(', ')}. Flüge, Hotels, Aktivitäten – alles auf einer smarten Plattform.`
      : 'Finde deine nächste Reise – kuratierte Ideen aus dem Jetnity Feed. Flüge, Hotels, Aktivitäten – alles auf einer smarten Plattform.'

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    alternates: { canonical: '/search' },
  }
}

/* ── Page ─────────────────────────────────────────────── */
export default async function SearchPage({ searchParams }: { searchParams?: SearchParams }) {
  const { tab, q, region, mood, city, sort, perPage, page } = withDefaults(normalizeParams(searchParams || {}))
  const supabase = createServerComponentClient()

  // CoPilot Pro ggf. anstoßen (non-blocking)
  const generatorTarget = region || city || ''
  if (generatorTarget) { try { await maybeGenerateCopilotUpload(generatorTarget) } catch {} }

  // Facets
  const [{ data: regRows }, { data: moodRows }] = await Promise.all([
    supabase.from('creator_uploads').select('region').not('region', 'is', null).limit(5000),
    supabase.from('creator_uploads').select('mood').not('mood', 'is', null).limit(5000),
  ])
  const regions = Array.from(new Set((regRows || []).map(r => r.region).filter(Boolean) as string[])).sort()
  const moods = Array.from(new Set((moodRows || []).map(m => m.mood).filter(Boolean) as string[])).sort()

  // SSR erste Seite
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from('creator_uploads')
    .select('id,title,mood,region,city,image_url,is_virtual,created_at', { count: 'exact' })

  if (region) query = query.ilike('region', `%${region}%`)
  if (mood)   query = query.ilike('mood', `%${mood}%`)
  if (city)   query = query.ilike('city', `%${city}%`)
  if (q) {
    const needle = `%${q.replace(/\s+/g, '%')}%`
    query = query.or(`title.ilike.${needle},mood.ilike.${needle},region.ilike.${needle},city.ilike.${needle}`)
  }

  if (sort === 'title') query = query.order('title', { ascending: true }).order('id', { ascending: true })
  else if (sort === 'old') query = query.order('created_at', { ascending: true }).order('id', { ascending: true })
  else query = query.order('created_at', { ascending: false }).order('id', { ascending: false })

  const { data, count, error } = await query.range(from, to)
  if (error) {
    return (
      <main className="max-w-6xl mx-auto p-6">
        <div className="rounded-xl border border-border bg-card/60 p-6 text-destructive">
          Fehler beim Laden: {error.message}
        </div>
      </main>
    )
  }

  const uploads = (data || []) as Upload[]
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  const initialCursor = computeNextCursor(uploads, sort)

  const chips: string[] = []
  if (city) chips.push(labelCity(city))
  if (region) chips.push(labelRegion(region))
  if (mood) chips.push(labelMood(mood))
  if (q) chips.push(`„${q}“`)

  return (
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-10 space-y-8">
      {/* Header & Filter */}
      <section className="space-y-3">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          {chips.length ? 'Deine Treffer' : 'Entdecke Reiseideen'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {chips.length
            ? <>Gefiltert nach <strong>{chips.join(' • ')}</strong></>
            : <>Nutze die Filter und Suche, um Vorschläge zu verfeinern.</>}
        </p>

        <form className="flex flex-wrap items-center gap-2" action="/search" method="get">
          <input type="hidden" name="tab" value={tab} />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Titel, Stadt oder Stimmung …"
            className="w-64 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <select name="region" defaultValue={region} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="">Alle Regionen</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select name="mood" defaultValue={mood} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="">Alle Stimmungen</option>
            {moods.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input type="text" name="city" defaultValue={city} placeholder="Stadt" className="w-40 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <select name="sort" defaultValue={sort} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="new">Neueste zuerst</option>
            <option value="old">Älteste zuerst</option>
            <option value="title">Titel A–Z</option>
          </select>
          <select name="perPage" defaultValue={perPage} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            {[12, 18, 24, 36, 48].map(n => <option key={n} value={n}>{n}/Seite</option>)}
          </select>
          <button type="submit" className="btn-premium rounded-lg bg-primary px-4 py-2 text-white text-sm">Anwenden</button>
          {(q || region || mood || city) && (
            <Link href="/search" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/40">Zurücksetzen</Link>
          )}
        </form>

        <p className="text-sm text-muted-foreground">
          {total.toLocaleString('de-DE')} Ergebnis{total === 1 ? '' : 'se'} gefunden
        </p>
      </section>

      {/* SSR-Masonry: columns + break-inside vermeiden */}
      <section aria-label="Suchergebnisse">
        <div
          id="masonry-root"
          className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]"
        >
          {uploads.map((u) => (
            <div key={(u as any).id} className="mb-6 break-inside-avoid">
              <ResultCard upload={u} />
            </div>
          ))}
        </div>
      </section>

      {/* Client-Append: fügt weitere Karten per Portal in #masonry-root ein */}
      <SearchMasonryAppend
        containerId="masonry-root"
        baseParams={{ tab, q, region, mood, city, sort, limit: perPage }}
        initialCursor={uploads.length > 0 && totalPages > 1 ? initialCursor : null}
      />
    </main>
  )
}

/* ── SSR-Karte ────────────────────────────────────────── */
function ResultCard({ upload }: { upload: Upload }) {
  const u: any = upload
  const img = u.image_url || u.cover_url || u.thumbnail_url || u.url || null
  const title: string = u.title || u.headline || 'Reiseidee'
  const region = u.region || u.metadata?.region || null
  const city = u.city || u.metadata?.city || null
  const mood = u.mood || u.metadata?.mood || null
  const tags: string[] = [mood, region].filter(Boolean)
  const isVirtual = Boolean(u.is_virtual)
  const href = u.public_url || u.link || `/search?city=${encodeURIComponent(String(city ?? ''))}`

  return (
    <article className={cn(
      'group relative overflow-hidden rounded-2xl border border-border bg-card/70 backdrop-blur',
      'shadow-sm transition hover:shadow-xl'
    )}>
      <div className="relative w-full">
        {/* Für Masonry: keine feste Aspect-Ratio → natürliche Höhe */}
        {img ? (
          <Image
            src={img}
            alt={title}
            width={1200}
            height={800}
            className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="grid h-48 w-full place-items-center bg-gradient-to-br from-indigo-500/20 via-sky-400/15 to-emerald-400/20">
            <MapPin className="h-8 w-8" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 text-[17px] font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {city && <><span>{city}</span>{region && ' · '}</>}
          {region && <span>{region}</span>}
          {(!city && !region) && 'Inspiration'}
        </p>

        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((t: string) => (
              <span key={t} className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <Link href={href} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            Jetzt entdecken <Search className="h-4 w-4" />
          </Link>
          {isVirtual && (
            <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-medium text-amber-700">
              Empfohlen
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

/* ── Utils ────────────────────────────────────────────── */
function normalizeParams(src: SearchParams) {
  const norm = (v?: string) => (typeof v === 'string' ? v.trim() : '')
  return {
    tab: norm(src.tab),
    q: norm(src.q),
    region: norm(src.region),
    mood: norm(src.mood),
    city: norm(src.city),
    sort: (['new','old','title'] as const).includes(src.sort as Sort) ? (src.sort as Sort) : 'new',
    perPage: norm(src.perPage),
    page: norm(src.page),
  }
}
function withDefaults(p: ReturnType<typeof normalizeParams>) {
  const per = clampInt(p.perPage ? Number(p.perPage) : 18, 6, 48)
  const pg = Math.max(1, p.page ? Number(p.page) : 1)
  return {
    tab: p.tab || 'discover',
    q: p.q || '',
    region: p.region || '',
    mood: p.mood || '',
    city: p.city || '',
    sort: (p.sort as Sort) || 'new',
    perPage: per,
    page: pg,
  }
}
function clampInt(n: number, min: number, max: number) { return Math.min(max, Math.max(min, Math.floor(n))) }

function computeNextCursor(list: any[], sort: Sort): string | null {
  if (!list || list.length === 0) return null
  const last = list[list.length - 1]
  try {
    if (sort === 'title') {
      return Buffer.from(JSON.stringify({ s: 'title' as const, k: [String(last.title ?? ''), String(last.id)] })).toString('base64url')
    } else {
      return Buffer.from(JSON.stringify({ s: (sort as 'new' | 'old'), k: [new Date(last.created_at).toISOString(), String(last.id)] })).toString('base64url')
    }
  } catch { return null }
}

/* Labels */
function labelMood(mood: string) {
  const map: Record<string, string> = {
    beach: 'Strand & Sonne', city: 'Städte-Trips', mountain: 'Berge & Wandern', wellness: 'Wellness',
    food: 'Food & Wine', romance: 'Romantik', adventure: 'Abenteuer', family: 'Familie',
    luxury: 'Luxus', budget: 'Budget', relax: 'Entspannung',
  }
  return map[mood] ?? mood
}
function labelRegion(region: string) {
  const map: Record<string, string> = { europa: 'Europa', alpen: 'Alpen', bali: 'Bali', global: 'Weltweit' }
  return map[region] ?? region
}
function labelCity(city: string) {
  const map: Record<string, string> = { lisbon: 'Lissabon', amsterdam: 'Amsterdam', zermatt: 'Zermatt', prague: 'Prag' }
  return map[city] ?? city
}
