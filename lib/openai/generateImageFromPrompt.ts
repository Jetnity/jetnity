// lib/openai/generateImageFromPrompt.ts
import 'server-only'
import {
  generateDalleImage,
  type GenerateDalleOptions,
  type GeneratedImage,
} from '@/lib/openai/generateDalleImage'

/**
 * Zusätzliche Steuerung:
 * - noThrow: bei Fehlern statt Exception -> null zurückgeben (Default false, also wie früher)
 */
export type GenerateImageFromPromptOptions = GenerateDalleOptions & {
  /** Bei Fehlern nicht werfen, sondern null zurückgeben (Default false) */
  noThrow?: boolean
}

/* Overloads */

// Rückwärtskompatibel: URL-String zurück (wirft bei Fehlern)
export async function generateImageFromPrompt(
  prompt: string
): Promise<string>

// URL-String zurück mit Optionen (Standard: wirft bei Fehlern; mit noThrow: null)
export async function generateImageFromPrompt(
  prompt: string,
  opts: GenerateImageFromPromptOptions
): Promise<string | null>

// Metadaten-Objekt zurück (mit result: 'object')
export async function generateImageFromPrompt(
  prompt: string,
  opts: GenerateImageFromPromptOptions & { result: 'object' }
): Promise<GeneratedImage | null>

/* Implementierung */

export async function generateImageFromPrompt(
  prompt: string,
  opts: GenerateImageFromPromptOptions = {}
): Promise<string | GeneratedImage | null> {
  // Delegation an die Pro-Implementierung (DALL·E 3, Retry, optionaler Supabase-Upload)
  const res = await generateDalleImage(prompt, opts)

  const wantObject = opts.result === 'object'
  const noThrow = opts.noThrow === true

  if (wantObject) {
    if (res && typeof res === 'object') return res
    if (noThrow) return null
    throw new Error('Keine Bilddaten von OpenAI zurückgegeben')
  }

  // URL-Modus
  const url = typeof res === 'string' ? res : (res && 'url' in (res as any) ? (res as any).url : null)

  if (url) return url
  if (noThrow) return null
  throw new Error('Keine Bild-URL von OpenAI zurückgegeben')
}
