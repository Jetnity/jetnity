// lib/openai/generateStoryInsightsServer.ts
import 'server-only'

import {
  generateStoryInsights,
  type StoryInsightsOptions,
  type StoryInsightsResult,
  OPENAI_ENABLED,
} from './generateStoryInsights'

/**
 * Server-seitiger Wrapper für die Story-Analyse.
 * - erzwingt Server-Kontext (via `server-only`)
 * - hält die gleiche Signatur wie der Client-Helfer
 * - kann in Route Handlers / Cron / Server Actions genutzt werden
 */
export async function generateStoryInsightsServer(
  storyText: string,
  opts: StoryInsightsOptions = {}
): Promise<StoryInsightsResult> {
  return generateStoryInsights(storyText, opts)
}

// Re-export fürs UI (Feature-Flag)
export { OPENAI_ENABLED }
