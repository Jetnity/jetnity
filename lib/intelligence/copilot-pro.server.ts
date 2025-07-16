// lib/intelligence/copilot-pro.server.ts

import { cookies } from 'next/headers'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { CopilotSuggestion } from '@/types/copilot-types'

export async function getCopilotSuggestions(): Promise<CopilotSuggestion[]> {
  const supabase = createServerComponentClient({ cookies: cookies() })

  const { data } = await supabase
    .from('creator_uploads')
    .select('*')
    .eq('is_virtual', true)
    .order('created_at', { ascending: false })
    .limit(5)

  if (!data) return []

  return data.map((item) => ({
    type: 'region', // muss exakt mit CopilotSuggestionType übereinstimmen
    title: item.title ?? '',
    subtitle: `Erstellt von ${item.creator_name ?? 'CoPilot Pro'}`,
    link: `/story/${item.id}`,
  }))
}
