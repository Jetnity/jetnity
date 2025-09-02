// components/home/TrendingSection.tsx
import Link from 'next/link'
import { createServerComponentClient } from '@/lib/supabase/server'

type SessionRow = {
  id: string
  title?: string | null
  user_id?: string | null
  created_at?: string | null
  review_status?: string | null
  is_public?: boolean | null
  visibility?: string | null
  rating?: number | null
}

type MetricRow = {
  session_id: string
  views?: number | null
  likes?: number | null
  comments?: number | null
  impact_score?: number | null
}

// Media ist tolerant – wir lesen '*' und picken die URL dynamisch
type MediaRow = {
  session_id: string
  image_url?: string | null
  url?: string | null
  public_url?: string | null
  file_url?: string | null
  path?: string | null
  created_at?: string | null
  // 'position' gibt es bei dir nicht – daher nicht verwendet
}

const LIMIT_CANDIDATES = 200
const LIMIT_TRENDING = 8
const HALF_LIFE_HOURS = 72

function pickUrl(m?: Partial<MediaRow> | null): string | null {
  if (!m) return null
  return m.image_url || m.url || m.public_url || m.file_url || m.path || null
}

function scoreItem(sess: SessionRow, met: MetricRow | undefined) {
  const views = Number(met?.views ?? 0)
  const likes = Number(met?.likes ?? 0)
  const comments = Number(met?.comments ?? 0)
  const impact = met?.impact_score != null ? Number(met.impact_score) : null
  const rating = Number(sess.rating ?? 0)

  const base = impact ?? (views * 0.35 + likes * 1.0 + comments * 1.5 + rating * 1.2)

  const created = sess.created_at ? new Date(sess.created_at).getTime() : Date.now()
  const ageHours = Math.max(0, (Date.now() - created) / 36e5)
  const recencyBoost = Math.exp(-ageHours / HALF_LIFE_HOURS)
  const finalScore = base * (1 + 0.5 * recencyBoost) + 5 * recencyBoost

  return { finalScore }
}

export default async function TrendingSection() {
  const supabase = createServerComponentClient()

  // 1) Kandidaten (letzte 30 Tage), tolerant mit select('*')
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  const { data: sessionsRaw } = await supabase
    .from('creator_sessions')
    .select('*')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(LIMIT_CANDIDATES)

  const sessions = (sessionsRaw ?? []) as SessionRow[]

  // Sichtbarkeit/Review
  const visible = sessions.filter((s) => {
    const isPublic =
      s.is_public === true ||
      (s.visibility && s.visibility.toLowerCase() === 'public') ||
      (s.is_public === undefined && s.visibility === undefined)
    const approved = !s.review_status || s.review_status === 'approved'
    return isPublic && approved
  })

  if (visible.length === 0) return null
  const ids = visible.map((s) => s.id)

  // 2) Metrics & Media – selektiere '*' und sortiere nur nach created_at
  const [{ data: metricsRaw }, { data: mediaRaw }] = await Promise.all([
    supabase.from('creator_session_metrics').select('*').in('session_id', ids),
    supabase
      .from('session_media')
      .select('*') // tolerant: keine festen Spaltennamen
      .in('session_id', ids)
      .order('created_at', { ascending: true }),
  ])

  const metrics = (metricsRaw ?? []) as MetricRow[]
  const media = (mediaRaw ?? []) as MediaRow[]

  const metricById = new Map(metrics.map((m) => [m.session_id, m]))

  // erstes Media je Session
  const firstMediaById = new Map<string, MediaRow>()
  for (const m of media) {
    if (!firstMediaById.has(m.session_id)) firstMediaById.set(m.session_id, m)
  }

  // 3) Score berechnen, sortieren, schneiden
  const ranked = visible
    .map((s) => {
      const m = metricById.get(s.id)
      const sc = scoreItem(s, m)
      const preview = pickUrl(firstMediaById.get(s.id))
      return {
        id: s.id,
        title: s.title ?? 'Untitled',
        created_at: s.created_at ?? null,
        user_id: s.user_id ?? null,
        previewUrl: preview,
        views: Number(m?.views ?? 0),
        likes: Number(m?.likes ?? 0),
        comments: Number(m?.comments ?? 0),
        score: sc.finalScore,
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, LIMIT_TRENDING)

  if (ranked.length === 0) return null

  return (
    <section className="max-w-6xl mx-auto px-4 pb-14">
      <div className="flex items-end justify-between gap-3 mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold">🔥 Trending Stories</h2>
        <Link
          href="/search?sort=trending"
          className="text-sm text-primary underline underline-offset-4 hover:opacity-80"
        >
          Mehr anzeigen
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {ranked.map((item) => (
          <Link
            key={item.id}
            href={`/story/${item.id}`}
            className="group rounded-2xl overflow-hidden border hover:shadow-md transition-shadow bg-card"
          >
            <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
              {item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="h-full w-full grid place-items-center text-muted-foreground text-sm">
                  Keine Vorschau
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-semibold line-clamp-2">{item.title}</h3>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>👁️ {item.views}</span>
                <span>❤️ {item.likes}</span>
                <span>💬 {item.comments}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
