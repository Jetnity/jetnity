// One-shot public link check; no scheduler, credentials, database or publishing.
 // Run: node --import tsx scripts/official-truth-at-visitor-links.ts
import { AT_VISITOR_INFORMATION_LINKS } from '../lib/readiness/official-truth-at-method-v1/at-visitor-links'

const allowed = new Set(['www.bmi.gv.at', 'www.bmeia.gv.at'])
async function pruefen(href: string) {
  let url = new URL(href)
  const signal = AbortSignal.timeout(15000)
  for (let hop = 0; hop <= 4; hop++) {
    if (url.protocol !== 'https:' || !allowed.has(url.hostname) || url.username || url.password || url.port) {
      throw new Error('Weiterleitung ausserhalb amtlicher HTTPS-Adressen')
    }
    const response = await fetch(url, {
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

async function main() {
  let failed = false
  for (const link of AT_VISITOR_INFORMATION_LINKS) {
    try {
      const result = await pruefen(link.href)
      console.log(JSON.stringify({ label: link.label, requested: link.href, ...result }))
      failed ||= !result.ok
    } catch (error) {
      failed = true
      console.error(JSON.stringify({ label: link.label, requested: link.href, ok: false, error: error instanceof Error ? error.message : String(error) }))
    }
  }
  if (failed) process.exitCode = 1
}

void main()
