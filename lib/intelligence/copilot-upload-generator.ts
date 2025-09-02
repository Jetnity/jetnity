// lib/intelligence/copilot-upload-generator.ts
import 'server-only'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { copilotCreators } from './copilot-creators'
import { generateHeroImage } from '@/lib/intelligence/copilot-image' // nutzt unser Pro-Image (DALL·E 3)

type GenerateUploadOptions = {
  /** Erneut generieren, auch wenn kürzlich schon vorhanden (Default false) */
  force?: boolean
  /** Frischegrenze in Tagen: wenn letzter Upload jünger → kein neuer (Default 14) */
  sinceDays?: number
  /** Bevorzugte Bildausrichtung (Default: 'landscape') */
  orientation?: 'landscape' | 'portrait' | 'square'
}

type GenerateUploadResult = {
  success: boolean
  reason?: string
  upload?: any
}

/* ───────────────────────── Supabase Client (Admin bevorzugt) ───────────────────────── */
async function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (url && serviceRole) {
    const { createClient } = await import('@supabase/supabase-js')
    // Admin-Client (RLS bypass) – nur auf Server verwenden!
    return createClient(url, serviceRole, { auth: { persistSession: false } })
  }

  // Fallback: SSR-Client mit Cookies/Sitzung (RLS muss Inserts erlauben)
  return createServerClient(url, anon, { cookies: cookies() })
}

/* ───────────────────────── Utils ───────────────────────── */
function h32(seed: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)
  }
  return h >>> 0
}

function pickDeterministic<T>(arr: readonly T[], seed: string): T {
  const idx = h32(seed) % arr.length
  return arr[idx]
}

const sanitize = (s?: string | null) => (s ?? '').trim().replace(/\s+/g, ' ')

/* ───────────────────────── Main ───────────────────────── */
/**
 * Generiert (falls sinnvoll) einen **virtuellen** Upload zu einer Destination/Region.
 * - Duplikate werden vermieden (Titel/Region, optional Freshness-Gate)
 * - Wählt Creator deterministisch aus `copilotCreators`
 * - Generiert ein Landscape- oder anderes Bild via DALL·E 3 (unsere Pro-Funktion)
 */
export async function generateCopilotUpload(
  destination: string,
  opts: GenerateUploadOptions = {}
): Promise<GenerateUploadResult> {
  const region = sanitize(destination)
  if (!region || region.length < 2) {
    return { success: false, reason: 'Ungültige Destination.' }
  }

  const supabase = await getSupabase()
  const sinceDays = Math.max(0, opts.sinceDays ?? 14)
  const cutoff =
    sinceDays > 0 ? new Date(Date.now() - sinceDays * 86_400_000).toISOString() : undefined

  // 1) Existenz-/Frische-Check (region/title, nur virtuelle)
  const { data: existing, error: checkErr } = await supabase
    .from('creator_uploads')
    .select('id, created_at, title, region, is_virtual')
    .or(`title.ilike.${region},region.ilike.${region}`)
    .eq('is_virtual', true)
    .order('created_at', { ascending: false })
    .limit(1)

  if (checkErr) {
    console.error('[copilot-upload-generator] Check fehlgeschlagen:', checkErr.message)
    // Wir brechen lieber ab als blind zu generieren
    return { success: false, reason: 'DB-Check fehlgeschlagen.' }
  }

  const newest = existing?.[0]
  if (!opts.force && newest?.created_at && cutoff && newest.created_at > cutoff) {
    return { success: true, reason: 'Schon ein frischer Upload vorhanden.', upload: newest }
  }
  if (!opts.force && newest) {
    return { success: true, reason: 'Upload existiert bereits.', upload: newest }
  }

  // 2) Creator deterministisch auswählen (stabil je Region)
  const creator = pickDeterministic(copilotCreators, region)

  // 3) Bild generieren (unsere Pro-Funktion; speichert optional in Supabase Storage,
  //    falls Service-Role vorhanden – sonst OpenAI-URL)
  const { url: imageUrl } = await generateHeroImage({
    region,
    mood: creator.mood,
    style: creator.style,
    orientation: opts.orientation ?? 'landscape',
    // Wenn Service-Role existiert, lohnt sich persistente Speicherung:
    saveToSupabase: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    pathPrefix: 'creator-media/copilot', // optionaler Zielordner im Bucket
    quality: 'standard',
    negative: ['people', 'human', 'text', 'logo', 'watermark'],
  })

  if (!imageUrl) {
    return { success: false, reason: 'Bildgenerierung fehlgeschlagen.' }
  }

  // 4) Insert (virtueller Upload)
  const payload = {
    title: region,
    region,
    creator_name: creator.name,
    creator_avatar: creator.avatar,
    image_url: imageUrl,
    is_virtual: true,
    // optionale Felder – falls deine Tabelle sie besitzt, werden sie gefüllt.
    mood: creator.mood ?? null,
    style: creator.style ?? null,
  } as Record<string, any>

  const { data: inserted, error: insertErr } = await supabase
    .from('creator_uploads')
    .insert(payload)
    .select()
    .single()

  if (insertErr) {
    console.error('[copilot-upload-generator] Insert fehlgeschlagen:', insertErr.message)
    return { success: false, reason: 'DB-Insert fehlgeschlagen.' }
  }

  return { success: true, upload: inserted }
}
