// lib/openai/generateStoryInsights.ts
export const OPENAI_ENABLED = Boolean(process.env.OPENAI_API_KEY)

export type StoryInsightsOptions = {
  model?: string
  locale?: 'de' | 'en' | 'auto'
  maxOutputTokens?: number
  temperature?: number
  signal?: AbortSignal
}

export type StoryInsightsResult = { rating: number | null; insights: string }

export async function generateStoryInsights(
  storyText: string,
  opts: StoryInsightsOptions = {}
): Promise<StoryInsightsResult> {
  const text = (storyText ?? '').trim()
  if (!text) return { rating: 0, insights: 'Kein Text übergeben.' }
  if (!OPENAI_ENABLED) {
    return {
      rating: 0,
      insights:
        'KI-Analyse deaktiviert (kein OPENAI_API_KEY). Inhalt kann trotzdem veröffentlicht werden.',
    }
  }

  const {
    model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    locale = 'de',
    maxOutputTokens = 600,
    temperature = 0.3,
    signal,
  } = opts

  let basisText = text
  if (text.length > 12000) {
    const chunks = chunkByLength(text, 6000)
    const condensed: string[] = []
    for (const [i, part] of chunks.entries()) {
      const piece = await summarizeChunk(part, { model, temperature, maxOutputTokens: 350, locale, signal })
      condensed.push(`(Segment ${i + 1}) ${piece}`)
    }
    basisText = condensed.join('\n')
  }

  const lang = localePrompt(locale)
  const finalSystem =
    lang.system +
    ' Antworte strikt als kompaktes JSON mit Schlüsseln "rating" (0–100, Zahl) und "feedback" (string). Keine weitere Ausgabe.'
  const finalUser = [lang.task, '', 'Text:', basisText].join('\n')

  try {
    const json = await callOpenAIJson({
      model,
      temperature,
      maxOutputTokens,
      system: finalSystem,
      user: finalUser,
      signal,
    })
    const { rating, feedback } = coerceInsightsJson(json)
    return { rating, insights: feedback || lang.noExtra }
  } catch {
    try {
      const textOut = await callOpenAIText({
        model,
        temperature,
        maxOutputTokens,
        system:
          lang.system +
          ' Antworte knapp. Beginne die Ausgabe mit "Bewertung: <Zahl>" und einem Abschnitt "Feedback:" dahinter.',
        user: finalUser,
        signal,
      })
      const { rating, feedback } = parseInsightsFromText(textOut)
      return { rating, insights: feedback || lang.noExtra }
    } catch (e) {
      console.error('❌ OpenAI-Analyse fehlgeschlagen:', e)
      return { rating: 0, insights: 'Keine Bewertung verfügbar. Die Analyse ist fehlgeschlagen.' }
    }
  }
}

/* ─── Prompts ─── */
function localePrompt(locale: 'de' | 'en' | 'auto') {
  if (locale === 'en') {
    return {
      system: 'You are a professional story editor for travel and lifestyle content. Be concise and helpful.',
      task:
        'Evaluate the story on (1) clarity, (2) emotional expression, (3) language quality. Provide a 0–100 overall score and very short actionable feedback.',
      noExtra: 'No additional suggestions.',
    }
  }
  return {
    system: 'Du bist ein professioneller Story-Editor für Reise- und Lifestyle-Inhalte. Antworte präzise und hilfreich.',
    task:
      'Bewerte die Geschichte hinsichtlich (1) Klarheit, (2) emotionalem Ausdruck, (3) Sprachqualität. Gib eine Gesamtbewertung (0–100) und kurzes, konkretes Feedback.',
    noExtra: 'Keine zusätzlichen Hinweise.',
  }
}

/* ─── Chunking ─── */
function chunkByLength(s: string, max = 6000) {
  const out: string[] = []
  for (let i = 0; i < s.length; i += max) out.push(s.slice(i, i + max))
  return out
}

async function summarizeChunk(
  chunk: string,
  {
    model,
    temperature,
    maxOutputTokens,
    locale,
    signal,
  }: { model: string; temperature: number; maxOutputTokens: number; locale: 'de' | 'en' | 'auto'; signal?: AbortSignal }
) {
  const lang = localePrompt(locale)
  const system =
    lang.system + ' Fasse sehr knapp die Kernaussagen, Stimmung und Stilmittel des folgenden Segments zusammen. Maximal 4 Bulletpoints.'
  const user = chunk
  const json = await callOpenAIJson({
    model,
    temperature,
    maxOutputTokens,
    system,
    user,
    signal,
    jsonShape: {
      type: 'object',
      properties: { bullets: { type: 'array', items: { type: 'string' } } },
      required: ['bullets'],
      additionalProperties: false,
    },
  })
  const bullets = Array.isArray((json as any)?.bullets) ? (json as any).bullets : []
  return (bullets as string[]).slice(0, 4).map((s) => `• ${s}`).join(' ')
}

