/** Plain text only. Markup and script payloads never pass through. */
export function readViatorTitle(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const title = value.trim()
  if (title.length < 1 || title.length > 300) return null
  if (/[<>]/.test(title) || /[\u0000-\u001F]/.test(title)) return null
  return title
}

export function readViatorDescription(value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (value.length > 20_000) return null
  const lower = value.toLowerCase()
  if (
    lower.includes('<script') ||
    lower.includes('javascript:') ||
    lower.includes('onerror=') ||
    lower.includes('onload=') ||
    lower.includes('data:text/html')
  ) {
    return null
  }
  const withBreaks = value.replace(/<br\s*\/?>/gi, '\n')
  const stripped = withBreaks.replace(/<[^>]*>/g, '')
  if (/<[^>]*>/.test(stripped)) return null
  const text = stripped.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim()
  if (!text || text.length > 4_000) return null
  return text
}
