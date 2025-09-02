// app/(public)/story/[id]/page.tsx
import { notFound } from 'next/navigation'
import type { Metadata, ResolvingMetadata } from 'next'
import { headers } from 'next/headers'
import { createServerComponentClient } from '@/lib/supabase/server'
import SessionViewTracker from '@/components/story/SessionViewTracker'

export const revalidate = 60 // Public-Seite: leichtes Caching

type ReviewStatus = 'pending' | 'approved' | 'rejected'

function pickMediaUrl(row: any): string | null {
  return row?.image_url || row?.url || row?.public_url || row?.file_url || row?.path || null
}
function pickSnippetText(row: any): string {
  return row?.content ?? row?.text ?? row?.body ?? ''
}
function baseUrlFromHeaders() {
  const h = headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? 'http'
  return process.env.NEXT_PUBLIC_APP_URL ?? `${proto}://${host}`
}

/** Dynamische SEO/OG-Metadaten für die Story */
export async function generateMetadata(
  { params }: { params: { id: string } },
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const supabase = createServerComponentClient()
  const base = baseUrlFromHeaders()

  // Tolerant lesen, damit fehlende Spalten (z.B. is_public) kein Typ-Error sind
  const { data: s } = await supabase
    .from('creator_sessions')
    .select('*')
    .eq('id', params.id)
    .maybeSingle()

  const notAvailable: Metadata = {
    title: 'Story nicht verfügbar – Jetnity',
    robots: { index: false, follow: false },
  }
  if (!s) return notAvailable

  const reviewOk = (s as any).review_status ? (s as any).review_status === 'approved' : true
  const isPublic = (s as any).is_public !== undefined ? Boolean((s as any).is_public) : true
  if (!reviewOk || !isPublic) return notAvailable

  // Snippets für Description
  const { data: snips } = await supabase
    .from('session_snippets')
    .select('content')
    .eq('session_id', params.id)
    .order('created_at', { ascending: true })

  const description =
    (snips?.find(Boolean)?.content ?? '')
      .toString()
      .replace(/\s+/g, ' ')
      .slice(0, 160) || 'Entdecke authentische Reise-Stories auf Jetnity.'

  // Erstes Media als mögliches OG-Image (tolerant)
  const { data: media } = await supabase
    .from('session_media')
    .select('*')
    .eq('session_id', params.id)
    .order('position', { ascending: true })
    .limit(1)

  const first = media?.[0] as any | undefined
  const mediaUrl: string | null =
    first?.image_url || first?.url || first?.public_url || first?.file_url || first?.path || null

  // Dynamische OG-Karte (funktioniert immer)
  const title = (s as any).title ?? 'Jetnity Reise-Story'
  const canonical = `${base}/story/${params.id}`
  const ogCardUrl = `${base}/api/og/story/${encodeURIComponent(params.id)}?t=${encodeURIComponent(title)}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: canonical,
      title,
      description,
      images: [
        ...(mediaUrl ? [{ url: mediaUrl, width: 1200, height: 630, alt: title }] : []),
        { url: ogCardUrl, width: 1200, height: 630, alt: title },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [mediaUrl ?? ogCardUrl],
    },
  }
}

export default async function PublicStoryPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient()

  // Session tolerant lesen
  const { data: s } = await supabase
    .from('creator_sessions')
    .select('*')
    .eq('id', params.id)
    .maybeSingle()

  if (!s) return notFound()

  // Nur approved/public anzeigen – falls Spalten existieren
  const reviewOk: boolean =
    (s as any).review_status ? ((s as any).review_status as ReviewStatus) === 'approved' : true
  const isPublic: boolean =
    (s as any).is_public !== undefined ? Boolean((s as any).is_public) : true

  if (!reviewOk || !isPublic) return notFound()

  // Snippets + Media parallel laden
  const [snippetsRes, mediaRes] = await Promise.all([
    supabase
      .from('session_snippets')
      .select('*')
      .eq('session_id', params.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('session_media')
      .select('*')
      .eq('session_id', params.id)
      .order('position', { ascending: true }),
  ])

  const snippets = (snippetsRes.data || [])
    .map(pickSnippetText)
    .filter((t) => typeof t === 'string' && t.trim().length > 0)

  if (snippets.length === 0) return notFound()

  const mediaUrls = (mediaRes.data || []).map(pickMediaUrl).filter((u): u is string => !!u)
  const title: string = (s as any).title ?? 'Jetnity Reise-Story'

  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">{title}</h1>

      {mediaUrls.length > 0 && (
        <div className="space-y-6 mb-8">
          {mediaUrls.map((src, i) => (
            <div key={i} className="relative w-full overflow-hidden rounded-xl shadow">
              {/* Simple <img>, um Remote-Domain-Fallen bei next/image zu vermeiden */}
              <img
                src={src}
                alt={`Story-Bild ${i + 1}`}
                className="w-full h-[320px] sm:h-[400px] object-cover"
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding={i === 0 ? 'sync' : 'async'}
              />
            </div>
          ))}
        </div>
      )}

      <article className="space-y-4 text-lg leading-relaxed text-foreground/90">
        {snippets.map((txt, i) => (
          <p key={i}>{txt}</p>
        ))}
      </article>

      {/* View-Tracking + kompakte Impact-Anzeige */}
      <SessionViewTracker sessionId={params.id} />

      <div className="mt-12 text-center text-xs text-muted-foreground">
        Jetnity Story-ID: <code>{params.id}</code>
      </div>

      {/* Strukturierte Daten */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: title,
            datePublished: (s as any).created_at ?? undefined,
            author: (s as any).user_id ? { '@type': 'Person', name: (s as any).user_id } : undefined,
            image: mediaUrls.slice(0, 3),
          }),
        }}
      />
    </main>
  )
}
