// lib/openai/generateImageMetadata.ts
import 'server-only'
import OpenAI from 'openai'

const MODEL = (process.env.OPENAI_METADATA_MODEL || 'gpt-4o-mini').trim()

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
  : null

export type ImageMetadataOptions = {
  /** Sprache der Ausgabe (Default: 'de') */
  locale?:
    | 'de' | 'en' | 'fr' | 'es' | 'it' | 'pt'
    | 'nl' | 'sv' | 'pl' | 'tr' | 'ru' | 'ja' | 'ko' | 'zh'
  /** Anzahl Tags (3–8, Default 5) */
  tagCount?: number
  /** Zusatzhinweise (optional) */
  extraHints?: string
}

export async function generateImageMetadata(
  imageUrl: string,
  opts: ImageMetadataOptions = {}
): Promise<{ description: string; tags: string[] }> {
  if (!client) {
    console.error('[generateImageMetadata] Missing OPENAI_API_KEY')
    return { description: '', tags: [] }
  }

  const locale =
    opts.locale ?? (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as any) ?? 'de'
  const tagCount = Math.max(3, Math.min(opts.tagCount ?? 5, 8))

  const systemText =
    `Du bist ein Reise-Content-Experte. Antworte auf ${locale}. ` +
    `Schreibe eine prägnante Bildbeschreibung (max. 200 Zeichen). ` +
    `Erzeuge ${tagCount} passende Tags (1–3 Wörter, ohne #, keine Duplikate). ` +
    `Fokussiere auf Reiseziel, Landschaftstyp, Stimmung, Saison, Stil.`
  const userText =
    `Gib **ausschließlich** gültiges JSON zurück, das exakt dem Schema entspricht. ` +
    (opts.extraHints ? `Hinweise: ${opts.extraHints}` : '')

  try {
    const resp = await client.chat.completions.create({
      model: MODEL,
      // ✅ In chat.completions in openai@5.16.0 sauber typisiert
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'image_metadata',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              description: { type: 'string', minLength: 10, maxLength: 280 },
              tags: {
                type: 'array',
                minItems: 3,
                maxItems: 8,
                items: { type: 'string', minLength: 2, maxLength: 30 }
              }
            },
            required: ['description', 'tags']
          }
        }
      },
      messages: [
        { role: 'system', content: systemText },
        {
          role: 'user',
          content: [
            { type: 'text', text: userText },
            { type: 'image_url', image_url: { url: imageUrl, detail: 'auto' } }
          ]
        }
      ],
      // konservative Grenze
      max_tokens: 300
    })

    const content = resp.choices[0]?.message?.content ?? ''
    let description = ''
    let tags: string[] = []

    if (content) {
      // JSON garantiert durch response_format; trotzdem try/catch
      const parsed = JSON.parse(content)
      description = String(parsed.description ?? '').trim()
      tags = Array.isArray(parsed.tags) ? parsed.tags.map((t: any) => String(t)) : []
    }

    // Normalisieren & auf gewünschte Anzahl begrenzen
    const seen = new Set<string>()
    const cleanTags = tags
      .map((t) => t.replace(/^#+/, '').trim())
      .filter(Boolean)
      .map((t) => (locale === 'de' ? t : t.toLowerCase()))
      .filter((t) => {
        const k = t.toLowerCase()
        if (seen.has(k)) return false
        seen.add(k)
        return true
      })
      .slice(0, tagCount)

    return { description: description.slice(0, 280), tags: cleanTags }
  } catch (err: any) {
    console.error('❌ [generateImageMetadata] OpenAI error:', err?.message ?? err)
    return { description: '', tags: [] }
  }
}
