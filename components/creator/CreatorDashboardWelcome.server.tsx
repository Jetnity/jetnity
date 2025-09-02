// components/creator/CreatorDashboardWelcome.server.tsx
// Server Component: holt personalisierte Copilot-Vorschläge & reicht sie an die Client-UI weiter.

import { unstable_noStore as noStore } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'
import { getCopilotSuggestions } from '@/lib/intelligence/copilot-pro.server'
import CreatorDashboardWelcome from './CreatorDashboardWelcome'

// RSC – immer nutzerspezifisch: keine Revalidation/Caches
export const dynamic = 'force-dynamic'
export const revalidate = 0

type Suggestions = Awaited<ReturnType<typeof getCopilotSuggestions>>

export default async function CreatorDashboardWelcomeServer() {
  // Nie cachen, da userbezogen
  noStore()

  // Auth prüfen
  const supabase = createServerComponentClient()
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) {
    redirect('/login')
  }

  // Copilot-Vorschläge – robust & schnell:
  // - weiches Timeout, damit die Seite nicht hängt
  // - Fallback auf Default-Snippets
  let suggestions: Suggestions = []

  try {
    suggestions = await withTimeout(getCopilotSuggestions(), 1500)
  } catch {
    // noop -> Fallback unten
  }

  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    suggestions = defaultSuggestions()
  } else {
    // Sicherheitsnetz: hart auf z. B. 6 begrenzen, um RSC-Payload klein zu halten
    suggestions = suggestions.slice(0, 6)
  }

  return <CreatorDashboardWelcome suggestions={suggestions} />
}

/* ---------------- helpers ---------------- */

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('copilot:timeout')), ms)
    p.then((v) => { clearTimeout(t); resolve(v) })
     .catch((e) => { clearTimeout(t); reject(e) })
  })
}

function defaultSuggestions(): Suggestions {
  return [
    {
      title: 'Schneller Start',
      description: 'Lade deine letzten 3 Highlights hoch und erzeuge automatisch Story-Texte.',
      action: { type: 'link', href: '/creator/media-studio' },
      priority: 1,
    },
    {
      title: 'Profil boosten',
      description: 'Vervollständige Bio & Avatar für bessere Sichtbarkeit.',
      action: { type: 'link', href: '/creator/creator-dashboard#profile' },
      priority: 2,
    },
    {
      title: 'Impact steigern',
      description: 'Tipps zur besseren Hook in den ersten 3 Sekunden.',
      action: { type: 'link', href: '/creator/analytics' },
      priority: 3,
    },
  ] as unknown as Suggestions
}