/* ─── OpenAI Calls ─── */
async function callOpenAIJson(args: {
  model: string
  temperature: number
  maxOutputTokens: number
  system: string
  user: string
  signal?: AbortSignal
  jsonShape?: Record<string, any>
}): Promise<any> {
  const { default: OpenAI } = await import('openai')
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

  // 1) Chat Completions mit JSON
  try {
    const res = await client.chat.completions.create(
      {
        model: args.model,
        temperature: args.temperature,
        response_format: { type: 'json_object' as const },
        messages: [
          { role: 'system', content: args.system },
          { role: 'user', content: args.user },
        ],
        max_tokens: args.maxOutputTokens,
      },
      args.signal ? { signal: args.signal } : undefined
    )
    const content = res.choices?.[0]?.message?.content?.trim() || '{}'
    return safeParseJson(content)
  } catch {
    // weiter
  }

  // 2) Responses API Fallback (locker typisiert)
  const payload: any = {
    model: args.model,
    temperature: args.temperature,
    max_output_tokens: args.maxOutputTokens,
    max_tokens: args.maxOutputTokens,
    input: [
      { role: 'system', content: args.system },
      { role: 'user', content: args.user },
    ],
    response_format: args.jsonShape
      ? { type: 'json_schema', json_schema: { name: 'insights', schema: args.jsonShape, strict: true } }
      : { type: 'json_object' },
  }

  const res: any = await client.responses.create(payload, args.signal ? { signal: args.signal } : undefined)
  const outText =
    res?.output_text ??
    res?.choices?.[0]?.message?.content ??
    res?.content?.[0]?.text ??
    ''

  const text = String(outText || '').trim()
  if (text.startsWith('{')) return safeParseJson(text)

  const asJson = tryExtractJsonFromResponse(res)
  if (asJson) return asJson

  const guessed = guessJson(text)
  if (guessed) return guessed

  throw new Error('No JSON content in Responses API result')
}

async function callOpenAIText(args: {
  model: string
  temperature: number
  maxOutputTokens: number
  system: string
  user: string
  signal?: AbortSignal
}): Promise<string> {
  const { default: OpenAI } = await import('openai')
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

  try {
    const res = await client.chat.completions.create(
      {
        model: args.model,
        temperature: args.temperature,
        messages: [
          { role: 'system', content: args.system },
          { role: 'user', content: args.user },
        ],
        max_tokens: args.maxOutputTokens,
      },
      args.signal ? { signal: args.signal } : undefined
    )
    const content = res.choices?.[0]?.message?.content?.trim() ?? ''
    if (content) return content
  } catch {
    // weiter
  }

  const res: any = await client.responses.create(
    {
      model: args.model,
      temperature: args.temperature,
      max_output_tokens: args.maxOutputTokens,
      input: [
        { role: 'system', content: args.system },
        { role: 'user', content: args.user },
      ],
    },
    args.signal ? { signal: args.signal } : undefined
  )
  return (res?.output_text ?? res?.choices?.[0]?.message?.content ?? res?.content?.[0]?.text ?? '').trim()
}

/* ─── Parsing ─── */
function safeParseJson(s: string): any {
  try {
    return JSON.parse(s)
  } catch {
    const guessed = guessJson(s)
    if (guessed) return guessed
    throw new Error('JSON parse failed')
  }
}
function guessJson(raw: string): any | null {
  const s = raw.trim()
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start >= 0 && end > start) {
    try { return JSON.parse(s.slice(start, end + 1)) } catch {}
  }
  return null
}
function tryExtractJsonFromResponse(res: any): any | null {
  try {
    const parts = res?.output ?? res?.content ?? []
    for (const p of parts) {
      const t = p?.content?.[0]?.text ?? p?.text ?? ''
      if (typeof t === 'string' && t.trim().startsWith('{')) {
        const j = safeParseJson(t.trim())
        if (j) return j
      }
    }
  } catch {}
  return null
}

export function parseInsightsFromText(text: string): { rating: number; feedback: string } {
  const ratingMatch = text.match(/Bewertung\s*:\s*(\d{1,3})/i) || text.match(/Rating\s*:\s*(\d{1,3})/i)
  let rating = ratingMatch ? clamp(parseInt(ratingMatch[1], 10), 0, 100) : 0
  if (!rating) {
    const nr = text.match(/\b(100|[1-9]?\d)\b/)
    if (nr) rating = clamp(parseInt(nr[1], 10), 0, 100)
  }
  let feedback = text
    .replace(/Bewertung\s*:\s*\d{1,3}/i, '')
    .replace(/Rating\s*:\s*\d{1,3}/i, '')
    .replace(/^Feedback\s*:\s*/i, '')
    .trim()
  if (feedback.length > 2000) feedback = feedback.slice(0, 2000) + ' …'
  return { rating, feedback }
}
function coerceInsightsJson(j: any): { rating: number; feedback: string } {
  const ratingRaw =
    (typeof j?.rating === 'number' ? j.rating : undefined) ??
    (typeof j?.score === 'number' ? j.score : undefined) ??
    (typeof j?.Bewertung === 'number' ? j.Bewertung : undefined)
  let rating = typeof ratingRaw === 'number' ? clamp(ratingRaw, 0, 100) : 0
  if (!rating && typeof j?.rating === 'string') {
    const p = parseInt(j.rating, 10)
    if (!isNaN(p)) rating = clamp(p, 0, 100)
  }
  const feedback = (j?.feedback ?? j?.insights ?? j?.Feedback ?? j?.comment ?? '').toString().trim()
  return { rating, feedback }
}
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}
