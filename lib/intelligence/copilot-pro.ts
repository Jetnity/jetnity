import { createServerComponentClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import type { CopilotSuggestion } from "@/types/copilot"

// Liefert intelligente Creator-Vorschläge für das Dashboard
export async function getCopilotSuggestions(userId: string): Promise<CopilotSuggestion[]> {
  const supabase = createServerComponentClient({ cookies: cookies() })
  const { data: uploads, error } = await supabase
    .from("creator_uploads")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error || !uploads) return []

  const regionCounts: Record<string, number> = {}
  uploads.forEach((u) => {
    if (u.region) regionCounts[u.region] = (regionCounts[u.region] || 0) + 1
  })

  const topRegion = Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

  const suggestions: CopilotSuggestion[] = []

  if (topRegion) {
    suggestions.push({
      type: "region",
      title: `Erstelle mehr Inhalte für ${topRegion}`,
      subtitle: "Diese Region performt bei deinen Uploads am besten",
      link: `/creator-dashboard?region=${topRegion}`,
    })
  }

  return suggestions
}

// Liefert aktuelle Trending Uploads für Startseite
export async function getTrendingUploads(limit = 6) {
  const supabase = createServerComponentClient({ cookies: cookies() })
  const { data, error } = await supabase
    .from("creator_uploads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  // Wenn echte Creator-Daten vorhanden → zurückgeben
  if (!error && data && data.length > 0) return data

  // 🔁 Andernfalls: KI-generierte Inhalte von CoPilot Pro
  const copilotUploads = [
    {
      id: "copilot-1",
      title: "Sonnenaufgang in Kyoto",
      region: "Japan",
      mood: "Spirituell",
      image_url: "https://images.unsplash.com/photo-1549692520-acc6669e2f0c", // Kann durch DALL·E ersetzt werden
    },
    {
      id: "copilot-2",
      title: "Entdeckungstour durch die Anden",
      region: "Peru",
      mood: "Abenteuer",
      image_url: "https://images.unsplash.com/photo-1500336624523-d727130c3328",
    },
    {
      id: "copilot-3",
      title: "Mediterraner Küstenzauber",
      region: "Italien",
      mood: "Romantisch",
      image_url: "https://images.unsplash.com/photo-1526779259212-756e03b55f83",
    },
    {
      id: "copilot-4",
      title: "Verlorene Stadt der Maya",
      region: "Mexiko",
      mood: "Mystisch",
      image_url: "https://images.unsplash.com/photo-1580414057400-ec504f9d7d5b",
    },
    {
      id: "copilot-5",
      title: "Safari unter Sternenhimmel",
      region: "Tansania",
      mood: "Natur",
      image_url: "https://images.unsplash.com/photo-1607083202430-ecae68743a3b",
    },
    {
      id: "copilot-6",
      title: "Gletscherwelten in Island",
      region: "Island",
      mood: "Episch",
      image_url: "https://images.unsplash.com/photo-1500048993953-d00a86f97d11",
    },
  ]

  return copilotUploads.slice(0, limit)
}
