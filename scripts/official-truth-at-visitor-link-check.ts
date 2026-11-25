// Public visitor link check only. Inject a transport for deterministic tests.
// No scheduler, database, source qualification, credentials or publishing.
const allowed = new Set(['www.bmi.gv.at', 'www.bmeia.gv.at'])
export async function pruefen(href: string, request: typeof fetch) {
  let url = new URL(href)
  const signal = AbortSignal.timeout(15000)
  for (let hop = 0; hop <= 4; hop++) {
    if (url.protocol !== 'https:' || !allowed.has(url.hostname) || url.username || url.password || url.port) {
      throw new Error('Weiterleitung ausserhalb amtlicher HTTPS-Adressen')
    }
    const response = await request(url, {
      method: 'GET', redirect: 'manual', signal,
      headers: { accept: 'text/html', 'user-agent': 'Jetnity-AT-Visitor-Link-Check/1.0' },
    })
    const location = response.headers.get('location')
    const contentType = response.headers.get('content-type') ?? ''
    await response.body?.cancel()
    if (response.status >= 300 && response.status < 400 && location) {
      if (hop === 4) throw new Error('Zu viele Weiterleitungen')
      url = new URL(location, url)
      continue
    }
    return { status: response.status, url: url.href, ok: response.ok && /text\/html/i.test(contentType) }
  }
  throw new Error('Unvollständige Prüfung')
}
