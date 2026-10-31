import { readFileSync } from 'node:fs'

import contract from '../inert-contract.json' with { type: 'json' }
import { CHILD_HOST, CHILD_ORIGIN, PARENT_ORIGIN, insertionValue } from './host-runtime.mjs'
import { productionPlanForClient } from './production-wire.mjs'

const runtimeSource = readFileSync(new URL('./host-runtime.mjs', import.meta.url), 'utf8')

function nonce() {
  const bytes = new Uint8Array(16)
  globalThis.crypto.getRandomValues(bytes)
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function classify(request) {
  const url = new URL(request.url)
  const method = request.method.toUpperCase()
  const provider = url.pathname === '/embed/discovercars'
    ? 'discovercars'
    : url.pathname === '/embed/twelvego'
      ? 'twelvego'
      : null
  const headerHost = (request.headers.get('host') || '').toLowerCase()
  const headerOk = headerHost.length === 0 || headerHost === CHILD_HOST || headerHost === `${CHILD_HOST}:443`
  const exactHttps = url.protocol === 'https:' && url.hostname === CHILD_HOST && (url.port === '' || url.port === '443')
  const readable = method === 'GET' || method === 'HEAD'
  if (provider && exactHttps && headerOk && readable && url.search === '') {
    return { kind: 'shell', provider, method }
  }
  return { kind: 'closed' }
}

export function reviewedScriptSources(plan) {
  const sources = []
  function walk(nodes) {
    for (const node of nodes || []) {
      if (node.kind === 'script') {
        for (const [name, value] of node.attributes || []) {
          if (name !== 'src') continue
          const resolved = insertionValue(name, value)
          if (typeof resolved !== 'string' || !resolved.startsWith('https://')) continue
          const origin = new URL(resolved).origin
          if (!sources.includes(origin)) sources.push(origin)
        }
      }
      if (node.children) walk(node.children)
    }
  }
  if (!plan || plan.selected !== true) return sources
  walk(plan.nodes)
  return sources
}

function shellHeaders(value, plans) {
  const headers = new Headers()
  headers.set('Cache-Control', 'no-store')
  headers.set('X-Robots-Tag', 'noindex, nofollow')
  headers.set('Referrer-Policy', 'no-referrer')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set(
    'Permissions-Policy',
    'accelerometer=(), autoplay=(), camera=(), display-capture=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), usb=(), xr-spatial-tracking=()',
  )
  headers.set(
    'Content-Security-Policy',
    `default-src 'none'; script-src ${[`'nonce-${value}'`, ...reviewedScriptSources(plans)].join(' ')}; style-src 'nonce-${value}'; frame-ancestors ${PARENT_ORIGIN}; form-action 'none'; base-uri 'none'; object-src 'none'; img-src 'none'; font-src 'none'; connect-src 'none'; media-src 'none'; worker-src 'none'; manifest-src 'none'; frame-src 'none'`,
  )
  headers.set('Content-Type', 'text/html; charset=utf-8')
  headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  headers.set('X-DNS-Prefetch-Control', 'off')
  return headers
}

export function buildShell(provider, options = {}) {
  const value = nonce()
  const plan = Object.hasOwn(options, 'plan') ? options.plan : productionPlanForClient(provider)
  const config = {
    provider,
    childOrigin: CHILD_ORIGIN,
    parentOrigin: PARENT_ORIGIN,
    plan: plan && plan.provider === provider ? plan : null,
  }
  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex, nofollow">
<title>Jetnity Widget-Host</title>
<style nonce="${value}">html,body{margin:0;padding:16px}p{overflow-wrap:anywhere;max-width:100%}</style>
</head>
<body>
<p id="jetnity-widget-status">Kein Anbieter ist geladen. Eine Freigabe der übergeordneten Jetnity-Seite ist erforderlich.</p>
<script type="module" nonce="${value}">
${runtimeSource}
startProductionShell(${JSON.stringify(config)});
</script>
</body>
</html>
`
  return { status: 200, headers: shellHeaders(value, config.plan), html, nonce: value }
}

export function decide(request) {
  const verdict = classify(request)
  if (verdict.kind !== 'shell') {
    return new Response(contract.body, { status: contract.status, headers: contract.headers })
  }
  const shell = buildShell(verdict.provider)
  const body = verdict.method === 'HEAD' ? null : shell.html
  return new Response(body, { status: shell.status, headers: shell.headers })
}
