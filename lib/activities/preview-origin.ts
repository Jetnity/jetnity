/** Optional dedicated public shell for protected previews. Never an auth bypass. */
export function activityPreviewOrigin(value = process.env.NEXT_PUBLIC_ACTIVITIES_FRAME_ORIGIN): string {
  if (!value) return ''
  try {
    const u = new URL(value)
    if (u.protocol !== 'https:' || u.username || u.password || u.port || u.search || u.hash || u.pathname !== '/') return ''
    if (!/^jetnity-flight-widget-[a-z0-9]+-jetnity-e1b93c82\.vercel\.app$/.test(u.hostname)) return ''
    return u.origin
  } catch { return '' }
}
